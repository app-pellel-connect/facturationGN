# Migration vers Backend JavaScript

Ce document explique comment migrer de Supabase vers le nouveau backend JavaScript sécurisé.

## 🎯 Vue d'ensemble

Le projet a été migré d'un backend Supabase vers un backend Node.js/Express sécurisé avec:
- Authentification JWT
- Base de données PostgreSQL
- API REST complète
- Sécurité renforcée (Helmet, CORS, Rate Limiting)

## 📋 Prérequis

1. **PostgreSQL** installé et configuré
2. **Node.js 18+** ou **Bun**
3. Base de données créée avec les migrations Supabase existantes

## 🚀 Installation

### 1. Installer les dépendances du backend

```bash
cd backend
npm install
# ou
bun install
```

### 2. Configurer les variables d'environnement

Copier `.env.example` vers `.env` et configurer:

```bash
cp .env.example .env
```

Éditer `.env` avec vos paramètres:

**Pour Neon (ou autre service cloud PostgreSQL):**

```env
DATABASE_URL=postgresql://neondb_owner:password@ep-tiny-tree-ad4orbp8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Pour PostgreSQL local:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=facturationgn
DB_USER=postgres
DB_PASSWORD=password
```

- Clés JWT secrètes (générer des valeurs sécurisées)
- URL CORS pour le frontend (`http://localhost:8080` en développement)

### 3. Créer la table `users`

Exécuter la migration pour créer la table des utilisateurs:

```bash
npm run migrate
# ou
bun run migrate
```

Cette table stocke les mots de passe hashés (séparés des profils pour la sécurité).

### 4. Démarrer le backend

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
```

Le backend sera accessible sur `http://localhost:3001` par défaut.

## 🔧 Configuration du Frontend

### 1. Ajouter la variable d'environnement

Créer ou mettre à jour `.env` à la racine du projet:

```env
VITE_API_URL=http://localhost:3001/api
```

### 2. Les hooks ont été mis à jour

Les hooks suivants utilisent maintenant le nouveau backend:
- `useAuth` - Authentification
- `useClients` - Gestion des clients
- `useInvoices` - Gestion des factures (à mettre à jour)
- `usePayments` - Gestion des paiements (à mettre à jour)
- `useTeamMembers` - Gestion de l'équipe (à mettre à jour)

## 📝 Notes importantes

### Migration des données existantes

Si vous avez des données existantes dans Supabase:

1. **Exporter les données** depuis Supabase
2. **Importer dans PostgreSQL** local
3. **Créer les mots de passe** pour les utilisateurs existants:
   - Les utilisateurs devront réinitialiser leurs mots de passe
   - Ou vous pouvez créer un script de migration pour générer des mots de passe temporaires

### Authentification

- Les tokens JWT sont stockés dans `localStorage`
- Le token expire après 7 jours (configurable)
- Le refresh token expire après 30 jours (configurable)

### Sécurité

Le backend implémente:
- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ Helmet (sécurité HTTP)
- ✅ CORS strict
- ✅ Rate Limiting
- ✅ Input Validation (Zod)
- ✅ SQL Injection Protection
- ✅ Audit Logging

## 🔄 Prochaines étapes

1. Mettre à jour les hooks restants (`useInvoices`, `usePayments`, `useTeamMembers`)
2. Tester toutes les fonctionnalités
3. Configurer le déploiement en production
4. Mettre à jour la documentation utilisateur

## 🐛 Dépannage

### Erreur de connexion à la base de données

Vérifier:
- PostgreSQL est démarré
- Les credentials dans `.env` sont corrects
- La base de données existe

### Erreur CORS

Vérifier que `CORS_ORIGIN` dans `.env` correspond à l'URL du frontend.

### Token invalide

Vérifier que:
- Le token est bien stocké dans `localStorage`
- Le `JWT_SECRET` est le même entre les redémarrages
- Le token n'a pas expiré

## 📚 Documentation API

Voir `backend/README.md` pour la documentation complète de l'API.

