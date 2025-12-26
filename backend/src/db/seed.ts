import pool from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { randomUUID } from 'crypto';

// Types pour les données
interface SeedData {
  users: Array<{
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    is_platform_owner: boolean;
  }>;
  companies: Array<{
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    status: 'pending' | 'approved' | 'suspended' | 'rejected';
  }>;
}

// Scénarios de seed
const scenarios = {
  empty: {
    users: [],
    companies: [],
  },
  minimal: {
    users: [
      {
        email: 'admin@facture.gn',
        password: 'Admin1234!',
        full_name: 'Admin Principal',
        phone: '+224 612 34 56 78',
        is_platform_owner: true,
      },
      {
        email: 'demo@facture.gn',
        password: 'Demo1234!',
        full_name: 'Utilisateur Démo',
        phone: '+224 623 45 67 89',
        is_platform_owner: false,
      },
    ],
    companies: [
      {
        name: 'Demo SARL',
        email: 'contact@demo.gn',
        phone: '+224 612 34 56 78',
        address: 'Commune de Kaloum',
        city: 'Conakry',
        country: 'Guinée',
        status: 'approved' as const,
      },
    ],
  },
  standard: {
    users: [
      {
        email: 'admin@facture.gn',
        password: 'Admin1234!',
        full_name: 'Admin Principal',
        phone: '+224 612 34 56 78',
        is_platform_owner: true,
      },
      {
        email: 'manager@demo.gn',
        password: 'Manager1234!',
        full_name: 'Gestionnaire Démo',
        phone: '+224 623 45 67 89',
        is_platform_owner: false,
      },
      {
        email: 'user@demo.gn',
        password: 'User1234!',
        full_name: 'Utilisateur Démo',
        phone: '+224 634 56 78 90',
        is_platform_owner: false,
      },
    ],
    companies: [
      {
        name: 'Demo SARL',
        email: 'contact@demo.gn',
        phone: '+224 612 34 56 78',
        address: 'Commune de Kaloum',
        city: 'Conakry',
        country: 'Guinée',
        status: 'approved' as const,
      },
      {
        name: 'Tech Solutions',
        email: 'info@techsol.gn',
        phone: '+224 645 67 89 01',
        address: 'Quartier Camayenne',
        city: 'Conakry',
        country: 'Guinée',
        status: 'approved' as const,
      },
      {
        name: 'Commerce Plus',
        email: 'contact@commerce.gn',
        phone: '+224 656 78 90 12',
        address: 'Marché Madina',
        city: 'Conakry',
        country: 'Guinée',
        status: 'pending' as const,
      },
    ],
  },
  full: {
    users: [
      {
        email: 'admin@facture.gn',
        password: 'Admin1234!',
        full_name: 'Admin Principal',
        phone: '+224 612 34 56 78',
        is_platform_owner: true,
      },
      ...Array.from({ length: 10 }, (_, i) => ({
        email: `user${i + 1}@demo.gn`,
        password: 'Demo1234!',
        full_name: `Utilisateur ${i + 1}`,
        phone: `+224 6${20 + i} ${30 + i} ${40 + i} ${50 + i}`,
        is_platform_owner: false,
      })),
    ],
    companies: [
      {
        name: 'Demo SARL',
        email: 'contact@demo.gn',
        phone: '+224 612 34 56 78',
        address: 'Commune de Kaloum',
        city: 'Conakry',
        country: 'Guinée',
        status: 'approved' as const,
      },
      {
        name: 'Tech Solutions',
        email: 'info@techsol.gn',
        phone: '+224 645 67 89 01',
        address: 'Quartier Camayenne',
        city: 'Conakry',
        country: 'Guinée',
        status: 'approved' as const,
      },
      {
        name: 'Commerce Plus',
        email: 'contact@commerce.gn',
        phone: '+224 656 78 90 12',
        address: 'Marché Madina',
        city: 'Conakry',
        country: 'Guinée',
        status: 'pending' as const,
      },
      {
        name: 'Services Généraux',
        email: 'info@services.gn',
        phone: '+224 667 89 01 23',
        address: 'Quartier Ratoma',
        city: 'Conakry',
        country: 'Guinée',
        status: 'approved' as const,
      },
      {
        name: 'Import Export SA',
        email: 'contact@import.gn',
        phone: '+224 678 90 12 34',
        address: 'Port de Conakry',
        city: 'Conakry',
        country: 'Guinée',
        status: 'approved' as const,
      },
    ],
  },
};

