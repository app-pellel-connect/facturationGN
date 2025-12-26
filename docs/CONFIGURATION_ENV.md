# Configuration des Variables d'Environnement

## 📋 Fichiers .env à créer

### 1. Frontend - `.env` à la racine du projet

Créer un fichier `.env` à la racine du projet avec :

```env
# URL de l'API backend
VITE_API_URL=http://localhost:3001/api
```

**Note :** En production, remplacer par l'URL de votre backend déployé.

### 2. Backend - `backend/.env`

Créer un fichier `.env` dans le dossier `backend/` avec :

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration - Neon PostgreSQL
DATABASE_URL=postgresql://neondb_owner:npg_UZA4Nqbvw9ko@ep-tiny-tree-ad4orbp8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔐 Génération des clés JWT

Pour générer des clés JWT sécurisées, utilisez :

```bash
# Générer une clé JWT secrète
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou avec OpenSSL
openssl rand -hex 64
```

## 📝 Instructions de configuration

### Frontend

1. Créer le fichier `.env` à la racine :
```bash
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

2. Vérifier que le fichier est bien créé :
```bash
cat .env
```

### Backend

1. Créer le fichier `.env` dans `backend/` :
```bash
cd backend
cp .env.example .env  # Si .env.example existe
# Sinon créer manuellement
```

2. Éditer `backend/.env` et configurer :
   - `DATABASE_URL` avec votre URL Neon
   - `JWT_SECRET` et `JWT_REFRESH_SECRET` avec des clés sécurisées
   - `CORS_ORIGIN` avec l'URL du frontend (http://localhost:8080)

## ✅ Vérification

### Frontend
```bash
# Vérifier que la variable est chargée
npm run dev
# Dans la console du navigateur, vérifier que les requêtes vont vers la bonne URL
```

### Backend
```bash
cd backend
npm run dev
# Vérifier dans les logs :
# ✅ Connected to PostgreSQL database
# 🚀 Serveur démarré sur le port 3001
# 🌐 CORS autorisé pour: http://localhost:8080
```

## 🔄 Variables importantes

| Variable | Frontend | Backend | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ✅ | ❌ | URL de l'API backend |
| `DATABASE_URL` | ❌ | ✅ | URL de connexion PostgreSQL |
| `JWT_SECRET` | ❌ | ✅ | Clé secrète pour signer les tokens JWT |
| `CORS_ORIGIN` | ❌ | ✅ | Origine autorisée pour CORS |
| `PORT` | ❌ | ✅ | Port du serveur backend |

## 🚨 Sécurité

⚠️ **Important :**
- Ne jamais commiter les fichiers `.env` dans Git
- Les fichiers `.env` sont déjà dans `.gitignore`
- Utiliser des clés JWT différentes en développement et production
- Ne pas partager vos clés JWT publiquement

