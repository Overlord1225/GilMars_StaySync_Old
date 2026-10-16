import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getActiveUnits } from '../lib/db'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import type { Unit } from '../lib/types'

export default function UnitsList() {
  const { user } = useAuth()
  const [units, setUnits] = useState<Unit[] | null>(null)

  useEffect(() => {
    let mounted = true
    getActiveUnits()
      .then((data) => {
        if (mounted) setUnits(data)
      })
      .catch((err: unknown) => {
        if (mounted) console.error(err)
      })
    return () => {
      mounted = false
    }
  }, [])

  if (units === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Spinner />
      </div>
    )
  }

  if (units.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <EmptyState
          title="No units available"
          description="There are no active units to browse right now."
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-brand">Available Units</h1>
          {user && (
            <Button variant="outline" onClick={() => {}}>
              {user.role === 'guest' ? 'My Reservations' : 'Admin Dashboard'}
            </Button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <Card key={unit.id} padded={false}>
              <div className="h-48 bg-slate-100 rounded-t-2xl overflow-hidden relative">
                {unit.image_urls && unit.image_urls.length > 0 ? (
                  <img
                    src={unit.image_urls[0]}
                    alt={unit.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    No image
                  </div>
                )}
                <span className="absolute top-4 right-4 bg-brand text-white px-3 py-1 rounded-full text-sm font-medium">
                  ₱{unit.price_per_night.toLocaleString()}/night
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-brand mb-1">{unit.name}</h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                  {unit.description ?? 'No description available.'}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-500">
                    Capacity: {unit.capacity} guest{unit.capacity !== 1 ? 's' : ''}
                  </span>
                  <Link
                    to={`/units/${unit.id}`}
                    className="text-brand font-medium hover:underline text-sm"
                  >
                    View details
                  </Link>
                </div>
                <div className="flex gap-2">
                  {unit.amenities
                    .slice(0, 3)
                    .map((amenity) => (
                      <span key={amenity} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
                        {amenity}
                      </span>
                    ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}