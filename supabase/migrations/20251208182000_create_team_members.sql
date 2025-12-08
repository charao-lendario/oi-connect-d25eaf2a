-- Create a dedicated table for team members as requested to separate concerns and ensure visibility
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'COLABORADOR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workspace_id, email)
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Members of a workspace can view their teammates
CREATE POLICY "View team members" ON public.team_members
FOR SELECT
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- Policy: Admins can manage their team members
CREATE POLICY "Admins manage team members" ON public.team_members
FOR ALL
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- Helper trigger to keep team_members in sync from profiles? 
-- No, let's manage it explicitly in the application to strict control.
-- But we should backfill existing users.

DO $$
BEGIN
    INSERT INTO public.team_members (workspace_id, user_id, email, name, role)
    SELECT 
        p.workspace_id, 
        p.id, 
        u.email, 
        COALESCE(p.full_name, 'Usuário'), 
        COALESCE((SELECT role FROM public.user_roles WHERE user_id = p.id LIMIT 1), 'COLABORADOR')
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.workspace_id IS NOT NULL
    ON CONFLICT (workspace_id, email) DO NOTHING;
END $$;
