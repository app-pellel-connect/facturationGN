# Backend FactureGN

Backend sécurisé Node.js/Express pour la plateforme de facturation FactureGN.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ ou Bun
- PostgreSQL 14+
- Variables d'environnement configurées

### Installation

```bash
cd backend
npm install
# ou
bun install
```

### Configuration

1. Copier le fichier `.env.example` vers `.env`:

```bash
cp .env.example .env
```

2. Configurer les variables d'environnement dans `.env`:

**Option 1: Utiliser DATABASE_URL (recommandé pour Neon, Railway, etc.)**

```env
PORT=3001
NODE_ENV=development

# URL de connexion complète (priorité)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Exemple pour Neon:
# DATABASE_URL=postgresql://neondb_owner:password@ep-tiny-tree-ad4orbp8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

CORS_ORIGIN=http://localhost:5173
```

**Option 2: Utiliser des paramètres individuels (fallback)**

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=facturationgn
DB_USER=postgres
DB_PASSWORD=password

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

CORS_ORIGIN=http://localhost:5173
```

### Migration de la base de données

Exécuter les migrations pour créer les tables nécessaires:

```bash
npm run migrate
# ou
bun run migrate
```

Cette commande :
- Crée la table `schema_migrations` pour suivre les migrations
- Crée la table `users` pour stocker les mots de passe hashés
- Exécute toutes les migrations SQL non exécutées dans l'ordre

**Commandes disponibles :**
- `npm run migrate` - Exécuter les migrations
- `npm run migrate:list` - Lister les migrations et leur statut
- `npm run migrate:reset` - Réinitialiser le suivi des migrations (développement uniquement)

### Seed de la base de données (données de test)

Peupler la base de données avec des données de test :

```bash
npm run seed                # Scénario standard
npm run seed:minimal        # Scénario minimal
npm run seed:standard       # Scénario standard
npm run seed:full           # Scénario complet
```

**Migration + Seed en une commande :**
```bash
npm run migrate:seed        # Migration + seed standard
npm run migrate:seed:minimal
npm run migrate:seed:standard
npm run migrate:seed:full
```

📖 **Documentation complète** : 
- [Guide des migrations](../docs/MIGRATIONS.md)
- [Guide du seed](../docs/SEED_DATABASE.md)

### Démarrage

**Mode développement:**
```bash
npm run dev
# ou
bun run dev
```

**Mode production:**
```bash
npm run build
npm start
# ou
bun run build
bun start
```

## 📚 API Endpoints

### Authentification

- `POST /api/auth/signup` - Inscription
- `POST /api/auth/signin` - Connexion
- `POST /api/auth/refresh` - Rafraîchir le token
- `GET /api/auth/me` - Obtenir le profil actuel

### Entreprises

- `GET /api/companies` - Lister toutes les entreprises (propriétaire uniquement)
- `GET /api/companies/:id` - Obtenir une entreprise
- `POST /api/companies` - Créer une entreprise
- `PUT /api/companies/:id` - Mettre à jour une entreprise
- `DELETE /api/companies/:id` - Supprimer une entreprise (propriétaire uniquement)

### Clients

- `GET /api/clients` - Lister les clients
- `GET /api/clients/:id` - Obtenir un client
- `POST /api/clients` - Créer un client
- `PUT /api/clients/:id` - Mettre à jour un client
- `DELETE /api/clients/:id` - Supprimer un client

### Factures

- `GET /api/invoices` - Lister les factures
- `GET /api/invoices/:id` - Obtenir une facture
- `POST /api/invoices` - Créer une facture
- `PUT /api/invoices/:id` - Mettre à jour une facture
- `DELETE /api/invoices/:id` - Supprimer une facture

### Paiements

- `GET /api/payments/invoice/:invoiceId` - Lister les paiements d'une facture
- `POST /api/payments` - Créer un paiement
- `DELETE /api/payments/:id` - Supprimer un paiement

### Équipe

- `GET /api/team` - Lister les membres de l'entreprise
- `POST /api/team` - Créer un membre (inviter)
- `PUT /api/team/:id` - Mettre à jour un membre
- `DELETE /api/team/:id` - Supprimer un membre

### Tableau de bord

- `GET /api/dashboard/stats` - Statistiques du tableau de bord

## 🔐 Sécurité

Le backend implémente plusieurs mesures de sécurité:

- **JWT Authentication** - Tokens d'authentification sécurisés
- **Helmet** - Protection des en-têtes HTTP
- **CORS** - Configuration stricte des origines autorisées
- **Rate Limiting** - Limitation du nombre de requêtes
- **Password Hashing** - Hashage bcrypt des mots de passe
- **Input Validation** - Validation Zod des données d'entrée
- **SQL Injection Protection** - Requêtes paramétrées
- **Audit Logging** - Journalisation des actions

## 🏗️ Architecture

```
backend/
├── src/
│   ├── config/          # Configuration (database, env)
│   ├── middleware/      # Middlewares (auth, validation, error)
│   ├── routes/          # Routes API
│   ├── utils/           # Utilitaires (JWT, password)
│   ├── db/              # Migrations
│   └── index.ts         # Point d'entrée
├── package.json
├── tsconfig.json
└── README.md
```

## 📝 Notes

- Le premier utilisateur inscrit devient automatiquement propriétaire de la plateforme
- Les tokens JWT expirent après 7 jours (configurable)
- Les refresh tokens expirent après 30 jours (configurable)
- Toutes les routes (sauf `/api/auth/signup` et `/api/auth/signin`) nécessitent une authentification

