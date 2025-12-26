-- ==============================================
-- Migration adaptée pour le nouveau backend (sans Supabase Auth)
-- ==============================================
-- Ajout de la table organizations pour le support multi-utilisateurs
-- Cette migration a été adaptée pour fonctionner sans auth.users
-- ==============================================

-- Add organizations table for multi-user business support
-- Note: Cette table sera remplacée par "companies" dans les migrations suivantes
-- On la crée seulement si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  siret TEXT,
  currency TEXT NOT NULL DEFAULT 'GNF',
  tax_rate NUMERIC NOT NULL DEFAULT 18,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Link users to organizations
-- Note: Cette table sera remplacée par "company_members" dans les migrations suivantes
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Référence vers profiles (sans contrainte pour compatibilité)
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Payments table for tracking deposits, partial and full payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  recorded_by UUID, -- Référence vers profiles (sans contrainte pour compatibilité)
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'partial' CHECK (payment_type IN ('deposit', 'partial', 'full', 'balance')),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile_money', 'bank_transfer', 'check', 'other')),
  reference TEXT,
  notes TEXT,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add paid_amount and balance columns to invoices (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'paid_amount'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN paid_amount NUMERIC NOT NULL DEFAULT 0;
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

-- Note: organization_id et company_id seront ajoutés par les migrations suivantes
-- On ne les ajoute pas ici pour éviter les conflits

-- Note: RLS est désactivé dans notre schéma car l'autorisation est gérée dans le backend
-- Les commandes ALTER TABLE ... ENABLE ROW LEVEL SECURITY sont ignorées
