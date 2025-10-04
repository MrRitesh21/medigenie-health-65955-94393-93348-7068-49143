-- Add location fields to doctors table
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS availability_schedule jsonb DEFAULT '[]'::jsonb;

-- Add location fields to patients table
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Create ratings table
CREATE TABLE IF NOT EXISTS public.doctor_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(patient_id, appointment_id)
);

-- Enable RLS on ratings table
ALTER TABLE public.doctor_ratings ENABLE ROW LEVEL SECURITY;

-- Patients can create ratings only for their completed appointments
CREATE POLICY "Patients can create ratings for their appointments"
ON public.doctor_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  AND appointment_id IN (
    SELECT id FROM public.appointments 
    WHERE patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
    AND status = 'completed'
  )
);

-- Patients can view their own ratings
CREATE POLICY "Patients can view their own ratings"
ON public.doctor_ratings
FOR SELECT
TO authenticated
USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

-- Doctors can view ratings for themselves
CREATE POLICY "Doctors can view their ratings"
ON public.doctor_ratings
FOR SELECT
TO authenticated
USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- Everyone can view ratings (for public doctor profiles)
CREATE POLICY "Public can view ratings"
ON public.doctor_ratings
FOR SELECT
TO authenticated
USING (true);

-- Patients can update their own ratings
CREATE POLICY "Patients can update their own ratings"
ON public.doctor_ratings
FOR UPDATE
TO authenticated
USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_doctor_ratings_updated_at
BEFORE UPDATE ON public.doctor_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for doctor ratings summary
CREATE OR REPLACE VIEW public.doctor_ratings_summary AS
SELECT 
  doctor_id,
  COUNT(*) as total_ratings,
  AVG(rating) as average_rating
FROM public.doctor_ratings
GROUP BY doctor_id;