async function createUser(userData: SeedData['users'][0], userId: string) {
  const passwordHash = await hashPassword(userData.password);

  // Créer le profil
  await pool.query(
    `INSERT INTO profiles (id, email, full_name, phone, is_platform_owner)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       full_name = EXCLUDED.full_name,
       phone = EXCLUDED.phone,
       is_platform_owner = EXCLUDED.is_platform_owner`,
    [userId, userData.email, userData.full_name, userData.phone || null, userData.is_platform_owner]
  );

  // Créer l'utilisateur avec mot de passe
  await pool.query(
    `INSERT INTO users (id, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       password_hash = EXCLUDED.password_hash`,
    [userId, userData.email, passwordHash]
  );
}

async function createCompany(companyData: SeedData['companies'][0], ownerId: string) {
  const companyId = randomUUID();

  // Créer l'entreprise
  const result = await pool.query(
    `INSERT INTO companies (id, name, email, phone, address, city, country, status, currency, tax_rate)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [companyId, companyData.name, companyData.email, companyData.phone, companyData.address, companyData.city, companyData.country, companyData.status, 'GNF', 18]
  );

  const createdCompanyId = result.rows[0].id;

  // Créer l'abonnement par défaut (vérifier s'il existe déjà)
  const existingSubscription = await pool.query(
    `SELECT id FROM subscriptions WHERE company_id = $1`,
    [createdCompanyId]
  );

  if (existingSubscription.rows.length === 0) {
    await pool.query(
      `INSERT INTO subscriptions (company_id, plan_name, status, max_users, max_invoices_per_month, max_clients)
       VALUES ($1, 'trial', 'trial', 3, 50, 20)`,
      [createdCompanyId]
    );
  }

  // Ajouter le propriétaire comme membre admin
  // Vérifier d'abord si le membre existe déjà
  const existingMember = await pool.query(
    `SELECT id FROM company_members WHERE company_id = $1 AND user_id = $2`,
    [createdCompanyId, ownerId]
  );

  if (existingMember.rows.length === 0) {
    await pool.query(
      `INSERT INTO company_members (company_id, user_id, role, invited_by, is_active)
       VALUES ($1, $2, 'company_admin', $2, true)`,
      [createdCompanyId, ownerId]
    );
  } else {
    await pool.query(
      `UPDATE company_members 
       SET role = 'company_admin', is_active = true 
       WHERE company_id = $1 AND user_id = $2`,
      [createdCompanyId, ownerId]
    );
  }

  return createdCompanyId;
}

async function seed(scenario: 'empty' | 'minimal' | 'standard' | 'full' = 'standard') {
  try {
    console.log(`🌱 Démarrage du seed avec le scénario: ${scenario}\n`);

    const data = scenarios[scenario];

    await pool.query('BEGIN');

    // Créer les utilisateurs
    const userIds: string[] = [];
    for (const userData of data.users) {
      const userId = randomUUID();
      await createUser(userData, userId);
      userIds.push(userId);
      console.log(`✅ Utilisateur créé: ${userData.email} (${userData.full_name})`);
    }

    // Créer les entreprises (une par utilisateur non-admin)
    const nonAdminUsers = data.users
      .map((u, i) => ({ user: u, userId: userIds[i] }))
      .filter(({ user }) => !user.is_platform_owner);

    for (let i = 0; i < Math.min(data.companies.length, nonAdminUsers.length); i++) {
      const companyData = data.companies[i];
      const owner = nonAdminUsers[i];
      const companyId = await createCompany(companyData, owner.userId);
      console.log(`✅ Entreprise créée: ${companyData.name} (${companyData.status})`);
    }

    await pool.query('COMMIT');

    console.log(`\n✅ Seed terminé avec succès!`);
    console.log(`\n📊 Résumé:`);
    console.log(`   - ${data.users.length} utilisateur(s) créé(s)`);
    console.log(`   - ${data.companies.length} entreprise(s) créée(s)`);
    console.log(`\n🔐 Identifiants de connexion:`);
    data.users.forEach(user => {
      console.log(`   - ${user.email} / ${user.password}`);
    });

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    await pool.query('ROLLBACK');
    console.error('❌ Erreur lors du seed:', error);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

// Gestion des arguments
const args = process.argv.slice(2);
const scenarioArg = args.find(arg => arg.startsWith('--scenario='));
const scenario = scenarioArg ? scenarioArg.split('=')[1] as 'empty' | 'minimal' | 'standard' | 'full' : 'standard';

if (!['empty', 'minimal', 'standard', 'full'].includes(scenario)) {
  console.error(`❌ Scénario invalide: ${scenario}`);
  console.error('Scénarios disponibles: empty, minimal, standard, full');
  process.exit(1);
}

seed(scenario);

