-- Drop and recreate the view without security definer
DROP VIEW IF EXISTS public.public_doctors;

-- Create a regular view (SECURITY INVOKER by default) for public doctor information
CREATE VIEW public.public_doctors 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  specialization,
  qualification,
  experience_years,
  consultation_fee,
  is_verified,
  bio,
  created_at
FROM public.doctors
WHERE is_verified = true;

-- Enable RLS on the view
ALTER VIEW public.public_doctors SET (security_invoker = true);

-- Grant access
GRANT SELECT ON public.public_doctors TO authenticated;
GRANT SELECT ON public.public_doctors TO anon;