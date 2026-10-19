import { describe, expect, it } from 'vitest'
import { canAccessRole, roleHome, roleRedirect } from './roleRedirect'

describe('roleHome', () => {
  it('sends guests to the public home and staff to admin', () => {
    expect(roleHome('guest')).toBe('/')
    expect(roleHome('admin')).toBe('/admin')
    expect(roleHome('super_admin')).toBe('/admin')
  })
})

describe('roleRedirect', () => {
  it('keeps safe requested destinations', () => {
    expect(roleRedirect('guest', '/my-bookings')).toBe('/my-bookings')
    expect(roleRedirect('admin', '/admin/reservations')).toBe('/admin/reservations')
    expect(roleRedirect('super_admin', '/super/accounts')).toBe('/super/accounts')
  })

  it('does not send guests into staff routes or admins into super admin routes', () => {
    expect(roleRedirect('guest', '/admin')).toBe('/')
    expect(roleRedirect('admin', '/super/accounts')).toBe('/admin')
  })

  it('uses the role home when no destination was requested', () => {
    expect(roleRedirect('guest')).toBe('/')
    expect(roleRedirect('admin', '/login')).toBe('/admin')
  })
})

describe('canAccessRole', () => {
  it('handles staff and any-role route groups', () => {
    expect(canAccessRole('admin', ['staff'])).toBe(true)
    expect(canAccessRole('super_admin', ['staff'])).toBe(true)
    expect(canAccessRole('guest', ['staff'])).toBe(false)
    expect(canAccessRole('guest', ['any'])).toBe(true)
  })

  it('allows only guests to access reservation request routes', () => {
    expect(canAccessRole('guest', ['guest'])).toBe(true)
    expect(canAccessRole('admin', ['guest'])).toBe(false)
    expect(canAccessRole('super_admin', ['guest'])).toBe(false)
  })

  it('keeps account-area routes available to guests and staff', () => {
    const accountRoles = ['guest', 'admin', 'super_admin'] as const
    expect(canAccessRole('guest', [...accountRoles])).toBe(true)
    expect(canAccessRole('admin', [...accountRoles])).toBe(true)
    expect(canAccessRole('super_admin', [...accountRoles])).toBe(true)
  })
})
