import pool from '../config/database.js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Table pour suivre les migrations exécutées
const createMigrationsTable = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);
`;

// Note: La table users est créée par la migration 0000_initial_schema.sql
// après que la table profiles soit créée

async function getExecutedMigrations(): Promise<string[]> {
  try {
    const result = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
    return result.rows.map(row => row.version);
  } catch (error) {
    // Si la table n'existe pas encore, retourner un tableau vide
    return [];
  }
}

async function markMigrationAsExecuted(version: string) {
  await pool.query(
    'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
    [version]
  );
}

async function executeMigration(sql: string, version: string) {
  try {
    await pool.query('BEGIN');
    await pool.query(sql);
    await markMigrationAsExecuted(version);
    await pool.query('COMMIT');
    console.log(`✅ Migration ${version} exécutée avec succès`);
  } catch (error: any) {
    await pool.query('ROLLBACK');
    console.error(`❌ Erreur lors de l'exécution de la migration ${version}:`);
    console.error(error.message);
    throw error;
  }
}

async function resetMigrations() {
  try {
    console.log('⚠️  ATTENTION: Suppression de toutes les migrations exécutées...');
    
    // Supprimer toutes les entrées de schema_migrations
    await pool.query('DELETE FROM schema_migrations');
    console.log('✅ Table schema_migrations réinitialisée');
    console.log('ℹ️  Les tables de la base de données n\'ont PAS été supprimées');
    console.log('ℹ️  Exécutez les migrations pour appliquer les changements');
  } catch (error: any) {
    console.error('❌ Erreur lors de la réinitialisation:', error.message);
    throw error;
  }
}

async function listMigrations() {
  try {
    const migrationsDir = join(__dirname, 'migrations');
    const files = await readdir(migrationsDir);
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    const executedMigrations = await getExecutedMigrations();
    
    console.log('\n📋 Liste des migrations:');
    console.log('═'.repeat(80));
    
    for (const file of sqlFiles) {
      const version = file.replace('.sql', '');
      const isExecuted = executedMigrations.includes(version);
      const status = isExecuted ? '✅ Exécutée' : '⏳ En attente';
      
      console.log(`${status} - ${version}`);
    }
    
    console.log('═'.repeat(80));
    console.log(`\nTotal: ${sqlFiles.length} migration(s), ${executedMigrations.length} exécutée(s)\n`);
  } catch (error: any) {
    console.error('❌ Erreur lors de la liste des migrations:', error.message);
    throw error;
  }
}

async function migrate() {
  try {
    const args = process.argv.slice(2);
    const shouldReset = args.includes('--reset');
    const shouldList = args.includes('--list');
    
    if (shouldList) {
      await pool.query(createMigrationsTable);
      await listMigrations();
      await pool.end();
      process.exit(0);
      return;
    }
    
    if (shouldReset) {
      await pool.query(createMigrationsTable);
      await resetMigrations();
      await pool.end();
      process.exit(0);
      return;
    }
    
    console.log('🔄 Exécution des migrations...\n');
    
    // Créer la table de suivi des migrations
    await pool.query(createMigrationsTable);
    
    // Lire toutes les migrations SQL
    const migrationsDir = join(__dirname, 'migrations');
    const files = await readdir(migrationsDir);
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Trier par nom (les timestamps garantissent l'ordre)
    
    if (sqlFiles.length === 0) {
      console.log('⚠️  Aucune migration SQL trouvée');
      await pool.end();
      process.exit(0);
      return;
    }
    
    // Obtenir les migrations déjà exécutées
    const executedMigrations = await getExecutedMigrations();
    
    let executedCount = 0;
    
    // Exécuter chaque migration non exécutée
    for (const file of sqlFiles) {
      const version = file.replace('.sql', '');
      
      if (executedMigrations.includes(version)) {
        console.log(`⏭️  Migration ${version} déjà exécutée, ignorée`);
        continue;
      }
      
      console.log(`📄 Exécution de la migration ${version}...`);
      const sql = await readFile(join(migrationsDir, file), 'utf-8');
      await executeMigration(sql, version);
      executedCount++;
      console.log('');
    }
    
    if (executedCount === 0) {
      console.log('✅ Toutes les migrations sont déjà à jour');
    } else {
      console.log(`✅ ${executedCount} migration(s) exécutée(s) avec succès`);
    }
    
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erreur lors des migrations:', error);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

migrate();
