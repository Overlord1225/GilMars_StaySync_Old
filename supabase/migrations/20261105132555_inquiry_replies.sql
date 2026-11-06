-- Staff replies to guest inquiries. Staff write; the inquiry's guest and staff read.
CREATE TABLE public.inquiry_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.profiles(id),
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX inquiry_replies_inquiry_id_idx ON public.inquiry_replies (inquiry_id, created_at);

ALTER TABLE public.inquiry_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY inquiry_replies_select_owner_or_staff
  ON public.inquiry_replies FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.inquiries i
      WHERE i.id = inquiry_id AND i.guest_id = auth.uid()
    )
  );

CREATE POLICY inquiry_replies_insert_staff
  ON public.inquiry_replies FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND staff_id = auth.uid());

GRANT SELECT, INSERT ON public.inquiry_replies TO authenticated;
