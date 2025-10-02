-- Grant SELECT permission on public_doctors view to authenticated users
-- Ensure anon access is explicitly revoked
GRANT SELECT ON public.public_doctors TO authenticated;
REVOKE SELECT ON public.public_doctors FROM anon;

-- Verify the underlying doctors table has proper RLS
-- The view with security_invoker=true will enforce these policies
DO $$
BEGIN
  -- Check if RLS is enabled on doctors table
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'doctors' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on public.doctors table';
  END IF;
END $$;