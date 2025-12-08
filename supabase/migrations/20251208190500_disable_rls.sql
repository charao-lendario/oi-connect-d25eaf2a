-- Disable Row Level Security on Agreement-related tables as requested
-- This allows free insertion and selection by authenticated users

ALTER TABLE public.agreements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Also disable for team_members if needed (though we just set it up)
-- ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;

-- Note: Access is still restricted to users who can login (authenticated role)
