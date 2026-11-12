-- Wrap auth.uid() in (select ...) so Postgres evaluates it once per query,
-- not once per row (advisor lint 0003_auth_rls_initplan). Logic is unchanged.
-- ALTER POLICY keeps each policy's role and command.

alter policy deletion_requests_delete on public.account_deletion_requests
  using ((guest_id = (select auth.uid())) or is_admin());

alter policy deletion_requests_insert_guest on public.account_deletion_requests
  with check (
    (guest_id = (select auth.uid()))
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'guest'::user_role
        and p.is_active
    )
  );

alter policy deletion_requests_select on public.account_deletion_requests
  using ((guest_id = (select auth.uid())) or is_admin());

alter policy guest_preferences_insert_own on public.guest_preferences
  with check (
    (guest_id = (select auth.uid()))
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'guest'::user_role
        and p.is_active
    )
  );

alter policy guest_preferences_select on public.guest_preferences
  using ((guest_id = (select auth.uid())) or is_admin());

alter policy guest_preferences_update_own on public.guest_preferences
  using (guest_id = (select auth.uid()))
  with check (guest_id = (select auth.uid()));

alter policy inquiries_insert_owner_or_staff on public.inquiries
  with check ((guest_id = (select auth.uid())) or is_admin());

alter policy inquiries_select_owner_or_staff on public.inquiries
  using ((guest_id = (select auth.uid())) or is_staff());

alter policy inquiry_replies_insert_staff on public.inquiry_replies
  with check (is_staff() and (staff_id = (select auth.uid())));

alter policy inquiry_replies_select_owner_or_staff on public.inquiry_replies
  using (
    is_staff()
    or exists (
      select 1 from public.inquiries i
      where i.id = inquiry_replies.inquiry_id
        and i.guest_id = (select auth.uid())
    )
  );

alter policy profiles_select_own_or_staff on public.profiles
  using ((id = (select auth.uid())) or is_staff());

alter policy profiles_update_own on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy reply_templates_insert_admin on public.reply_templates
  with check (is_admin() and (created_by = (select auth.uid())));

alter policy reservation_staff_notes_insert_admin on public.reservation_staff_notes
  with check (is_admin() and (staff_id = (select auth.uid())));

alter policy reservations_select_owner_or_staff on public.reservations
  using ((guest_id = (select auth.uid())) or is_staff());

alter policy unit_stay_info_select on public.unit_stay_info
  using (
    is_admin()
    or exists (
      select 1 from public.reservations r
      where r.unit_id = unit_stay_info.unit_id
        and r.guest_id = (select auth.uid())
        and r.status = 'confirmed'::reservation_status
    )
  );
