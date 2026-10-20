import { useId, useState } from "react";
import { Link } from "react-router-dom";
import type { UserRole } from "@/lib/types";

type GuideAudience = Extract<UserRole, "guest" | "admin" | "super_admin">;

function wasDismissed(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "dismissed";
  } catch {
    return false;
  }
}

export function RoleGuide({ audience }: { audience: GuideAudience }) {
  const guideId = useId();
  const roleName = audience === "guest" ? "guest" : audience === "super_admin" ? "super admin" : "admin";
  const storageKey = `staysync-guide-${audience}`;
  const [open, setOpen] = useState(() => !wasDismissed(storageKey));

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(storageKey, "dismissed");
    } catch {
      // Keep the guide usable when browser storage is unavailable.
    }
  }

  const guestSteps = [
    <>Browse the stays and choose dates that meet the advance notice shown in the calendar. Check-out is the day you leave and is not counted as a night.</>,
    <>Send a reservation request and review the dates, guest count and estimated stay price. Sending a request does not hold the dates.</>,
    <>Pay the fixed PHP 1,500 deposit using verified GCash or bank details shared by GilMars staff. Dates are held only after the deposit is verified and staff confirm the request.</>,
  ];

  const adminSteps = audience === "super_admin"
    ? [
      <>Use the staff workspace to review reservations and inquiries, manage units and guest accounts, and open configuration tools from the sidebar.</>,
      <>Use Staff to review staff roles and access. Create the authentication account first, then assign its staff role here.</>,
      <>Use My account to update your profile name, and read <Link to="/help" className="font-medium text-brand underline">Help</Link> to review the guest booking rules.</>,
    ]
    : [
      <>Use the staff workspace to review reservations and inquiries, manage units and guest accounts, and record booking updates.</>,
      <>Use My account to update your profile name. StaySync warns before you leave unsaved changes.</>,
      <>Read <Link to="/help" className="font-medium text-brand underline">Help</Link> to review booking rules and the guest reservation steps.</>,
    ];

  const steps = audience === "guest" ? guestSteps : adminSteps;
  const heading = audience === "guest" ? "How booking works" : `Getting started: ${roleName}`;
  const triggerLabel = audience === "guest" ? "How booking works" : "Open orientation";

  return <section aria-labelledby={`${guideId}-title`} className="border-b border-border bg-surface px-4 py-4 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${guideId}-title`} className="font-heading text-lg font-semibold text-brand-dark">{heading}</h2>
        <button type="button" aria-controls={`${guideId}-content`} aria-expanded={open} onClick={() => open ? dismiss() : setOpen(true)} className="inline-flex min-h-11 items-center justify-center rounded-control px-3 text-sm font-medium text-brand underline hover:bg-brand-light focus-visible:ring-2 focus-visible:ring-brand">
          {open ? "Dismiss guide" : triggerLabel}
        </button>
      </div>
      <ol id={`${guideId}-content`} hidden={!open} className="mt-3 grid min-w-0 gap-3 text-sm leading-6 text-text md:grid-cols-3">
        {steps.map((step, index) => <li key={index} className="flex min-w-0 gap-3 rounded-control border border-border bg-cream p-3">
          <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">{index + 1}</span>
          <span className="min-w-0 flex-1">{step}</span>
        </li>)}
      </ol>
    </div>
  </section>;
}
