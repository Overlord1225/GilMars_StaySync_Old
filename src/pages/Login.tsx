import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)

      if (!user?.is_active) {
        await supabase.auth.signOut()
        setError('Your account is inactive. Please contact support.')
        setLoading(false)
        return
      }

      navigate(user.role === 'admin' || user.role === 'super_admin' ? '/admin/reservations' : '/units')
    } catch (err: unknown) {
      setLoading(false)
      const message =
        err instanceof Error ? err.message : 'Sign in failed. Please try again.'
      setError(message)
    }
  }

  return (
  <div className="min-h-screen flex items-center justify-center bg-cream px-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-black/5 p-8 sm:p-10">
      <div className="flex flex-col items-center mb-8">
        <img
          src={logo}
          alt="GilMars StaySync logo"
          className="h-28 w-auto object-contain mb-4"
        />
        <h1 className="text-2xl font-semibold text-brand">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to manage your stay</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand text-white py-2.5 font-medium hover:bg-brand-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        No account yet?{' '}
        <span className="text-brand font-medium hover:underline cursor-pointer" onClick={() => navigate('/register')} role="link" tabIndex={0}>Register</span>
      </p>
    </div>
  </div>
)
}