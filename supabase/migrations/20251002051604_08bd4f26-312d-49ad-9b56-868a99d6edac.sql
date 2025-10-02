-- Revoke anonymous access to public_doctors view
-- This ensures only authenticated users can view doctor listings
REVOKE SELECT ON public.public_doctors FROM anon;

-- Add a comment to document the security decision
COMMENT ON VIEW public.public_doctors IS 'Public view of verified doctors. Access restricted to authenticated users only to prevent unauthorized scraping of doctor information and pricing data.';