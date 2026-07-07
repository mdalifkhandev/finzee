-- Add UPDATE policy for messages table
CREATE POLICY "owner_update" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add DELETE policy for messages table  
CREATE POLICY "owner_delete"
ON public.messages
FOR DELETE
USING (auth.uid() = user_id);