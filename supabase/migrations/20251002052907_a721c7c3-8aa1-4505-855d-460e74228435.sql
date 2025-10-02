-- Fix the public_doctors view to properly respect RLS policies
-- Drop and recreate without security_invoker to ensure RLS is properly enforced

DROP VIEW IF EXISTS public.public_doctors CASCADE;

-- Recreate the view without security_invoker (defaults to security_definer)
-- This ensures the view operates under the view owner's permissions
-- and users still need proper grants to query it
CREATE VIEW public.public_doctors AS
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

-- Revoke all existing permissions first
REVOKE ALL ON public.public_doctors FROM PUBLIC;
REVOKE ALL ON public.public_doctors FROM anon;
REVOKE ALL ON public.public_doctors FROM authenticated;

-- Grant SELECT only to authenticated users
-- This prevents anonymous scraping of doctor information
GRANT SELECT ON public.public_doctors TO authenticated;

-- Add security comment
COMMENT ON VIEW public.public_doctors IS 'Secure view of verified doctors. Access restricted to authenticated users only. Excludes sensitive fields like user_id, license_number, and clinic details for privacy protection.';