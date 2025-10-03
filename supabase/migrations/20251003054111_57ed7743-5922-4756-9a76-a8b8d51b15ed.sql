-- Create app_role enum for role management
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'patient', 'pharmacy');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()));

-- Update doctors table RLS policies for admin verification
CREATE POLICY "Admins can update any doctor profile"
ON public.doctors
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all doctors"
ON public.doctors
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Update appointments RLS policies for admin access
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Update prescriptions RLS policies for admin access
CREATE POLICY "Admins can view all prescriptions"
ON public.prescriptions
FOR SELECT
USING (public.is_admin(auth.uid()));