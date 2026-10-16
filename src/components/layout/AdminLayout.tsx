import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isSuper = user?.role === 'super_admin';

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-white border-b border-black/5 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-brand">StaySync Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/admin/reservations" className="text-slate-600 hover:text-brand font-medium">
                Reservations
              </Link>
              <Link to="/admin/inquiries" className="text-slate-600 hover:text-brand font-medium">
                Inquiries
              </Link>
              <Link to="/admin/units" className="text-slate-600 hover:text-brand font-medium">
                Units
              </Link>
              <Link to="/admin/guests" className="text-slate-600 hover:text-brand font-medium">
                Guests
              </Link>
              {isSuper && (
                <>
                  <Link to="/super/keywords" className="text-slate-600 hover:text-brand font-medium">
                    Keywords
                  </Link>
                  <Link
                    to="/super/booking-rules"
                    className="text-slate-600 hover:text-brand font-medium"
                  >
                    Booking Rules
                  </Link>
                  <Link
                    to="/super/accounts"
                    className="text-slate-600 hover:text-brand font-medium"
                  >
                    Admin Accounts
                  </Link>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  signOut().then(() => navigate('/login'));
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}