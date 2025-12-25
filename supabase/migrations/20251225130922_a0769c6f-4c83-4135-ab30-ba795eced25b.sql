-- Add organizations table for multi-user business support
CREATE TABLE public.organizations (
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
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Payments table for tracking deposits, partial and full payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'partial' CHECK (payment_type IN ('deposit', 'partial', 'full', 'balance')),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile_money', 'bank_transfer', 'check', 'other')),
  reference TEXT,
  notes TEXT,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add paid_amount and balance columns to invoices
ALTER TABLE public.invoices 
ADD COLUMN paid_amount NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN balance NUMERIC GENERATED ALWAYS AS (COALESCE(total, 0) - paid_amount) STORED,
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Add organization_id to clients
ALTER TABLE public.clients 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Organizations RLS policies
CREATE POLICY "Users can view their organizations"
ON public.organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = organizations.id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Org owners/admins can update their organization"
ON public.organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = organizations.id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Org owners can delete their organization"
ON public.organizations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = organizations.id 
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Organization members RLS policies
CREATE POLICY "Users can view members of their organizations"
ON public.organization_members FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join organizations"
ON public.organization_members FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Org owners/admins can manage members"
ON public.organization_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Org owners can remove members"
ON public.organization_members FOR DELETE
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
);

-- Payments RLS policies
CREATE POLICY "Users can view payments for their invoices"
ON public.payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = payments.invoice_id
    AND (invoices.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can create payments for their invoices"
ON public.payments FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_id
    AND invoices.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their payments"
ON public.payments FOR UPDATE
USING (
  user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete their payments"
ON public.payments FOR DELETE
USING (
  user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
);

-- Function to update invoice paid_amount when payment is added
CREATE OR REPLACE FUNCTION public.update_invoice_paid_amount()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for payments
CREATE TRIGGER update_invoice_on_payment
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_paid_amount();

-- Add updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add partial status to invoices
-- Note: Already have draft, sent, paid, cancelled - adding partial for deposits