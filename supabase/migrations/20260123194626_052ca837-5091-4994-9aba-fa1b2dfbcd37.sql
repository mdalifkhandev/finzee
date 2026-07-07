-- Add preferred_language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language code (e.g., en, es, fr) for AI responses';