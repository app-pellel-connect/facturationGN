-- ==============================================
-- VIDER TOUTES LES TABLES EXISTANTES
-- ==============================================

-- Supprimer les données existantes
TRUNCATE public.payments CASCADE;
TRUNCATE public.invoice_items CASCADE;
TRUNCATE public.invoices CASCADE;
TRUNCATE public.clients CASCADE;
TRUNCATE public.organization_members CASCADE;
TRUNCATE public.organizations CASCADE;
TRUNCATE public.user_roles CASCADE;
TRUNCATE public.profiles CASCADE;

-- Supprimer les tables existantes
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Supprimer les types existants
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS public.has_role CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.update_invoice_paid_amount CASCADE;

-- ==============================================
-- CRÉER LE NOUVEAU SCHÉMA
-- ==============================================

-- Nouveau type pour les rôles plateforme
CREATE TYPE public.platform_role AS ENUM ('platform_owner', 'company_admin', 'company_manager', 'company_user');

-- Nouveau type pour le statut entreprise
CREATE TYPE public.company_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');

-- Nouveau type pour le statut abonnement
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');

-- ==============================================
-- TABLE: profiles (utilisateurs)
-- ==============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_platform_owner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- TABLE: companies (entreprises)
-- ==============================================
CREATE TABLE public.companies (
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

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- TABLE: subscriptions (abonnements)
-- ==============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT DEFAULT 'trial',
  status subscription_status DEFAULT 'trial',
  max_users INTEGER DEFAULT 3,
  max_invoices_per_month INTEGER DEFAULT 50,
  max_clients INTEGER DEFAULT 20,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- TABLE: company_members (membres entreprise)
-- ==============================================
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role platform_role DEFAULT 'company_user',
  is_active BOOLEAN DEFAULT TRUE,
  invited_by UUID REFERENCES public.profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- TABLE: clients
-- ==============================================
CREATE TABLE public.clients (
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

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- TABLE: invoices
-- ==============================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 18,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  balance NUMERIC GENERATED ALWAYS AS (total - paid_amount) STORED,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- TABLE: invoice_items
-- ==============================================
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- TABLE: payments
-- ==============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  payment_type TEXT DEFAULT 'partial',
  reference TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- TABLE: audit_logs (journaux d'audit)
-- ==============================================
CREATE TABLE public.audit_logs (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- FONCTIONS UTILITAIRES
-- ==============================================

-- Fonction pour vérifier si un utilisateur est propriétaire plateforme
CREATE OR REPLACE FUNCTION public.is_platform_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_platform_owner FROM public.profiles WHERE id = _user_id),
    FALSE
  )
$$;

-- Fonction pour obtenir l'entreprise d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_company(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_members 
  WHERE user_id = _user_id AND is_active = TRUE 
  LIMIT 1
$$;

-- Fonction pour vérifier le rôle dans une entreprise
CREATE OR REPLACE FUNCTION public.has_company_role(_user_id UUID, _company_id UUID, _roles platform_role[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id 
      AND company_id = _company_id 
      AND role = ANY(_roles)
      AND is_active = TRUE
  )
$$;

-- Fonction pour update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction pour mettre à jour paid_amount
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

-- Fonction pour créer le profil et assigner le rôle propriétaire si premier utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Compter les utilisateurs existants
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Créer le profil
  INSERT INTO public.profiles (id, email, full_name, is_platform_owner)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'full_name',
    user_count = 0  -- Le premier utilisateur devient propriétaire
  );
  
  RETURN NEW;
END;
$$;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Trigger pour nouveau utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger pour paid_amount
CREATE TRIGGER update_payments_invoice
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_invoice_paid_amount();

-- ==============================================
-- POLITIQUES RLS
-- ==============================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Platform owner can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_platform_owner(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Platform owner can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_platform_owner(auth.uid()));

-- COMPANIES
CREATE POLICY "Anyone can create company" ON public.companies
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Platform owner can view all companies" ON public.companies
  FOR SELECT USING (public.is_platform_owner(auth.uid()));

CREATE POLICY "Company members can view their company" ON public.companies
  FOR SELECT USING (id = public.get_user_company(auth.uid()));

CREATE POLICY "Platform owner can update any company" ON public.companies
  FOR UPDATE USING (public.is_platform_owner(auth.uid()));

CREATE POLICY "Company admin can update their company" ON public.companies
  FOR UPDATE USING (public.has_company_role(auth.uid(), id, ARRAY['company_admin']::platform_role[]));

CREATE POLICY "Platform owner can delete companies" ON public.companies
  FOR DELETE USING (public.is_platform_owner(auth.uid()));

-- SUBSCRIPTIONS
CREATE POLICY "Platform owner can manage subscriptions" ON public.subscriptions
  FOR ALL USING (public.is_platform_owner(auth.uid()));

CREATE POLICY "Company admin can view subscription" ON public.subscriptions
  FOR SELECT USING (public.has_company_role(auth.uid(), company_id, ARRAY['company_admin']::platform_role[]));

-- COMPANY_MEMBERS
CREATE POLICY "Platform owner can manage all members" ON public.company_members
  FOR ALL USING (public.is_platform_owner(auth.uid()));

CREATE POLICY "Company admin can manage members" ON public.company_members
  FOR ALL USING (public.has_company_role(auth.uid(), company_id, ARRAY['company_admin']::platform_role[]));

CREATE POLICY "Members can view their company members" ON public.company_members
  FOR SELECT USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Users can view their own membership" ON public.company_members
  FOR SELECT USING (user_id = auth.uid());

-- CLIENTS
CREATE POLICY "Company members can view clients" ON public.clients
  FOR SELECT USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Platform owner can view all clients" ON public.clients
  FOR SELECT USING (public.is_platform_owner(auth.uid()));

CREATE POLICY "Company admin/manager can manage clients" ON public.clients
  FOR ALL USING (public.has_company_role(auth.uid(), company_id, ARRAY['company_admin', 'company_manager']::platform_role[]));

-- INVOICES
CREATE POLICY "Company members can view invoices" ON public.invoices
  FOR SELECT USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Platform owner can view all invoices" ON public.invoices
  FOR SELECT USING (public.is_platform_owner(auth.uid()));

CREATE POLICY "Company admin/manager can manage invoices" ON public.invoices
  FOR ALL USING (public.has_company_role(auth.uid(), company_id, ARRAY['company_admin', 'company_manager']::platform_role[]));

-- INVOICE_ITEMS
CREATE POLICY "Company members can view invoice items" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_items.invoice_id 
      AND company_id = public.get_user_company(auth.uid())
    )
  );

