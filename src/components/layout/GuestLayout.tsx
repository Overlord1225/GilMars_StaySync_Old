import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export function GuestLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-white border-b border-black/5 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-brand">StaySync</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/units" className="text-slate-600 hover:text-brand font-medium">
                Units
              </Link>
              {user && (
                <>
                  <Link
                    to="/reservations/my"
                    className="text-slate-600 hover:text-brand font-medium"
                  >
                    My Reservations
                  </Link>
                  <Link
                    to="/inquiries/my"
                    className="text-slate-600 hover:text-brand font-medium"
                  >
                    My Inquiries
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      signOut().then(() => navigate('/login'));
                    }}
                  >
                    Sign out
                  </Button>
                </>
              )}
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