import { supabase } from './supabase'
import type { Unit, Reservation, Inquiry, Profile, InquiryKeyword } from './types'

export async function getActiveUnits(): Promise<Unit[]> {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data as Unit[]
}

export async function getUnitById(id: string): Promise<Unit | null> {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Unit | null
}

export async function getBlockedDateRanges(unitId: string): Promise<{ check_in: string; check_out: string }[]> {
  const { data, error } = await supabase.rpc('get_blocked_date_ranges', { unit_id: unitId })

  if (error) throw error
  return data as { check_in: string; check_out: string }[]
}

export async function createReservation(reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('reservations')
    .insert(reservation)
    .select()
    .single()

  if (error) throw error
  return data as Reservation
}

export async function getReservationsByUnit(unitId: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('unit_id', unitId)
    .order('check_in', { ascending: true })

  if (error) throw error
  return data as Reservation[]
}

export async function getReservationsByGuest(guestId: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Reservation[]
}

export async function createInquiry(inquiry: Omit<Inquiry, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('inquiries')
    .insert(inquiry)
    .select()
    .single()

  if (error) throw error
  return data as Inquiry
}

export async function getInquiriesByGuest(guestId: string): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Inquiry[]
}

export async function getActiveKeywords(): Promise<InquiryKeyword[]> {
  const { data, error } = await supabase
    .from('inquiry_keywords')
    .select('*')
    .eq('is_active', true)

  if (error) throw error
  return data as InquiryKeyword[]
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Profile | null
}

export async function getBookingRules() {
  const { data, error } = await supabase
    .from('booking_rules')
    .select('*')
    .eq('id', true)
    .single()

  if (error) throw error
  return data
}

export async function cancelReservation(id: string) {
  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Reservation
}