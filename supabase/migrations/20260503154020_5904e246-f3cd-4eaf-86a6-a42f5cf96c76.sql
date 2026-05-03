DROP POLICY IF EXISTS "Creator can update their room" ON public.rooms;
CREATE POLICY "Creator can update their room"
  ON public.rooms FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);