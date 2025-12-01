-- Desabilitar RLS para tabelas relacionadas a combinados
ALTER TABLE public.agreements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Opcional: Remover as políticas existentes para limpeza (embora desabilitar RLS já as ignore)
DROP POLICY IF EXISTS "Users can view accessible agreements" ON public.agreements;
DROP POLICY IF EXISTS "Gestores and admins can create agreements" ON public.agreements;
DROP POLICY IF EXISTS "Users can create own agreements" ON public.agreements;
DROP POLICY IF EXISTS "Creators and admins can update agreements" ON public.agreements;
DROP POLICY IF EXISTS "Creators and admins can delete agreements" ON public.agreements;

DROP POLICY IF EXISTS "Users can view participants of accessible agreements" ON public.agreement_participants;
DROP POLICY IF EXISTS "Agreement creators can add participants" ON public.agreement_participants;
DROP POLICY IF EXISTS "Participants can update their own status" ON public.agreement_participants;
DROP POLICY IF EXISTS "Creators can delete participants" ON public.agreement_participants;

DROP POLICY IF EXISTS "Users can view checklist of accessible agreements" ON public.checklist_items;
DROP POLICY IF EXISTS "Agreement creators can manage checklist" ON public.checklist_items;
DROP POLICY IF EXISTS "Creators and participants can update checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Creators can delete checklist items" ON public.checklist_items;

DROP POLICY IF EXISTS "Users can view attachments of accessible agreements" ON public.attachments;
DROP POLICY IF EXISTS "Participants can upload attachments" ON public.attachments;
DROP POLICY IF EXISTS "Uploaders and admins can delete attachments" ON public.attachments;

DROP POLICY IF EXISTS "Users can view comments of accessible agreements" ON public.comments;
DROP POLICY IF EXISTS "Participants can add comments" ON public.comments;
DROP POLICY IF EXISTS "Authors and admins can update comments" ON public.comments;
DROP POLICY IF EXISTS "Authors and admins can delete comments" ON public.comments;

DROP POLICY IF EXISTS "Users can view audit logs of accessible agreements" ON public.audit_logs;
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;
