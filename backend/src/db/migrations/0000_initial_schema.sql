-- ========================================
-- Migration initiale pour le backend (sans Supabase Auth)
-- ========================================
-- Cette migration adapte le schéma pour fonctionner sans auth.users
-- Date: 2025-01-XX
-- Description: Création du schéma de base sans dépendance à Supabase Auth
-- ========================================

-- Supprimer les références à auth.users si elles existent
-- Note: Si vous migrez depuis Supabase, certaines tables peuvent déjà exister

-- Modifier la table profiles pour ne plus référencer auth.users
DO $$ 
BEGIN
  -- Si la table profiles existe avec une contrainte vers auth.users, on la supprime
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  END IF;
  
  -- Modifier la colonne id pour qu'elle soit simplement UUID sans référence
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Créer la table profiles sans référence à auth.users
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      full_name TEXT,
      phone TEXT,
      avatar_url TEXT,
      is_platform_owner BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Créer un index sur l'email pour les recherches
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
  END IF;
END $$;

-- Désactiver RLS si nécessaire (nous gérons l'autorisation dans le backend)
-- Note: RLS peut être désactivé sans erreur même s'il n'était pas activé
DO $$
BEGIN
  ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorer l'erreur si RLS n'est pas activé
    NULL;
END $$;

-- Créer la table users pour stocker les mots de passe hashés
-- Cette table est créée séparément des profils pour la sécurité
-- Note: La création est également gérée par migrate.ts, mais on la garde ici pour cohérence
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer un index sur l'email pour l'authentification
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Note: Les autres tables (companies, clients, invoices, etc.) sont créées
-- par les migrations Supabase existantes qui sont déjà dans le dossier migrations/
