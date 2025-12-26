# Variables d'Environnement pour Vercel - Production

Ce document liste toutes les variables d'environnement à configurer dans Vercel Dashboard pour la production.

## 📋 Configuration dans Vercel Dashboard

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **Environment Variables**
4. Ajoutez chaque variable ci-dessous
5. Sélectionnez **Production** (et éventuellement **Preview** et **Development**)

## 🔐 Variables Obligatoires

### Base de Données

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

**Description:** URL de connexion PostgreSQL complète  
**Exemple (Neon):** `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`  
**⚠️ Important:** Utilisez le mode SSL (`sslmode=require`) pour les bases de données cloud

### JWT - Authentification

```env
JWT_SECRET=votre_secret_jwt_super_securise
JWT_REFRESH_SECRET=votre_refresh_secret_super_securise
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

**Description:** Secrets pour l'authentification JWT  
**⚠️ CRITIQUE:** 
- Générez des secrets forts et uniques
- Ne réutilisez JAMAIS les secrets de développement
- Changez les secrets par défaut

**Génération de secrets sécurisés:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64
```

### CORS

```env
CORS_ORIGIN=https://votre-projet.vercel.app
```

**Description:** URL du frontend autorisée pour les requêtes CORS  
**Exemple:** `https://facturationgn.vercel.app`  
**Note:** Si frontend et backend sont sur le même domaine, utilisez l'URL de votre projet Vercel

### Environnement

```env
NODE_ENV=production
```

**Description:** Environnement d'exécution  
**Valeur:** Toujours `production` pour la production

## ⚙️ Variables Optionnelles

### Rate Limiting

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Description:** Configuration du rate limiting  
**Valeurs par défaut:**
- `RATE_LIMIT_WINDOW_MS`: 900000 (15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: 100 requêtes par fenêtre

## 🌐 Variables Frontend (OBLIGATOIRE)

### VITE_API_URL

```env
VITE_API_URL=/api
```

**Description:** URL de l'API backend utilisée par le frontend React  
**Valeur en production:** `/api` (chemin relatif)  
**Valeur en développement:** `http://localhost:3001/api`

**⚠️ Important:**
- En production sur Vercel, utilisez `/api` (chemin relatif) car le frontend et le backend sont sur le même domaine
- Cela évite les problèmes CORS et simplifie la configuration
- Vercel redirige automatiquement les routes `/api/*` vers les fonctions serverless du backend

**Comment ça fonctionne:**
- Frontend déployé sur: `https://votre-projet.vercel.app`
- Requêtes API vers: `https://votre-projet.vercel.app/api/*`
- Vercel route automatiquement vers les fonctions serverless du backend

## 📝 Checklist de Configuration

Avant de déployer, vérifiez que vous avez configuré:

- [ ] `DATABASE_URL` - URL de connexion PostgreSQL valide
- [ ] `JWT_SECRET` - Secret fort et unique (généré)
- [ ] `JWT_REFRESH_SECRET` - Secret fort et unique (généré)
- [ ] `JWT_EXPIRES_IN` - Durée de validité du token (ex: `1h`, `7d`)
- [ ] `JWT_REFRESH_EXPIRES_IN` - Durée de validité du refresh token (ex: `7d`, `30d`)
- [ ] `CORS_ORIGIN` - URL de votre frontend déployé
- [ ] `NODE_ENV` - Défini à `production`
- [ ] `VITE_API_URL` - Défini à `/api` pour la production

## 🔄 Après Configuration

1. **Redéployez** votre application (Vercel ne recharge pas les variables sans redéploiement)
2. **Vérifiez les logs** dans Vercel Dashboard pour confirmer que les variables sont chargées
3. **Testez** l'application pour vérifier que tout fonctionne

## 🚨 Sécurité

### ⚠️ Ne JAMAIS:

- Commiter les fichiers `.env` dans Git
- Partager les secrets en clair
- Réutiliser les secrets entre environnements
- Utiliser les secrets par défaut en production

### ✅ Bonnes Pratiques:

- Utilisez des secrets différents pour chaque environnement
- Générez des secrets longs et aléatoires (minimum 64 caractères)
- Activez la rotation des secrets régulièrement
- Utilisez Vercel Secrets pour les secrets sensibles (optionnel)

## 📚 Ressources

- [Documentation Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentation Vercel - Secrets](https://vercel.com/docs/concepts/projects/environment-variables#vercel-secrets)

