import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth';
import { supabase } from '../lib/supabase'

export default function Home() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      navigate('/login')
      return
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
      navigate('/admin')
    } else {
      navigate('/')
    }
  }, [navigate, user, loading])

  if (loading || !user) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-slate-700">Logged in as {user.email}</p>
      <button
        onClick={async () => {
          await supabase.auth.signOut()
          navigate('/login')
        }}
        className="rounded-lg bg-slate-800 text-white px-4 py-2"
      >
        Sign out
      </button>
    </div>
  )
}