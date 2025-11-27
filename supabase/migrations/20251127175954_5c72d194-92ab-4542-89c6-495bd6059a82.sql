-- Relax insert policy on agreements to allow any authenticated user to create their own agreements
-- Previous policy "Gestores and admins can create agreements" required specific roles and may be blocking inserts
DROP POLICY IF EXISTS "Gestores and admins can create agreements" ON public.agreements;

CREATE POLICY "Users can create own agreements"
ON public.agreements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);
