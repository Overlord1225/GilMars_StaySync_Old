import { supabase } from '@/lib/supabase'
import { addDays, todayManila } from '@/lib/dates'
import type { Inquiry, InquiryKeyword, Profile, Reservation, Unit } from '@/lib/types'

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
