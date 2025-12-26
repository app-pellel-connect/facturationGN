# Scripts PowerShell pour les Migrations et le Seed

Ce document liste tous les scripts PowerShell disponibles pour gérer les migrations et le seed de la base de données.

## 📋 Scripts de Migration

### `migrate.ps1`

Exécute les migrations de la base de données.

```powershell
.\scripts\migrate.ps1
```

**Équivalent npm :** `npm run migrate` (dans le dossier backend)

### `migrate-list.ps1`

Liste toutes les migrations et leur statut (exécutée ou en attente).

```powershell
.\scripts\migrate-list.ps1
```

**Équivalent npm :** `npm run migrate:list` (dans le dossier backend)

### `migrate-reset.ps1`

Réinitialise le suivi des migrations (développement uniquement).

```powershell
.\scripts\migrate-reset.ps1
```

⚠️ **Attention :** Cette commande demande confirmation car elle réinitialise le suivi des migrations (mais ne supprime pas les tables).

**Équivalent npm :** `npm run migrate:reset` (dans le dossier backend)

## 🌱 Scripts de Seed

### `seed.ps1`

Peuple la base de données avec le scénario standard.

```powershell
.\scripts\seed.ps1
```

Avec un scénario spécifique :
```powershell
.\scripts\seed.ps1 -Scenario standard
.\scripts\seed.ps1 -Scenario minimal
.\scripts\seed.ps1 -Scenario full
.\scripts\seed.ps1 -Scenario empty
```

**Équivalent npm :** `npm run seed` (dans le dossier backend)

### `seed-minimal.ps1`

Peuple la base de données avec le scénario minimal (2 utilisateurs, 1 entreprise).

```powershell
.\scripts\seed-minimal.ps1
```

**Équivalent npm :** `npm run seed:minimal` (dans le dossier backend)

### `seed-standard.ps1`

Peuple la base de données avec le scénario standard (3 utilisateurs, 3 entreprises).

```powershell
.\scripts\seed-standard.ps1
```

**Équivalent npm :** `npm run seed:standard` (dans le dossier backend)

### `seed-full.ps1`

Peuple la base de données avec le scénario complet (11 utilisateurs, 5 entreprises).

```powershell
.\scripts\seed-full.ps1
```

**Équivalent npm :** `npm run seed:full` (dans le dossier backend)

## 🔄 Scripts Combinés (Migration + Seed)

### `migrate-seed.ps1`

Exécute les migrations puis le seed avec le scénario standard.

```powershell
.\scripts\migrate-seed.ps1
```

Avec un scénario spécifique :
```powershell
.\scripts\migrate-seed.ps1 -Scenario minimal
.\scripts\migrate-seed.ps1 -Scenario standard
.\scripts\migrate-seed.ps1 -Scenario full
```

**Équivalent npm :** `npm run migrate:seed` (dans le dossier backend)

### `migrate-seed-minimal.ps1`

Exécute les migrations puis le seed minimal.

```powershell
.\scripts\migrate-seed-minimal.ps1
```

**Équivalent npm :** `npm run migrate:seed:minimal` (dans le dossier backend)

### `migrate-seed-standard.ps1`

Exécute les migrations puis le seed standard.

```powershell
.\scripts\migrate-seed-standard.ps1
```

**Équivalent npm :** `npm run migrate:seed:standard` (dans le dossier backend)

### `migrate-seed-full.ps1`

Exécute les migrations puis le seed complet.

```powershell
.\scripts\migrate-seed-full.ps1
```

**Équivalent npm :** `npm run migrate:seed:full` (dans le dossier backend)

## 📖 Exemples d'utilisation

### Setup initial complet

```powershell
# Migration + seed standard
.\scripts\migrate-seed-standard.ps1
```

### Développement rapide

```powershell
# Migration + seed minimal
.\scripts\migrate-seed-minimal.ps1
```

### Tests avec beaucoup de données

```powershell
# Migration + seed complet
.\scripts\migrate-seed-full.ps1
```

### Migration seule

```powershell
# Juste les migrations
.\scripts\migrate.ps1
```

### Vérifier l'état

```powershell
# Voir quelles migrations sont exécutées
.\scripts\migrate-list.ps1
```

### Réinitialiser (développement)

```powershell
# Réinitialiser le suivi des migrations
.\scripts\migrate-reset.ps1
```

## 🔐 Permissions PowerShell

Si vous obtenez une erreur de sécurité, vous devrez peut-être autoriser l'exécution des scripts :

```powershell
# Voir la politique actuelle
Get-ExecutionPolicy

# Autoriser l'exécution pour cette session uniquement
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Ou autoriser pour l'utilisateur actuel (plus permanent)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📚 Documentation complète

- [Guide des migrations](./MIGRATIONS.md)
- [Guide du seed](./SEED_DATABASE.md)
- [Documentation du backend](../backend/README.md)

