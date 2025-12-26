# 🚀 Configuration des Variables d'Environnement pour Vercel

Guide rapide pour configurer les variables d'environnement de production sur Vercel.

## 📋 Étapes Rapides

### 1. Générer les Secrets JWT

```bash
cd backend
node scripts/generate-secrets.js
```

Cela générera deux secrets sécurisés que vous devrez copier.

### 2. Configurer dans Vercel Dashboard

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. **Settings** > **Environment Variables**
4. Cliquez sur **Add New**
5. Ajoutez chaque variable ci-dessous
6. Sélectionnez **Production** (et **Preview** si nécessaire)
7. Cliquez sur **Save**

### 3. Variables à Ajouter

Copiez-collez ces variables une par une dans Vercel:

```env
# Base de données (remplacez par votre URL réelle)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# JWT Secrets (générez-les avec le script ci-dessus)
JWT_SECRET=votre_secret_jwt_généré
JWT_REFRESH_SECRET=votre_refresh_secret_généré

# Durées de validité des tokens
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS (remplacez par votre URL Vercel)
CORS_ORIGIN=https://votre-projet.vercel.app

# Environnement
NODE_ENV=production

# Frontend - URL de l'API (utilisez /api en production)
VITE_API_URL=/api
```

### 4. Redéployer

Après avoir ajouté toutes les variables:

1. Allez dans **Deployments**
2. Cliquez sur les **3 points** du dernier déploiement
3. Sélectionnez **Redeploy**

Ou simplement poussez un nouveau commit pour déclencher un nouveau déploiement.

## ✅ Vérification

Après le redéploiement, vérifiez que:

- [ ] L'application démarre sans erreur
- [ ] Les logs ne montrent pas d'erreurs de connexion à la base de données
- [ ] L'authentification fonctionne (connexion/inscription)
- [ ] Les requêtes API fonctionnent
- [ ] Le frontend peut communiquer avec le backend (pas d'erreurs CORS)

### Vérifier VITE_API_URL

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet **Network**
3. Effectuez une action qui fait une requête API (ex: connexion)
4. Vérifiez que la requête va vers `/api/*` et non vers `http://localhost:3001/api`

## 📚 Documentation Complète

Pour plus de détails, consultez:
- `vercel.env.production.md` - Documentation détaillée
- `backend/vercel.env.production.txt` - Liste de référence rapide
- `docs/DEPLOIEMENT_VERCEL.md` - Guide complet de déploiement

## 🔐 Sécurité

⚠️ **IMPORTANT:**
- Ne commitez JAMAIS les secrets dans Git
- Utilisez des secrets différents pour chaque environnement
- Changez les secrets par défaut
- Ne partagez jamais les secrets en clair

