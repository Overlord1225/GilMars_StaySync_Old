import { supabase } from "@/lib/supabase";
import { addDays, todayManila } from "@/lib/dates";
import type { Json } from "@/lib/database.types";
import type {
  AuditLogEntry,
  BookingRule,
  Inquiry,
  InquiryKeyword,
  InquiryReply,
  Profile,
  DeletionRequest,
  ReplyTemplate,
  Reservation,
  ReservationStaffNote,
  Unit,
} from "@/lib/types";

export async function getActiveUnits(): Promise<Unit[]> {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getUnitById(id: string): Promise<Unit | null> {
  // A malformed id would make Postgres return a 400 instead of "no row".
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBlockedDateRanges(
  unitId: string,
): Promise<{ check_in: string; check_out: string }[]> {
  const from = todayManila();
  const through = addDays(from, 730);
  const { data, error } = await supabase.rpc("get_booked_ranges", {
    p_unit_id: unitId,
    p_from: from,
    p_to: through,
  });
  if (error) throw error;
  return data;
}

export async function checkAvailability(
  unitId: string,
  checkIn: string,
  checkOut: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_availability", {
    p_unit_id: unitId,
    p_check_in: checkIn,
    p_check_out: checkOut,
  });
  if (error) throw error;
  return data;
}

export async function createReservationRequest(input: {
  unitId: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  notes: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc("create_reservation_request", {
    p_unit_id: input.unitId,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_num_guests: input.numGuests,
    p_notes: input.notes ?? undefined,
  });
  if (error) throw error;
  return data;
}

export async function getReservationsByGuest(
  guestId: string,
): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("guest_id", guestId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function cancelReservation(id: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_reservation", {
    p_reservation_id: id,
  });
  if (error) throw error;
}

