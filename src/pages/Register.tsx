import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import logo from '../assets/logo.png'

export default function Register() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signUp(email, password, fullName, contactNumber)
      navigate('/login', {
        state: {
          message: 'Account created successfully. Please sign in.',
        },
      })
    } catch (err: unknown) {
      setLoading(false)
      const message =
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
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
          <h1 className="text-2xl font-semibold text-brand">Create account</h1>
          <p className="text-sm text-slate-500 mt-1">Join GilMars StaySync</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="full_name"
            label="Full name"
            placeholder="Juan Dela Cruz"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            id="email"
            label="Email"
            placeholder="you@example.com"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="contact_number"
            label="Contact number"
            placeholder="+63 912 345 6789"
            type="tel"
            required
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
          />
          <Input
            id="password"
            label="Password"
            placeholder="••••••••"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-8">
          Already have an account?{' '}
          <span
            className="text-brand font-medium hover:underline cursor-pointer"
            onClick={() => navigate('/login')}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate('/login')
            }}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  )
}