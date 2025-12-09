-- Add workspace_id column to agreements table
DO $$
BEGIN
    ALTER TABLE public.agreements 
    ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);
END $$;

-- Optional: Backfill existing agreements if they have a creator who belongs to a workspace
UPDATE public.agreements a
SET workspace_id = p.workspace_id
FROM public.profiles p
WHERE a.creator_id = p.id
AND a.workspace_id IS NULL;
