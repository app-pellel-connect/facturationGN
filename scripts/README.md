# Scripts PowerShell

Ce dossier contient tous les scripts PowerShell pour gérer le projet FactureGN.

## 🚀 Scripts de démarrage

### `start.ps1`
Démarre le projet (frontend + backend) en mode développement ou production.

```powershell
.\scripts\start.ps1              # Mode développement (par défaut)
.\scripts\start.ps1 -Dev          # Mode développement
.\scripts\start.ps1 -Build        # Build avant démarrage
.\scripts\start.ps1 -NoInstall    # Sans installation des dépendances
```

### `stop.ps1`
Arrête tous les processus du projet (frontend + backend).

```powershell
.\scripts\stop.ps1
```

## 🗄️ Scripts de Migration

### `migrate.ps1`
Exécute les migrations de la base de données.

```powershell
.\scripts\migrate.ps1
```

### `migrate-list.ps1`
Liste toutes les migrations et leur statut (exécutée ou en attente).

```powershell
.\scripts\migrate-list.ps1
```

### `migrate-reset.ps1`
Réinitialise le suivi des migrations (développement uniquement).

```powershell
.\scripts\migrate-reset.ps1
```

⚠️ **Attention** : Cette commande demande confirmation et ne supprime pas les tables, seulement le suivi.

## 🌱 Scripts de Seed

### `seed.ps1`
Peuple la base de données avec le scénario standard.

```powershell
.\scripts\seed.ps1                    # Scénario standard
.\scripts\seed.ps1 -Scenario minimal  # Scénario minimal
.\scripts\seed.ps1 -Scenario full     # Scénario complet
```

### `seed-minimal.ps1`
Peuple la base de données avec le scénario minimal (2 utilisateurs, 1 entreprise).

```powershell
.\scripts\seed-minimal.ps1
```

### `seed-standard.ps1`
Peuple la base de données avec le scénario standard (3 utilisateurs, 3 entreprises).

```powershell
.\scripts\seed-standard.ps1
```

### `seed-full.ps1`
Peuple la base de données avec le scénario complet (11 utilisateurs, 5 entreprises).

```powershell
.\scripts\seed-full.ps1
```

## 🔄 Scripts Combinés (Migration + Seed)

### `migrate-seed.ps1`
Exécute les migrations puis le seed avec le scénario standard.

```powershell
.\scripts\migrate-seed.ps1                    # Scénario standard
.\scripts\migrate-seed.ps1 -Scenario minimal  # Scénario minimal
.\scripts\migrate-seed.ps1 -Scenario full     # Scénario complet
```

### `migrate-seed-minimal.ps1`
Exécute les migrations puis le seed minimal.

```powershell
.\scripts\migrate-seed-minimal.ps1
```

### `migrate-seed-standard.ps1`
Exécute les migrations puis le seed standard.

```powershell
.\scripts\migrate-seed-standard.ps1
```

### `migrate-seed-full.ps1`
Exécute les migrations puis le seed complet.

```powershell
.\scripts\migrate-seed-full.ps1
```

## 📋 Workflow typique

### Setup initial

```powershell
# 1. Migration + Seed standard
.\scripts\migrate-seed-standard.ps1

# 2. Démarrer le projet
.\scripts\start.ps1
```

### Développement rapide

```powershell
# Migration + Seed minimal
.\scripts\migrate-seed-minimal.ps1

# Démarrer en mode dev
.\scripts\start.ps1 -Dev
```

### Tests complets

```powershell
# Migration + Seed complet (beaucoup de données)
.\scripts\migrate-seed-full.ps1

# Démarrer le projet
.\scripts\start.ps1 -Dev
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

- [Guide des migrations](../docs/MIGRATIONS.md)
- [Guide du seed](../docs/SEED_DATABASE.md)
- [Scripts PowerShell détaillés](../docs/SCRIPTS_POWERSHELL.md)

