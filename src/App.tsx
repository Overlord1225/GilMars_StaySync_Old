import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout } from './components/layout/PublicLayout'
import { GuestLayout } from './components/layout/GuestLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import UnitsList from './pages/UnitsList'
import UnitDetails from './pages/UnitDetails'
import Availability from './pages/Availability'
import ReservationRequest from './pages/ReservationRequest'
import MyReservations from './pages/MyReservations'
import { useAuth } from './contexts/AuthContext'

// Placeholder pages (to be implemented in later modules)
const ComingSoon = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-cream">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-brand mb-2">{title}</h2>
      <p className="text-slate-500">Coming soon in the next module.</p>
    </div>
  </div>
)
const InquiryForm = () => <ComingSoon title="Inquiry Form" />
const MyInquiries = () => <ComingSoon title="My Inquiries" />
const AdminReservations = () => <ComingSoon title="Admin Reservations" />
const AdminInquiries = () => <ComingSoon title="Admin Inquiries" />
const AdminUnits = () => <ComingSoon title="Manage Units" />
const AdminGuests = () => <ComingSoon title="Manage Guests" />
const AdminAccounts = () => <ComingSoon title="Admin Accounts" />
const AdminKeywords = () => <ComingSoon title="Inquiry Keywords" />
const AdminBookingRules = () => <ComingSoon title="Booking Rules" />
const AccuracyTest = () => <ComingSoon title="Accuracy Test" />

function RequireAuth({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role!)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<GuestLayout />}>
        <Route
          path="/units"
          element={
            <RequireAuth roles={['guest', 'admin', 'super_admin']}>
              <UnitsList />
            </RequireAuth>
          }
        />
        <Route
          path="/units/:id"
          element={
            <RequireAuth roles={['guest', 'admin', 'super_admin']}>
              <UnitDetails />
            </RequireAuth>
          }
        />
        <Route
          path="/availability"
          element={
            <RequireAuth roles={['guest', 'admin', 'super_admin']}>
              <Availability />
            </RequireAuth>
          }
        />
        <Route
          path="/reservations/request"
          element={
            <RequireAuth roles={['guest', 'admin', 'super_admin']}>
              <ReservationRequest />
            </RequireAuth>
          }
        />
        <Route
          path="/reservations/my"
          element={
            <RequireAuth roles={['guest', 'admin', 'super_admin']}>
              <MyReservations />
            </RequireAuth>
          }
        />
        <Route
          path="/inquiries/submit"
          element={
            <RequireAuth roles={['guest', 'admin', 'super_admin']}>
              <InquiryForm />
            </RequireAuth>
          }
        />
        <Route
          path="/inquiries/my"
          element={
            <RequireAuth roles={['guest', 'admin', 'super_admin']}>
              <MyInquiries />
            </RequireAuth>
          }
        />
      </Route>

      <Route
        element={
          <RequireAuth roles={['admin', 'super_admin']}>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route path="/admin/reservations" element={<AdminReservations />} />
        <Route path="/admin/inquiries" element={<AdminInquiries />} />
        <Route path="/admin/units" element={<AdminUnits />} />
        <Route path="/admin/guests" element={<AdminGuests />} />
      </Route>

      <Route
        element={
          <RequireAuth roles={['super_admin']}>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route path="/super/accounts" element={<AdminAccounts />} />
        <Route path="/super/keywords" element={<AdminKeywords />} />
        <Route path="/super/booking-rules" element={<AdminBookingRules />} />
        <Route path="/tests/accuracy" element={<AccuracyTest />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}