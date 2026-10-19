import { useEffect, useState } from 'react'
import { getActiveUnits, getBookingRules, getBlockedDateRanges } from '../lib/db'
import { supabase } from '../lib/supabase'
import { todayManila, addDays, formatDate } from '../lib/dates'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'

export default function Availability() {
  const [units, setUnits] = useState<any[] | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [blockedRanges, setBlockedRanges] = useState<{ check_in: string; check_out: string }[]>([])
  const [minDate, setMinDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const [unitsData, rulesData] = await Promise.all([
          getActiveUnits(),
          getBookingRules(),
        ])
        if (!mounted) return
        setUnits(unitsData)
        const minAdvance = (rulesData as any)?.min_advance_days ?? 1
        setMinDate(addDays(todayManila(), minAdvance))
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load units.')
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  async function checkAvailability() {
    if (!selectedUnit || !checkIn || !checkOut) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: rpcError } = await (supabase as any).rpc('check_availability', {
        p_unit_id: selectedUnit,
        p_check_in: checkIn,
        p_check_out: checkOut,
      })
      if (rpcError) throw rpcError
      setAvailable(!!data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to check availability.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedUnit) return
    let mounted = true
    getBlockedDateRanges(selectedUnit)
      .then((data) => { if (mounted) setBlockedRanges(data) })
      .catch(() => { /* blocked ranges are optional */ })
    return () => { mounted = false }
  }, [selectedUnit])

  if (units === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Spinner />
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-brand">Check Availability</h1>
          <a href="/units" className="text-slate-600 hover:text-brand text-sm">
            ← Back to units
          </a>
        </div>

        <Card>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select unit</label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              >
                <option value="">Choose a unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — ₱{u.price_per_night.toLocaleString()}/night
                  </option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Check-in date</label>
                <input
                  type="date"
                  min={minDate}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Check-out date</label>
                <input
                  type="date"
                  min={checkIn ? addDays(checkIn, 1) : minDate}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
            </div>

            {minDate && (
              <p className="text-xs text-slate-500">
                Earliest check-in: {formatDate(minDate)} (advance booking required)
              </p>
            )}

            <div className="pt-4">
              <Button
                onClick={checkAvailability}
                disabled={loading || !selectedUnit || !checkIn || !checkOut}
                className="w-auto"
              >
                {loading ? 'Checking...' : 'Check availability'}
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {available !== null && selectedUnit && checkIn && checkOut && (
              <div className={`p-4 rounded-lg border flex items-center gap-3 ${available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {available ? (
                  <>
                    <span className="text-green-700 font-semibold">✓ Available</span>
                    <span className="text-slate-600 text-sm">
                      {formatDate(checkIn)} to {formatDate(checkOut)} is open for booking.
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-red-700 font-semibold">✗ Not available</span>
                    <span className="text-slate-600 text-sm">
                      The selected dates overlap with existing bookings.
                    </span>
                  </>
                )}
              </div>
            )}

            {blockedRanges.length > 0 && available === false && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Blocked date ranges:</h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  {blockedRanges.map((r, i) => (
                    <li key={i}>{formatDate(r.check_in)} to {formatDate(r.check_out)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}