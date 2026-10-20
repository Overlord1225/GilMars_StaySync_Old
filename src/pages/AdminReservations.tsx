import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/useToast'
import { addAirbnbReservation, confirmReservation, getAllProfiles, getAllUnits, getStaffReservations, recordReservationDeposit, rejectReservation, rescheduleReservation, updateReservationStatus } from '@/lib/db'
import { formatCurrency, formatStayDate } from '@/lib/format'
import type { Profile, Reservation, Unit } from '@/lib/types'

type FilterStatus = 'all' | Reservation['status']

function friendlyReservationError(error: unknown): string {
  const detail = typeof error === 'object' && error !== null ? error as { code?: unknown; message?: unknown } : {}
  if (detail.code === '23P01' || String(detail.message ?? '').includes('overlap')) return 'These dates were just taken by another confirmed booking.'
  if (String(detail.message ?? '').includes('Paid date')) return 'Record the deposit payment and reference before confirming this StaySync request.'
  return 'The reservation could not be updated. Check the details and try again.'
}

export default function AdminReservations() {
  const { showToast } = useToast()
  const [rows, setRows] = useState<Reservation[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<FilterStatus>('all')
  const [unitFilter, setUnitFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState({ unitId: '', guestName: '', checkIn: '', checkOut: '', guests: '1', notes: '' })
  const [payment, setPayment] = useState<Record<string, { method: 'GCash' | 'Bank transfer'; reference: string }>>({})
  const [reschedule, setReschedule] = useState<Record<string, { checkIn: string; checkOut: string; reason: string }>>({})

  const load = useCallback(async () => {
    try {
      const [reservations, unitRows, profileRows] = await Promise.all([getStaffReservations(), getAllUnits(), getAllProfiles()])
      setError('')
      setRows(reservations)
      setUnits(unitRows)
      setProfiles(profileRows)
      setManual((value) => ({ ...value, unitId: value.unitId || unitRows[0]?.id || '' }))
    } catch {
      setError('We could not load reservation records. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void Promise.resolve().then(load) }, [load, refresh])

  const unitNames = useMemo(() => new Map(units.map((unit) => [unit.id, unit.name])), [units])
  const guestNames = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile.full_name || profile.email])), [profiles])
  const filtered = rows.filter((row) => (status === 'all' || row.status === status)
    && (unitFilter === 'all' || row.unit_id === unitFilter)
    && (sourceFilter === 'all' || row.source === sourceFilter)
    && (!dateFrom || row.check_out > dateFrom)
    && (!dateTo || row.check_in < dateTo))

  async function runAction(id: string, action: () => Promise<void>, success: string) {
    setBusyId(id)
    try {
      await action()
      showToast(success, 'success')
      setRefresh((value) => value + 1)
    } catch (cause) {
      showToast(friendlyReservationError(cause), 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function savePayment(row: Reservation) {
    const value = payment[row.id]
    if (!value?.reference.trim()) return
    await runAction(row.id, () => recordReservationDeposit({
      reservationId: row.id,
      method: value.method,
      reference: value.reference.trim(),
      amount: row.deposit_amount ?? 1500,
    }), 'Deposit payment recorded.')
  }

  async function addManualBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!manual.unitId || !manual.guestName.trim()) return
    setBusyId('manual')
    try {
      await addAirbnbReservation({
        unitId: manual.unitId,
        guestName: manual.guestName.trim(),
        checkIn: manual.checkIn,
        checkOut: manual.checkOut,
        guests: Number(manual.guests),
        notes: manual.notes.trim() || null,
      })
      setManualOpen(false)
      setManual((value) => ({ ...value, guestName: '', checkIn: '', checkOut: '', notes: '' }))
      showToast('Airbnb booking added.', 'success')
      setRefresh((value) => value + 1)
    } catch (cause) {
      showToast(friendlyReservationError(cause), 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function saveReschedule(row: Reservation) {
    const value = reschedule[row.id]
    if (!value?.checkIn || !value.checkOut || !value.reason.trim()) return
    await runAction(row.id, () => rescheduleReservation({
      reservationId: row.id,
      checkIn: value.checkIn,
      checkOut: value.checkOut,
      unitId: row.unit_id,
      reason: value.reason.trim(),
    }), 'Emergency reschedule saved.')
    setReschedule((old) => { const next = { ...old }; delete next[row.id]; return next })
  }

  if (loading) return <div className="space-y-5"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full rounded-card" /><Skeleton className="h-48 w-full rounded-card" /></div>
  if (error) return <EmptyState title="Reservations did not load" description={error} action={<Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Try again</Button>} />

  return <section className="space-y-6">
    <PageHeader title="Reservations" description="Review StaySync requests and manage confirmed stays." breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Reservations' }]} actions={<Button variant="outline" onClick={() => setManualOpen((value) => !value)}>{manualOpen ? 'Close form' : 'Add Airbnb booking'}</Button>} />
    {manualOpen && <Card><form onSubmit={(event) => void addManualBooking(event)} className="grid gap-4 sm:grid-cols-2">
      <Select id="manual-unit" label="Stay" value={manual.unitId} onChange={(event) => setManual({ ...manual, unitId: event.target.value })}>{units.map((unit) => <option value={unit.id} key={unit.id}>{unit.name}</option>)}</Select>
      <Input id="manual-name" label="Guest name" required value={manual.guestName} onChange={(event) => setManual({ ...manual, guestName: event.target.value })} />
      <Input id="manual-checkin" label="Check-in" type="date" required value={manual.checkIn} onChange={(event) => setManual({ ...manual, checkIn: event.target.value })} />
      <Input id="manual-checkout" label="Check-out" type="date" required min={manual.checkIn || undefined} value={manual.checkOut} onChange={(event) => setManual({ ...manual, checkOut: event.target.value })} />
      <Input id="manual-guests" label="Guests" type="number" min="1" required value={manual.guests} onChange={(event) => setManual({ ...manual, guests: event.target.value })} />
      <Textarea id="manual-notes" label="Notes" value={manual.notes} onChange={(event) => setManual({ ...manual, notes: event.target.value })} />
      <div className="sm:col-span-2"><Button type="submit" loading={busyId === 'manual'}>Save Airbnb booking</Button></div>
    </form></Card>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Select id="filter-status" label="Status" value={status} onChange={(event) => setStatus(event.target.value as FilterStatus)}><option value="all">All statuses</option>{['pending', 'confirmed', 'rejected', 'cancelled', 'completed'].map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</Select>
      <Select id="filter-unit" label="Stay" value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)}><option value="all">All stays</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</Select>
      <Select id="filter-source" label="Source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="all">All sources</option><option value="staysync">StaySync</option><option value="airbnb">Airbnb</option></Select>
      <Input id="filter-from" label="Overlapping from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
      <Input id="filter-to" label="Before" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
    </div>
    {filtered.length === 0 ? <EmptyState title="No reservations match" description="Try another filter. New guest requests will appear here." /> : <div className="space-y-4">{filtered.map((row) => {
      const guest = row.guest_id ? guestNames.get(row.guest_id) ?? 'Guest' : row.manual_guest_name ?? 'Airbnb guest'
      const paymentValue = payment[row.id] ?? { method: row.payment_method === 'Bank transfer' ? 'Bank transfer' as const : 'GCash' as const, reference: row.payment_reference ?? '' }
      const nextReschedule = reschedule[row.id] ?? { checkIn: row.check_in, checkOut: row.check_out, reason: '' }
      return <Card key={row.id} className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-brand-dark">{guest}</h2><p className="text-sm text-text-muted">{unitNames.get(row.unit_id) ?? 'Stay'} · {row.source === 'airbnb' ? 'Airbnb' : 'StaySync'}</p><p className="mt-1 text-sm">{formatStayDate(row.check_in)} → {formatStayDate(row.check_out)} · {row.num_guests} guests</p></div><StatusBadge status={row.status} /></div>
        {row.notes && <p className="rounded-control bg-cream p-3 text-sm text-text">{row.notes}</p>}
        {row.source === 'staysync' && row.status === 'pending' && <div className="grid gap-3 rounded-control border border-border p-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end"><Select id={`method-${row.id}`} label="Payment method" value={paymentValue.method} onChange={(event) => setPayment({ ...payment, [row.id]: { ...paymentValue, method: event.target.value as 'GCash' | 'Bank transfer' } })}><option>GCash</option><option>Bank transfer</option></Select><Input id={`reference-${row.id}`} label={`Payment reference (${formatCurrency(row.deposit_amount ?? 1500)})`} value={paymentValue.reference} onChange={(event) => setPayment({ ...payment, [row.id]: { ...paymentValue, reference: event.target.value } })} /><Button variant="outline" disabled={!paymentValue.reference.trim() || busyId === row.id} loading={busyId === row.id} onClick={() => void savePayment(row)}>Record payment</Button></div>}
        <div className="flex flex-wrap gap-2">{row.status === 'pending' && <><Button disabled={busyId === row.id || (row.source === 'staysync' && !row.paid_at)} loading={busyId === row.id} title={row.source === 'staysync' && !row.paid_at ? 'Record verified deposit payment before confirming.' : undefined} onClick={() => void runAction(row.id, () => confirmReservation(row.id), 'Reservation confirmed.')}>Confirm</Button><Button variant="danger" disabled={busyId === row.id} onClick={() => { const note = window.prompt('Optional note for the rejection') ?? ''; void runAction(row.id, () => rejectReservation(row.id, note), 'Reservation rejected.') }}>Reject</Button></>}{row.status === 'confirmed' && <><Button variant="outline" disabled={busyId === row.id} onClick={() => void runAction(row.id, () => updateReservationStatus(row.id, 'completed'), 'Stay marked complete.')}>Mark completed</Button><Button variant="danger" disabled={busyId === row.id} onClick={() => { if (window.confirm('Cancel this confirmed stay?')) void runAction(row.id, () => updateReservationStatus(row.id, 'cancelled'), 'Reservation cancelled.') }}>Cancel stay</Button></>}</div>
        {row.status === 'confirmed' && <details className="rounded-control border border-border p-3"><summary className="min-h-11 cursor-pointer py-2 font-medium text-brand">Emergency reschedule</summary><p className="mb-3 text-sm text-text-muted">For emergencies such as floods or heavy rain. Add the reason to the record.</p><div className="grid gap-3 sm:grid-cols-3"><Input id={`new-in-${row.id}`} label="New check-in" type="date" value={nextReschedule.checkIn} onChange={(event) => setReschedule({ ...reschedule, [row.id]: { ...nextReschedule, checkIn: event.target.value } })} /><Input id={`new-out-${row.id}`} label="New check-out" type="date" value={nextReschedule.checkOut} onChange={(event) => setReschedule({ ...reschedule, [row.id]: { ...nextReschedule, checkOut: event.target.value } })} /><Input id={`reason-${row.id}`} label="Reason" value={nextReschedule.reason} onChange={(event) => setReschedule({ ...reschedule, [row.id]: { ...nextReschedule, reason: event.target.value } })} /></div><Button className="mt-3" disabled={!nextReschedule.reason.trim() || busyId === row.id} onClick={() => void saveReschedule(row)}>Save reschedule</Button></details>}
      </Card>
    })}</div>}
  </section>
}
