import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth';
import {
  getUnitById,
  getBookingRules,
  getReservationsByUnit,
  createReservation,
} from '../lib/db'
import { formatDate, addDays, isOverlapping, diffDays, todayManila } from '../lib/dates'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Toast } from '../components/ui/Toast'

export default function ReservationRequest() {
  const { id: unitId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [unit, setUnit] = useState<any | null>(null)
  const [rules, setRules] = useState<any | null>(null)
  const [reservations, setReservations] = useState<any[]>([])
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') ?? '')
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') ?? '')
  const [numGuests, setNumGuests] = useState(searchParams.get('guests') ?? '1')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!unitId || !user) return
    let mounted = true
    setLoading(true)
    Promise.all([getUnitById(unitId), getBookingRules()])
      .then(([u, r]) => {
        if (mounted) {
          setUnit(u)
          setRules(r)
          if (!searchParams.get('check_in')) {
            setCheckIn(addDays(todayManila(), (r as any)?.min_advance_days ?? 1))
          }
          if (!searchParams.get('check_out')) {
            setCheckOut(addDays(todayManila(), ((r as any)?.min_advance_days ?? 1) + 1))
          }
        }
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load unit.')
      })
      .finally(() => { if (mounted) setLoading(false) })

    getReservationsByUnit(unitId)
      .then((data) => { if (mounted) setReservations(data) })
      .catch((err: unknown) => { if (mounted) console.error(err) })

    return () => { mounted = false }
  }, [unitId, user, searchParams])

  const minDate = addDays(todayManila(), rules?.min_advance_days ?? 1)

  function validate(): string | null {
    if (!checkIn || !checkOut) return 'Please select both check-in and check-out dates.'
    if (!numGuests || parseInt(numGuests, 10) < 1) return 'Please enter number of guests.'
    if (checkIn < minDate) return `Check-in must be at least ${rules?.min_advance_days ?? 1} day(s) from today.`
    if (checkOut <= checkIn) return 'Check-out must be after check-in.'
    if (unit && parseInt(numGuests, 10) > unit.capacity) return `Number of guests exceeds unit capacity (${unit.capacity}).`
    const hasOverlap = reservations.some(
      (r) => r.status === 'confirmed' && isOverlapping(r.check_in, r.check_out, checkIn, checkOut)
    )
    if (hasOverlap) return 'The selected dates are already booked. Please choose different dates.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError(null)

    try {
      await createReservation({
        unit_id: unitId!,
        guest_id: user!.id,
        manual_guest_name: null,
        source: 'staysync',
        check_in: checkIn,
        check_out: checkOut,
        num_guests: parseInt(numGuests, 10),
        status: 'pending',
        notes: notes || null,
        deposit_amount: rules?.deposit_amount ?? null,
        payment_method: null,
        payment_reference: null,
        paid_at: null,
        rescheduled_at: null,
        reviewed_by: null,
        reviewed_at: null,
      })
      setToast({ message: 'Reservation request submitted successfully! Awaiting confirmation.', variant: 'success' })
      setCheckIn('')
      setCheckOut('')
      setNumGuests('1')
      setNotes('')
    } catch (err: unknown) {
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Failed to submit reservation.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Spinner />
      </div>
    )
  }

  if (error || !unit || !rules || !user) {
    return (
      <div className="min-h-screen bg-cream">
        <EmptyState
          title="Unable to load"
          description={error || 'Please sign in to request a reservation.'}
          action={
            <Button variant="outline" onClick={() => navigate('/units')}>
              Browse Units
            </Button>
          }
        />
      </div>
    )
  }

  const minDateStr = addDays(todayManila(), rules.min_advance_days)
  const totalNights = diffDays(checkIn, checkOut)
  const totalAmount = totalNights > 0 ? totalNights * unit.price_per_night : 0

  return (
    <div className="min-h-screen bg-cream py-6">
      {toast && (
        <Toast message={toast.message} variant={toast.variant} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md" />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Link to={`/units/${unitId}`} className="text-slate-600 hover:text-brand text-sm">
            ← Back to {unit.name}
          </Link>
        </div>

        <Card>
          <h2 className="text-2xl font-bold text-brand mb-6">Request Reservation</h2>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-brand mb-4">Unit details</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-slate-600"><span className="font-medium">Unit:</span> {unit.name}</p>
                <p className="text-sm text-slate-600"><span className="font-medium">Capacity:</span> {unit.capacity} guest{unit.capacity !== 1 ? 's' : ''}</p>
                <p className="text-sm text-slate-600"><span className="font-medium">Price per night:</span> ₱{unit.price_per_night.toLocaleString()}</p>
                <p className="text-sm text-slate-600"><span className="font-medium">Deposit required:</span> ₱{(rules.deposit_amount ?? 0).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-brand mb-4">Booking rules</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-slate-600"><span className="font-medium">Minimum advance booking:</span> {rules.min_advance_days} day(s)</p>
                <p className="text-sm text-slate-600"><span className="font-medium">Earliest check-in:</span> {formatDate(minDateStr)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Check-in date</label>
              <input
                type="date"
                min={minDateStr}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Check-out date</label>
              <input
                type="date"
                min={addDays(minDateStr, 1)}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Number of guests</label>
                <input
                  type="number"
                  min="1"
                  max={unit.capacity}
                  value={numGuests}
                  onChange={(e) => setNumGuests(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
              {checkIn && checkOut && totalNights > 0 && (
                <div className="flex items-end">
                  <span className="text-sm text-slate-500 mb-1">Estimated total:</span>
                  <span className="ml-2 text-lg font-bold text-brand">₱{totalAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="Any special requests?"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Submitting...' : 'Submit reservation request'}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              Your request will be reviewed by an admin. A StaySync booking is only held once the deposit of ₱{(rules.deposit_amount ?? 0).toLocaleString()} is paid via GCash or bank transfer.
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}