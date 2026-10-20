import { supabase } from '@/lib/supabase'
import { addDays, todayManila } from '@/lib/dates'
import type { BookingRule, Inquiry, InquiryKeyword, Profile, Reservation, Unit } from '@/lib/types'

export async function getActiveUnits(): Promise<Unit[]> {
  const { data, error } = await supabase.from('units').select('*').eq('is_active', true).order('name')
  if (error) throw error
  return data
}

export async function getUnitById(id: string): Promise<Unit | null> {
  const { data, error } = await supabase.from('units').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function getBlockedDateRanges(unitId: string): Promise<{ check_in: string; check_out: string }[]> {
  const from = todayManila()
  const through = addDays(from, 730)
  const { data, error } = await supabase.rpc('get_booked_ranges', {
    p_unit_id: unitId,
    p_from: from,
    p_to: through,
  })
  if (error) throw error
  return data
}

export async function checkAvailability(unitId: string, checkIn: string, checkOut: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_availability', {
    p_unit_id: unitId,
    p_check_in: checkIn,
    p_check_out: checkOut,
  })
  if (error) throw error
  return data
}

export async function createReservationRequest(input: {
  unitId: string
  checkIn: string
  checkOut: string
  numGuests: number
  notes: string | null
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_reservation_request', {
    p_unit_id: input.unitId,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_num_guests: input.numGuests,
    p_notes: input.notes ?? undefined,
  })
  if (error) throw error
  return data
}

export async function getReservationsByGuest(guestId: string): Promise<Reservation[]> {
  const { data, error } = await supabase.from('reservations').select('*').eq('guest_id', guestId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function cancelReservation(id: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_reservation', { p_reservation_id: id })
  if (error) throw error
}

export async function createInquiry(inquiry: Omit<Inquiry, 'id' | 'created_at' | 'updated_at'>): Promise<Inquiry> {
  const { data, error } = await supabase.from('inquiries').insert(inquiry).select().single()
  if (error) throw error
  return data
}

export async function getInquiriesByGuest(guestId: string): Promise<Inquiry[]> {
  const { data, error } = await supabase.from('inquiries').select('*').eq('guest_id', guestId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getActiveKeywords(): Promise<InquiryKeyword[]> {
  const { data, error } = await supabase.from('inquiry_keywords').select('*').eq('is_active', true)
  if (error) throw error
  return data
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function getBookingRules() {
  const { data, error } = await supabase.from('booking_rules').select('*').eq('id', true).single()
  if (error) throw error
  return data
}

export async function getStaffReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('check_in', { ascending: true })
  if (error) throw error
  return data
}

export async function recordReservationDeposit(input: {
  reservationId: string
  method: 'GCash' | 'Bank transfer'
  reference: string
  amount: number
}): Promise<void> {
  const { error } = await supabase.rpc('record_deposit', {
    p_reservation_id: input.reservationId,
    p_method: input.method,
    p_reference: input.reference,
    p_amount: input.amount,
  })
  if (error) throw error
}

export async function submitDepositReference(input: {
  reservationId: string
  method: 'GCash' | 'Bank transfer'
  reference: string
}): Promise<void> {
  const { error } = await supabase.rpc('submit_deposit_reference', {
    p_reservation_id: input.reservationId,
    p_method: input.method,
    p_reference: input.reference,
  })
  if (error) throw error
}

export async function confirmReservation(id: string): Promise<void> {
  const { error } = await supabase.rpc('confirm_reservation', { p_reservation_id: id })
  if (error) throw error
}

export async function rejectReservation(id: string, note: string): Promise<void> {
  const { error } = await supabase.rpc('reject_reservation', {
    p_reservation_id: id,
    p_note: note || undefined,
  })
  if (error) throw error
}

export async function addAirbnbReservation(input: {
  unitId: string
  guestName: string
  checkIn: string
  checkOut: string
  guests: number
  notes: string | null
}): Promise<void> {
  const { error } = await supabase.rpc('add_airbnb_booking', {
    p_unit_id: input.unitId,
    p_guest_name: input.guestName,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_num_guests: input.guests,
    p_notes: input.notes ?? undefined,
  })
  if (error) throw error
}

export async function rescheduleReservation(input: {
  reservationId: string
  checkIn: string
  checkOut: string
  unitId: string
  reason: string
}): Promise<void> {
  const { error } = await supabase.rpc('reschedule_reservation', {
    p_reservation_id: input.reservationId,
    p_new_check_in: input.checkIn,
    p_new_check_out: input.checkOut,
    p_new_unit_id: input.unitId,
    p_reason: input.reason,
  })
  if (error) throw error
}

export async function updateReservationStatus(id: string, status: 'cancelled' | 'completed'): Promise<void> {
  const { error } = await supabase.rpc('staff_update_reservation_status', {
    p_reservation_id: id,
    p_status: status,
  })
  if (error) throw error
}

export async function getAllInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateInquiry(
  id: string,
  updates: Pick<Inquiry, 'category' | 'status'>,
): Promise<void> {
  const { error } = await supabase.from('inquiries').update(updates).eq('id', id)
  if (error) throw error
}

export async function getAllKeywords(): Promise<InquiryKeyword[]> {
  const { data, error } = await supabase.from('inquiry_keywords').select('*').order('category').order('keyword')
  if (error) throw error
  return data
}

export async function saveKeyword(keyword: Omit<InquiryKeyword, 'id' | 'created_at'> & { id?: string }): Promise<void> {
  const { error } = keyword.id
    ? await supabase.from('inquiry_keywords').update(keyword).eq('id', keyword.id)
    : await supabase.from('inquiry_keywords').insert(keyword)
  if (error) throw error
}

export async function getTestInquiries() {
  const { data, error } = await supabase.from('test_inquiries').select('*').order('created_at')
  if (error) throw error
  return data
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('full_name')
  if (error) throw error
  return data
}

export async function getAllUnits(): Promise<Unit[]> {
  const { data, error } = await supabase.from('units').select('*').order('name')
  if (error) throw error
  return data
}

export async function saveUnit(unit: Omit<Unit, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<void> {
  const { error } = unit.id
    ? await supabase.from('units').update(unit).eq('id', unit.id)
    : await supabase.from('units').insert(unit)
  if (error) throw error
}

export async function saveBookingRules(input: Pick<BookingRule, 'min_advance_days' | 'deposit_amount'>): Promise<void> {
  const { error } = await supabase.from('booking_rules').update(input).eq('id', true)
  if (error) throw error
}
