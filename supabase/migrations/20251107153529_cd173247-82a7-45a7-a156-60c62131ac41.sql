-- Create table for doctor booking QR codes
CREATE TABLE IF NOT EXISTS public.doctor_booking_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  access_count integer DEFAULT 0,
  max_uses integer DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.doctor_booking_tokens ENABLE ROW LEVEL SECURITY;

-- Doctors can create and manage their own tokens
CREATE POLICY "Doctors can create own booking tokens"
ON public.doctor_booking_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can view own booking tokens"
ON public.doctor_booking_tokens
FOR SELECT
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can update own booking tokens"
ON public.doctor_booking_tokens
FOR UPDATE
TO authenticated
USING (
  doctor_id IN (
    SELECT id FROM public.doctors WHERE user_id = auth.uid()
  )
);

-- Anyone can view active non-expired tokens for booking
CREATE POLICY "Public can view active booking tokens"
ON public.doctor_booking_tokens
FOR SELECT
TO authenticated
USING (is_active = true AND expires_at > now());

-- Add indexes for performance
CREATE INDEX idx_doctor_booking_tokens_doctor_id ON public.doctor_booking_tokens(doctor_id);
CREATE INDEX idx_doctor_booking_tokens_token ON public.doctor_booking_tokens(token);
CREATE INDEX idx_doctor_booking_tokens_active ON public.doctor_booking_tokens(is_active, expires_at);