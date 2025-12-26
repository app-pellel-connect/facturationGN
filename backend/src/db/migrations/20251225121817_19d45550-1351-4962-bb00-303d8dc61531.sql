-- ==============================================
-- Migration adaptée pour le nouveau backend (sans Supabase Auth)
-- ==============================================
-- Cette migration a été adaptée pour fonctionner sans auth.users
-- Les politiques RLS sont ignorées car elles utilisent auth.uid() qui n'existe plus
-- ==============================================

-- Create role enum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'comptable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Note: La table profiles est créée par 0000_initial_schema.sql
-- On ne la recrée pas ici pour éviter les conflits

-- Create user_roles table (separate from profiles for security)
-- Note: Cette table n'est plus utilisée dans le nouveau schéma, on la crée seulement si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Référence vers profiles supprimée pour compatibilité
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create clients table (only if it doesn't exist, will be updated by later migrations)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  siret TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create invoices table (only if it doesn't exist, will be updated by later migrations)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
  due_date DATE,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 20.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create invoice_items table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Note: RLS est désactivé dans notre schéma car l'autorisation est gérée dans le backend
-- Les commandes ALTER TABLE ... ENABLE ROW LEVEL SECURITY sont ignorées

-- Security definer function to check roles (créée seulement si elle n'existe pas)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user signup (ignorée - auth.users n'existe plus)
-- Cette fonction n'est plus utilisée car nous gérons la création des profils dans le backend
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Fonction désactivée - la création des profils est gérée dans le backend
  RETURN NEW;
END;
$$;

-- Note: Le trigger on_auth_user_created n'est pas créé car auth.users n'existe plus

-- Function to update updated_at (créée seulement si elle n'existe pas)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at (créés seulement s'ils n'existent pas)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Note: Les politiques RLS utilisant auth.uid() ne sont pas créées
-- car auth.uid() n'existe plus dans notre schéma
-- L'autorisation est gérée dans le backend via les middlewares JWT
