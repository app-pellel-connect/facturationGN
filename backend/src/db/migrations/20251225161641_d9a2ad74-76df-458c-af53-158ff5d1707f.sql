-- Supprimer les politiques d'accès du propriétaire aux clients et factures
DROP POLICY IF EXISTS "Platform owner can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Platform owner can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Platform owner can view all invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Platform owner can view all payments" ON public.payments;