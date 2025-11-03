-- Create table for QR access tokens
CREATE TABLE public.health_record_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  access_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accessed_by UUID[], -- Array of doctor IDs who accessed it
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.health_record_tokens ENABLE ROW LEVEL SECURITY;

-- Patients can create and view their own tokens
CREATE POLICY "Patients can create own tokens"
ON public.health_record_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Patients can view own tokens"
ON public.health_record_tokens
FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Patients can update own tokens"
ON public.health_record_tokens
FOR UPDATE
TO authenticated
USING (
  patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  )
);

-- Doctors and admins can view valid tokens
CREATE POLICY "Doctors can view valid tokens"
ON public.health_record_tokens
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND expires_at > now()
  AND (
    EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid())
    OR is_admin(auth.uid())
  )
);

-- Create index for faster token lookups
CREATE INDEX idx_health_record_tokens_token ON public.health_record_tokens(token);
CREATE INDEX idx_health_record_tokens_expires ON public.health_record_tokens(expires_at);

-- Function to validate and increment token usage
CREATE OR REPLACE FUNCTION public.validate_and_use_token(
  p_token TEXT,
  p_doctor_id UUID
)
RETURNS TABLE (
  is_valid BOOLEAN,
  patient_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_record RECORD;
BEGIN
  -- Get token record
  SELECT * INTO v_token_record
  FROM public.health_record_tokens
  WHERE token = p_token;

  -- Check if token exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Invalid token'::TEXT;
    RETURN;
  END IF;

  -- Check if token is active
  IF NOT v_token_record.is_active THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Token has been deactivated'::TEXT;
    RETURN;
  END IF;

  -- Check if token is expired
  IF v_token_record.expires_at < now() THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Token has expired'::TEXT;
    RETURN;
  END IF;

  -- Check if max uses reached
  IF v_token_record.max_uses IS NOT NULL AND v_token_record.access_count >= v_token_record.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Token usage limit reached'::TEXT;
    RETURN;
  END IF;

  -- Update access count and doctor list
  UPDATE public.health_record_tokens
  SET 
    access_count = access_count + 1,
    accessed_by = array_append(COALESCE(accessed_by, ARRAY[]::UUID[]), p_doctor_id)
  WHERE id = v_token_record.id;

  -- Return success
  RETURN QUERY SELECT true, v_token_record.patient_id, 'Access granted'::TEXT;
END;
$$;