# Migration depuis Supabase vers Backend

Ce guide explique comment migrer de Supabase vers le backend Node.js.

## 📋 Prérequis

- Base de données PostgreSQL (Neon ou autre)
- Les migrations Supabase ont été copiées dans `backend/src/db/migrations/`

## 🔄 Processus de migration

### 1. Les migrations Supabase

Les migrations SQL de Supabase ont été copiées dans `backend/src/db/migrations/`. Ces migrations peuvent contenir des références à:
- `auth.users` - Table d'authentification Supabase
- `auth.uid()` - Fonction Supabase pour obtenir l'ID utilisateur

### 2. Adaptation nécessaire

Si vous migrez depuis une base Supabase existante:
- Les tables et politiques RLS existent déjà
- Le backend gère l'authentification via JWT, pas via Supabase Auth
- Les politiques RLS qui utilisent `auth.uid()` ne fonctionneront plus

**Options:**

#### Option A: Désactiver RLS (recommandé pour migration complète)

```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
-- etc.
```

Le backend gère l'autorisation via les middlewares, donc RLS n'est plus nécessaire.

#### Option B: Garder RLS et adapter les politiques

Si vous voulez garder RLS, vous devrez créer une fonction qui simule `auth.uid()`:

```sql
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Retourner l'ID utilisateur depuis une variable de session
  -- Note: Cela nécessite une configuration spéciale
  RETURN NULL; -- À adapter selon vos besoins
END;
$$;
```

**Recommandation:** Utiliser l'Option A et désactiver RLS, car le backend gère déjà toute l'autorisation.

### 3. Exécuter les migrations

```bash
cd backend
npm run migrate
```

Le script de migration:
1. Crée la table `schema_migrations` pour suivre les migrations exécutées
2. Crée la table `users` pour stocker les mots de passe
3. Exécute toutes les migrations SQL dans l'ordre
4. Ignore les migrations déjà exécutées

### 4. Modifier la table profiles

Si vous migrez depuis Supabase, la table `profiles` peut avoir une contrainte vers `auth.users`. Vous devez la supprimer:

```sql
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
```

La migration `0000_initial_schema.sql` gère cela automatiquement.

## ⚠️ Notes importantes

1. **Mots de passe:** Les utilisateurs existants devront réinitialiser leurs mots de passe ou vous devrez créer un script de migration pour générer des mots de passe temporaires.

2. **RLS:** Les politiques RLS Supabase ne fonctionneront plus. Le backend gère l'autorisation via les middlewares JWT.

3. **Triggers:** Le trigger `on_auth_user_created` ne fonctionnera plus car il dépend de `auth.users`. Le backend crée les profils directement lors de l'inscription.

## 🔄 Prochaines étapes

Après la migration:
1. Tester la connexion à la base de données
2. Créer un premier utilisateur via l'API `/api/auth/signup`
3. Vérifier que toutes les fonctionnalités fonctionnent
4. Supprimer le dossier `supabase` si tout fonctionne correctement

