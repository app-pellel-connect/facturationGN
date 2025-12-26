# 🔧 Correction de l'Erreur "vite: command not found" sur Vercel

## 1. 🔧 Corrections Appliquées

### Problème Identifié

L'erreur `sh: line 1: vite: command not found` indique que `vite` n'est pas disponible dans le PATH lors de l'exécution du build sur Vercel.

### Solutions Appliquées

#### A. Modification des scripts build

**Changement dans `package.json`** :

```json
// ❌ AVANT
{
  "scripts": {
    "build": "vite build"
  }
}

// ✅ APRÈS
{
  "scripts": {
    "build": "npx vite build"
  }
}
```

**Pourquoi** : `npx` trouve automatiquement les binaires dans `node_modules/.bin/`, même s'ils ne sont pas dans le PATH.

#### B. Installation des devDependencies

**Changement dans `vercel.json`** :

```json
// ❌ AVANT
{
  "installCommand": "npm install && cd backend && npm install && cd .."
}

// ✅ APRÈS
{
  "installCommand": "npm install --include=dev && cd backend && npm install && cd .."
}
```

**Pourquoi** : Garantit l'installation des `devDependencies` (où se trouve `vite`).

#### C. Placement de vite dans devDependencies

**Changement dans `package.json`** :

```json
// ✅ CORRECT
{
  "devDependencies": {
    "vite": "^5.4.19"
  }
}
```

**Pourquoi** : `vite` est un outil de build, donc logiquement en `devDependencies`. Avec `--include=dev`, il sera installé.

## 2. 🎯 Cause Racine

### Ce qui se passait

1. Vercel exécute `npm install` (sans `--include=dev`)
2. Vercel peut utiliser `npm ci --production` qui **exclut les devDependencies**
3. `vite` est dans `devDependencies` → **Non installé**
4. Vercel exécute `npm run build` qui appelle `vite build`
5. `vite` n'est pas dans le PATH → **Erreur "command not found"**

### Ce qui devait se passer

1. Installer **toutes** les dépendances, y compris les devDependencies
2. `vite` doit être disponible dans `node_modules/.bin/`
3. `npm run build` doit pouvoir trouver `vite` (via `npx` ou PATH)

### Conditions qui ont déclenché l'erreur

1. **Vercel optimise les builds** : Peut utiliser `npm ci --production`
2. **devDependencies exclues** : Par défaut en production
3. **PATH non configuré** : Les binaires de `node_modules/.bin/` ne sont pas dans le PATH

## 3. 📚 Concept Sous-jacent

### Pourquoi cette erreur existe

