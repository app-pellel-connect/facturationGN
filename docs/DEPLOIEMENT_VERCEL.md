# Guide de Déploiement sur Vercel

Ce document explique comment déployer l'application FactureGN sur Vercel, avec le frontend React et le backend Node.js/Express.

## 📋 Table des Matières

1. [Architecture de Déploiement](#architecture-de-déploiement)
2. [Prérequis](#prérequis)
3. [Configuration du Projet](#configuration-du-projet)
4. [Variables d'Environnement](#variables-denvironnement)
5. [Installation des Dépendances](#installation-des-dépendances)
6. [Déploiement](#déploiement)
7. [Base de Données](#base-de-données)
8. [Dépannage](#dépannage)

## 🏗️ Architecture de Déploiement

Vercel permet de déployer :
- **Frontend** : Application React/Vite en tant que site statique
- **Backend** : API Express en tant que fonctions serverless (Vercel Functions)

### Structure du Déploiement

```
/
├── vercel.json (configuration frontend)
├── package.json
├── vite.config.ts
├── src/ (frontend React)
└── backend/
    ├── vercel.json (configuration backend)
    ├── api/
    │   └── index.ts (point d'entrée serverless)
    └── src/
        └── index.ts (application Express)
```

Les routes `/api/*` sont automatiquement redirigées vers les fonctions serverless du backend.

## ✅ Prérequis

- Un compte [Vercel](https://vercel.com)
- Le projet Git hébergé sur GitHub, GitLab ou Bitbucket
- Base de données PostgreSQL (Neon, Supabase, ou autre)
- [Vercel CLI](https://vercel.com/docs/cli) installé (optionnel, pour déploiement via CLI)

## ⚙️ Configuration du Projet

### Fichiers de Configuration

Les fichiers suivants ont déjà été créés :

1. **`vercel.json`** (racine) : Configuration du frontend
2. **`backend/vercel.json`** : Configuration du backend
3. **`backend/api/index.ts`** : Point d'entrée serverless

### Vérification

Assurez-vous que :
- ✅ `backend/src/index.ts` exporte `app` comme export par défaut
- ✅ `backend/src/index.ts` ne démarre le serveur que si exécuté directement
- ✅ `backend/api/index.ts` importe et utilise l'application Express

## 🔐 Variables d'Environnement

### Variables Frontend

Dans Vercel Dashboard > Settings > Environment Variables, configurez :

```
VITE_API_URL=/api
```

**En production**, utilisez `/api` pour que le frontend communique avec le backend sur le même domaine (évite les problèmes CORS).

**En développement local**, utilisez `http://localhost:3001/api`.

### Variables Backend

Configurez toutes ces variables dans Vercel Dashboard :

```
# Base de données (obligatoire)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# JWT (obligatoire - utilisez des secrets forts!)
JWT_SECRET=votre_secret_jwt_super_securise_changez_moi
JWT_REFRESH_SECRET=votre_refresh_secret_super_securise_changez_moi
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS (facultatif si frontend et backend sur le même domaine)
CORS_ORIGIN=https://votre-domaine.vercel.app

# Environnement
NODE_ENV=production
```

**Génération de secrets JWT** (recommandé) :
```bash
# Sur Linux/Mac
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Sur Windows PowerShell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**⚠️ Important** : 
- Ne commitez JAMAIS les secrets dans Git
- Utilisez des secrets différents pour production et développement
- Changez les secrets par défaut

## 📦 Installation des Dépendances

### Pour Vercel Functions

Le backend utilise `@vercel/node` pour les fonctions serverless. Installez-le :

```bash
cd backend
npm install --save-dev @vercel/node
```

Vercel utilisera automatiquement cette dépendance lors du build.

## 🚀 Déploiement

### Méthode 1 : Via Vercel Dashboard (Recommandé pour débuter)

1. **Connecter le dépôt Git**
   - Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
   - Cliquez sur "New Project" ou "Add New..." > "Project"
   - Importez votre dépôt Git (GitHub, GitLab, Bitbucket)

2. **Configurer le projet**
   - **Framework Preset** : Vite (détecté automatiquement)
   - **Root Directory** : `./` (racine)
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`

3. **Ajouter les variables d'environnement**
   - Dans "Environment Variables", ajoutez toutes les variables listées ci-dessus
   - Sélectionnez les environnements (Production, Preview, Development)

4. **Déployer**
   - Cliquez sur "Deploy"
   - Attendez que le build se termine
   - Votre application sera accessible à l'URL fournie

### Méthode 2 : Via Vercel CLI

1. **Installer Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Se connecter**
   ```bash
   vercel login
   ```

3. **Lier le projet local**
   ```bash
   vercel link
   ```
   Suivez les instructions pour créer ou lier un projet Vercel.

4. **Ajouter les variables d'environnement**
   ```bash
   # Variables pour la production
   vercel env add DATABASE_URL production
   vercel env add JWT_SECRET production
   vercel env add JWT_REFRESH_SECRET production
   vercel env add VITE_API_URL production
   # ... etc pour chaque variable
   
   # Répéter pour preview et development si nécessaire
   ```

5. **Déployer**
   ```bash
   # Déploiement en preview
   vercel

   # Déploiement en production
   vercel --prod
   ```

### Structure après Déploiement

Une fois déployé, votre application sera accessible à :
- **Frontend** : `https://votre-projet.vercel.app`
- **API** : `https://votre-projet.vercel.app/api/*`

Toutes les routes `/api/*` sont automatiquement redirigées vers les fonctions serverless du backend.

## 📊 Base de Données

### Migration

Les migrations doivent être exécutées avant ou après le premier déploiement.

#### Option 1 : Via Vercel CLI (Recommandé)

1. **Récupérer les variables d'environnement**
   ```bash
   vercel env pull .env.production
   ```

2. **Exécuter les migrations**
   ```bash
   cd backend
   npm run migrate
   ```

#### Option 2 : Script de déploiement

Créez un script `scripts/vercel-build.sh` :

```bash
#!/bin/bash
set -e

echo "📦 Installation des dépendances..."
npm install
cd backend && npm install && cd ..

echo "🔄 Exécution des migrations..."
cd backend
npm run migrate
cd ..

echo "🏗️ Build du frontend..."
npm run build
```

Puis ajoutez dans `package.json` :

```json
{
  "scripts": {
    "vercel-build": "bash scripts/vercel-build.sh"
  }
}
```

**⚠️ Attention** : Cette approche peut ralentir le déploiement. Préférez l'Option 1.

### Seeding (Données de Test)

⚠️ **Ne jamais exécuter le seeding en production** sauf pour initialiser la base de données.

Pour les données de test en développement :
```bash
cd backend
npm run seed
```

## 🔍 Dépannage

### Problème : Les routes API ne fonctionnent pas (404)

**Symptômes** : Les requêtes à `/api/*` retournent 404

**Solutions** :
1. Vérifiez que `backend/vercel.json` existe et est correctement configuré
2. Vérifiez que `backend/api/index.ts` existe et exporte correctement le handler
3. Vérifiez les logs de build dans Vercel Dashboard
4. Assurez-vous que `@vercel/node` est installé dans `backend/package.json`

### Problème : Variables d'environnement non disponibles

**Symptômes** : `process.env.VARIABLE` est `undefined`

**Solutions** :
1. Vérifiez que les variables sont définies dans Vercel Dashboard > Settings > Environment Variables
2. Redéployez après avoir ajouté/modifié les variables (Vercel ne recharge pas les variables sans redéploiement)
3. Vérifiez que vous avez sélectionné le bon environnement (Production, Preview, Development)
4. Utilisez `vercel env pull` pour vérifier les variables locales

### Problème : Erreur CORS

**Symptômes** : `Access-Control-Allow-Origin` erreur dans la console

**Solutions** :
1. Si frontend et backend sont sur le même domaine Vercel, utilisez `VITE_API_URL=/api`
2. Configurez `CORS_ORIGIN` dans les variables d'environnement avec l'URL exacte du frontend
3. Vérifiez la configuration CORS dans `backend/src/index.ts`

### Problème : Base de données non accessible

**Symptômes** : Erreurs de connexion à la base de données

**Solutions** :
1. Vérifiez que `DATABASE_URL` est correctement configuré dans Vercel
2. Vérifiez que votre base de données accepte les connexions depuis Vercel (whitelist IP si nécessaire)
3. Pour Neon, assurez-vous d'utiliser le pooler avec `?sslmode=require`
4. Vérifiez les logs de fonction dans Vercel Dashboard pour voir l'erreur exacte

### Problème : Build échoue

**Symptômes** : Le déploiement échoue pendant le build

**Solutions** :
1. Vérifiez les logs de build dans Vercel Dashboard
2. Testez le build localement : `npm run build`
3. Assurez-vous que toutes les dépendances sont dans `package.json` (pas dans `package-lock.json` uniquement)
4. Vérifiez que `node_modules` n'est pas commité (doit être dans `.gitignore`)
5. Vérifiez que TypeScript compile sans erreur : `cd backend && npm run build`

### Problème : Fonction serverless timeout

**Symptômes** : Les requêtes API prennent trop de temps et timeout

**Solutions** :
1. Vercel Functions ont un timeout de 10 secondes (gratuit) ou 60 secondes (Pro)
2. Optimisez vos requêtes de base de données
3. Utilisez la mise en cache quand c'est possible
4. Pour les opérations longues, considérez un service séparé (Queue, Background Jobs)

### Problème : TypeScript errors lors du build

**Symptômes** : Erreurs TypeScript dans les logs de build

**Solutions** :
1. Vérifiez que `backend/tsconfig.json` est correctement configuré
2. Assurez-vous que tous les types sont installés : `@types/node`, `@types/express`, etc.
3. Testez la compilation locale : `cd backend && npm run build`

## 📝 Checklist de Déploiement

Avant de déployer en production :

### Pré-déploiement
- [ ] Toutes les variables d'environnement sont configurées dans Vercel
- [ ] Les secrets JWT sont forts et uniques (générés avec `crypto.randomBytes`)
- [ ] La base de données est accessible depuis Vercel (whitelist IP si nécessaire)
- [ ] Les tests passent localement
- [ ] Le build fonctionne localement (`npm run build`)
- [ ] Les migrations ont été exécutées (ou sont prêtes à être exécutées)
- [ ] Le CORS est correctement configuré
- [ ] `@vercel/node` est installé dans `backend/package.json`

### Post-déploiement
- [ ] L'application est accessible via l'URL Vercel
- [ ] Les routes API fonctionnent (`/api/auth/signin`, etc.)
- [ ] La connexion à la base de données fonctionne
- [ ] L'authentification fonctionne (signin/signup)
- [ ] Les logs sont surveillés dans Vercel Dashboard
- [ ] Un domaine personnalisé est configuré (optionnel)

## 🔄 Mises à Jour

Pour mettre à jour l'application :

### Via Git (Automatique)

1. Push les changements sur votre branche principale
2. Vercel redéploiera automatiquement (si GitHub/GitLab est connecté)
3. Les déploiements sur d'autres branches créent des "Preview Deployments"

### Via CLI (Manuel)

```bash
# Déploiement en preview
vercel

# Déploiement en production
vercel --prod
```

### Rollback

En cas de problème, vous pouvez revenir à une version précédente :
1. Allez dans Vercel Dashboard > Deployments
2. Cliquez sur "..." à côté du déploiement précédent
3. Sélectionnez "Promote to Production"

## 🌐 Domaine Personnalisé

Pour ajouter un domaine personnalisé :

1. Allez dans Vercel Dashboard > Settings > Domains
2. Cliquez sur "Add Domain"
3. Entrez votre domaine
4. Suivez les instructions pour configurer DNS

**Note** : Mettez à jour `CORS_ORIGIN` avec votre nouveau domaine.

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Déploiement Express sur Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- [Variables d'environnement Vercel](https://vercel.com/docs/environment-variables)
- [Monorepo sur Vercel](https://vercel.com/docs/monorepos)

## 🆘 Support

En cas de problème :

1. **Consultez les logs** dans Vercel Dashboard > Deployments > [Votre déploiement] > Functions
2. **Testez localement** avec `vercel dev` pour simuler l'environnement Vercel
3. **Vérifiez la documentation Vercel** pour les erreurs spécifiques
4. **Consultez les logs de fonction** pour les erreurs runtime

## ⚠️ Limitations Vercel (Plan Gratuit)

- **Timeout** : 10 secondes par fonction
- **Bandwidth** : 100 GB/mois
- **Function execution** : 100 GB-heures/mois
- **Build time** : 45 minutes/mois

Pour la production, considérez le [Plan Pro](https://vercel.com/pricing) pour :
- Timeout de 60 secondes
- Bandwidth illimité
- Analytics avancés
