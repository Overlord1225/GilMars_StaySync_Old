import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/useToast";
import { getAllKeywords, saveKeyword } from "@/lib/db";
import type { InquiryCategory, InquiryKeyword } from "@/lib/types";

const categoryOptions: InquiryCategory[] = [
  "booking_request",
  "availability_inquiry",
  "general_question",
  "complaint",
];
type KeywordForm = {
  id?: string;
  category: InquiryCategory;
  keyword: string;
  language: string;
  weight: string;
  is_active: boolean;
};
const newKeyword: KeywordForm = {
  category: "general_question",
  keyword: "",
  language: "en",
  weight: "1",
  is_active: true,
};

export default function KeywordManagement() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<InquiryKeyword[]>([]);
  const [form, setForm] = useState<KeywordForm>(newKeyword);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    try {
      setRows(await getAllKeywords());
      setError("");
    } catch {
      setError("Inquiry keywords could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load, reload]);

  function edit(row: InquiryKeyword) {
    setForm({
      id: row.id,
      category: row.category,
      keyword: row.keyword,
      language: row.language ?? "en",
      weight: String(row.weight),
      is_active: row.is_active,
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.keyword.trim() || saving) return;
    setSaving(true);
    try {
      await saveKeyword({
        ...(form.id ? { id: form.id } : {}),
        category: form.category,
        keyword: form.keyword.trim(),
        language: form.language.trim() || "en",
        weight: Math.max(1, Number(form.weight)),
        is_active: form.is_active,
      });
      setForm(newKeyword);
      showToast("Keyword saved.", "success");
      setReload((value) => value + 1);
    } catch {
      showToast(
        "The keyword could not be saved. Check permissions and try again.",
        "error",
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
  if (error && rows.length === 0)
    return (
      <EmptyState
        title="Keywords did not load"
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
        title="Inquiry keywords"
        description="Active keywords and weights determine the automatic inquiry category."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Keywords" },
        ]}
      />
      <Card>
        <form
          onSubmit={(event) => void submit(event)}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <Select
            id="keyword-category"
            label="Category"
            value={form.category}
            onChange={(event) =>
              setForm({
                ...form,
                category: event.target.value as InquiryCategory,
              })
            }
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
          <Input
            id="keyword-text"
            label="Keyword or phrase"
            required
            value={form.keyword}
            onChange={(event) =>
              setForm({ ...form, keyword: event.target.value })
            }
          />
          <Input
            id="keyword-language"
            label="Language"
            value={form.language}
            onChange={(event) =>
              setForm({ ...form, language: event.target.value })
            }
          />
          <Input
            id="keyword-weight"
            label="Weight"
            type="number"
            min="1"
            value={form.weight}
            onChange={(event) =>
              setForm({ ...form, weight: event.target.value })
            }
          />
          <div className="flex items-end gap-2">
            <Button type="submit" loading={saving}>
              {form.id ? "Save changes" : "Add keyword"}
            </Button>
            {form.id && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm(newKeyword)}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>
      {categoryOptions.map((category) => (
        <section key={category} className="space-y-3">
          <h2 className="font-heading text-xl font-semibold capitalize text-brand-dark">
            {category.replaceAll("_", " ")}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {rows
              .filter((row) => row.category === category)
              .map((row) => (
                <Card
                  key={row.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-text">{row.keyword}</p>
                    <p className="text-xs text-text-muted">
                      {row.language} · weight {row.weight} ·{" "}
                      {row.is_active ? "active" : "disabled"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => edit(row)}>
                      Edit
                    </Button>
                    <Button
                      variant={row.is_active ? "danger" : "secondary"}
                      disabled={saving}
                      onClick={() => {
                        void saveKeyword({ ...row, is_active: !row.is_active })
                          .then(() => {
                            setReload((value) => value + 1);
                            showToast(
                              row.is_active
                                ? "Keyword disabled."
                                : "Keyword enabled.",
                              "success",
                            );
                          })
                          .catch(() =>
                            showToast(
                              "Keyword status could not be changed.",
                              "error",
                            ),
                          );
                      }}
                    >
                      {row.is_active ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </section>
      ))}
    </section>
  );
}
