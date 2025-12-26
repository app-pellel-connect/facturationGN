# Guide Complet : Erreur 404 NOT_FOUND sur Vercel

## 1. 🔧 Correction Proposée

### État Actuel de Votre Code

Votre fichier `api/index.ts` est **correctement configuré** :

```typescript
// ✅ CORRECT - Import depuis source TypeScript
import app from '../backend/src/index.js';
```

### Vérifications Supplémentaires

Si l'erreur persiste, vérifiez ces points :

#### A. Vérifier que `@vercel/node` est installé

```bash
# À la racine du projet
npm list @vercel/node

# Si absent, installer :
npm install --save-dev @vercel/node
```

**Dans votre cas** : ✅ Déjà installé (ligne 82 de `package.json`)

#### B. Vérifier la structure des fichiers

```
/
├── api/
│   └── index.ts          ← Doit exister (✅ présent)
├── backend/
│   ├── src/
│   │   └── index.ts      ← Doit exporter `app` (✅ présent)
│   └── package.json
└── vercel.json           ← Configuration (✅ présent)
```

#### C. Vérifier le `vercel.json`

Votre configuration actuelle :
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index"
    }
  ]
}
```

**Cette configuration est correcte** pour Vercel v2. Vercel détecte automatiquement les fichiers dans `api/` comme fonctions serverless.

### Si l'erreur persiste : Solution Alternative

Si après vérification l'erreur persiste, essayez cette configuration explicite :

```json
{
  "version": 2,
  "buildCommand": "cd backend && npm run build && cd .. && npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install && cd backend && npm install && cd ..",
  "functions": {
    "api/index.ts": {
      "runtime": "@vercel/node"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index"
    }
  ]
}
```

## 2. 🎯 Cause Racine Détaillée

### Ce que le code faisait vs. ce qu'il devait faire

#### Scénario Initial (Avant Correction)

**Ce que le code faisait** :
```typescript
// ❌ Code initial (hypothétique)
import app from '../backend/dist/index.js';
```

**Problème** :
1. Vercel commence le build
2. Vercel détecte `api/index.ts` comme fonction serverless
3. Vercel compile `api/index.ts` **immédiatement**
4. L'import essaie de charger `../backend/dist/index.js`
5. **Le dossier `dist` n'existe pas encore** (le build du backend n'a pas commencé)
6. Import échoue → Fonction serverless non créée → 404 NOT_FOUND

**Ce qu'il devait faire** :
```typescript
// ✅ Code correct
import app from '../backend/src/index.js';
```

**Pourquoi ça fonctionne** :
1. Vercel compile `api/index.ts`
2. L'import charge `../backend/src/index.js`
3. **Le fichier source existe toujours** (pas besoin de build)
4. Vercel compile automatiquement le TypeScript dans les fonctions serverless
5. Fonction serverless créée → Routes disponibles

### Conditions qui ont déclenché l'erreur

1. **Ordre de compilation asynchrone** :
   - Vercel optimise les builds en parallèle
   - Les fonctions serverless peuvent être compilées avant le build du backend
   - Pas de garantie d'ordre séquentiel

2. **Dépendance sur un artefact de build** :
   - Le fichier `dist/index.js` est un **artefact de build**
   - Il n'existe que **après** la compilation TypeScript
   - Les fonctions serverless ont besoin de fichiers disponibles **immédiatement**

3. **Configuration implicite** :
   - Vercel compile automatiquement le TypeScript
   - On n'a pas besoin de pré-compiler
   - L'import depuis source est la méthode recommandée

### Erreur de conception

**Erreur principale** : Supposition que les builds sont séquentiels

```json
// ❌ Erreur : Supposer que ceci garantit l'ordre
"buildCommand": "cd backend && npm run build && cd .. && npm run build"
```

**Réalité** :
- Vercel peut compiler les fonctions serverless **pendant** le build
- Les fonctions serverless sont traitées **indépendamment** du build command
- Le build command est pour le **frontend**, pas pour les fonctions serverless

## 3. 📚 Concept Sous-jacent

### Pourquoi cette erreur existe

**Protection** : L'erreur 404 NOT_FOUND protège contre :

1. **Ressources inexistantes** :
   - Fichiers manquants
   - Routes non configurées
   - Imports invalides

2. **Dépendances circulaires ou manquantes** :
   - Modules non disponibles au moment de l'import
   - Chemins incorrects

3. **Configuration incorrecte** :
   - Routes mal définies
   - Fonctions serverless non détectées

### Mental modèle correct

#### Architecture Vercel Functions

```
┌─────────────────────────────────────────┐
│         Vercel Build Process            │
├─────────────────────────────────────────┤
│                                         │
│  1. Install Dependencies                │
│     ├── npm install (root)              │
│     └── npm install (backend)           │
│                                         │
│  2. Compile Serverless Functions        │
│     └── api/index.ts                    │
│         ├── Detect TypeScript           │
│         ├── Compile with @vercel/node   │
│         └── Resolve imports             │
│             └── Need: Source files      │
│                 (NOT build artifacts)    │
│                                         │
│  3. Build Frontend (if needed)          │
│     └── npm run build                   │
│                                         │
│  4. Build Backend (if needed)           │
│     └── cd backend && npm run build    │
│                                         │
└─────────────────────────────────────────┘
```

**Points clés** :
- Les fonctions serverless sont compilées **indépendamment**
- Elles ont besoin de fichiers sources, pas d'artefacts de build
- Vercel compile le TypeScript automatiquement

#### Résolution d'imports dans les fonctions serverless

```typescript
// Dans api/index.ts
import app from '../backend/src/index.js';
//                          ^^^^^^^^^^^^
//                          TypeScript résout .js → .ts
//                          Vercel compile automatiquement
```

**Processus** :
1. TypeScript voit `.js` dans l'import
2. TypeScript résout vers `.ts` (module ES)
3. Vercel compile le `.ts` avec `@vercel/node`
4. Fonction serverless créée

### Dans le contexte du framework

**Vercel Functions** :
- Utilise `@vercel/node` comme runtime
- Compile TypeScript automatiquement
- Détecte les fonctions dans `api/` automatiquement
- Optimise les builds en parallèle

**Design de Vercel** :
- **Isolation** : Chaque fonction est indépendante
- **Optimisation** : Builds parallèles pour vitesse
- **Simplicité** : Pas besoin de pré-compiler

## 4. ⚠️ Signes d'Alerte

### Ce qu'il faut surveiller

#### 1. Imports depuis des dossiers de build

```typescript
// ❌ ALERTE ROUGE
import from '../dist/...'
import from '../build/...'
import from '../backend/dist/...'
```

**Action** : Toujours importer depuis source

#### 2. Supposition d'ordre de build

```json
// ❌ ALERTE ORANGE
{
  "buildCommand": "build-backend && build-frontend"
}
// Ne garantit PAS que backend est compilé avant les fonctions
```

**Action** : Ne jamais supposer l'ordre

#### 3. Erreurs dans les logs Vercel

```
Error: Cannot find module '../backend/dist/index.js'
Error: Module not found
```

**Action** : Vérifier les imports

### Patterns similaires à éviter

#### Pattern 1 : Import conditionnel basé sur NODE_ENV

```typescript
// ❌ ÉVITER
const app = process.env.NODE_ENV === 'production'
  ? require('../backend/dist/index.js')
  : require('../backend/src/index.ts');