export async function createInquiry(
  inquiry: Omit<Inquiry, "id" | "created_at" | "updated_at">,
): Promise<Inquiry> {
  const { data, error } = await supabase
    .from("inquiries")
    .insert(inquiry as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getInquiriesByGuest(guestId: string): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("guest_id", guestId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getActiveKeywords(): Promise<InquiryKeyword[]> {
  const { data, error } = await supabase
    .from("inquiry_keywords")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;
  return data;
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBookingRules() {
  const { data, error } = await supabase
    .from("booking_rules")
    .select("*")
    .eq("id", true)
    .single();
  if (error) throw error;
  return data;
}

export async function getStaffReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("check_in", { ascending: true });
  if (error) throw error;
  return data;
}

/** Arrival details by unit id. RLS limits a guest to units they have confirmed. */
export async function getUnitStayInfo(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("unit_stay_info")
    .select("unit_id, info");
  if (error) throw error;
  return new Map(data.map((row) => [row.unit_id, row.info]));
}

/** Empty text removes the arrival details. */
export async function saveUnitStayInfo(
  unitId: string,
  info: string,
): Promise<void> {
  const text = info.trim();
  const { error } = text
    ? await supabase.from("unit_stay_info").upsert({
        unit_id: unitId,
        info: text,
        updated_at: new Date().toISOString(),
      })
    : await supabase.from("unit_stay_info").delete().eq("unit_id", unitId);
  if (error) throw error;
}

export async function getReservationStaffNotes(): Promise<
  ReservationStaffNote[]
> {
  const { data, error } = await supabase
    .from("reservation_staff_notes")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addReservationStaffNote(
  reservationId: string,
  note: string,
): Promise<void> {
  const { error } = await supabase
    .from("reservation_staff_notes")
    .insert({ reservation_id: reservationId, note });
  if (error) throw error;
}

export async function recordReservationDeposit(input: {
  reservationId: string;
  method: "GCash" | "Bank transfer";
  reference: string;
  amount: number;
}): Promise<void> {
  const { error } = await supabase.rpc("record_deposit", {
    p_reservation_id: input.reservationId,
    p_method: input.method,
    p_reference: input.reference,
    p_amount: input.amount,
  });
  if (error) throw error;
}

export async function submitDepositReference(input: {
  reservationId: string;
  method: "GCash" | "Bank transfer";
  reference: string;
}): Promise<void> {
  const { error } = await supabase.rpc("submit_deposit_reference", {
    p_reservation_id: input.reservationId,
    p_method: input.method,
    p_reference: input.reference,
  });
  if (error) throw error;
}

export async function confirmReservation(id: string): Promise<void> {
  const { error } = await supabase.rpc("confirm_reservation", {
    p_reservation_id: id,
  });
  if (error) throw error;
}

export async function rejectReservation(
  id: string,
  note: string,
): Promise<void> {
  const { error } = await supabase.rpc("reject_reservation", {
    p_reservation_id: id,
    p_note: note || undefined,
  });
  if (error) throw error;
}

export async function addAirbnbReservation(input: {
  unitId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  notes: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc("add_airbnb_booking", {
    p_unit_id: input.unitId,
    p_guest_name: input.guestName,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_num_guests: input.guests,
    p_notes: input.notes ?? undefined,
  });
  if (error) throw error;
}

export async function addDateBlock(input: {
  unitId: string;
  reason: string;
  start: string;
  end: string;
}): Promise<void> {
  const { error } = await supabase.rpc("add_date_block", {
    p_unit_id: input.unitId,
    p_reason: input.reason,
    p_start: input.start,
    p_end: input.end,
  });
  if (error) throw error;
}

export async function rescheduleReservation(input: {
  reservationId: string;
  checkIn: string;
  checkOut: string;
  unitId: string;
  reason: string;
}): Promise<void> {
  const { error } = await supabase.rpc("reschedule_reservation", {
    p_reservation_id: input.reservationId,
    p_new_check_in: input.checkIn,
    p_new_check_out: input.checkOut,
    p_new_unit_id: input.unitId,
    p_reason: input.reason,
  });
  if (error) throw error;
}

export async function updateReservationStatus(
  id: string,
  status: "cancelled" | "completed",
): Promise<void> {
  const { error } = await supabase.rpc("staff_update_reservation_status", {
    p_reservation_id: id,
    p_status: status,
  });
  if (error) throw error;
}

export async function getAllInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateInquiry(
  id: string,
  updates: Pick<Inquiry, "category" | "status">,
): Promise<void> {
  const { error } = await supabase
    .from("inquiries")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function getAllKeywords(): Promise<InquiryKeyword[]> {
  const { data, error } = await supabase
    .from("inquiry_keywords")
    .select("*")
    .order("category")
    .order("keyword");
  if (error) throw error;
  return data;
}

export async function saveKeyword(
  keyword: Omit<InquiryKeyword, "id" | "created_at"> & { id?: string },
): Promise<void> {
  const { error } = keyword.id
    ? await supabase
        .from("inquiry_keywords")
        .update(keyword)
        .eq("id", keyword.id)
    : await supabase.from("inquiry_keywords").insert(keyword as any);
  if (error) throw error;
}

export async function getTestInquiries() {
  const { data, error } = await supabase
    .from("test_inquiries")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");
  if (error) throw error;
  return data;
}

export async function getAllUnits(): Promise<Unit[]> {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function countReservationsByUnit(unitId: string): Promise<number> {
  const { count, error } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("unit_id", unitId);
  if (error) throw error;
  return count ?? 0;
}

export async function deleteStorageObjects(
  bucket: string,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
}

export async function saveUnit(
  unit: Omit<Unit, "id" | "created_at" | "updated_at"> & { id?: string },
): Promise<void> {
  const { error } = unit.id
    ? await supabase.from("units").update(unit).eq("id", unit.id)
    : await supabase.from("units").insert(unit as any);
  if (error) throw error;
}

export async function saveBookingRules(
  input: Pick<
    BookingRule,
    | "min_advance_days"
    | "deposit_amount"
    | "pending_expiry_hours"
    | "max_stay_nights"
    | "max_advance_days"
  >,
): Promise<void> {
  const { error } = await supabase
    .from("booking_rules")
    .update(input)
    .eq("id", true);
  if (error) throw error;
}

export async function expireStaleRequests(): Promise<number> {
  const { data, error } = await supabase.rpc("expire_stale_requests");
  if (error) throw error;
  return data;
}

export const AUDIT_PAGE_SIZE = 25;

export type AuditFilters = {
  actor: string;
  action: string;
  /** Asia/Manila dates, 'YYYY-MM-DD'. `to` is inclusive. */
  from: string;
  to: string;
};

const likeEscape = (text: string) => text.replace(/[\\%_]/g, "\\$&");

function filteredAudit(filters: AuditFilters) {
  let query = supabase.from("audit_log").select("*", { count: "exact" });
  if (filters.actor.trim())
    query = query.ilike("actor_email", `%${likeEscape(filters.actor.trim())}%`);
  if (filters.action.trim())
    query = query.ilike("action", `%${likeEscape(filters.action.trim())}%`);
  if (filters.from)
    query = query.gte("created_at", `${filters.from}T00:00:00+08:00`);
  if (filters.to)
    query = query.lt("created_at", `${addDays(filters.to, 1)}T00:00:00+08:00`);
  return query.order("created_at", { ascending: false });
}

export async function getAuditLog(
  page: number,
  filters: AuditFilters,
): Promise<{ rows: AuditLogEntry[]; total: number }> {
  const from = (page - 1) * AUDIT_PAGE_SIZE;
  const { data, error, count } = await filteredAudit(filters).range(
    from,
    from + AUDIT_PAGE_SIZE - 1,
  );
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

/** Up to 2000 matching rows for CSV export. */
export async function getAuditLogForExport(
  filters: AuditFilters,
): Promise<AuditLogEntry[]> {
  const { data, error } = await filteredAudit(filters).range(0, 1999);
  if (error) throw error;
  return data ?? [];
}

export async function auditLog(input: {
  action: string;
  targetTable?: string;
  targetId?: string;
  targetDetails?: Json;
}): Promise<void> {
  const { error } = await supabase.rpc("log_staff_action", {
    p_action: input.action,
    p_target_table: input.targetTable,
    p_target_id: input.targetId,
    p_target_details: input.targetDetails,
  });
  if (error) throw error;
}

export async function getInquiryReplies(): Promise<InquiryReply[]> {
  const { data, error } = await supabase
    .from("inquiry_replies")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

/** A guest sees only their own request; an admin sees all of them. */
export async function getDeletionRequests(): Promise<DeletionRequest[]> {
  const { data, error } = await supabase
    .from("account_deletion_requests")
    .select("*");
  if (error) throw error;
  return data;
}

export async function requestAccountDeletion(reason: string): Promise<void> {
  const { error } = await supabase
    .from("account_deletion_requests")
    .insert({ reason: reason.trim() || null });
  if (error) throw error;
}

export async function clearDeletionRequest(guestId: string): Promise<void> {
  const { error } = await supabase
    .from("account_deletion_requests")
    .delete()
    .eq("guest_id", guestId);
  if (error) throw error;
}

export async function getReplyTemplates(): Promise<ReplyTemplate[]> {
  const { data, error } = await supabase
    .from("reply_templates")
    .select("*")
    .order("title");
  if (error) throw error;
  return data;
}

export async function addReplyTemplate(
  title: string,
  body: string,
): Promise<void> {
  const { error } = await supabase
    .from("reply_templates")
    .insert({ title, body });
  if (error) throw error;
}

export async function deleteReplyTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("reply_templates")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function addInquiryReply(
  inquiryId: string,
  staffId: string,
  message: string,
): Promise<void> {
  const { error } = await supabase
    .from("inquiry_replies")
    .insert({ inquiry_id: inquiryId, staff_id: staffId, message });
  if (error) throw error;
}
