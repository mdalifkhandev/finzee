-- Add DELETE policy for profiles table so users can delete their own profile
CREATE POLICY "owner_profile_delete" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);