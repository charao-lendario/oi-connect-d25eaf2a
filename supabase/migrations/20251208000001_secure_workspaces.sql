-- Enable RLS on key tables to ensure isolation
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for Agreements: Users can only see agreements created by users in their workspace OR where they are participants
DROP POLICY IF EXISTS "Workspace Isolation for Agreements" ON public.agreements;
CREATE POLICY "Workspace Isolation for Agreements"
ON public.agreements
FOR SELECT
USING (
  (
    -- Agreement creator is in same workspace
    creator_id IN (
      SELECT id FROM public.profiles 
      WHERE workspace_id = (SELECT workspace_id FROM public.profiles WHERE id = auth.uid())
    )
  )
  OR
  (
    -- OR user is a participant
    id IN (
      SELECT agreement_id FROM public.agreement_participants 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy for Profiles: Users can only see profiles from their own workspace
DROP POLICY IF EXISTS "Workspace Isolation for Profiles" ON public.profiles;
CREATE POLICY "Workspace Isolation for Profiles"
ON public.profiles
FOR SELECT
USING (
  workspace_id = (SELECT workspace_id FROM public.profiles WHERE id = auth.uid())
  OR id = auth.uid() -- Can always see self
);

-- Ensure users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());
