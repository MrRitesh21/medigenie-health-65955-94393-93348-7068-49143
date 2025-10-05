-- Add profile photo URL to doctors table
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS photo_url text;