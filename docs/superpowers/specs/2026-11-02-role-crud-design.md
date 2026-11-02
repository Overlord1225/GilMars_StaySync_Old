# Role-based CRUD and live access repair

Date: 2026-11-02
Status: awaiting user review

## Goal

Complete the data management each role needs, and restore the database access
the app depends on.

| Role | Resource | Create | Read | Update | Delete |
|---|---|---|---|---|---|
| Admin | Rooms (`units`) | Yes | Yes | Yes | Only without history |
| Admin | Guests | No, guests self-register | Yes | Name, email, active status | Only without history |
| Super admin | Admins | Yes (`create-staff`) | Yes | Name, email, role, active status | Only without history |
| Guest | Own reservations | Yes | Yes | Pending only | Cancel pending only |

Super admins are staff, so they can do everything an admin can.

## Decisions

- "Delete" permanently removes a room, guest or admin only if it has no history.
  Otherwise the app explains why and offers deactivate (or "Mark inactive" for
  rooms).
- A guest "deletes" a reservation by cancelling it. The row is kept.
- Guests edit and cancel only pending requests. Staff handle confirmed bookings
  with their existing tools.
- Admins do not create guests.
- Nobody can change the email of, or delete, their own account through
  `manage-account`.
- A super admin cannot be deleted or have their email changed through
  `manage-account`. They must be demoted to admin first.

## Live state (read-only queries, 2026-11-02, project STAYSYNC)

- RLS is on for every `public` table.
- `units` has no policies. `profiles` has only `profiles_update_staff_guests`.
- Expected effect, inferred from the rules and not yet tested in the running
  app: rooms and profiles read as empty, so room pages and role loading fail.
- `anon` and `authenticated` hold broad grants on `units`, `reservations` and
  `inquiries`, including `TRUNCATE`, which ignores RLS. The Supabase API does not
  expose it, but it should not be granted.
- `res_insert_guest` allows direct inserts that skip
  `create_reservation_request` validation.
- `audit_log.actor_id` is `ON DELETE CASCADE`. All other foreign keys to
  `profiles` and `units` are `NO ACTION`.
- `booking_rules`, `inquiry_keywords`, `test_inquiries` and storage policies were
  not checked. Check them read-only before writing migration 0015.

## Part 1: Access repair (migration 0015, shipped first and on its own)

Policies:

- `units`: `SELECT` for `anon` and `authenticated` where `is_active` or
  `is_staff()`. `INSERT`, `UPDATE`, `DELETE` for `authenticated` where
  `is_staff()`.
- `profiles`: `SELECT` where `id = auth.uid()` or `is_staff()`. `UPDATE` own row.
  `UPDATE` any row for `is_super_admin()`. The existing
  `prevent_profile_privilege_escalation` trigger keeps guarding role and status.

Grants:

- Revoke `TRUNCATE`, `TRIGGER` and `REFERENCES` from `anon` and `authenticated`
  on `units`, `reservations` and `inquiries`.
- Revoke all writes from `anon` on those tables, and `SELECT` on `reservations`
  and `inquiries`. Keep `anon` `SELECT` on `units`.
- Revoke `DELETE` on `reservations` and `inquiries` from `authenticated`, and
  `INSERT` on `reservations`.
- Drop `res_insert_guest`, so guest reservations are only created by the RPC.

Before writing the migration, confirm that no frontend call depends on a removed
grant.

## Part 2: Guest reservation editing (migration 0016)

New RPC `update_reservation_request(p_reservation_id, p_check_in, p_check_out,
p_num_guests, p_notes)`, `SECURITY DEFINER`, with execute granted to
`authenticated` only.

- The caller must be an active guest who owns the reservation, and it must be
  pending. The row is locked `FOR UPDATE`.
- It repeats the create checks: check-out after check-in, guest count within
  capacity, active unit, minimum advance days (never same-day), and availability
  against confirmed reservations only. Ranges stay half-open.
- It cannot change the unit, status, source or deposit fields. To change rooms,
  the guest cancels and sends a new request.

Required trigger change: `guard_reservation_guest_update` checks `auth.uid()`,
which stays set inside a `SECURITY DEFINER` RPC, so it would reject this RPC's
edits. Remove `SECURITY DEFINER` from the trigger function and apply the guard
only when `current_user = 'authenticated'`. Direct guest updates stay locked down
and validated RPCs pass. Test both paths, including staff workflows and
`cancel_reservation`.

