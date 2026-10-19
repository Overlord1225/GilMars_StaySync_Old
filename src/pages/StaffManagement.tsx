import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/features/auth/useAuth'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/lib/types'

export default function StaffManagement() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [pendingChange, setPendingChange] = useState<{ profile: Profile; updates: { role?: UserRole; is_active?: boolean }; title: string; consequence: string; confirmLabel: string } | null>(null)

  const fetchStaff = useCallback(async () => {
    return await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: true })
  }, [])

  const loadStaff = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: queryError } = await fetchStaff()
    if (queryError) setError(queryError.message)
    else setStaff(data ?? [])
    setLoading(false)
  }, [fetchStaff])

  useEffect(() => {
    let active = true
    void fetchStaff().then(({ data, error: queryError }) => {
      if (!active) return
      if (queryError) setError(queryError.message)
      else setStaff(data ?? [])
      setLoading(false)
    })
    return () => { active = false }
  }, [fetchStaff])

  async function updateStaff(profile: Profile, updates: { role?: UserRole; is_active?: boolean }): Promise<boolean> {
    if (profile.id === user?.id) return false
    setSavingId(profile.id)
    setError('')
    const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', profile.id)
    if (updateError) {
      setError('We couldn’t update this staff account. Please try again.')
      setSavingId(null)
      return false
    }
    await loadStaff()
    setSavingId(null)
    return true
  }

  async function confirmChange() {
    if (!pendingChange || savingId) return
    const saved = await updateStaff(pendingChange.profile, pendingChange.updates)
    if (saved) setPendingChange(null)
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Staff management" description="Manage roles and access for staff profiles. Create auth accounts through Supabase first; new accounts receive the guest role until promoted here." breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Staff' }]} actions={<Button variant="outline" onClick={() => void loadStaff()} loading={loading}>Refresh</Button>} />
      {error && <p role="alert" className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800">{error}</p>}
      {loading ? <p role="status">Loading staff…</p> : staff.length === 0 ? (
        <Card><p className="text-slate-600">No staff accounts found. Add an account in Supabase Auth, then refresh this list.</p></Card>
      ) : (
        <div className="space-y-3">
          {staff.map((profile) => (
            <Card key={profile.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-900">{profile.full_name || 'Unnamed staff member'}</h2>
                <p className="text-sm text-slate-600">{profile.email}</p>
                {profile.id === user?.id && <p className="mt-1 text-xs text-text-muted">Your current account</p>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-slate-700">Role
                  <select
                    className="ml-2 min-h-10 rounded-lg border border-slate-300 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-brand"
                    value={profile.role}
                    disabled={profile.id === user?.id || savingId === profile.id}
                    onChange={(event) => {
                      const role = event.target.value as UserRole
                      if (role === profile.role) return
                      const roleName = role === 'super_admin' ? 'super admin' : 'admin'
                      setPendingChange({ profile, updates: { role }, title: `Change ${profile.full_name || 'this staff member'}’s role?`, consequence: `This will change ${profile.full_name || 'this staff member'}’s access to StaySync as a ${roleName}.`, confirmLabel: 'Change role' })
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super admin</option>
                  </select>
                </label>
                <Button
                  variant={profile.is_active ? 'danger' : 'secondary'}
                  disabled={profile.id === user?.id || savingId === profile.id}
                  loading={savingId === profile.id}
                  onClick={() => setPendingChange({ profile, updates: { is_active: !profile.is_active }, title: profile.is_active ? `Deactivate ${profile.full_name || 'this staff account'}?` : `Reactivate ${profile.full_name || 'this staff account'}?`, consequence: profile.is_active ? 'This will prevent this account from accessing StaySync.' : 'This will restore this account’s access to StaySync.', confirmLabel: profile.is_active ? 'Deactivate account' : 'Reactivate account' })}
                >
                  {profile.is_active ? 'Deactivate' : 'Reactivate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog open={Boolean(pendingChange)} onClose={() => { if (!savingId) setPendingChange(null) }} onConfirm={() => void confirmChange()} loading={Boolean(savingId)} title={pendingChange?.title ?? 'Confirm staff change'} consequence={pendingChange?.consequence ?? ''} confirmLabel={pendingChange?.confirmLabel ?? 'Confirm'} cancelLabel="Go back" />
    </section>
  )
}