CREATE POLICY "Platform owner can view all invoice items" ON public.invoice_items
  FOR SELECT USING (public.is_platform_owner(auth.uid()));

CREATE POLICY "Company admin/manager can manage invoice items" ON public.invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_items.invoice_id 
      AND public.has_company_role(auth.uid(), company_id, ARRAY['company_admin', 'company_manager']::platform_role[])
    )
  );

-- PAYMENTS
CREATE POLICY "Company members can view payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = payments.invoice_id 
      AND company_id = public.get_user_company(auth.uid())
    )
  );

CREATE POLICY "Platform owner can view all payments" ON public.payments
  FOR SELECT USING (public.is_platform_owner(auth.uid()));

CREATE POLICY "Company admin/manager can manage payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = payments.invoice_id 
      AND public.has_company_role(auth.uid(), company_id, ARRAY['company_admin', 'company_manager']::platform_role[])
    )
  );

-- AUDIT_LOGS
CREATE POLICY "Platform owner can view all logs" ON public.audit_logs
  FOR SELECT USING (public.is_platform_owner(auth.uid()));

CREATE POLICY "Company admin can view company logs" ON public.audit_logs
  FOR SELECT USING (
    company_id IS NOT NULL 
    AND public.has_company_role(auth.uid(), company_id, ARRAY['company_admin']::platform_role[])
  );

CREATE POLICY "Anyone can insert logs" ON public.audit_logs
  FOR INSERT WITH CHECK (TRUE);