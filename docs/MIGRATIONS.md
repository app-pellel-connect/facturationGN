# Guide des Migrations de Base de Données

Ce document explique comment utiliser le système de migrations de la base de données pour FactureGN.

## 📋 Vue d'ensemble

Le système de migrations permet de :
- Appliquer des changements de schéma de manière contrôlée
- Suivre les migrations déjà exécutées
- Éviter les exécutions multiples de la même migration
- Réinitialiser le suivi des migrations si nécessaire

## 🚀 Commandes disponibles

### Exécuter les migrations

```bash
cd backend
npm run migrate
```

Cette commande :
1. Crée la table `schema_migrations` si elle n'existe pas
2. Crée la table `users` pour stocker les mots de passe hashés
3. Exécute toutes les migrations SQL non exécutées dans l'ordre
4. Ignore les migrations déjà exécutées

### Lister les migrations

```bash
npm run migrate:list
```

Affiche la liste de toutes les migrations avec leur statut (exécutée ou en attente).

### Réinitialiser le suivi des migrations

```bash
npm run migrate:reset
```

⚠️ **Attention** : Cette commande :
- Supprime uniquement les entrées de la table `schema_migrations`
- **NE supprime PAS** les tables de la base de données
- Permet de réexécuter toutes les migrations lors du prochain `npm run migrate`

> **Note** : Cette commande est utile lors du développement pour tester les migrations, mais doit être utilisée avec précaution en production.

## 📁 Structure des migrations

Les migrations sont stockées dans `backend/src/db/migrations/` et suivent le format :

```
{timestamp}_{description}.sql
```

Exemples :
- `0000_initial_schema.sql` - Migration initiale
- `20251225121817_19d45550-1351-4962-bb00-303d8dc61531.sql` - Migration avec timestamp

### Ordre d'exécution

Les migrations sont exécutées **par ordre alphabétique** du nom de fichier. Les timestamps garantissent l'ordre chronologique.

## 📝 Créer une nouvelle migration

### 1. Créer le fichier SQL

Créer un nouveau fichier dans `backend/src/db/migrations/` avec le format :

```sql
-- Description de la migration
-- Date: YYYY-MM-DD
-- Auteur: Nom

-- Votre code SQL ici
CREATE TABLE IF NOT EXISTS ma_nouvelle_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Bonnes pratiques

- ✅ Toujours utiliser `IF NOT EXISTS` pour les `CREATE TABLE`
- ✅ Utiliser des transactions si nécessaire (déjà géré par le système)
- ✅ Ajouter des commentaires pour expliquer la migration
- ✅ Tester la migration sur une base de données de développement
- ✅ Vérifier que la migration est idempotente (peut être exécutée plusieurs fois sans problème)

### 3. Exemples de migrations courantes

#### Créer une table

```sql
CREATE TABLE IF NOT EXISTS ma_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Ajouter une colonne

```sql
ALTER TABLE ma_table 
ADD COLUMN IF NOT EXISTS new_column TEXT;
```

#### Créer un index

```sql
CREATE INDEX IF NOT EXISTS idx_ma_table_name 
ON ma_table(name);
```

#### Modifier une colonne

```sql
ALTER TABLE ma_table 
ALTER COLUMN name SET NOT NULL;
```

## 🔄 Migration depuis Supabase

Si vous migrez depuis une base de données Supabase existante :

### 1. Copier les migrations Supabase

Les migrations Supabase sont déjà dans `backend/src/db/migrations/`. Elles peuvent contenir :
- Des références à `auth.users` (table Supabase Auth)
- Des fonctions utilisant `auth.uid()`
- Des politiques RLS (Row Level Security)

### 2. Adapter les migrations

Le système de migration :
- ✅ Désactive RLS sur `profiles` (géré par le backend)
- ✅ Crée la table `users` pour stocker les mots de passe
- ✅ Supprime les références à `auth.users` dans `0000_initial_schema.sql`

### 3. Exécuter les migrations

```bash
npm run migrate
```

Le système :
1. Vérifie quelles migrations ont déjà été exécutées
2. Exécute uniquement les migrations non exécutées
3. Enregistre chaque migration exécutée dans `schema_migrations`

## 🔍 Vérifier l'état des migrations

### Dans la base de données

```sql
-- Lister toutes les migrations exécutées
SELECT version, executed_at 
FROM schema_migrations 
ORDER BY executed_at;

-- Vérifier si une migration spécifique a été exécutée
SELECT * FROM schema_migrations 
WHERE version = '20251225121817_19d45550-1351-4962-bb00-303d8dc61531';
```

### Via la ligne de commande

```bash
npm run migrate:list
```

## ⚠️ Problèmes courants

### Erreur : "relation already exists"

Si vous obtenez une erreur indiquant qu'une table existe déjà :
- Vérifiez que vous utilisez `IF NOT EXISTS` dans vos migrations
- Ou vérifiez que la migration a déjà été exécutée avec `npm run migrate:list`

### Erreur : "duplicate key value"

Si vous obtenez une erreur de clé dupliquée :
- Vérifiez que la migration n'a pas déjà été exécutée
- Utilisez `npm run migrate:list` pour voir l'état

### Migration échouée

Si une migration échoue :
1. Le système fait automatiquement un `ROLLBACK`
2. La migration n'est pas marquée comme exécutée
3. Corrigez le fichier SQL
4. Réexécutez `npm run migrate`

### Réexécuter une migration

Si vous devez réexécuter une migration :
1. Utilisez `npm run migrate:reset` pour réinitialiser le suivi
2. Ou supprimez manuellement l'entrée de `schema_migrations` :
   ```sql
   DELETE FROM schema_migrations WHERE version = 'nom_de_la_migration';
   ```

## 🔐 Sécurité

### Table `users`

La table `users` stocke les mots de passe hashés séparément des profils pour la sécurité :
- `id` : Référence vers `profiles.id`
- `email` : Email de l'utilisateur (pour authentification)
- `password_hash` : Mot de passe hashé avec bcrypt

### Politiques RLS

Les politiques RLS (Row Level Security) sont désactivées car :
- L'autorisation est gérée dans le backend via les middlewares JWT
- Plus simple et plus performant
- Plus de contrôle sur l'autorisation

## 📚 Migration des données existantes

Si vous avez des données existantes dans Supabase :

1. **Exporter les données** depuis Supabase (via l'interface ou pg_dump)
2. **Importer dans PostgreSQL** (votre base cible)
3. **Exécuter les migrations** pour créer les tables manquantes
4. **Créer les mots de passe** pour les utilisateurs existants :
   - Les utilisateurs devront réinitialiser leurs mots de passe
   - Ou créer un script de migration pour générer des mots de passe temporaires

## 🔄 Workflow recommandé

1. **Développement** :
   ```bash
   # Créer la migration
   # Tester sur une base locale
   npm run migrate
   ```

2. **Test** :
   ```bash
   # Vérifier que tout fonctionne
   npm run migrate:list
   ```

3. **Production** :
   ```bash
   # Faire une sauvegarde
   # Exécuter les migrations
   npm run migrate
   # Vérifier l'état
   npm run migrate:list
   ```

## 📖 Ressources

- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Migration depuis Supabase](./SUPABASE_REMOVAL.md)
- [Configuration Backend](../backend/README.md)

