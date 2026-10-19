import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout } from './components/layout/PublicLayout'
import { GuestLayout } from './components/layout/GuestLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import UnitsList from './pages/UnitsList'
import UnitDetails from './pages/UnitDetails'
import Availability from './pages/Availability'
import ReservationRequest from './pages/ReservationRequest'
import MyReservations from './pages/MyReservations'

// Placeholder pages (to be implemented in later modules)
const ComingSoon = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-cream">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-brand mb-2">{title}</h2>
      <p className="text-slate-500">Coming soon in the next module.</p>
    </div>
  </div>
)
const MyInquiries = () => <ComingSoon title="My Inquiries" />
const Inquire = () => <ComingSoon title="Inquiry Form" />
const AdminDashboard = () => <ComingSoon title="Admin Dashboard" />
const SuperDashboard = () => <ComingSoon title="Super Admin Dashboard" />
const AdminReservations = () => <ComingSoon title="Admin Reservations" />
const AdminInquiries = () => <ComingSoon title="Admin Inquiries" />
const AdminUnits = () => <ComingSoon title="Manage Units" />
const AdminGuests = () => <ComingSoon title="Manage Guests" />
const AdminAccounts = () => <ComingSoon title="Admin Accounts" />
const AdminKeywords = () => <ComingSoon title="Inquiry Keywords" />
const AdminBookingRules = () => <ComingSoon title="Booking Rules" />
const AccuracyTest = () => <ComingSoon title="Accuracy Test" />

export default function App() {
  return (
    <Routes>
      {/* Public routes — no login required */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Public unit browsing — no login required */}
      <Route path="/units" element={<UnitsList />} />
      <Route path="/units/:id" element={<UnitDetails />} />

      {/* Guest-only routes */}
      <Route element={<GuestLayout />}>
        <Route
          element={
            <ProtectedRoute allowedRoles={['guest', 'admin', 'super_admin']} />
          }
        >
          <Route path="/availability" element={<Availability />} />
          <Route
            path="/reservations/request"
            element={<ReservationRequest />}
          />
          <Route path="/my-bookings" element={<MyReservations />} />
          <Route path="/my-inquiries" element={<MyInquiries />} />
          <Route path="/inquire" element={<Inquire />} />
        </Route>
      </Route>

      {/* Admin routes (admin + super_admin) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']} />
        }
      >
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="units" element={<AdminUnits />} />
          <Route path="guests" element={<AdminGuests />} />
        </Route>
      </Route>

      {/* Super admin routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['super_admin']} />
        }
      >
        <Route path="/super" element={<SuperDashboard />} />
        <Route path="/super/accounts" element={<AdminAccounts />} />
        <Route path="/super/keywords" element={<AdminKeywords />} />
        <Route path="/super/booking-rules" element={<AdminBookingRules />} />
        <Route path="/tests/accuracy" element={<AccuracyTest />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}