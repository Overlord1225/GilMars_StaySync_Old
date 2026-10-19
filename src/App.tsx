import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestLayout } from '@/components/layout/GuestLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RoleRoute } from '@/features/auth/RoleRoute'
const Account = lazy(() => import('@/pages/Account'))
const Availability = lazy(() => import('@/pages/Availability'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const Landing = lazy(() => import('@/pages/Landing'))
const Help = lazy(() => import('@/pages/Help'))
const Login = lazy(() => import('@/pages/Login'))
const MyReservations = lazy(() => import('@/pages/MyReservations'))
const MyInquiries = lazy(() => import('@/pages/MyInquiries'))
const InquiryForm = lazy(() => import('@/pages/InquiryForm'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Register = lazy(() => import('@/pages/Register'))
const ReservationRequest = lazy(() => import('@/pages/ReservationRequest'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const UnitDetails = lazy(() => import('@/pages/UnitDetails'))
const UnitsList = lazy(() => import('@/pages/UnitsList'))
const ComponentsShowcase = lazy(() => import('@/pages/dev/ComponentsShowcase'))
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout').then((module) => ({ default: module.AdminLayout })))
const StaffManagement = lazy(() => import('@/pages/StaffManagement'))

function RouteLoading({ label }: { label: string }) {
  return <main className="flex min-h-64 items-center justify-center px-4 py-12" role="status" aria-live="polite">Loading {label}…</main>
}

function RoutePage({ label, children }: { label: string; children: ReactNode }) {
  return <Suspense fallback={<RouteLoading label={label} />}>{children}</Suspense>
}

const ComingSoon = ({ title }: { title: string }) => (
  <section className="rounded-2xl bg-white p-8 text-center shadow-sm">
    <h1 className="text-2xl font-semibold text-brand">{title}</h1>
    <p className="mt-2 text-slate-600">This section is being prepared.</p>
  </section>
)

export default function App() {
  return (
    <Routes>
      {import.meta.env.DEV && <Route path="/dev/components" element={<RoutePage label="component gallery"><ComponentsShowcase /></RoutePage>} />}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<RoutePage label="home"><Landing /></RoutePage>} />
        <Route path="/login" element={<RoutePage label="sign in"><Login /></RoutePage>} />
        <Route path="/register" element={<RoutePage label="registration"><Register /></RoutePage>} />
        <Route path="/forgot-password" element={<RoutePage label="password reset"><ForgotPassword /></RoutePage>} />
        <Route path="/reset-password" element={<RoutePage label="password reset"><ResetPassword /></RoutePage>} />
        <Route path="/units" element={<RoutePage label="stays"><UnitsList /></RoutePage>} />
        <Route path="/units/:id" element={<RoutePage label="stay details"><UnitDetails /></RoutePage>} />
        <Route path="/availability" element={<RoutePage label="availability"><Availability /></RoutePage>} />
        <Route path="/help" element={<RoutePage label="help"><Help /></RoutePage>} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['guest']} />}>
        <Route element={<GuestLayout />}>
          <Route path="/reservations/request/:id" element={<RoutePage label="reservation request"><ReservationRequest /></RoutePage>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['guest', 'admin', 'super_admin']} />}>
        <Route element={<GuestLayout />}>
          <Route path="/my-bookings" element={<RoutePage label="reservations"><MyReservations /></RoutePage>} />
          <Route path="/reservations/my" element={<Navigate to="/my-bookings" replace />} />
          <Route path="/my-inquiries" element={<RoutePage label="messages"><MyInquiries /></RoutePage>} />
          <Route path="/inquiries/my" element={<Navigate to="/my-inquiries" replace />} />
          <Route path="/inquire" element={<RoutePage label="message form"><InquiryForm /></RoutePage>} />
          <Route path="/account" element={<RoutePage label="account"><Account /></RoutePage>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
        <Route path="/admin" element={<Suspense fallback={<RouteLoading label="admin workspace" />}><AdminLayout /></Suspense>}>
          <Route index element={<ComingSoon title="Admin dashboard" />} />
          <Route path="reservations" element={<ComingSoon title="Reservations" />} />
          <Route path="inquiries" element={<ComingSoon title="Inquiries" />} />
          <Route path="units" element={<ComingSoon title="Manage units" />} />
          <Route path="guests" element={<ComingSoon title="Guests" />} />
          <Route path="staff" element={<RoleRoute role="super_admin"><Suspense fallback={<RouteLoading label="staff management" />}><StaffManagement /></Suspense></RoleRoute>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route path="/super" element={<Navigate to="/admin" replace />} />
        <Route path="/super/accounts" element={<Suspense fallback={<RouteLoading label="staff management" />}><StaffManagement /></Suspense>} />
        <Route path="/super/keywords" element={<ComingSoon title="Inquiry keywords" />} />
        <Route path="/super/booking-rules" element={<ComingSoon title="Booking rules" />} />
        <Route path="/tests/accuracy" element={<ComingSoon title="Accuracy test" />} />
      </Route>

      <Route path="*" element={<RoutePage label="page"><NotFound /></RoutePage>} />
    </Routes>
  )
}
