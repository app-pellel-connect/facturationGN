# 🚀 Guide de Démarrage - FactureGN

Ce guide explique comment installer, builder et démarrer le projet FactureGN.

## 📋 Prérequis

- Node.js 18+ installé
- npm installé
- Base de données PostgreSQL configurée (Neon ou locale)
- Fichiers `.env` configurés (voir `docs/CONFIGURATION_ENV.md`)

## 🚀 Démarrage Rapide

### Option 1: Script automatique (Recommandé)

Le script `scripts/start.cjs` gère automatiquement l'installation, le build et le démarrage :

```bash
# Mode développement (install + démarrage)
npm start

# Ou explicitement
npm run start:dev

# Mode production (install + build + démarrage)
npm run start:prod
```

**Options disponibles :**
```bash
npm start -- --dev          # Mode développement
npm start -- --build        # Force le build
npm start -- --no-install   # Ignore l'installation
```

### Option 2: Scripts manuels

#### Installation des dépendances

```bash
# Installer toutes les dépendances (frontend + backend)
npm run install:all
```

#### Build

```bash
# Builder le projet (frontend + backend)
npm run build:all
```

#### Démarrage

**Mode développement :**
```bash
# Frontend (port 8080)
npm run dev

# Backend (dans un autre terminal, port 3001)
cd backend
npm run dev
```

**Mode production :**
```bash
# Frontend
npm run preview

# Backend (dans un autre terminal)
cd backend
npm start
```

## 📝 Scripts Disponibles

### Scripts Frontend (package.json racine)

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarre le serveur de développement Vite (port 8080) |
| `npm run build` | Build le frontend pour la production |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | Exécute le linter |
| `npm start` | Lance le script de démarrage automatique (dev) |
| `npm run start:dev` | Lance en mode développement |
| `npm run start:prod` | Lance en mode production |
| `npm run install:all` | Installe les dépendances frontend + backend |
| `npm run build:all` | Build frontend + backend |

### Scripts Backend (backend/package.json)

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarre le serveur en mode développement avec hot-reload |
| `npm run build` | Compile TypeScript vers JavaScript |
| `npm start` | Démarre le serveur en mode production |
| `npm run migrate` | Exécute les migrations de base de données |

## 🔧 Scripts Shell (Alternative)

### Windows (PowerShell)

```powershell
# Mode développement
.\scripts\start.ps1 -Dev

# Mode production avec build
.\scripts\start.ps1 -Build

# Sans installation
.\scripts\start.ps1 -Dev -NoInstall
```

### Linux/Mac (Bash)

```bash
# Rendre le script exécutable (première fois)
chmod +x scripts/start.sh

# Mode développement
./scripts/start.sh --dev

# Mode production avec build
./scripts/start.sh --build

# Sans installation
./scripts/start.sh --dev --no-install
```

## 🌐 URLs

Une fois démarré :

- **Frontend** : http://localhost:8080
- **Backend API** : http://localhost:3001/api
- **Health Check** : http://localhost:3001/health

## 📦 Structure du Script de Démarrage

Le script `scripts/start.cjs` effectue les étapes suivantes :

1. **Installation** (`--no-install` pour ignorer)
   - Installe les dépendances frontend (`npm install`)
   - Installe les dépendances backend (`cd backend && npm install`)

2. **Build** (si `--build` ou mode production)
   - Build le backend (`cd backend && npm run build`)
   - Build le frontend (`npm run build`)

3. **Démarrage**
   - Mode dev : Lance `npm run dev` pour frontend et backend
   - Mode prod : Lance `npm start` pour frontend et backend

## ⚠️ Notes Importantes

### Fichiers .env requis

Avant de démarrer, assurez-vous d'avoir :

1. **`.env`** à la racine :
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

2. **`backend/.env`** :
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   CORS_ORIGIN=http://localhost:8080
   ```

### Migrations de base de données

Lors de la première installation, exécutez les migrations :

```bash
cd backend
npm run migrate
```

### Dépannage

**Erreur de port déjà utilisé :**
- Frontend : Changez le port dans `vite.config.ts`
- Backend : Changez `PORT` dans `backend/.env`

**Erreur de connexion à la base de données :**
- Vérifiez `DATABASE_URL` dans `backend/.env`
- Vérifiez que PostgreSQL est démarré
- Vérifiez les credentials

**Erreur CORS :**
- Vérifiez que `CORS_ORIGIN` dans `backend/.env` correspond à l'URL du frontend

## 🔄 Workflow Recommandé

1. **Première installation :**
   ```bash
   npm run install:all
   cd backend
   npm run migrate
   cd ..
   npm start
   ```

2. **Développement quotidien :**
   ```bash
   npm start  # Démarre en mode dev (frontend + backend)
   ```

3. **Avant de déployer :**
   ```bash
   npm run build:all
   npm run start:prod
   ```

## 📚 Documentation

- Configuration : `docs/CONFIGURATION_ENV.md`
- Communication Frontend/Backend : `docs/COMMUNICATION_FRONTEND_BACKEND.md`
- Backend : `backend/README.md`

