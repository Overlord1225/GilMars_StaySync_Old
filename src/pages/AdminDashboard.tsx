import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getAllInquiries, getAllUnits, getStaffReservations } from '@/lib/db'
import { todayManila } from '@/lib/dates'
import { formatStayDate } from '@/lib/format'
import type { Inquiry, Reservation, Unit } from '@/lib/types'

export default function AdminDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    Promise.all([getStaffReservations(), getAllInquiries(), getAllUnits()]).then(([bookingRows, inquiryRows, unitRows]) => {
      if (!active) return
      setReservations(bookingRows)
      setInquiries(inquiryRows)
      setUnits(unitRows)
    }).catch(() => { if (active) setError(true) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  if (loading) return <div className="space-y-5"><Skeleton className="h-8 w-64" /><Skeleton className="h-32 w-full rounded-card" /></div>
  if (error) return <EmptyState title="Dashboard data did not load" description="Check your staff access and try again." />

  const today = todayManila()
  const month = today.slice(0, 7)
  const pending = reservations.filter((row) => row.status === 'pending')
  const newInquiries = inquiries.filter((row) => row.status === 'new')
  const todayArrivals = reservations.filter((row) => row.status === 'confirmed' && row.check_in === today).length
  const todayDepartures = reservations.filter((row) => row.status === 'confirmed' && row.check_out === today).length
  const confirmedMonth = reservations.filter((row) => row.status === 'confirmed' && row.check_in.startsWith(month)).length
  const unitNames = new Map(units.map((unit) => [unit.id, unit.name]))
  const attention = [...newInquiries.filter((row) => row.category === 'complaint').map((row) => ({ kind: 'inquiry' as const, row })), ...pending.map((row) => ({ kind: 'reservation' as const, row }))].slice(0, 8)

  return <section className="space-y-6"><PageHeader title="Admin dashboard" description="A quick view of guest requests and the work that needs attention." breadcrumbs={[{ label: 'Admin' }]} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[
      ['Pending reservations', pending.length, '/admin/reservations'],
      ['New inquiries', newInquiries.length, '/admin/inquiries'],
      ["Today's check-ins", todayArrivals, '/admin/reservations'],
      ["Today's check-outs", todayDepartures, '/admin/reservations'],
      ['Confirmed this month', confirmedMonth, '/admin/reservations'],
    ].map(([label, value, href]) => <Link key={label} to={String(href)}><Card className="h-full transition hover:shadow-raised"><p className="text-sm text-text-muted">{label}</p><p className="mt-2 font-heading text-3xl font-bold text-brand">{value}</p></Card></Link>)}</div>
    <Card><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-heading text-xl font-semibold text-brand-dark">Needs attention</h2><p className="text-sm text-text-muted">Complaints first, then pending reservation requests.</p></div><div className="flex gap-2"><Link to="/admin/reservations" className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-brand underline">Reservations</Link><Link to="/admin/inquiries" className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-brand underline">Inquiries</Link></div></div>
      {attention.length === 0 ? <p className="rounded-control bg-cream p-4 text-sm text-text-muted">Nothing needs attention right now.</p> : <ul className="divide-y divide-border">{attention.map(({ kind, row }) => kind === 'reservation' ? <li key={`r-${row.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium text-text">Reservation request · {unitNames.get(row.unit_id) ?? 'Stay'}</p><p className="text-sm text-text-muted">{formatStayDate(row.check_in)} to {formatStayDate(row.check_out)} · submitted {formatStayDate(row.created_at.slice(0, 10))}</p></div><StatusBadge status={row.status} /></li> : <li key={`i-${row.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium text-text">Complaint · {row.subject || 'Guest message'}</p><p className="line-clamp-1 text-sm text-text-muted">{row.message}</p></div><StatusBadge status={row.status} /></li>)}</ul>}
    </Card>
  </section>
}
