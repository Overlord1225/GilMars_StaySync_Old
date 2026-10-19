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
  const { signUp } = useAuth()
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
    <p className="mt-5 text-center text-sm text-text-muted">Already registered? <Link to="/login" className="inline-flex min-h-11 items-center font-medium text-brand hover:underline">Sign in</Link></p>
  </AuthShell>;
}
