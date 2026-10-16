import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getReservationsByGuest, cancelReservation } from '../lib/db'
import { formatDate } from '../lib/date'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'

export default function MyReservations() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let mounted = true
    setLoading(true)
    getReservationsByGuest(user.id)
      .then((data) => { if (mounted) setReservations(data) })
      .catch((err: unknown) => { if (mounted) setError(err instanceof Error ? err.message : 'Failed to load reservations.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [user])

  async function handleCancel(id: string) {
    if (!window.confirm('Cancel this reservation? This cannot be undone.')) return
    try {
      await cancelReservation(id)
      setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: 'cancelled' as const } : r))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel reservation.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream">
        <EmptyState
          title="Unable to load"
          description={error}
          action={<Button variant="outline" onClick={() => navigate('/units')}>Browse Units</Button>}
        />
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <EmptyState
          title="No reservations yet"
          description="You haven't made any reservation requests. Browse units and submit a request."
          action={
            <Button variant="outline" onClick={() => navigate('/units')}>
              Browse Units
            </Button>
          }
        />
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border border-amber-200',
    confirmed: 'bg-brand/10 text-brand border border-brand/20',
    rejected: 'bg-red-100 text-red-700 border border-red-200',
    cancelled: 'bg-slate-100 text-slate-700 border border-slate-200',
    completed: 'bg-green-100 text-green-700 border border-green-200',
  }

  return (
    <div className="min-h-screen bg-cream py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-brand mb-6">My Reservations</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservations.map((r) => (
            <Card key={r.id} padded={false}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-brand">{r.unit_name || 'Unit'}</h3>
                  <Badge variant="default" className={statusColors[r.status]}>
                    {r.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  {formatDate(r.check_in)} to {formatDate(r.check_out)} • {r.num_guests} guest{r.num_guests !== 1 ? 's' : ''}
                </p>
                {r.deposit_amount && (
                  <p className="text-sm text-slate-600 mb-4"><span className="font-medium">Deposit:</span> ₱{r.deposit_amount.toLocaleString()}</p>
                )}
                {r.notes && (
                  <p className="text-sm text-slate-600 mb-4"><span className="font-medium">Notes:</span> {r.notes}</p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate(`/units/${r.unit_id}`)}>
                    View unit
                  </Button>
                  {r.status === 'pending' && (
                    <Button variant="danger" onClick={() => handleCancel(r.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}