Frontend:

- Add `updateReservationRequest` to `src/lib/db.ts`.
- Add a guest route, `/reservations/edit/:id`, using react-hook-form and zod.
  Show unavailable dates the same way `ReservationRequest` does, reusing its
  logic where practical.
- Add an "Edit request" action on pending rows in `MyReservations`.

## Part 3: Rooms

Changes in `src/pages/AdminUnits.tsx`:

- Render the delete `ConfirmDialog` inside the returned JSX. It is currently
  unreachable after the `return`.
- Delete the database row first, then the photos. If photo removal fails, the room
  is still deleted and the app logs a warning.
- Handle Postgres error `23503` by showing that the room has history and offering
  "Mark inactive". Handle other delete errors and show a toast on success.

The foreign keys from `reservations` and `inquiries` are the real guard, so no
new RPC is needed.

## Part 4: Accounts (`manage-account` Edge Function)

Request: `POST { action: "delete" | "update_email", targetId, email? }`.

The function follows the `create-staff` authentication pattern: verify the token,
load the actor's profile with the service-role client, and require an active
account. The service-role key stays in Function secrets.

Authorization, enforced in the function:

| Actor | Allowed target role |
|---|---|
| Admin | `guest` |
| Super admin | `guest`, `admin` |

Everything else returns 403, including acting on your own account and any
`super_admin` target.

`delete`:

- Returns 409 if the target appears in `reservations.guest_id`,
  `reservations.reviewed_by`, `inquiries.guest_id`, `inquiries.corrected_by` or
  `audit_log.actor_id`.
- Otherwise deletes the auth user, which cascades to the profile. Foreign keys
  still block reservations or inquiries created after the check. A race with a
  new audit entry would lose that entry, which is accepted because only an active
  staff member being deleted at that moment could cause it.

`update_email`:

- Validates and normalizes the email, updates the auth user, then updates
  `profiles.email`. If the profile update fails, it restores the previous auth
  email and returns 500. Returns a generic error on a duplicate email.

Audit: the function writes an `audit_log` row for each successful action. For
deletes, the details contain the target's id and email, and the actor is the
caller, so the entry survives.

Frontend:

- Add wrappers to `src/lib/db.ts`.
- `AdminGuests`: add an edit form (name and email) and a delete action. A 409
  response shows the history message and offers deactivate.
- `StaffManagement`: send email edits through the function, and add the same
  delete action. Replace the header text saying accounts must be created in
  Supabase first, since `create-staff` handles this.
- Move direct name and status updates in `AdminGuests` to `src/lib/db.ts`.

Verify that deactivated users are blocked at sign-in. `AdminGuests` promises this,
but it has not been confirmed. If it is not enforced, block them in the auth flow
and rely on RLS and RPC checks on the server.

## Testing

- Vitest: any new pure validation or date helpers, in `src/**/*.test.ts`.
- Each task: `npm run typecheck && npm run lint && npm test`. Before pushing, also
  `npm run format:check` and `npm run build`.
- Add these to `supabase/tests/exploit_checks.md`, run only on a test project or
  Supabase branch:
  - An anonymous user cannot write `units` or read `profiles`.
  - A guest cannot read other profiles, directly edit a reservation or insert one
    directly, or edit someone else's reservation or a confirmed one.
  - An admin cannot delete or edit staff through `manage-account`.
  - A super admin cannot delete themselves or another super admin.
  - An account or room with history cannot be deleted.
- Manual: sign in as each role on the live app after 0015 and confirm rooms and
  role routing work.

## Rollout

Each remote step needs the exact command shown and approved first.

1. Apply 0015 and confirm the app works before continuing.
2. Apply 0016.
3. Deploy `manage-account`.
4. Update `src/lib/database.types.ts` for the new RPC.

## Out of scope

- Admins creating guests.
- Guest edits or cancellation of confirmed bookings, and refunds.
- Reassigning or anonymizing history so that accounts can be deleted.
- Guests changing a request's room.
- A database guard against a super admin demoting themselves. The UI already
  prevents it.
- The existing uncommitted `create-staff` changes, which stay separate from this
  work.
