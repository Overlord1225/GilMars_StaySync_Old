import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/useToast'
import { getAllUnits, saveUnit } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Unit } from '@/lib/types'

type UnitForm = { id?: string; name: string; description: string; capacity: string; price: string; amenities: string; active: boolean; imageUrls: string[] }
const emptyForm: UnitForm = { name: '', description: '', capacity: '2', price: '', amenities: '', active: true, imageUrls: [] }

export default function AdminUnits() {
  const { showToast } = useToast()
  const [units, setUnits] = useState<Unit[]>([])
  const [form, setForm] = useState<UnitForm | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null)

  const load = useCallback(async () => {
    try { setUnits(await getAllUnits()); setError('') }
    catch { setError('We could not load units. Please try again.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void Promise.resolve().then(load) }, [load, reload])

  function edit(unit?: Unit) {
    setPhoto(null)
    setForm(unit ? {
      id: unit.id,
      name: unit.name,
      description: unit.description ?? '',
      capacity: String(unit.capacity),
      price: String(unit.price_per_night),
      amenities: unit.amenities.join(', '),
      active: unit.is_active,
      imageUrls: unit.image_urls,
    } : { ...emptyForm })
  }

  async function removePhoto(publicUrl: string): Promise<void> {
    try {
      const objectPath = publicUrl.split('/unit-images/')[1]
      if (objectPath) {
        await supabase.storage.from('unit-images').remove([objectPath])
      }
    } catch {
      // Storage deletion is best-effort; the URL is already removed from the list
    }
  }

  async function deleteUnit(unit: Unit): Promise<void> {
    // Delete Storage objects first
    for (const url of unit.image_urls) {
      try {
        const objectPath = url.split('/unit-images/')[1]
        if (objectPath) {
          await supabase.storage.from('unit-images').remove([objectPath])
        }
      } catch {
        // Continue even if individual object deletion fails
      }
    }
    const { error: deleteError } = await supabase.from('units').delete().eq('id', unit.id)
    if (deleteError) throw deleteError
    setReload((value) => value + 1)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form || saving) return
    setSaving(true)
    setError('')
    try {
      const imageUrls = [...form.imageUrls]
      if (photo) {
        const objectPath = `${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
        const { error: uploadError } = await supabase.storage.from('unit-images').upload(objectPath, photo, { upsert: false })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('unit-images').getPublicUrl(objectPath)
        imageUrls.push(data.publicUrl)
      }
      await saveUnit({
        ...(form.id ? { id: form.id } : {}),
        name: form.name.trim(),
        description: form.description.trim() || null,
        capacity: Number(form.capacity),
        price_per_night: Number(form.price),
        amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean),
        image_urls: imageUrls,
        is_active: form.active,
      })
      setForm(null)
      showToast('Stay details saved.', 'success')
      setReload((value) => value + 1)
    } catch {
      setError('Stay details could not be saved. Check the fields and photo permissions, then try again.')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="space-y-5"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full rounded-card" /></div>
  if (error && !form && !units.length) return <EmptyState title="Units did not load" description={error} action={<Button variant="outline" onClick={() => setReload((value) => value + 1)}>Try again</Button>} />

  return <section className="space-y-6">
    <PageHeader title="Manage stays" description="Edit listing details, photos, pricing, and availability status." breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Units' }]} actions={<Button onClick={() => edit()}>Add stay</Button>} />
    {error && <p role="alert" className="rounded-control bg-danger-50 p-3 text-sm text-danger-700">{error}</p>}
    {form && <Card><form onSubmit={(event) => void submit(event)} className="grid gap-4 sm:grid-cols-2">
      <Input id="unit-name" label="Name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      <Input id="unit-capacity" label="Capacity" type="number" min="1" required value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} />
      <Input id="unit-price" label="Price per night (PHP)" type="number" min="0" step="0.01" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
      <Input id="unit-amenities" label="Amenities (comma separated)" value={form.amenities} onChange={(event) => setForm({ ...form, amenities: event.target.value })} />
      <Textarea id="unit-description" label="Description" className="sm:col-span-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      <label className="space-y-1.5 text-sm font-medium text-text">Add a photo<input className="block min-h-11 w-full rounded-control border border-border bg-surface p-2" type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} /></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />Accepting requests</label>
      {form.imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          {form.imageUrls.map((url) => (
            <div className="relative" key={url}>
              <img src={url} alt="Stay" className="size-20 rounded-control object-cover" />
              <button
                type="button"
                className="absolute -right-2 -top-2 rounded-full bg-danger-700 px-2 py-1 text-xs text-white"
                aria-label="Remove photo"
                onClick={() => {
                  void removePhoto(url)
                  setForm({ ...form, imageUrls: form.imageUrls.filter((image) => image !== url) })
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 sm:col-span-2"><Button type="submit" loading={saving}>Save stay</Button><Button type="button" variant="outline" disabled={saving} onClick={() => setForm(null)}>Cancel</Button></div>
    </form></Card>}
    {units.length === 0 ? <EmptyState title="No stays yet" description="Add the first listing to start showing it on the public site." /> : <div className="grid gap-4 md:grid-cols-2">{units.map((unit) => <Card key={unit.id} className="flex flex-col gap-3 sm:flex-row"><div className="w-full sm:w-36">{unit.image_urls[0] ? <img src={unit.image_urls[0]} alt="" className="h-36 w-full rounded-control object-cover" /> : <div className="grid h-36 place-items-center rounded-control bg-cream text-sm text-text-muted">No photo</div>}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><h2 className="font-semibold text-brand-dark">{unit.name}</h2><span className="text-xs text-text-muted">{unit.is_active ? 'Active' : 'Inactive'}</span></div><p className="mt-1 text-sm text-text-muted">{unit.capacity} guests · PHP {unit.price_per_night.toLocaleString()} / night</p><p className="mt-2 line-clamp-2 text-sm text-text-muted">{unit.description}</p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" onClick={() => edit(unit)}>Edit stay</Button>
                  <Button variant="danger" onClick={() => setDeleteTarget(unit)}>Delete unit</Button>
                </div>
              </div></Card>)}</div>}
  </section>
  {deleteTarget && (
    <ConfirmDialog
      open={Boolean(deleteTarget)}
      onClose={() => setDeleteTarget(null)}
      onConfirm={() => {
        void deleteUnit(deleteTarget)
        setDeleteTarget(null)
      }}
      title={`Delete "${deleteTarget.name}"?`}
      consequence="This will permanently delete the stay and all its photos. This action cannot be undone."
      confirmLabel="Delete unit"
      cancelLabel="Cancel"
    />
  )}
}
