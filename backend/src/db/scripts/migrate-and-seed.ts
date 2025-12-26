import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Script pour exécuter les migrations puis le seed
 * Usage: npm run migrate:seed [--scenario=standard]
 */

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 Exécution: ${command} ${args.join(' ')}\n`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', (error) => {
      console.error(`❌ Erreur: ${error.message}`);
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}`));
        return;
      }
      resolve();
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const scenario = args.find(arg => arg.startsWith('--scenario=')) || '--scenario=standard';

  try {
    // Étape 1: Exécuter les migrations
    console.log('═══════════════════════════════════════');
    console.log('1️⃣  Exécution des migrations');
    console.log('═══════════════════════════════════════');
    
    await runCommand('npm', ['run', 'migrate']);

    // Étape 2: Exécuter le seed
    console.log('\n═══════════════════════════════════════');
    console.log('2️⃣  Peuplement de la base de données');
    console.log('═══════════════════════════════════════');
    
    await runCommand('npm', ['run', 'seed', scenario]);

    console.log('\n✅ Migration et seed terminés avec succès!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();

