import { addDays } from './dates'

export type CalendarMonthRow = {
  id: string
  unit_id: string
  check_in: string
  check_out: string
  num_guests: number
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
  source: 'staysync' | 'airbnb'
  guest_id: string | null
  guest_display_name: string
  manual_guest_name: string | null
  notes: string | null
  deposit_amount: number | null
  payment_method: string | null
  payment_reference: string | null
  paid_at: string | null
}

export type CalendarReservation = {
  id: string
  unitId: string
  checkIn: string
  checkOut: string
  numGuests: number
  status: 'pending' | 'confirmed' | 'completed'
  source: 'staysync' | 'airbnb'
  guestId: string | null
  guestDisplayName: string
  manualGuestName: string | null
  notes: string | null
  depositAmount: number | null
  paymentMethod: string | null
  paymentReference: string | null
  paidAt: string | null
}

export type CalendarDay = {
  date: string
  day: number
  monthOffset: -1 | 0 | 1
  occupied: boolean
  reservations: CalendarReservation[]
  checkIns: CalendarReservation[]
  checkOuts: CalendarReservation[]
  backToBack: boolean
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(
    new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`),
  )
}

export function monthLabelShort(year: number, month: number): string {
  return new Intl.DateTimeFormat('en-PH', { month: 'short', year: 'numeric' }).format(
    new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`),
  )
}

export function longDate(date: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function addMonths(date: string, months: number): string {
  const [yearPart, monthPart] = date.split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)
  const result = new Date(Date.UTC(year, month - 1 + months, 1))
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-01`
}

/**
 * Monday = 0 ... Sunday = 6.
 */
export function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7
}

/**
 * All dates to render for the month grid, Monday-first, including leading
 * days from the previous month and trailing days from the next month.
 */
export function monthGrid(year: number, month: number): string[] {
  const first = `${year}-${String(month).padStart(2, '0')}-01`
  const lead = weekdayIndex(first)
  const total = lead + daysInMonth(year, month)
  const trail = (7 - (total % 7)) % 7
  const grid: string[] = []
  let date = addDays(first, -lead)
  for (let i = 0; i < total + trail; i++) {
    grid.push(date)
    date = addDays(date, 1)
  }
  return grid
}

export function mapCalendarRow(row: CalendarMonthRow): CalendarReservation {
  return {
    id: row.id,
    unitId: row.unit_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    numGuests: row.num_guests,
    status: row.status as CalendarReservation['status'],
    source: row.source,
    guestId: row.guest_id,
    guestDisplayName: row.guest_display_name ?? row.manual_guest_name ?? 'Guest',
    manualGuestName: row.manual_guest_name,
    notes: row.notes,
    depositAmount: row.deposit_amount,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    paidAt: row.paid_at,
  }
}

export function buildCalendarDays(
  year: number,
  month: number,
  rows: CalendarMonthRow[],
): CalendarDay[] {
  const grid = monthGrid(year, month)
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = addMonths(monthStart, 1)
  const reservations = rows
    .filter((row) => row.status !== 'rejected' && row.status !== 'cancelled')
    .map(mapCalendarRow)

  return grid.map((date) => {
    const occupying = reservations.filter(
      (reservation) => reservation.checkIn <= date && date < reservation.checkOut,
    )
    const checkIns = reservations.filter((reservation) => reservation.checkIn === date)
    const checkOuts = reservations.filter((reservation) => reservation.checkOut === date)
    return {
      date,
      day: Number(date.slice(8, 10)),
      monthOffset: date < monthStart ? -1 : date >= monthEnd ? 1 : 0,
      occupied: occupying.length > 0,
      reservations: occupying,
      checkIns,
      checkOuts,
      backToBack: checkIns.length > 0 && checkOuts.length > 0,
    }
  })
}
