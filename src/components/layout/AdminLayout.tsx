import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { RoleGuide } from '@/components/layout/RoleGuide'

const baseLinks = [
  ['Dashboard', '/admin'],
  ['Reservations', '/admin/reservations'],
  ['Inquiries', '/admin/inquiries'],
  ['Units', '/admin/units'],
  ['Guests', '/admin/guests'],
] as const

export function AdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const isSuper = user?.role === 'super_admin'
  const links = isSuper ? [...baseLinks, ['Staff', '/admin/staff'] as const, ['Keywords', '/super/keywords'] as const, ['Booking rules', '/super/booking-rules'] as const] : baseLinks
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2.5 font-medium ${isActive ? 'bg-brand/10 text-brand' : 'text-slate-700 hover:bg-slate-100'}`
  const navItems = <>
    {links.map(([label, to]) => <NavLink key={to} to={to} end={to === '/admin'} className={navClass}>{label}</NavLink>)}
    {isSuper && <NavLink to="/super/accounts" className={navClass}>Admin accounts</NavLink>}
    <NavLink to="/account" className={navClass}>My account</NavLink>
    <NavLink to="/help" className={navClass}>Help</NavLink>
  </>

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-cream">
      <a href="#admin-content" className="sr-only z-50 rounded bg-white p-3 text-brand focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:ring-2 focus:ring-brand">Skip to content</a>
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-black/5 bg-white px-4 py-2 lg:hidden">
        <Link to="/admin" className="font-bold text-brand">StaySync Admin</Link>
        <div className="flex items-center gap-3">
          <details className="relative">
            <summary className="min-h-11 cursor-pointer rounded-lg px-3 py-2 font-medium text-brand focus:outline-none focus:ring-2 focus:ring-brand">Menu</summary>
            <nav aria-label="Admin navigation" className="absolute right-0 top-12 z-30 flex min-w-56 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">{navItems}</nav>
          </details>
          <Button variant="outline" onClick={() => void handleSignOut()}>Sign out</Button>
        </div>
      </header>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-black/5 bg-white p-4 lg:block">
          <Link to="/admin" className="mb-6 block px-3 py-3 text-lg font-bold text-brand">StaySync Admin</Link>
          <nav aria-label="Admin navigation" className="sticky top-5 flex flex-col gap-1">{navItems}
            <Button variant="outline" className="mt-4" onClick={() => void handleSignOut()}>Sign out</Button>
          </nav>
        </aside>
        <main id="admin-content" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8"><RoleGuide audience={isSuper ? 'super_admin' : 'admin'} /><Outlet /></main>
      </div>
    </div>
  )
}
