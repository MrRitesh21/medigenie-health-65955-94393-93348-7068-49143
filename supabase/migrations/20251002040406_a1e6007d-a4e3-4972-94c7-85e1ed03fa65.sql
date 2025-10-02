-- Create a security definer function to check if user has doctor role
CREATE OR REPLACE FUNCTION public.is_doctor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = 'doctor'::user_role
  )
$$;

-- Add INSERT policy for doctors table
CREATE POLICY "Doctors can insert own profile"
ON public.doctors
FOR INSERT
WITH CHECK (
  public.is_doctor(auth.uid()) AND auth.uid() = user_id
);