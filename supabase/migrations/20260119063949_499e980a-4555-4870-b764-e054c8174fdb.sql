-- Drop existing profiles table and recreate with new structure
-- First drop dependent objects
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Drop and recreate profiles table with new structure
DROP TABLE IF EXISTS public.profiles;

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  age int,
  bio text,
  avatar_url text,
  tags jsonb,
  income_pattern text,
  pain_points text[],
  goals text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "owner_profile_read" ON public.profiles 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "owner_profile_insert" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_profile_update" ON public.profiles 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_prefs table
CREATE TABLE IF NOT EXISTS public.user_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tone text DEFAULT 'calm',
  emoji text DEFAULT 'low',
  voice text DEFAULT 'alloy',
  nudges boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_prefs
ALTER TABLE public.user_prefs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_prefs
CREATE POLICY "owner_prefs_read" ON public.user_prefs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "owner_prefs_insert" ON public.user_prefs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_prefs_update" ON public.user_prefs 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger for user_prefs
CREATE TRIGGER update_user_prefs_updated_at
  BEFORE UPDATE ON public.user_prefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to create both profile and prefs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_prefs (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;