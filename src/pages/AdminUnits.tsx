import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/useToast";
import { getAllUnits, saveUnit } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Unit } from "@/lib/types";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

type UnitForm = {
  id?: string;
  name: string;
  description: string;
  capacity: string;
  price: string;
  price3: string;
  price4: string;
  extraFee: string;
  amenities: string;
  active: boolean;
  imageUrls: string[];
};
const emptyForm: UnitForm = {
  name: "",
  description: "",
  capacity: "2",
  price: "",
  price3: "",
  price4: "",
  extraFee: "",
  amenities: "",
  active: true,
  imageUrls: [],
};

export default function AdminUnits() {
  const { showToast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState<UnitForm | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
  const [photoToRemove, setPhotoToRemove] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setUnits(await getAllUnits());
      setError("");
    } catch {
      setError("We could not load units. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load, reload]);

  function edit(unit?: Unit) {
    setPhoto(null);
    setForm(
      unit
        ? {
            id: unit.id,
            name: unit.name,
            description: unit.description ?? "",
            capacity: String(unit.capacity),
            price: String(unit.price_per_night),
            price3: unit.price_3_guests?.toString() ?? "",
            price4: unit.price_4_guests?.toString() ?? "",
            extraFee: unit.extra_guest_fee?.toString() ?? "",
            amenities: unit.amenities.join(", "),
            active: unit.is_active,
            imageUrls: unit.image_urls,
          }
        : { ...emptyForm },
    );
  }

  async function removePhoto(publicUrl: string): Promise<void> {
    try {
      const objectPath = publicUrl.split("/unit-images/")[1];
      if (objectPath) {
        await supabase.storage.from("unit-images").remove([objectPath]);
      }
    } catch {
      // Storage deletion is best-effort; the URL is already removed from the list
    }
  }

  async function deleteUnit(unit: Unit): Promise<void> {
    // Delete the row first: if it is blocked (reservations), keep the photos.
    const { error: deleteError } = await supabase
      .from("units")
      .delete()
      .eq("id", unit.id);
    if (deleteError) {
      showToast(
        "We couldn’t delete this stay. If it has reservations, turn off “Accepting requests” instead.",
        "error",
      );
      return;
    }
    for (const url of unit.image_urls) {
      try {
        const objectPath = url.split("/unit-images/")[1];
        if (objectPath) {
          await supabase.storage.from("unit-images").remove([objectPath]);
        }
      } catch {
        // Best effort: the stay is already deleted
      }
    }
    showToast("Stay deleted.", "success");
    setReload((value) => value + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || saving) return;
    setSaving(true);
    setError("");
    try {
      const imageUrls = [...form.imageUrls];
      if (photo) {
        if (!PHOTO_TYPES.includes(photo.type) || photo.size > PHOTO_MAX_BYTES) {
          throw new Error(
            "Photo must be a JPEG, PNG or WebP image under 5 MB.",
          );
        }
        const objectPath = `${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const { error: uploadError } = await supabase.storage
          .from("unit-images")
          .upload(objectPath, photo, { upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage
          .from("unit-images")
          .getPublicUrl(objectPath);
        imageUrls.push(data.publicUrl);
      }
      await saveUnit({
        ...(form.id ? { id: form.id } : {}),
        name: form.name.trim(),
        description: form.description.trim() || null,
        capacity: Number(form.capacity),
        price_per_night: Number(form.price),
        price_3_guests: form.price3 === "" ? null : Number(form.price3),
        price_4_guests: form.price4 === "" ? null : Number(form.price4),
        extra_guest_fee: form.extraFee === "" ? null : Number(form.extraFee),
        amenities: form.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        image_urls: imageUrls,
        is_active: form.active,
      });
      setForm(null);
      showToast("Stay details saved.", "success");
      setReload((value) => value + 1);
    } catch {
      setError(
        "Stay details could not be saved. Check the fields and photo permissions, then try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  if (error && !form && !units.length)
    return (
      <EmptyState
        title="Units did not load"
        description={error}
        action={
          <Button
            variant="outline"
            onClick={() => setReload((value) => value + 1)}
          >
            Try again
          </Button>
        }
      />
    );

  return (
    <section className="space-y-6">
      <PageHeader
        title="Manage stays"
        actions={<Button onClick={() => edit()}>Add stay</Button>}
      />
      {error && (
        <p
          role="alert"
          className="rounded-control bg-danger-50 p-3 text-sm text-danger-700"
        >
          {error}
        </p>
      )}
      {form && (
        <Card>
          <form
            onSubmit={(event) => void submit(event)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Input
              id="unit-name"
              label="Name"
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <Input
              id="unit-capacity"
              label="Capacity"
              type="number"
              min="1"
              required
              value={form.capacity}
              onChange={(event) =>
                setForm({ ...form, capacity: event.target.value })
              }
            />
            <Input
              id="unit-price"
              label="Price per night, 1-2 guests (PHP)"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.price}
              onChange={(event) =>
                setForm({ ...form, price: event.target.value })
              }
            />
            {(
              [
                [
                  "unit-price3",
                  "Price per night, 3 guests (PHP, optional)",
                  "price3",
                ],
                [
                  "unit-price4",
                  "Price per night, 4 guests (PHP, optional)",
                  "price4",
                ],
                [
                  "unit-extra-fee",
                  "Fee per guest beyond 4 (PHP, optional)",
                  "extraFee",
                ],
              ] as const
            ).map(([id, label, key]) => (
              <Input
                key={id}
                id={id}
                label={label}
                type="number"
                min="0"
                step="0.01"
                value={form[key]}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
              />
            ))}
            <Input
              id="unit-amenities"
              label="Amenities (comma separated)"
              value={form.amenities}
              onChange={(event) =>
                setForm({ ...form, amenities: event.target.value })
              }
            />
            <Textarea
              id="unit-description"
              label="Description"
              className="sm:col-span-2"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
            <label className="space-y-1.5 text-sm font-medium text-ink">
              Add a photo
              <input
                className="block min-h-11 w-full rounded-control border border-rule bg-surface p-2"
                type="file"
                accept={PHOTO_TYPES.join(",")}
                onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
              />
            </label>
            <Checkbox
              id="unit-active"
              label="Accepting requests"
              checked={form.active}
              onChange={(event) =>
                setForm({ ...form, active: event.target.checked })
              }
            />
            {form.imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                {form.imageUrls.map((url, index) => (
                  <div className="relative" key={url}>
                    <img
                      src={url}
                      alt={`${form.name || "Stay"} photo ${index + 1}`}
                      className="size-20 rounded-control object-cover"
                    />
                    <button
                      type="button"
                      className="absolute -right-3 -top-3 grid size-11 place-items-center rounded-full bg-danger-700 text-lg text-white"
                      aria-label="Remove photo"
                      onClick={() => setPhotoToRemove(url)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" loading={saving}>
                Save stay
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setForm(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
      {units.length === 0 ? (
        <EmptyState title="No stays yet" />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {units.map((unit) => (
            <Card
              key={unit.id}
              padded={false}
              className="flex flex-col overflow-hidden"
            >
              <div className="w-full">
                {unit.image_urls[0] ? (
                  <img
                    src={unit.image_urls[0]}
                    alt=""
                    className="aspect-4/3 w-full object-cover"
                  />
                ) : (
                  <div className="grid aspect-4/3 place-items-center bg-brand-light text-sm text-ink-muted">
                    No photo
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 p-5">
                <div className="flex justify-between gap-3">
                  <h2 className="font-heading text-lg text-brand-dark">
                    {unit.name}
                  </h2>
                  <Badge variant={unit.is_active ? "success" : "default"}>
                    {unit.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {unit.capacity} guests · from{" "}
                  {formatCurrency(unit.price_per_night)} / night
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
                  {unit.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => edit(unit)}>
                    Edit stay
                  </Button>
                  <Button variant="ghost" onClick={() => setDeleteTarget(unit)}>
                    Delete unit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(photoToRemove)}
        onClose={() => setPhotoToRemove(null)}
        onConfirm={() => {
          const url = photoToRemove;
          setPhotoToRemove(null);
          if (!url || !form) return;
          void removePhoto(url);
          setForm({
            ...form,
            imageUrls: form.imageUrls.filter((image) => image !== url),
          });
        }}
        title="Remove this photo?"
        consequence="The photo file is deleted right away and cannot be recovered."
        confirmLabel="Remove photo"
        cancelLabel="Cancel"
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;
          if (!target) return;
          void deleteUnit(target);
          setDeleteTarget(null);
        }}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        consequence="This will permanently delete the stay and all its photos. This action cannot be undone."
        confirmLabel="Delete unit"
        cancelLabel="Cancel"
      />
    </section>
  );
}
