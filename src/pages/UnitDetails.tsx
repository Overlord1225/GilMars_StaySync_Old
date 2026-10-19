import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getUnitById, getBlockedDateRanges, getBookingRules } from '../lib/db'
import { supabase } from '../lib/supabase'
import { todayManila, addDays } from '../lib/dates'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import type { Unit } from '../lib/types'

export default function UnitDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [unit, setUnit] = useState<Unit | null>(null)
  const [blocked, setBlocked] = useState<{ check_in: string; check_out: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [minDate, setMinDate] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let mounted = true
    setLoading(true)
    Promise.all([
      getUnitById(id),
      getBlockedDateRanges(id),
      getBookingRules(),
    ])
      .then(([u, b, rules]) => {
        if (mounted) {
          setUnit(u)
          setBlocked(b)
          const minAdvance = (rules as any)?.min_advance_days ?? 1
          setMinDate(addDays(todayManila(), minAdvance))
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load unit.')
          setLoading(false)
        }
      })
    return () => { mounted = false }
  }, [id])

  async function handleCheckAvailability() {
    if (!id || !checkIn || !checkOut) return
    setChecking(true)
    setCheckError(null)
    setAvailable(null)
    try {
      const { data, error: rpcError } = await (supabase as any).rpc('check_availability', {
        p_unit_id: id,
        p_check_in: checkIn,
        p_check_out: checkOut,
      })
      if (rpcError) throw rpcError
      setAvailable(!!data)
    } catch (err: unknown) {
      setCheckError(err instanceof Error ? err.message : 'Failed to check availability.')
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Spinner />
      </div>
    )
  }

  if (error || !unit) {
    return (
      <div className="min-h-screen bg-cream">
        <EmptyState
          title="Unit not found"
          description={error || 'The unit you are looking for does not exist.'}
          action={
            <Button variant="outline" onClick={() => navigate('/units')}>
              Browse Units
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/units" className="text-slate-600 hover:text-brand text-sm mb-4 inline-block">
          ← Back to units
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card padded={false}>
            <div className="h-64 bg-slate-100 rounded-2xl overflow-hidden relative">
              {unit.image_urls && unit.image_urls.length > 0 ? (
                <img
                  src={unit.image_urls[0]}
                  alt={unit.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  No image available
                </div>
              )}
              <span className="absolute top-4 right-4 bg-brand text-white px-3 py-1.5 rounded-full text-sm font-medium">
                ₱{unit.price_per_night.toLocaleString()}/night
              </span>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                {unit.amenities.map((amenity) => (
                  <span key={amenity} className="text-xs bg-brand/10 text-brand border border-brand/20 px-2.5 py-1 rounded-md">
                    {amenity}
                  </span>
                ))}
              </div>
              <h2 className="text-2xl font-bold text-brand mb-2">{unit.name}</h2>
              <p className="text-slate-600 mb-6">
                {unit.description ?? 'No description available.'}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-black/5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Capacity</p>
                  <p className="text-lg font-semibold text-slate-900">{unit.capacity} guest{unit.capacity !== 1 ? 's' : ''}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-black/5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Price per night</p>
                  <p className="text-lg font-semibold text-brand">₱{unit.price_per_night.toLocaleString()}</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Blocked dates</p>
                {blocked.length === 0 ? (
                  <p className="text-sm text-slate-600">No blocked date ranges.</p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-600">
                    {blocked.map((range, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-amber-600">●</span>
                        {range.check_in} to {range.check_out}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold text-brand mb-6">Check availability</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Check-in date</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => { setCheckIn(e.target.value); setAvailable(null) }}
                  min={minDate}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Check-out date</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => { setCheckOut(e.target.value); setAvailable(null) }}
                  min={checkIn || minDate}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Number of guests</label>
                <input
                  type="number"
                  min="1"
                  max={unit.capacity}
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
              <Button
                className="w-full"
                disabled={!unit.is_active || !checkIn || !checkOut || checking}
                onClick={handleCheckAvailability}
              >
                {checking ? 'Checking…' : 'Check availability'}
              </Button>

              {checkError && (
                <p className="text-sm text-red-600">{checkError}</p>
              )}

              {available === true && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Available for {checkIn} → {checkOut}.
                </div>
              )}

              {available === false && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Not available for the selected dates. Please try different dates.
                </div>
              )}

              {available === true && (
                <Link
                  to={`/reservations/request/${unit.id}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`}
                  className="block"
                >
                  <Button className="w-full">Request this reservation</Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}