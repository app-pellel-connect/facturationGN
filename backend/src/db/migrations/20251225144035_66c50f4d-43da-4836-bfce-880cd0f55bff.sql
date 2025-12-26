-- ==============================================
-- Migration adaptée pour le nouveau backend (sans Supabase Auth)
-- ==============================================
-- ATTENTION: Cette migration était conçue pour recréer tout le schéma
-- Elle a été adaptée pour être idempotente et fonctionner sans auth.users
-- ==============================================

-- Note: Les commandes TRUNCATE et DROP TABLE sont désactivées car elles supprimeraient
-- toutes les données. Si vous voulez vraiment réinitialiser, exécutez-les manuellement.
-- Pour cette migration adaptée, on utilise IF NOT EXISTS pour être sûr que tout existe.

-- ==============================================
-- CRÉER LES TYPES
-- ==============================================

-- Nouveau type pour les rôles plateforme
DO $$ BEGIN
    CREATE TYPE public.platform_role AS ENUM ('platform_owner', 'company_admin', 'company_manager', 'company_user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Nouveau type pour le statut entreprise
DO $$ BEGIN
    CREATE TYPE public.company_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Nouveau type pour le statut abonnement
DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================
-- TABLE: profiles (utilisateurs)
-- ==============================================
-- Note: profiles est créée par 0000_initial_schema.sql, on vérifie juste qu'elle a les bonnes colonnes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
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
    
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
  ELSE
    -- Ajouter les colonnes manquantes si elles n'existent pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone') THEN
      ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
      ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_platform_owner') THEN
      ALTER TABLE public.profiles ADD COLUMN is_platform_owner BOOLEAN DEFAULT FALSE;
    END IF;
  END IF;
END $$;

-- Désactiver RLS (nous gérons l'autorisation dans le backend)
DO $$
BEGIN
  ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ==============================================
-- TABLE: companies (entreprises)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  siret TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Guinée',
  logo_url TEXT,
  currency TEXT DEFAULT 'GNF',
  tax_rate NUMERIC DEFAULT 18,
  status company_status DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Désactiver RLS
DO $$
BEGIN
  ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ==============================================
-- TABLE: subscriptions (abonnements)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT DEFAULT 'trial',
  status subscription_status DEFAULT 'trial',
  max_users INTEGER DEFAULT 3,
  max_invoices_per_month INTEGER DEFAULT 50,
  max_clients INTEGER DEFAULT 20,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Désactiver RLS
DO $$
BEGIN
  ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ==============================================
-- TABLE: company_members (membres entreprise)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role platform_role NOT NULL DEFAULT 'company_user',
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Désactiver RLS
DO $$
BEGIN
  ALTER TABLE public.company_members DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ==============================================
-- TABLE: clients (clients)
-- ==============================================
-- S'assurer que clients a company_id au lieu de user_id
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Guinée',
  siret TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrer user_id vers company_id si nécessaire (à adapter selon votre schéma)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clients' 
    AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clients' 
    AND column_name = 'company_id'
  ) THEN
    -- Note: Cette migration nécessiterait une logique spécifique selon vos données
    -- Pour l'instant, on ajoute juste company_id et on laisse user_id
    ALTER TABLE public.clients ADD COLUMN company_id UUID REFERENCES public.companies(id);
  END IF;
END $$;

-- Désactiver RLS
DO $$
BEGIN
  ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ==============================================
-- TABLE: invoices (factures)
-- ==============================================
-- S'assurer que invoices a company_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
  
  -- Ajouter created_by si nécessaire
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN created_by UUID REFERENCES public.profiles(id);
  END IF;
  
  -- Ajouter paid_amount et balance si nécessaire
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN paid_amount NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'balance'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN balance NUMERIC GENERATED ALWAYS AS (COALESCE(total, 0) - COALESCE(paid_amount, 0)) STORED;
  END IF;
END $$;

-- Désactiver RLS
DO $$
BEGIN
  ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ==============================================
-- TABLE: invoice_items (lignes de facture)
-- ==============================================
-- S'assurer que la table existe (déjà créée par migration précédente)
-- Pas besoin de la recréer

-- Désactiver RLS
DO $$
BEGIN
  ALTER TABLE public.invoice_items DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ==============================================
-- TABLE: payments (paiements)
-- ==============================================
-- S'assurer que payments a recorded_by au lieu de user_id
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  recorded_by UUID REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'partial' CHECK (payment_type IN ('deposit', 'partial', 'full', 'balance')),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile_money', 'bank_transfer', 'check', 'other')),
  reference TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Migrer user_id vers recorded_by si nécessaire
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'recorded_by'
  ) THEN
    ALTER TABLE public.payments RENAME COLUMN user_id TO recorded_by;
  END IF;
END $$;

-- Désactiver RLS
DO $$
BEGIN
  ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ==============================================
-- TABLE: audit_logs (logs d'audit)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  company_id UUID REFERENCES public.companies(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Désactiver RLS
DO $$
BEGIN
  ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ==============================================
-- FONCTIONS UTILITAIRES
-- ==============================================

-- Fonction pour vérifier si un utilisateur est propriétaire de la plateforme
CREATE OR REPLACE FUNCTION public.is_platform_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_platform_owner FROM public.profiles WHERE id = _user_id;
$$;

-- Fonction pour obtenir l'entreprise de l'utilisateur
CREATE OR REPLACE FUNCTION public.get_user_company(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id 
  FROM public.company_members 
  WHERE user_id = _user_id 
    AND is_active = TRUE 
  LIMIT 1;
$$;

-- Fonction pour vérifier le rôle dans une entreprise
CREATE OR REPLACE FUNCTION public.has_company_role(
  _user_id UUID,
  _company_id UUID,
  _roles platform_role[]
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND is_active = TRUE
      AND role = ANY(_roles)
  );
$$;

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction pour mettre à jour paid_amount des factures
CREATE OR REPLACE FUNCTION public.update_invoice_paid_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.invoices 
    SET paid_amount = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.payments 
      WHERE invoice_id = NEW.invoice_id
    ),
    status = CASE
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = NEW.invoice_id) >= COALESCE(total, 0) THEN 'paid'
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = NEW.invoice_id) > 0 THEN 'partial'
      ELSE status
    END
    WHERE id = NEW.invoice_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.invoices 
    SET paid_amount = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.payments 
      WHERE invoice_id = OLD.invoice_id
    ),
    status = CASE
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = OLD.invoice_id) >= COALESCE(total, 0) THEN 'paid'
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = OLD.invoice_id) > 0 THEN 'partial'
      ELSE 'sent'
    END
    WHERE id = OLD.invoice_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Trigger pour updated_at sur companies
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger pour updated_at sur subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger pour updated_at sur clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger pour updated_at sur invoices
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger pour mettre à jour paid_amount des factures
DROP TRIGGER IF EXISTS update_invoice_on_payment ON public.payments;
CREATE TRIGGER update_invoice_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_paid_amount();

-- Note: Les politiques RLS utilisant auth.uid() ne sont pas créées
-- car auth.uid() n'existe plus dans notre schéma
-- L'autorisation est gérée dans le backend via les middlewares JWT
