import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/features/auth/useAuth'
import { roleRedirect } from '@/features/auth/roleRedirect'
import { loginSchema, type LoginValues } from '@/features/auth/authSchemas'
import { AuthShell } from '@/components/auth/AuthShell'

export default function Login() {
  const { signIn, loading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const message = (location.state as { message?: string } | null)?.message
  const requestedPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!loading && user?.is_active && user.role) {
      navigate(roleRedirect(user.role, requestedPath), { replace: true })
    }
  }, [loading, user, requestedPath, navigate])

  async function onSubmit(values: LoginValues) {
    try {
      const role = await signIn(values.email, values.password)
      navigate(roleRedirect(role, requestedPath), { replace: true })
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : ''
      const message = /invalid login credentials|invalid email or password/i.test(rawMessage)
        ? 'Email or password is incorrect.'
        : /email not confirmed/i.test(rawMessage)
          ? 'Please confirm your email using the link we sent you.'
          : /inactive|profile|provisioned/i.test(rawMessage)
            ? 'We couldn’t open your account profile. Please contact the GilMars team for help.'
            : 'We couldn’t sign you in right now. Check your details and try again.'
      setError('root', { message })
    }
  }

  return <AuthShell title="Welcome back" description="Sign in to manage your GilMars stay.">
    {message && <p role="status" className="mb-4 rounded-control border border-success-200 bg-success-50 p-3 text-sm text-success-700">{message}</p>}
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Input id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
      <div className="space-y-1"><Input id="password" label="Password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <button type="button" className="inline-flex min-h-11 items-center rounded-control px-2 text-sm font-medium text-brand underline focus-visible:ring-2 focus-visible:ring-brand" onClick={() => setShowPassword((visible) => !visible)} aria-pressed={showPassword}>{showPassword ? 'Hide password' : 'Show password'}</button>
      </div>
      {errors.root?.message && <p role="alert" className="rounded-control border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">{errors.root.message}</p>}
      <Button type="submit" className="w-full" loading={isSubmitting}>Sign in</Button>
    </form>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm"><Link to="/forgot-password" className="inline-flex min-h-11 items-center font-medium text-brand hover:underline">Forgot password?</Link><Link to="/register" className="inline-flex min-h-11 items-center font-medium text-brand hover:underline">Create account</Link></div>
  </AuthShell>;
}
