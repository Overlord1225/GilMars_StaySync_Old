-- Canned replies staff can insert into an inquiry reply. Staff only.
CREATE TABLE public.reply_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 80),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reply_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY reply_templates_select_staff
  ON public.reply_templates FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY reply_templates_insert_staff
  ON public.reply_templates FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND created_by = auth.uid());

CREATE POLICY reply_templates_delete_staff
  ON public.reply_templates FOR DELETE TO authenticated
  USING (public.is_staff());

GRANT SELECT, INSERT, DELETE ON public.reply_templates TO authenticated;
