import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestLayout } from '@/components/layout/GuestLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RoleRoute } from '@/features/auth/RoleRoute'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
const Account = lazy(() => import('@/pages/Account'))
const Availability = lazy(() => import('@/pages/Availability'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
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
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout').then((module) => ({ default: module.AdminLayout })))
const StaffManagement = lazy(() => import('@/pages/StaffManagement'))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const AdminReservations = lazy(() => import('@/pages/AdminReservations'))
const AdminInquiries = lazy(() => import('@/pages/AdminInquiries'))
const AdminUnits = lazy(() => import('@/pages/AdminUnits'))
const AdminGuests = lazy(() => import('@/pages/AdminGuests'))
const KeywordManagement = lazy(() => import('@/pages/KeywordManagement'))
const BookingRules = lazy(() => import('@/pages/BookingRules'))
const AccuracyTest = lazy(() => import('@/pages/AccuracyTest'))

function RouteLoading({ label }: { label: string }) {
  return <main className="flex min-h-64 items-center justify-center px-4 py-12" role="status" aria-live="polite">Loading {label}…</main>
}

function RoutePage({ label, children }: { label: string; children: ReactNode }) {
  return <Suspense fallback={<RouteLoading label={label} />}>{children}</Suspense>
}

const appFallback = (
  <div className="flex flex-col items-center justify-center rounded-card border border-danger-200 bg-danger-50 p-6 text-center" role="alert" aria-live="polite">
    <svg aria-hidden="true" className="mb-3 size-8 shrink-0 text-danger-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
    <h2 className="text-lg font-semibold text-danger-800">Application error</h2>
    <p className="mt-2 text-sm text-danger-700">An unexpected error occurred. Refresh the page to continue.</p>
    <button onClick={() => window.location.reload()} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-control bg-brand px-4 text-white hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">Refresh page</button>
  </div>
)

export default function App() {
  return (
    <ErrorBoundary fallback={appFallback}>
      <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<RoutePage label="sign in"><Login /></RoutePage>} />
        <Route path="/login" element={<Navigate to="/" replace />} />
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
          <Route index element={<RoutePage label="dashboard"><AdminDashboard /></RoutePage>} />
          <Route path="reservations" element={<RoutePage label="reservations"><AdminReservations /></RoutePage>} />
          <Route path="inquiries" element={<RoutePage label="inquiries"><AdminInquiries /></RoutePage>} />
          <Route path="units" element={<RoutePage label="stays"><AdminUnits /></RoutePage>} />
          <Route path="guests" element={<RoutePage label="guests"><AdminGuests /></RoutePage>} />
          <Route path="staff" element={<RoleRoute role="super_admin"><Suspense fallback={<RouteLoading label="staff management" />}><StaffManagement /></Suspense></RoleRoute>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route path="/super" element={<Suspense fallback={<RouteLoading label="super-admin workspace" />}><AdminLayout /></Suspense>}>
          <Route index element={<Navigate to="/admin" replace />} />
          <Route path="accounts" element={<RoutePage label="staff management"><StaffManagement /></RoutePage>} />
          <Route path="keywords" element={<RoutePage label="inquiry keywords"><KeywordManagement /></RoutePage>} />
          <Route path="booking-rules" element={<RoutePage label="booking rules"><BookingRules /></RoutePage>} />
        </Route>
        <Route path="/tests" element={<Suspense fallback={<RouteLoading label="evaluation workspace" />}><AdminLayout /></Suspense>}>
          <Route path="accuracy" element={<RoutePage label="accuracy test"><AccuracyTest /></RoutePage>} />
        </Route>
      </Route>

      <Route path="*" element={<RoutePage label="page"><NotFound /></RoutePage>} />
      </Routes>
    </ErrorBoundary>
  )
}
