-- Add role and status columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student',
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Update RLS policies for admin access
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- New policy: admins can see all profiles, students can only see themselves
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Update policy: only admins can update roles/status
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admin-only delete policy for rooms
DROP POLICY IF EXISTS "Creator can delete their room" ON public.rooms;

CREATE POLICY "rooms_delete_policy"
  ON public.rooms FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = _user_id), false)
$$;
