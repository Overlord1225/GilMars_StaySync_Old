import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { Button } from '../components/ui/Button'
import logo from '../assets/logo.png'

export default function Landing() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <nav className="bg-white border-b border-black/5 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-10 w-auto" />
              <span className="text-xl font-bold text-brand">StaySync</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/units" className="text-slate-600 hover:text-brand font-medium">
                Browse Units
              </Link>
              <Link to="/availability" className="text-slate-600 hover:text-brand font-medium">
                Check Availability
              </Link>
              {user && (
                <Button variant="outline" onClick={handleSignOut}>
                  Sign out
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <header className="relative bg-brand text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
            Book your stay at GilMars
          </h1>
          <p className="text-lg text-brand/100 mb-8 max-w-2xl mx-auto">
            Simple, stress-free reservation and inquiry management for your next getaway.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/units"
              className="w-full sm:w-auto px-8 py-3 bg-white text-brand font-bold rounded-xl hover:bg-brand-dark transition-colors"
            >
              Browse Units
            </Link>
            <Link
              to="/availability"
              className="w-full sm:w-auto px-8 py-3 border border-white text-white rounded-xl hover:bg-white/10 transition-colors"
            >
                            Check Availability
          </Link>
          </div>
        </div>
      </header>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-brand mb-4">How it works</h2>
          <p className="text-slate-600 mb-12 max-w-xl mx-auto">
            Find your perfect unit, check availability for your dates, and submit a
            reservation request in minutes.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-brand mb-2">Browse units</h3>
              <p className="text-slate-600 text-sm">
                View available units with photos, capacity, and nightly rates.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-brand mb-2">Check availability</h3>
              <p className="text-slate-600 text-sm">
                See if your desired dates are open before submitting a request.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-brand mb-2">Request a stay</h3>
              <p className="text-slate-600 text-sm">
                Submit your reservation and we'll review it shortly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}