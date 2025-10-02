-- Enable Row Level Security on the public_doctors view
ALTER VIEW public.public_doctors SET (security_invoker = true);

-- Note: Views in PostgreSQL/Supabase inherit RLS from their underlying tables by default
-- However, we should ensure the view is defined correctly and uses security_invoker
-- Let's recreate the view with proper security settings

-- Drop the existing view
DROP VIEW IF EXISTS public.public_doctors;

-- Recreate the view showing only verified doctors with public information
-- This view excludes sensitive information like user_id
CREATE OR REPLACE VIEW public.public_doctors
WITH (security_invoker = true)
AS
SELECT 
  d.id,
  d.specialization,
  d.qualification,
  d.experience_years,
  d.consultation_fee,
  d.bio,
  d.is_verified,
  d.created_at
FROM public.doctors d
WHERE d.is_verified = true;

-- Add a comment explaining the view's purpose
COMMENT ON VIEW public.public_doctors IS 'Public view of verified doctors showing only non-sensitive information. Excludes user_id, license_number, and clinic details for privacy.';

-- Grant SELECT access to authenticated users
GRANT SELECT ON public.public_doctors TO authenticated;
GRANT SELECT ON public.public_doctors TO anon;