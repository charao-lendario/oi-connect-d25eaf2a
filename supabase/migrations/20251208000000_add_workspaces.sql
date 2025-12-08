-- Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own workspace (and any they are members of, which is defined by profile.workspace_id)
CREATE POLICY "Users can view their own workspace" 
ON public.workspaces FOR SELECT 
USING (
    id IN (SELECT workspace_id FROM public.profiles WHERE id = auth.uid())
);

-- Update profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Insert Mutumilk workspace
INSERT INTO public.workspaces (name, slug) 
VALUES ('Mutumilk Laticínios', 'mutumilk') 
ON CONFLICT (slug) DO NOTHING;
