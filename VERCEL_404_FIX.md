# 🔧 Correction de l'erreur 404 sur les routes API Vercel

## ❌ Problème

Erreur `404 (Not Found)` lors des requêtes vers `/api/*` sur Vercel :
```
POST https://facturation-gn.vercel.app/api/auth/signin 404 (Not Found)
```

## ✅ Solution Appliquée

### 1. Installation de `@vercel/node` dans le backend

```bash
cd backend
npm install --save-dev @vercel/node
```

### 2. Création du point d'entrée API à la racine

Un fichier `api/index.ts` a été créé à la racine du projet. Vercel détecte automatiquement les fichiers dans le dossier `api/` comme des fonctions serverless.

### 3. Configuration du `vercel.json`

Le fichier `vercel.json` a été mis à jour pour :
- Compiler le backend avant le frontend
- Installer les dépendances du backend
- Router les requêtes `/api/*` vers la fonction serverless

## 📋 Structure Requise

```
/
├── api/
│   └── index.ts          ← Point d'entrée serverless (NOUVEAU)
├── backend/
│   ├── api/
│   │   └── index.ts      ← Handler backend (existant)
│   ├── src/
│   │   └── index.ts      ← Application Express
│   └── package.json
├── vercel.json           ← Configuration Vercel (MIS À JOUR)
└── package.json
```

## 🔄 Prochaines Étapes

1. **Committez les changements** :
   ```bash
   git add api/index.ts vercel.json backend/package.json
   git commit -m "fix: configuration Vercel pour les routes API"
   git push
   ```

2. **Vercel redéploiera automatiquement** après le push

3. **Vérifiez les logs de build** dans Vercel Dashboard pour confirmer :
   - Le backend est compilé (`cd backend && npm run build`)
   - Le frontend est compilé (`npm run build`)
   - Les fonctions serverless sont détectées

## 🧪 Vérification

Après le redéploiement, testez :

1. **Health check** : `https://facturation-gn.vercel.app/api/health`
   - Devrait retourner : `{"status":"ok","timestamp":"..."}`

2. **Connexion** : `POST https://facturation-gn.vercel.app/api/auth/signin`
   - Ne devrait plus retourner 404

## 🐛 Si le problème persiste

### Vérifier dans Vercel Dashboard

1. **Settings** > **Functions**
   - Vérifiez que `api/index.ts` apparaît dans la liste des fonctions

2. **Deployments** > **Logs**
   - Vérifiez qu'il n'y a pas d'erreurs de build
   - Vérifiez que `@vercel/node` est installé

3. **Settings** > **Environment Variables**
   - Vérifiez que toutes les variables sont configurées
   - Vérifiez que `NODE_ENV=production` est défini

### Vérifier la configuration

1. **Vérifiez que `api/index.ts` existe** à la racine
2. **Vérifiez que `backend/src/index.ts` exporte `app`** comme export par défaut
3. **Vérifiez que le backend compile** sans erreur

### Alternative : Utiliser la configuration monorepo

Si vous avez plusieurs projets dans le même repo, vous pouvez configurer Vercel pour utiliser un dossier spécifique :

Dans Vercel Dashboard > Settings > General :
- **Root Directory** : `/` (racine)
- **Build Command** : `cd backend && npm run build && cd .. && npm run build`
- **Output Directory** : `dist`

## 📚 Ressources

- [Documentation Vercel - Serverless Functions](https://vercel.com/docs/functions)
- [Documentation Vercel - Routing](https://vercel.com/docs/routing)

