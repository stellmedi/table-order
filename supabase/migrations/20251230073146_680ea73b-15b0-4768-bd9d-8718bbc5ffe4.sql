-- Allow authenticated users to create restaurants (as owners)
CREATE POLICY "Authenticated users can create restaurants"
ON public.restaurants
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());