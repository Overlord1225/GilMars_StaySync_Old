import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import logo from '../assets/logo.png'

export default function SuperAdmin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'super_admin'>('super_admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Use the existing signUp from auth
      const { signUp } = await import('../lib/auth')
      const { data, error } = await signUp(email, password, fullName, contactNumber)
      if (error) throw error

      if (data.user) {
        // Update the profile with the desired role
        const { updateProfile } = await import('../lib/auth')
        const { error: profileError } = await updateProfile(data.user.id, { role })
        if (profileError) throw profileError
      }

      setSuccess(`Successfully created ${role} account!`)
      setFullName('')
      setEmail('')
      setContactNumber('')
      setPassword('')
      setRole('super_admin')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-black/5 p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="GilMars StaySync logo" className="h-28 w-auto object-contain mb-4" />
            <h1 className="text-2xl font-semibold text-brand">Super Admin</h1>
            <p className="text-sm text-slate-500 mt-1">Create Admin / Super Admin Accounts</p>
          </div>
          <p className="text-center text-slate-600 mb-6">
            You must be a super admin to access this page.
          </p>
          <Button className="w-full" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-black/5 p-8 sm:p-10">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="GilMars StaySync logo" className="h-28 w-auto object-contain mb-4" />
          <h1 className="text-2xl font-semibold text-brand">Super Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Create Admin / Super Admin Accounts</p>
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

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account...' : `Create ${role} account`}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-8">
          <Button variant="ghost" onClick={() => navigate('/units')}>
            Back to Units
          </Button>
        </p>
      </div>
    </div>
  )
}