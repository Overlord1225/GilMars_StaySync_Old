import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Stepper } from "@/components/ui/Stepper";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { Toast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";

type SampleRow = { id: string; guest: string; status: string };
const rows: SampleRow[] = [
  { id: "ST-1042", guest: "Alex Rivera", status: "Pending" },
  { id: "ST-1041", guest: "Jamie Santos", status: "Confirmed" },
];
const columns: TableColumn<SampleRow>[] = [
  { key: "id", header: "Reference", render: (row) => row.id },
  { key: "guest", header: "Guest", render: (row) => row.guest },
  { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status.toLowerCase()} /> },
];
const sectionClass = "space-y-4 border-b border-border py-8 last:border-b-0";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className={sectionClass} aria-labelledby={`showcase-${title.toLowerCase().replaceAll(" ", "-")}`}>
    <h2 id={`showcase-${title.toLowerCase().replaceAll(" ", "-")}`} className="text-2xl font-semibold text-brand-dark">{title}</h2>
    {children}
  </section>;
}

export default function ComponentsShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(1);

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <PageHeader title="Component library" description="Development-only reference for shared StaySync UI components and their visible states." breadcrumbs={[{ label: "Development" }, { label: "Components" }]} />

    <Section title="Buttons">
      <p className="text-sm text-text-muted">Hover each button, use Tab to inspect focus, and press and hold to see its active state. Focus and active samples are also pinned below for screenshots.</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(["primary", "secondary", "outline", "ghost", "danger"] as const).map((variant) => <Card key={variant} className="space-y-4 p-4">
          <h3 className="font-semibold capitalize text-brand-dark">{variant}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={variant}>Default</Button>
            <Button variant={variant} className="ring-2 ring-brand ring-offset-2 ring-offset-cream">Focus</Button>
            <Button variant={variant} className="translate-y-px">Active</Button>
            <Button variant={variant} disabled>Disabled</Button>
            <Button variant={variant} loading>Loading</Button>
          </div>
        </Card>)}
      </div>
    </Section>

    <Section title="Form controls">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <h3 className="font-semibold text-brand-dark">Input</h3>
          <Input id="showcase-input" label="Email address" placeholder="name@example.com" hint="We use this to send reservation updates." />
          <Input id="showcase-input-focus" label="Focused state" defaultValue="alex@example.com" className="ring-2 ring-brand ring-offset-2 ring-offset-cream" />
          <Input id="showcase-input-disabled" label="Disabled state" defaultValue="Not editable" disabled />
          <Input id="showcase-input-error" label="Error state" defaultValue="alex@" error="Enter an email address such as name@example.com." />
        </Card>
        <Card className="space-y-4 p-5">
          <h3 className="font-semibold text-brand-dark">Select</h3>
          <Select id="showcase-select" label="Choose a stay" defaultValue="garden" hint="Select one of the available stays."><option value="garden">Garden Studio</option><option value="family">Family Loft</option></Select>
          <Select id="showcase-select-disabled" label="Disabled state" disabled defaultValue="unavailable"><option value="unavailable">Unavailable</option></Select>
          <Select id="showcase-select-error" label="Error state" error="Choose a stay to continue." defaultValue=""><option value="">Select a stay</option><option value="garden">Garden Studio</option></Select>
        </Card>
        <Card className="space-y-4 p-5">
          <h3 className="font-semibold text-brand-dark">Textarea</h3>
          <Textarea id="showcase-message" label="Message" hint="Share a short note for the GilMars team." placeholder="Type your message" />
          <Textarea id="showcase-message-error" label="Error state" defaultValue="" error="Add a few details so the team can help." />
          <Textarea id="showcase-message-disabled" label="Disabled state" defaultValue="This message cannot be edited." disabled />
        </Card>
        <Card className="space-y-4 p-5">
          <h3 className="font-semibold text-brand-dark">Checkbox</h3>
          <Checkbox id="showcase-checkbox" label="I have read the booking rules" hint="Check-out is exclusive; it is not counted as a night." />
          <Checkbox id="showcase-checkbox-error" label="Required confirmation" error="Select this box before continuing." />
          <Checkbox id="showcase-checkbox-disabled" label="Disabled state" disabled />
        </Card>
      </div>
    </Section>

    <Section title="Feedback and status">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <h3 className="font-semibold text-brand-dark">Badges</h3>
          <div className="flex flex-wrap gap-2">{(["default", "success", "warning", "info", "pending", "confirmed", "rejected", "cancelled", "completed"] as const).map((variant) => <Badge key={variant} variant={variant}>{variant}</Badge>)}</div>
        </Card>
        <Card className="space-y-4 p-5">
          <h3 className="font-semibold text-brand-dark">Status badges</h3>
          <div className="flex flex-wrap gap-2">{["pending", "confirmed", "rejected", "cancelled", "completed", "new", "in_progress", "resolved", "closed"].map((status) => <StatusBadge key={status} status={status} />)}</div>
        </Card>
        <Card className="space-y-3 p-5">
          <h3 className="font-semibold text-brand-dark">Toasts</h3>
          <Toast variant="success" message="Your changes were saved." />
          <Toast variant="error" message="The request could not be completed. Try again." />
          <Toast variant="info" message="Your reservation is waiting for review." />
        </Card>
        <Card className="space-y-3 p-5">
          <h3 className="font-semibold text-brand-dark">Loading</h3>
          <div className="flex items-center gap-3"><Spinner role="img" aria-label="Loading reservation" /><span className="text-sm text-text-muted">Loading reservation</span></div>
          <div className="grid gap-2"><Skeleton className="h-5 w-1/2" label="Loading title" /><Skeleton className="h-20 w-full rounded-card" label="Loading content" /></div>
        </Card>
      </div>
    </Section>

    <Section title="Cards and empty state">
      <div className="grid gap-4 md:grid-cols-2">
        <Card><h3 className="font-semibold text-brand-dark">Standard card</h3><p className="mt-2 text-sm text-text-muted">A surface for related information and actions.</p></Card>
        <Card padded={false} className="p-4"><h3 className="font-semibold text-brand-dark">Compact card</h3><p className="mt-2 text-sm text-text-muted">Use reduced padding for nested content groups.</p></Card>
        <EmptyState title="No reservations yet" description="Your stay requests will appear here after you send one." action={<Button>Explore stays</Button>} />
      </div>
    </Section>

    <Section title="Navigation and data">
      <div className="grid gap-6">
        <Card className="space-y-4 p-5">
          <h3 className="font-semibold text-brand-dark">Tabs</h3>
          <Tabs className="max-w-2xl" items={[
            { id: "details", label: "Details", content: <p className="text-sm text-text-muted">View the reservation details.</p> },
            { id: "payment", label: "Payment", content: <p className="text-sm text-text-muted">Review the deposit instructions.</p> },
            { id: "history", label: "History", disabled: true, content: <p className="text-sm text-text-muted">Follow status changes over time.</p> },
          ]} />
        </Card>
        <Card className="space-y-4 p-5">
          <h3 className="font-semibold text-brand-dark">Table and responsive card rows</h3>
          <Table columns={columns} rows={rows} getRowKey={(row) => row.id} caption="Sample reservation records" />
        </Card>
        <Card className="space-y-4 p-5">
          <h3 className="font-semibold text-brand-dark">Pagination</h3>
          <Pagination page={page} pageCount={4} onPageChange={setPage} label="reservations" />
        </Card>
        <Card className="space-y-4 p-5">
          <h3 className="font-semibold text-brand-dark">Breadcrumbs</h3>
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My reservations", href: "/my-bookings" }, { label: "ST-1042" }]} />
          <h3 className="font-semibold text-brand-dark">Tooltip</h3>
          <Tooltip content="Check-out is the day you leave and is not charged as a night."><button type="button" className="min-h-11 rounded-control border border-border px-3 text-sm text-brand hover:bg-brand-light focus-visible:ring-2 focus-visible:ring-brand">What does check-out mean?</button></Tooltip>
        </Card>
      </div>
    </Section>

    <Section title="Progress and identity">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-4 p-5"><h3 className="font-semibold text-brand-dark">Stepper</h3><Stepper currentStep={1} steps={[{ label: "Dates and guests", description: "Choose a stay" }, { label: "Review", description: "Check the details" }, { label: "Deposit", description: "Read payment steps" }]} /></Card>
        <Card className="space-y-4 p-5"><h3 className="font-semibold text-brand-dark">Avatar</h3><div className="flex items-center gap-3"><Avatar name="Alex Rivera" size="sm" /><Avatar name="Jamie Santos" /><Avatar name="GilMars Staff" size="lg" /><Avatar name="Guest" src="/favicon.svg" /></div></Card>
      </div>
    </Section>

    <Section title="Page header and dialogs">
      <Card className="space-y-6 p-5">
        <PageHeader title="My reservations" description="Review your stay requests and see what happens next." breadcrumbs={[{ label: "Home", href: "/" }, { label: "My reservations" }]} actions={<Button>Explore stays</Button>} />
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>Open confirmation</Button>
        </div>
      </Card>
    </Section>

    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Reservation details">
      <p className="text-sm leading-6 text-text">This modal shows a focused information panel. Close it with Escape, the close button, or the backdrop.</p>
      <div className="mt-5 flex justify-end"><Button onClick={() => setModalOpen(false)}>Done</Button></div>
    </Modal>
    <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => setConfirmOpen(false)} title="Cancel this request?" consequence="This will cancel the pending request. You will need to send a new request if you still want these dates." confirmLabel="Cancel request" cancelLabel="Keep request" />
    <p className="mt-8 text-xs text-text-muted">This page contains fictional sample content. It is available only in Vite development mode and is not linked from customer or staff navigation.</p>
  </main>;
}
