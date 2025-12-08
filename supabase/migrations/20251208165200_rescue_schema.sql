-- 1. Create workspaces table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add workspace_id to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'workspace_id') THEN
        ALTER TABLE public.profiles ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'must_change_password') THEN
        ALTER TABLE public.profiles ADD COLUMN must_change_password BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Insert Mutumilk workspace if missing
INSERT INTO public.workspaces (name, slug) 
VALUES ('Mutumilk Laticínios', 'mutumilk') 
ON CONFLICT (slug) DO NOTHING;

-- 4. Create the Security Helper Function (Safe against infinite recursion)
-- We use a raw query or simple select, but now that column exists, it should work.
CREATE OR REPLACE FUNCTION get_user_workspace_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT workspace_id FROM profiles WHERE id = user_id;
$$;

-- 5. Enable RLS and Apply Policies

-- Agreements
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace Isolation for Agreements" ON public.agreements;
DROP POLICY IF EXISTS "Ver apenas combinados do meu workspace" ON public.agreements;

CREATE POLICY "Workspace Isolation for Agreements"
ON public.agreements
FOR SELECT
USING (
  (creator_id IN (SELECT id FROM public.profiles WHERE workspace_id = get_user_workspace_id(auth.uid())))
  OR
  (id IN (SELECT agreement_id FROM public.agreement_participants WHERE user_id = auth.uid()))
);

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workspace Isolation for Profiles" ON public.profiles;

CREATE POLICY "Workspace Isolation for Profiles"
ON public.profiles
FOR SELECT
USING (
  workspace_id = get_user_workspace_id(auth.uid())
  OR id = auth.uid()
);

-- Workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view their own workspace" ON public.workspaces;

CREATE POLICY "Authenticated users can view workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (true);

-- 6. Ensure Carol is linked to Mutumilk (Data Fix)
DO $$
DECLARE
    mutumilk_id uuid;
BEGIN
    SELECT id INTO mutumilk_id FROM public.workspaces WHERE slug = 'mutumilk';
    
    UPDATE public.profiles
    SET workspace_id = mutumilk_id
    WHERE id IN (
        SELECT id FROM auth.users WHERE email = 'carol.martins@mutumilklaticinios.com.br'
    ) AND workspace_id IS NULL;
END $$;
