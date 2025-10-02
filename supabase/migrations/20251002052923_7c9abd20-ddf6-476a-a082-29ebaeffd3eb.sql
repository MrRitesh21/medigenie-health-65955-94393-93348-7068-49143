-- Fix the public_doctors view to use security_invoker
-- This ensures RLS policies on the underlying doctors table are enforced

DROP VIEW IF EXISTS public.public_doctors CASCADE;

-- Recreate with security_invoker = true
-- This makes the view check RLS as the querying user, not the view owner
CREATE VIEW public.public_doctors
WITH (security_invoker = true) AS
SELECT 
  id,
  specialization,
  qualification,
  experience_years,
  consultation_fee,
  bio,
  is_verified,
  created_at
FROM public.doctors
WHERE is_verified = true;

-- Revoke all existing permissions
REVOKE ALL ON public.public_doctors FROM PUBLIC;
REVOKE ALL ON public.public_doctors FROM anon;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.public_doctors TO authenticated;

-- Add security documentation
COMMENT ON VIEW public.public_doctors IS 'Secure view of verified doctors using security_invoker. RLS policies from doctors table are enforced. Access restricted to authenticated users only. Excludes sensitive fields for privacy.';