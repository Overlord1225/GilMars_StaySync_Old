import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/features/auth/useAuth'
import { registerSchema, type RegisterValues } from '@/features/auth/authSchemas'
import { AuthShell } from '@/components/auth/AuthShell'

export default function Register() {
  const { signUp, signInWithOAuth } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), mode: 'onBlur' })

  async function onSubmit(values: RegisterValues) {
    setSubmitError('')
    try {
      const { confirmationRequired } = await signUp(values)
      navigate('/login', { replace: true, state: { message: confirmationRequired
        ? 'Account created. Check your email to confirm it, then sign in.'
        : 'Account created successfully. Please sign in.' } })
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : ''
      setSubmitError(/already registered|already exists|user exists/i.test(rawMessage)
        ? 'An account with this email already exists. Sign in or reset your password instead.'
        : 'We couldn’t create your account right now. Check your details and try again.')
    }
  }

  return <AuthShell title="Create your guest account" description="Join GilMars StaySync to request a stay and follow your reservation.">
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input id="fullName" label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
      <Input id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <div><Input id="password" label="Password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" error={errors.password?.message} {...register('password')} /><button type="button" className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-brand underline focus-visible:ring-2 focus-visible:ring-brand" aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide password' : 'Show password'}</button></div>
      <div><Input id="confirmPassword" label="Confirm password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} /><button type="button" className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-brand underline focus-visible:ring-2 focus-visible:ring-brand" aria-pressed={showConfirmPassword} onClick={() => setShowConfirmPassword((value) => !value)}>{showConfirmPassword ? 'Hide password' : 'Show password'}</button></div>
      {submitError && <p role="alert" className="rounded-control border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">{submitError}</p>}
      <Button type="submit" className="w-full" loading={isSubmitting}>Create account</Button>
    </form>
    <div className="mt-5 flex items-center gap-3 text-xs text-text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">or continue with</div>
    <Button type="button" variant="outline" className="w-full" loading={isSubmitting} onClick={() => void signInWithOAuth('google')}>
      <svg aria-hidden="true" className="mr-2 size-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.05c0-.8-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Continue with Google
    </Button>
    <p className="mt-5 text-center text-sm text-text-muted">Already registered? <Link to="/" className="inline-flex min-h-11 items-center font-medium text-brand hover:underline">Sign in</Link></p>
  </AuthShell>;
}
