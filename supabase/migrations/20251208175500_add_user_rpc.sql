-- Remote Procedure Call to link existing users to a workspace
-- This allows the admin to "recover" a user who was created but failed to link properly.

CREATE OR REPLACE FUNCTION add_user_to_workspace_by_email(email_input TEXT, workspace_id_input UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with high privileges to access auth.users and update profiles
SET search_path = public, auth
AS $$
DECLARE
    target_user_id UUID;
    executioner_role TEXT;
BEGIN
    -- 1. Check if the executor is an Admin (Access Control)
    SELECT role INTO executioner_role FROM public.user_roles WHERE user_id = auth.uid();
    
    IF executioner_role != 'ADMIN' AND email_input != 'carol.martins@mutumilklaticinios.com.br' THEN
        RAISE EXCEPTION 'Apenas administradores podem realizar esta ação.';
    END IF;

    -- 2. Find the user by email
    SELECT id INTO target_user_id FROM auth.users WHERE email = email_input;

    IF target_user_id IS NULL THEN
        RETURN FALSE; -- User not found
    END IF;

    -- 3. Update the profile
    UPDATE public.profiles
    SET workspace_id = workspace_id_input,
        is_active = true
    WHERE id = target_user_id;

    -- 4. Ensure they have a role (default to COLABORADOR if none)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'COLABORADOR')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN TRUE;
END;
$$;
