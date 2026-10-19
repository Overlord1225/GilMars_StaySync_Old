import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { Button } from '../ui/Button';
import logo from '../../assets/logo.png';

export function PublicLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {user && (
        <nav className="bg-white border-b border-black/5 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Logo" className="h-10 w-auto" />
                <span className="text-xl font-bold text-brand">StaySync</span>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleSignOut}>
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}