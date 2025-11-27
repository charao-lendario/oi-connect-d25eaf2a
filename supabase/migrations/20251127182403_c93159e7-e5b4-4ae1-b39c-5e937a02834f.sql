-- Criar bucket para anexos
INSERT INTO storage.buckets (id, name, public)
VALUES ('agreement-attachments', 'agreement-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket
CREATE POLICY "Participantes podem ver anexos de combinados acessíveis"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agreement-attachments' AND
  EXISTS (
    SELECT 1 FROM attachments
    WHERE storage_path = name
    AND can_access_agreement(auth.uid(), agreement_id)
  )
);

CREATE POLICY "Participantes podem fazer upload de anexos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agreement-attachments' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Usuários podem deletar seus próprios anexos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agreement-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);