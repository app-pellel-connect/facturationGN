-- Create a function to register a company atomically with elevated privileges
CREATE OR REPLACE FUNCTION public.register_company(
  p_user_id uuid,
  p_name text,
  p_email text,
  p_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_siret text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  -- 1. Create the company
  INSERT INTO public.companies (name, email, phone, address, city, siret, status)
  VALUES (p_name, p_email, p_phone, p_address, p_city, p_siret, 'pending')
  RETURNING id INTO v_company_id;

  -- 2. Add the user as company_admin
  INSERT INTO public.company_members (company_id, user_id, role, is_active)
  VALUES (v_company_id, p_user_id, 'company_admin', true);

  -- 3. Create trial subscription
  INSERT INTO public.subscriptions (company_id, plan_name, status, max_users, max_invoices_per_month, max_clients)
  VALUES (v_company_id, 'trial', 'trial', 3, 50, 20);

  -- 4. Log the action
  INSERT INTO public.audit_logs (user_id, company_id, action, entity_type, entity_id, new_values)
  VALUES (p_user_id, v_company_id, 'company_created', 'company', v_company_id, 
          jsonb_build_object('name', p_name, 'email', p_email));

  RETURN v_company_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.register_company TO authenticated;