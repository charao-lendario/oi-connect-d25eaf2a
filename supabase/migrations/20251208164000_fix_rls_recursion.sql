-- Function to get workspace_id without triggering RLS recursion
CREATE OR REPLACE FUNCTION get_user_workspace_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT workspace_id FROM profiles WHERE id = user_id;
$$;

-- Fix Profiles Policy (Avoid recursion)
DROP POLICY IF EXISTS "Workspace Isolation for Profiles" ON public.profiles;
CREATE POLICY "Workspace Isolation for Profiles"
ON public.profiles
FOR SELECT
USING (
  -- Users can see profiles in their workspace
  workspace_id = get_user_workspace_id(auth.uid())
  -- Users can always see themselves
  OR id = auth.uid()
);

-- Fix Agreements Policy (Use optimized function)
DROP POLICY IF EXISTS "Workspace Isolation for Agreements" ON public.agreements;
DROP POLICY IF EXISTS "Ver apenas combinados do meu workspace" ON public.agreements;

CREATE POLICY "Workspace Isolation for Agreements"
ON public.agreements
FOR SELECT
USING (
  -- Option 1: Creator is in my workspace
  (creator_id IN (SELECT id FROM public.profiles WHERE workspace_id = get_user_workspace_id(auth.uid())))
  OR
  -- Option 2: I am a participant
  (id IN (SELECT agreement_id FROM public.agreement_participants WHERE user_id = auth.uid()))
);

-- Fix Workspaces Policy (Allow finding workspace by slug)
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view workspaces" ON public.workspaces;

CREATE POLICY "Authenticated users can view workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (true);
