-- Drop and recreate the function with updated parameters
DROP FUNCTION IF EXISTS public.register_company(uuid, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.register_company(
  p_user_id uuid,
  p_name text,
  p_phone text,
  p_address text,
  p_city text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_user_email text;
BEGIN
  -- Get user email from profiles
  SELECT email INTO v_user_email FROM public.profiles WHERE id = p_user_id;

  -- 1. Create the company
  INSERT INTO public.companies (name, email, phone, address, city, status)
  VALUES (p_name, v_user_email, p_phone, p_address, p_city, 'pending')
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
          jsonb_build_object('name', p_name));

  RETURN v_company_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.register_company(uuid, text, text, text, text) TO authenticated;