```

**Problème** : Le fichier `dist` peut ne pas exister

**Solution** : Toujours importer depuis source

#### Pattern 2 : Build explicite dans la fonction

```typescript
// ❌ ÉVITER
import { execSync } from 'child_process';
execSync('cd backend && npm run build');
import app from '../backend/dist/index.js';
```

**Problème** : Trop complexe, peut échouer

**Solution** : Laisser Vercel gérer

#### Pattern 3 : Utiliser require() au lieu d'import

```typescript
// ❌ ÉVITER (si vous utilisez ES modules)
const app = require('../backend/dist/index.js');
```

**Problème** : Mélange CommonJS/ES modules

**Solution** : Utiliser `import` (ES modules)

### Code smells

#### 🚩 Code Smell #1 : Import depuis dist/

```typescript
// 🚩 SMELL
import app from '../backend/dist/index.js';
```

**Pourquoi** : Dépend d'un artefact de build

**Fix** : Importer depuis source

#### 🚩 Code Smell #2 : Build command complexe pour les fonctions

```json
// 🚩 SMELL
{
  "buildCommand": "build-backend-first && build-frontend"
}
```

**Pourquoi** : Suppose un ordre qui n'existe pas

**Fix** : Simplifier, importer depuis source

#### 🚩 Code Smell #3 : Vérification d'existence de fichier

```typescript
// 🚩 SMELL
import { existsSync } from 'fs';
if (existsSync('../backend/dist/index.js')) {
  import app from '../backend/dist/index.js';
} else {
  import app from '../backend/src/index.ts';
}
```

**Pourquoi** : Trop complexe, indique un problème de design

**Fix** : Toujours importer depuis source

## 5. 🔄 Alternatives et Trade-offs

### Approche 1 : Import depuis Source (✅ Recommandé)

```typescript
// api/index.ts
import app from '../backend/src/index.js';
```

**Avantages** :
- ✅ Simple et direct
- ✅ Fonctionne toujours
- ✅ Vercel compile automatiquement
- ✅ Pas de dépendance sur l'ordre de build
- ✅ Suit les meilleures pratiques Vercel

**Inconvénients** :
- Aucun (c'est la meilleure approche)

**Quand l'utiliser** : Toujours (approche par défaut)

### Approche 2 : Utiliser le handler existant

```typescript
// api/index.ts
export { default } from '../backend/api/index.js';
```

**Avantages** :
- ✅ Réutilise le code existant
- ✅ Centralise la logique
- ✅ Un seul point de configuration

**Inconvénients** :
- ⚠️ Un niveau d'indirection supplémentaire
- ⚠️ Nécessite que `backend/api/index.ts` existe

**Quand l'utiliser** : Si vous avez déjà un handler dans `backend/api/`

### Approche 3 : Build explicite avec includeFiles

```json
{
  "functions": {
    "api/index.ts": {
      "runtime": "@vercel/node",
      "includeFiles": "backend/dist/**"
    }
  }
}
```

**Avantages** :
- ✅ Contrôle explicite
- ✅ Peut fonctionner si le build est garanti

**Inconvénients** :
- ❌ Complexe
- ❌ Peut échouer si le build échoue
- ❌ Dépend de l'ordre de build
- ❌ Moins flexible

**Quand l'utiliser** : Jamais (trop risqué)

### Approche 4 : Monorepo avec workspaces

```json
// package.json (racine)
{
  "workspaces": ["backend"],
  "scripts": {
    "build": "npm run build --workspace=backend && npm run build"
  }
}
```

**Avantages** :
- ✅ Gestion de dépendances centralisée
- ✅ Builds coordonnés

**Inconvénients** :
- ⚠️ Plus complexe à configurer
- ⚠️ Toujours le même problème d'ordre

**Quand l'utiliser** : Si vous avez un vrai monorepo avec plusieurs packages

### Recommandation Finale

**Utiliser l'Approche 1** (import depuis source) car :

1. **Simplicité** : Moins de code, moins de complexité
2. **Fiabilité** : Fonctionne toujours, pas de dépendance sur l'ordre
3. **Performance** : Vercel optimise automatiquement
4. **Maintenabilité** : Facile à comprendre et maintenir
5. **Best Practice** : Suit les recommandations officielles Vercel

## 📋 Checklist de Vérification

Avant de déployer, vérifiez :

- [ ] `api/index.ts` existe à la racine
- [ ] Les imports pointent vers des fichiers sources (`.ts` ou `.js` qui résolvent vers `.ts`)
- [ ] Pas d'imports depuis `dist/` ou `build/`
- [ ] `@vercel/node` est installé (dans `package.json` ou `backend/package.json`)
- [ ] `vercel.json` a la configuration de routing correcte
- [ ] `backend/src/index.ts` exporte `app` comme export par défaut
- [ ] Les variables d'environnement sont configurées dans Vercel Dashboard

## 🎓 Résumé et Leçons

### Leçon Principale

**Sur Vercel, les fonctions serverless sont compilées indépendamment. Toujours importer depuis les fichiers sources TypeScript, jamais depuis les fichiers compilés.**

### Règles d'Or

1. **Règle #1** : Si vous voyez un import depuis `dist/` ou `build/` dans une fonction serverless, c'est probablement une erreur.

2. **Règle #2** : Ne jamais supposer un ordre de build. Vercel optimise en parallèle.

3. **Règle #3** : Laisser Vercel compiler le TypeScript. Ne pas pré-compiler pour les fonctions serverless.

### Modèle Mental

```
Fonctions Serverless = Fichiers Source
├── Importer depuis .ts (via .js dans l'import)
├── Vercel compile automatiquement
└── Pas besoin de pré-compiler
```

### Ressources

- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Vercel TypeScript Support](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js#typescript)
- [Vercel Routing](https://vercel.com/docs/routing)

