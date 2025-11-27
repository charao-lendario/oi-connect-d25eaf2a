-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- USER ROLES POLICIES
-- ============================================

CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- ============================================
-- AGREEMENTS POLICIES
-- ============================================

CREATE POLICY "Users can view accessible agreements"
  ON public.agreements FOR SELECT
  USING (public.can_access_agreement(auth.uid(), id));

CREATE POLICY "Gestores and admins can create agreements"
  ON public.agreements FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id AND
    (public.has_role(auth.uid(), 'GESTOR') OR public.has_role(auth.uid(), 'ADMIN'))
  );

CREATE POLICY "Creators and admins can update agreements"
  ON public.agreements FOR UPDATE
  USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Creators and admins can delete agreements"
  ON public.agreements FOR DELETE
  USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'ADMIN'));

-- ============================================
-- AGREEMENT PARTICIPANTS POLICIES
-- ============================================

CREATE POLICY "Users can view participants of accessible agreements"
  ON public.agreement_participants FOR SELECT
  USING (public.can_access_agreement(auth.uid(), agreement_id));

CREATE POLICY "Agreement creators can add participants"
  ON public.agreement_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agreements
      WHERE id = agreement_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update their own status"
  ON public.agreement_participants FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.agreements
      WHERE id = agreement_id AND creator_id = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'ADMIN')
  );

CREATE POLICY "Creators can delete participants"
  ON public.agreement_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agreements
      WHERE id = agreement_id AND creator_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'ADMIN')
  );

-- ============================================
-- CHECKLIST ITEMS POLICIES
-- ============================================

CREATE POLICY "Users can view checklist of accessible agreements"
  ON public.checklist_items FOR SELECT
  USING (public.can_access_agreement(auth.uid(), agreement_id));

CREATE POLICY "Agreement creators can manage checklist"
  ON public.checklist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agreements
      WHERE id = agreement_id AND creator_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'ADMIN')
  );

CREATE POLICY "Creators and participants can update checklist items"
  ON public.checklist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agreements
      WHERE id = agreement_id AND (
        creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.agreement_participants
          WHERE agreement_id = checklist_items.agreement_id 
            AND user_id = auth.uid()
        )
      )
    ) OR public.has_role(auth.uid(), 'ADMIN')
  );

CREATE POLICY "Creators can delete checklist items"
  ON public.checklist_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agreements
      WHERE id = agreement_id AND creator_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'ADMIN')
  );

-- ============================================
-- ATTACHMENTS POLICIES
-- ============================================

CREATE POLICY "Users can view attachments of accessible agreements"
  ON public.attachments FOR SELECT
  USING (public.can_access_agreement(auth.uid(), agreement_id));

CREATE POLICY "Participants can upload attachments"
  ON public.attachments FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by_id AND
    public.can_access_agreement(auth.uid(), agreement_id)
  );

CREATE POLICY "Uploaders and admins can delete attachments"
  ON public.attachments FOR DELETE
  USING (
    auth.uid() = uploaded_by_id OR 
    public.has_role(auth.uid(), 'ADMIN')
  );

-- ============================================
-- COMMENTS POLICIES
-- ============================================

CREATE POLICY "Users can view comments of accessible agreements"
  ON public.comments FOR SELECT
  USING (public.can_access_agreement(auth.uid(), agreement_id));

CREATE POLICY "Participants can add comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    public.can_access_agreement(auth.uid(), agreement_id)
  );

CREATE POLICY "Authors and admins can update comments"
  ON public.comments FOR UPDATE
  USING (
    auth.uid() = author_id OR 
    public.has_role(auth.uid(), 'ADMIN')
  );

CREATE POLICY "Authors and admins can delete comments"
  ON public.comments FOR DELETE
  USING (
    auth.uid() = author_id OR 
    public.has_role(auth.uid(), 'ADMIN')
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

CREATE POLICY "Users can view audit logs of accessible agreements"
  ON public.audit_logs FOR SELECT
  USING (
    public.can_access_agreement(auth.uid(), agreement_id) OR
    public.has_role(auth.uid(), 'ADMIN')
  );

CREATE POLICY "System can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TRIGGERS AND UTILITY FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON public.agreements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_agreement_participants_updated_at
  BEFORE UPDATE ON public.agreement_participants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile and assign role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, position)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'position', 'Colaborador')
  );
  
  -- Assign default COLABORADOR role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'COLABORADOR');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.agreements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agreement_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;