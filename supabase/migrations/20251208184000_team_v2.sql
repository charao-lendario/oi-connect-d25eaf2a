-- Add position column
DO $$
BEGIN
    ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS position TEXT;
END $$;

-- Update team_members position from profiles
UPDATE public.team_members tm
SET position = p.position
FROM public.profiles p
WHERE tm.user_id = p.id;

-- V2 Adding RPC with position and robust logic
CREATE OR REPLACE FUNCTION add_user_to_workspace_v2(
    email_input TEXT, 
    workspace_id_input UUID,
    name_input TEXT,
    position_input TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    target_user_id UUID;
    executioner_role TEXT;
    existing_name TEXT;
    final_name TEXT;
BEGIN
    -- Resolve User
    SELECT id INTO target_user_id FROM auth.users WHERE email = email_input;

    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Update profile
    UPDATE public.profiles
    SET workspace_id = workspace_id_input,
        is_active = true
    WHERE id = target_user_id
    RETURNING full_name INTO existing_name;

    final_name := COALESCE(existing_name, name_input, 'Colaborador');
    
    -- Ensure Auth Role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'COLABORADOR')
    ON CONFLICT (user_id) DO NOTHING;

    -- Upsert Team Member
    INSERT INTO public.team_members (workspace_id, user_id, email, name, role, position)
    VALUES (workspace_id_input, target_user_id, email_input, final_name, 'COLABORADOR', position_input)
    ON CONFLICT (workspace_id, email) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        name = EXCLUDED.name,
        position = EXCLUDED.position;

    RETURN TRUE;
END;
$$;

-- Removal RPC
CREATE OR REPLACE FUNCTION remove_user_from_workspace(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Delete from team_members only if in executor's workspace
    DELETE FROM public.team_members 
    WHERE user_id = target_user_id 
    AND workspace_id IN (SELECT workspace_id FROM public.profiles WHERE id = auth.uid());
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows > 0 THEN
        -- If successful, unlink profile
        UPDATE public.profiles
        SET workspace_id = NULL,
            is_active = false
        WHERE id = target_user_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;
