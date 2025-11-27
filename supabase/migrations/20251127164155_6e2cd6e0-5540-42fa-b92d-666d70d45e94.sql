-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE public.app_role AS ENUM ('COLABORADOR', 'GESTOR', 'ADMIN');
CREATE TYPE public.agreement_status AS ENUM (
  'DRAFT', 'PENDING', 'ACCEPTED', 'REJECTED', 
  'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED'
);
CREATE TYPE public.agreement_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE public.participant_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE public.notification_type AS ENUM (
  'AGREEMENT_CREATED', 'AGREEMENT_SENT', 'AGREEMENT_ACCEPTED',
  'AGREEMENT_REJECTED', 'AGREEMENT_UPDATED', 'AGREEMENT_COMPLETED',
  'CHECKLIST_ITEM_CHECKED', 'COMMENT_ADDED',
  'DEADLINE_APPROACHING', 'DEADLINE_OVERDUE'
);

-- ============================================
-- TABLES (without RLS policies yet)
-- ============================================

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  two_factor_enabled BOOLEAN DEFAULT false NOT NULL,
  two_factor_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_login_at TIMESTAMPTZ
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Agreements
CREATE TABLE public.agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  creator_id UUID REFERENCES public.profiles(id) NOT NULL,
  meeting_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status agreement_status DEFAULT 'PENDING' NOT NULL,
  priority agreement_priority DEFAULT 'MEDIUM' NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}' NOT NULL,
  version INT DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Agreement Participants
CREATE TABLE public.agreement_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES public.agreements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  status participant_status DEFAULT 'PENDING' NOT NULL,
  response_date TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(agreement_id, user_id)
);

-- Checklist Items
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES public.agreements(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  order_index INT NOT NULL,
  assigned_to_id UUID REFERENCES public.profiles(id),
  is_completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by_id UUID REFERENCES public.profiles(id),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Attachments
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES public.agreements(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES public.agreements(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  is_edited BOOLEAN DEFAULT false NOT NULL,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES public.agreements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_agreement ON public.audit_logs(agreement_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_agreement_participants_user ON public.agreement_participants(user_id);
CREATE INDEX idx_agreement_participants_agreement ON public.agreement_participants(agreement_id);

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get all user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Function to check if user can access an agreement
CREATE OR REPLACE FUNCTION public.can_access_agreement(_user_id UUID, _agreement_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agreements
    WHERE id = _agreement_id AND (
      creator_id = _user_id OR
      EXISTS (
        SELECT 1 FROM public.agreement_participants
        WHERE agreement_id = _agreement_id AND user_id = _user_id
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = 'ADMIN'
      )
    )
  )
$$;