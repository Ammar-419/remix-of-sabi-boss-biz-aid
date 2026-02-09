-- Fix the overly permissive INSERT policy - make it so only the user can insert their own notifications
-- First drop the old policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create proper insert policy - notifications should be inserted via service role in edge functions
-- but we'll also allow users to insert their own
CREATE POLICY "Users can insert own notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);