**Protection** : L'exclusion des devDependencies en production protège contre :
- Installation de dépendances inutiles
- Réduction de la taille du build
- Sécurité (moins de code = moins de surface d'attaque)

**Mais** : Les outils de build sont nécessaires même en production pour créer les artefacts finaux.

### Mental modèle correct

#### npx vs commande directe

```
Commande directe (vite build)
├── Cherche dans PATH
├── Peut échouer si pas dans PATH
└── Dépend de la configuration système

npx (npx vite build)
├── Cherche dans node_modules/.bin/
├── Fonctionne toujours si installé
└── Plus robuste et portable
```

#### Processus de Build Vercel

```
1. Install Dependencies
   ├── npm install (peut exclure devDependencies)
   └── Solution: npm install --include=dev

2. Build Application
   ├── Nécessite vite (devDependency)
   ├── Option 1: npx vite build (recommandé)
   └── Option 2: vite build (nécessite PATH)

3. Deploy Artifacts
   └── Seuls les artefacts finaux sont déployés
```

## 4. ⚠️ Signes d'Alerte

### Ce qu'il faut surveiller

#### 1. Commandes directes dans les scripts

```json
// ⚠️ ALERTE
{
  "scripts": {
    "build": "vite build"  // Peut échouer si vite pas dans PATH
  }
}
```

**Action** : Utiliser `npx` pour plus de robustesse

#### 2. InstallCommand sans --include=dev

```json
// ⚠️ ALERTE
{
  "installCommand": "npm install"
}
```

**Action** : Ajouter `--include=dev` si vous avez des outils de build en devDependencies

#### 3. Erreurs "command not found" dans les logs

```
vite: command not found
tsc: command not found
```

**Action** : Vérifier l'installation et utiliser `npx`

### Patterns similaires à éviter

#### Pattern 1 : Supposer que les commandes sont dans le PATH

```json
// ❌ ÉVITER
{
  "scripts": {
    "build": "vite build",
    "lint": "eslint ."
  }
}
```

**Solution** : Utiliser `npx` pour plus de robustesse

```json
// ✅ CORRECT
{
  "scripts": {
    "build": "npx vite build",
    "lint": "npx eslint ."
  }
}
```

#### Pattern 2 : InstallCommand sans --include=dev

```json
// ❌ ÉVITER
{
  "installCommand": "npm install"
}
```

**Solution** : Ajouter `--include=dev` si nécessaire

## 5. 🔄 Alternatives et Trade-offs

### Approche 1 : npx dans les scripts (✅ Recommandé)

```json
{
  "scripts": {
    "build": "npx vite build"
  },
  "installCommand": "npm install --include=dev"
}
```

**Avantages** :
- ✅ Robuste et portable
- ✅ Fonctionne toujours si installé
- ✅ Pas de dépendance sur PATH

**Inconvénients** :
- Légèrement plus lent (cherche le binaire)

**Quand l'utiliser** : Toujours (meilleure pratique)

### Approche 2 : Vite dans dependencies

```json
{
  "dependencies": {
    "vite": "^5.4.19"
  }
}
```

**Avantages** :
- ✅ Toujours installé

**Inconvénients** :
- ❌ Augmente la taille du build
- ❌ Pas sémantiquement correct
- ❌ Mauvais pour la sécurité

**Quand l'utiliser** : Jamais (mauvaise pratique)

### Approche 3 : Script npm personnalisé

```json
{
  "scripts": {
    "vercel-build": "npx vite build"
  }
}
```

**Avantages** :
- ✅ Centralise la logique

**Inconvénients** :
- ⚠️ Nécessite toujours `--include=dev`

**Quand l'utiliser** : Si vous avez une logique de build complexe

### Recommandation Finale

**Utiliser l'Approche 1** (`npx` + `--include=dev`) car :

1. **Robustesse** : Fonctionne toujours
2. **Sémantique** : `vite` reste en devDependencies
3. **Sécurité** : Moins de code en production
4. **Best Practice** : Suit les recommandations npm/Vercel

## 📋 Checklist de Vérification

Avant de déployer, vérifiez :

- [ ] Les scripts build utilisent `npx` pour les outils de build
- [ ] `installCommand` inclut `--include=dev` si nécessaire
- [ ] Les outils de build (`vite`, `tsc`, etc.) sont dans `devDependencies`
- [ ] Les logs Vercel montrent que les devDependencies sont installées
- [ ] Le build se termine sans erreur "command not found"

## 🎓 Résumé

### Leçon Principale

**Sur Vercel, utilisez `npx` dans les scripts build et `--include=dev` dans `installCommand` pour garantir que les outils de build sont disponibles.**

### Règles d'Or

1. **Règle #1** : Utilisez `npx` pour les outils de build dans les scripts
2. **Règle #2** : Ajoutez `--include=dev` dans `installCommand` si vous avez des outils de build en devDependencies
3. **Règle #3** : Gardez les outils de build en `devDependencies` (sémantiquement correct)

### Modèle Mental

```
Build Process = Install + Build
├── Install: npm install --include=dev (pour outils de build)
├── Build: npx vite build (trouve automatiquement le binaire)
└── Deploy: Seuls les artefacts finaux sont déployés
```

