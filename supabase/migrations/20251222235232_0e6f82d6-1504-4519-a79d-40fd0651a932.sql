-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Create policies with simpler names
CREATE POLICY "owner_select" ON public.messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "owner_insert" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);