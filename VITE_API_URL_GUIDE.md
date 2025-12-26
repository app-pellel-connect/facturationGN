# Guide de Configuration VITE_API_URL pour Vercel

## 📋 Vue d'ensemble

`VITE_API_URL` est la variable d'environnement qui définit l'URL de l'API backend utilisée par le frontend React.

## 🔄 Valeurs selon l'environnement

### Développement Local

```env
VITE_API_URL=http://localhost:3001/api
```

**Utilisation:** Quand vous développez localement avec `npm run dev`

### Production sur Vercel

```env
VITE_API_URL=/api
```

**Utilisation:** Quand l'application est déployée sur Vercel

## ⚙️ Pourquoi `/api` en production ?

Sur Vercel, le frontend et le backend sont déployés sur le **même domaine** :

- **Frontend:** `https://votre-projet.vercel.app`
- **API:** `https://votre-projet.vercel.app/api/*`

En utilisant un chemin relatif (`/api`), le frontend fait automatiquement des requêtes vers le même domaine, ce qui :

✅ **Évite les problèmes CORS** - Pas besoin de configurer CORS pour des domaines différents  
✅ **Simplifie la configuration** - Pas besoin de connaître l'URL exacte du backend  
✅ **Fonctionne avec les redirections Vercel** - Vercel route automatiquement `/api/*` vers les fonctions serverless

## 🔧 Configuration dans Vercel

### Méthode 1 : Via Vercel Dashboard (Recommandé)

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. **Settings** > **Environment Variables**
4. Cliquez sur **Add New**
5. Ajoutez:
   - **Key:** `VITE_API_URL`
   - **Value:** `/api`
   - **Environments:** Sélectionnez **Production** (et **Preview** si nécessaire)
6. Cliquez sur **Save**

### Méthode 2 : Via Vercel CLI

```bash
vercel env add VITE_API_URL production
# Entrez: /api
```

## 🧪 Vérification

### 1. Vérifier dans le code compilé

Après le build, vérifiez que la variable est bien injectée :

```bash
# Build le projet
npm run build

# Chercher dans les fichiers compilés
grep -r "VITE_API_URL" dist/
```

### 2. Vérifier dans le navigateur

1. Ouvrez votre application déployée
2. Ouvrez les **DevTools** (F12)
3. Allez dans l'onglet **Console**
4. Tapez: `console.log(import.meta.env.VITE_API_URL)`
5. Vous devriez voir: `/api`

### 3. Vérifier les requêtes réseau

1. Ouvrez les **DevTools** (F12)
2. Allez dans l'onglet **Network**
3. Effectuez une action qui fait une requête API (ex: connexion)
4. Vérifiez que la requête va vers `/api/auth/signin` et non vers `http://localhost:3001/api/auth/signin`

## 🐛 Dépannage

### Problème: Les requêtes vont vers localhost

**Symptôme:** Les requêtes API vont vers `http://localhost:3001/api` au lieu de `/api`

**Solutions:**
1. Vérifiez que `VITE_API_URL=/api` est bien configuré dans Vercel Dashboard
2. Redéployez l'application (les variables d'environnement sont injectées au build)
3. Vérifiez que vous avez sélectionné le bon environnement (Production)

### Problème: Erreurs CORS

**Symptôme:** Erreurs CORS dans la console du navigateur

**Solutions:**
1. Vérifiez que `VITE_API_URL=/api` (pas une URL complète)
2. Vérifiez que `CORS_ORIGIN` dans le backend correspond à votre URL Vercel
3. Assurez-vous que le frontend et le backend sont sur le même domaine

### Problème: 404 sur les routes API

**Symptôme:** Les requêtes vers `/api/*` retournent 404

**Solutions:**
1. Vérifiez que `backend/vercel.json` existe et est correctement configuré
2. Vérifiez que `backend/api/index.ts` existe et exporte correctement le handler
3. Vérifiez les logs de build dans Vercel Dashboard

## 📚 Code Source

La variable est utilisée dans `src/lib/api/client.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

**Note:** La valeur par défaut (`http://localhost:3001/api`) est utilisée uniquement en développement local si la variable n'est pas définie.

## ✅ Checklist

Avant de déployer en production:

- [ ] `VITE_API_URL` est défini à `/api` dans Vercel Dashboard
- [ ] L'environnement est sélectionné (Production)
- [ ] L'application a été redéployée après avoir ajouté la variable
- [ ] Les requêtes API fonctionnent correctement
- [ ] Pas d'erreurs CORS dans la console

