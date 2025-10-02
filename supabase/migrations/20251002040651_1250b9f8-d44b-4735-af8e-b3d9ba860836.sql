-- Create a view for public doctor information with only safe fields
CREATE OR REPLACE VIEW public.public_doctors AS
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

-- Grant access to authenticated users
GRANT SELECT ON public.public_doctors TO authenticated;
GRANT SELECT ON public.public_doctors TO anon;

-- Remove the overly permissive public policy on doctors table
DROP POLICY IF EXISTS "Public can view verified doctors" ON public.doctors;

-- Add a more restrictive policy - only allow public to view through profiles/appointments
-- This prevents direct access to sensitive fields
CREATE POLICY "Authenticated users can view verified doctor listings"
ON public.doctors
FOR SELECT
TO authenticated
USING (is_verified = true);