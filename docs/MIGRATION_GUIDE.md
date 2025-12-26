# Guide de Migration FactureGN

Ce guide vous accompagne dans la migration complète du système vers le nouveau backend Node.js.

## 📋 Table des matières

1. [Préparation](#préparation)
2. [Configuration](#configuration)
3. [Migration de la base de données](#migration-de-la-base-de-données)
4. [Migration des données](#migration-des-données)
5. [Vérification](#vérification)
6. [Dépannage](#dépannage)

## 🔧 Préparation

### Prérequis

- ✅ Node.js 18+ ou Bun
- ✅ PostgreSQL 14+ (local ou cloud comme Neon)
- ✅ Accès à votre base de données Supabase (si migration depuis Supabase)
- ✅ Variables d'environnement configurées

### Sauvegarde

⚠️ **IMPORTANT** : Faites toujours une sauvegarde avant de commencer !

```bash
# Exemple avec pg_dump
pg_dump -h your-host -U your-user -d your-database > backup_$(date +%Y%m%d_%H%M%S).sql
```

## ⚙️ Configuration

### 1. Variables d'environnement

Créez un fichier `.env` dans le dossier `backend/` :

```env
# Base de données
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# JWT
JWT_SECRET=votre-clé-secrète-super-longue-et-complexe
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=votre-clé-refresh-secrète-super-longue-et-complexe
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:8080

# Environnement
NODE_ENV=development
PORT=3001
```

### 2. Génération des clés JWT

Générez des clés sécurisées pour JWT :

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou utilisez openssl
openssl rand -hex 64
```

## 🗄️ Migration de la base de données

### Étape 1 : Vérifier l'état actuel

```bash
cd backend
npm run migrate:list
```

### Étape 2 : Exécuter les migrations

```bash
npm run migrate
```

Cette commande va :
1. Créer la table `schema_migrations` si elle n'existe pas
2. Créer la table `users` pour stocker les mots de passe
3. Exécuter toutes les migrations SQL non exécutées

### Étape 3 : Vérifier les migrations

```bash
npm run migrate:list
```

Vous devriez voir toutes les migrations marquées comme "✅ Exécutée".

## 📦 Migration des données

### Si vous migrez depuis Supabase

#### Option A : Base de données existante

Si vous utilisez déjà la même base PostgreSQL :

1. Les tables existent déjà
2. Exécutez simplement les migrations :
   ```bash
   npm run migrate
   ```
3. Les migrations adapteront le schéma pour le nouveau backend

#### Option B : Nouvelle base de données

Si vous créez une nouvelle base de données :

1. Importez les données depuis Supabase :
   ```bash
   pg_dump -h supabase-host -U postgres -d postgres > supabase_backup.sql
   psql -h new-host -U user -d database < supabase_backup.sql
   ```

2. Exécutez les migrations :
   ```bash
   npm run migrate
   ```

### Migration des utilisateurs

⚠️ **Important** : Les utilisateurs existants devront réinitialiser leurs mots de passe car :
- Les mots de passe étaient stockés dans Supabase Auth
- Le nouveau système utilise une table `users` séparée
- Les hashs ne sont pas directement compatibles

#### Solution temporaire (développement)

Créer un script pour migrer les utilisateurs (à adapter selon vos besoins) :

```typescript
// scripts/migrate-users.ts
import pool from '../src/config/database.js';
import bcrypt from 'bcryptjs';

async function migrateUsers() {
  // Récupérer tous les profils
  const profiles = await pool.query('SELECT id, email FROM profiles');
  
  for (const profile of profiles.rows) {
    // Générer un mot de passe temporaire
    const tempPassword = 'TempPassword123!';
    const hash = await bcrypt.hash(tempPassword, 10);
    
    // Insérer dans la table users
    await pool.query(
      `INSERT INTO users (id, email, password_hash) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (id) DO NOTHING`,
      [profile.id, profile.email, hash]
    );
    
    console.log(`✅ Utilisateur ${profile.email} créé avec mot de passe temporaire`);
  }
}
```

#### Solution production

1. Créez un endpoint temporaire pour réinitialiser les mots de passe
2. Envoyez un email aux utilisateurs avec un lien de réinitialisation
3. Les utilisateurs créent un nouveau mot de passe via l'interface

## ✅ Vérification

### 1. Vérifier les tables

```sql
-- Vérifier que les tables principales existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Devrait inclure :
-- - schema_migrations
-- - users
-- - profiles
-- - companies
-- - clients
-- - invoices
-- - etc.
```

### 2. Vérifier les migrations

```bash
npm run migrate:list
```

Toutes les migrations doivent être marquées comme exécutées.

### 3. Tester la connexion

```bash
cd backend
npm run dev
```

Le backend devrait démarrer sans erreur. Vérifiez les logs :
- ✅ "Connected to PostgreSQL database"
- ✅ "Server running on port 3001"

### 4. Tester l'authentification

1. Créez un nouveau compte via `/api/auth/signup`
2. Connectez-vous via `/api/auth/signin`
3. Vérifiez que le token JWT est retourné

## 🐛 Dépannage

### Erreur : "relation does not exist"

**Cause** : Les migrations n'ont pas été exécutées.

**Solution** :
```bash
npm run migrate
```

### Erreur : "duplicate key value violates unique constraint"

**Cause** : La migration a déjà été exécutée.

**Solution** :
```bash
# Vérifier l'état
npm run migrate:list

# Si la migration est déjà exécutée, c'est normal
```

### Erreur : "password authentication failed"

**Cause** : Mauvais identifiants de base de données.

**Solution** : Vérifiez votre `.env` et la variable `DATABASE_URL`.

### Erreur : "SSL connection required"

**Cause** : La base de données nécessite SSL.

**Solution** : Ajoutez `?sslmode=require` à votre `DATABASE_URL` :
```
DATABASE_URL=postgresql://...?sslmode=require
```

### Migration échouée

Si une migration échoue :

1. Le système fait automatiquement un ROLLBACK
2. Vérifiez les logs d'erreur
3. Corrigez le fichier SQL
4. Réexécutez :
   ```bash
   npm run migrate
   ```

### Réexécuter toutes les migrations

Si vous devez réexécuter toutes les migrations (développement uniquement) :

```bash
npm run migrate:reset
npm run migrate
```

⚠️ **Attention** : Cela ne supprime pas les tables, seulement le suivi des migrations.

## 📚 Ressources

- [Documentation complète des migrations](../docs/MIGRATIONS.md)
- [Documentation du backend](./README.md)
- [Configuration des variables d'environnement](../docs/CONFIGURATION_ENV.md)
- [Communication Frontend-Backend](../docs/COMMUNICATION_FRONTEND_BACKEND.md)

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs du backend
2. Vérifiez les logs de la base de données
3. Consultez la section [Dépannage](#dépannage)
4. Vérifiez que toutes les migrations sont exécutées : `npm run migrate:list`

