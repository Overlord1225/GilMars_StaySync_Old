import { lazy, Suspense, type ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { GuestLayout } from "@/components/layout/GuestLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { GuestOnly, ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Head } from "@/components/ui/Head";
import { Skeleton } from "@/components/ui/Skeleton";
const Account = lazy(() => import("@/pages/Account"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const Help = lazy(() => import("@/pages/Help"));
const Landing = lazy(() => import("@/pages/Landing"));
const Legal = lazy(() => import("@/pages/Legal"));
const Login = lazy(() => import("@/pages/Login"));
const MyReservations = lazy(() => import("@/pages/MyReservations"));
const MyInquiries = lazy(() => import("@/pages/MyInquiries"));
const InquiryForm = lazy(() => import("@/pages/InquiryForm"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const SuperDashboard = lazy(() => import("@/pages/SuperDashboard"));
const Register = lazy(() => import("@/pages/Register"));
const ReservationRequest = lazy(() => import("@/pages/ReservationRequest"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const UnitDetails = lazy(() => import("@/pages/UnitDetails"));
const UnitsList = lazy(() => import("@/pages/UnitsList"));
const AdminLayout = lazy(() =>
  import("@/components/layout/AdminLayout").then((module) => ({
    default: module.AdminLayout,
  })),
);
const AuditLog = lazy(() => import("@/pages/AuditLog"));
const StaffManagement = lazy(() => import("@/pages/StaffManagement"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminReservations = lazy(() => import("@/pages/AdminReservations"));
const AdminCalendar = lazy(() => import("@/pages/AdminCalendar"));
const AdminInquiries = lazy(() => import("@/pages/AdminInquiries"));
const AdminSearch = lazy(() => import("@/pages/AdminSearch"));
const AdminUnits = lazy(() => import("@/pages/AdminUnits"));
const AdminGuests = lazy(() => import("@/pages/AdminGuests"));
const KeywordManagement = lazy(() => import("@/pages/KeywordManagement"));
const BookingRules = lazy(() => import("@/pages/BookingRules"));
const AccuracyTest = lazy(() => import("@/pages/AccuracyTest"));

function RouteLoading({ label }: { label: string }) {
  return (
    // Not <main>: every layout already provides one around the page.
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-64" label={`Loading ${label}`} />
      <Skeleton className="h-48 w-full rounded-card" />
    </div>
  );
}

function RoutePage({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  // Children render after this, so a page's own <Head> overrides the label title.
  return (
    <Suspense fallback={<RouteLoading label={label} />}>
      <Head title={label.charAt(0).toUpperCase() + label.slice(1)} />
      {children}
    </Suspense>
  );
}

const appFallback = (
  <div
    className="flex flex-col items-center justify-center rounded-card border border-danger-200 bg-danger-50 p-6 text-center"
    role="alert"
    aria-live="polite"
  >
    <svg
      aria-hidden="true"
      className="mb-3 size-8 shrink-0 text-danger-700"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <h2 className="text-lg text-danger-800">Application error</h2>
    <p className="mt-2 text-sm text-danger-700">
      An unexpected error occurred. Refresh the page to continue.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="mt-4 inline-flex min-h-11 items-center justify-center rounded-control bg-brand px-4 text-on-fill hover:bg-brand-dark"
    >
      Refresh page
    </button>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary fallback={appFallback}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route
            path="/"
            element={
              <RoutePage label="home">
                <Landing />
              </RoutePage>
            }
          />
          <Route
            path="/login"
            element={
              <RoutePage label="sign in">
                <Login />
              </RoutePage>
            }
          />
          <Route element={<GuestOnly />}>
            <Route
              path="/register"
              element={
                <RoutePage label="registration">
                  <Register />
                </RoutePage>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <RoutePage label="password reset">
                  <ForgotPassword />
                </RoutePage>
              }
            />
          </Route>
          <Route
            path="/reset-password"
            element={
              <RoutePage label="password reset">
                <ResetPassword />
              </RoutePage>
            }
          />
          <Route
            path="/units"
            element={
              <RoutePage label="stays">
                <UnitsList />
              </RoutePage>
            }
          />
          <Route
            path="/units/:id"
            element={
              <RoutePage label="stay details">
                <UnitDetails />
              </RoutePage>
            }
          />
          <Route
            path="/help"
            element={
              <RoutePage label="help">
                <Help />
              </RoutePage>
            }
          />
          {(
            [
              ["/privacy", "privacy"],
              ["/terms", "terms"],
              ["/cancellation-policy", "cancellation"],
              ["/house-rules", "house-rules"],
            ] as const
          ).map(([path, doc]) => (
            <Route
              key={path}
              path={path}
              element={
                <RoutePage label={doc}>
                  <Legal doc={doc} />
                </RoutePage>
              }
            />
          ))}
          <Route
            path="*"
            element={
              <RoutePage label="page">
                <NotFound />
              </RoutePage>
            }
          />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["guest"]} />}>
          <Route element={<GuestLayout />}>
            <Route
              path="/reservations/request/:id"
              element={
                <RoutePage label="reservation request">
                  <ReservationRequest />
                </RoutePage>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <RoutePage label="my reservations">
                  <MyReservations />
                </RoutePage>
              }
            />
            <Route
              path="/my-inquiries"
              element={
                <RoutePage label="my inquiries">
                  <MyInquiries />
                </RoutePage>
              }
            />
            <Route
              path="/inquire"
              element={
                <RoutePage label="ask a question">
                  <InquiryForm />
                </RoutePage>
              }
            />
            <Route
              path="/account"
              element={
                <RoutePage label="account">
                  <Account />
                </RoutePage>
              }
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route
            path="/admin"
            element={
              <Suspense fallback={<RouteLoading label="admin workspace" />}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route
              index
              element={
                <RoutePage label="dashboard">
                  <AdminDashboard />
                </RoutePage>
              }
            />
            <Route
              path="reservations"
              element={
                <RoutePage label="reservations">
                  <AdminReservations />
                </RoutePage>
              }
            />
            <Route
              path="calendar"
              element={
                <RoutePage label="calendar">
                  <AdminCalendar />
                </RoutePage>
              }
            />
            <Route
              path="inquiries"
              element={
                <RoutePage label="inquiries">
                  <AdminInquiries />
                </RoutePage>
              }
            />
            <Route
              path="search"
              element={
                <RoutePage label="search">
                  <AdminSearch />
                </RoutePage>
              }
            />
            <Route
              path="units"
              element={
                <RoutePage label="manage stays">
                  <AdminUnits />
                </RoutePage>
              }
            />
            <Route
              path="guests"
              element={
                <RoutePage label="guests">
                  <AdminGuests />
                </RoutePage>
              }
            />
            <Route
              path="account"
              element={
                <RoutePage label="account">
                  <Account />
                </RoutePage>
              }
            />
            <Route
              path="keywords"
              element={
                <RoutePage label="inquiry keywords">
                  <KeywordManagement />
                </RoutePage>
              }
            />
            <Route
              path="booking-rules"
              element={
                <RoutePage label="booking rules">
                  <BookingRules />
                </RoutePage>
              }
            />
            <Route
              path="accuracy"
              element={
                <RoutePage label="accuracy test">
                  <AccuracyTest />
                </RoutePage>
              }
            />
            <Route
              path="*"
              element={
                <RoutePage label="page">
                  <NotFound />
                </RoutePage>
              }
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
          <Route
            path="/super"
            element={
              <Suspense
                fallback={<RouteLoading label="super-admin workspace" />}
              >
                <AdminLayout />
              </Suspense>
            }
          >
            <Route
              index
              element={
                <RoutePage label="dashboard">
                  <SuperDashboard />
                </RoutePage>
              }
            />
            <Route
              path="accounts"
              element={
                <RoutePage label="account management">
                  <StaffManagement />
                </RoutePage>
              }
            />
            <Route
              path="audit"
              element={
                <RoutePage label="audit log">
                  <AuditLog />
                </RoutePage>
              }
            />
            <Route
              path="account"
              element={
                <RoutePage label="account">
                  <Account />
                </RoutePage>
              }
            />
            <Route
              path="*"
              element={
                <RoutePage label="page">
                  <NotFound />
                </RoutePage>
              }
            />
          </Route>
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
