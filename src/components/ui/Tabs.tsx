import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type TabItem = { id: string; label: string; content: ReactNode; disabled?: boolean };
export function Tabs({ items, defaultTab, className = "" }: { items: TabItem[]; defaultTab?: string; className?: string }) {
  const baseId = useId();
  const [active, setActive] = useState(defaultTab ?? items[0]?.id ?? "");
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const enabled = items.map((tab, i) => tab.disabled ? -1 : i).filter((i) => i >= 0);
    const target = event.key === "Home" ? enabled[0] : event.key === "End" ? enabled.at(-1) : enabled[(enabled.indexOf(index) + (event.key === "ArrowRight" ? 1 : enabled.length - 1)) % enabled.length];
    if (target === undefined) return;
    setActive(items[target]?.id ?? "");
    refs.current[target]?.focus();
  };
  const current = items.find((tab) => tab.id === active) ?? items[0];
  if (!current) return null;
  return <div className={className}>
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Sections">
      {items.map((tab, index) => <button key={tab.id} ref={(node) => { refs.current[index] = node; }} id={`${baseId}-tab-${tab.id}`} type="button" role="tab" aria-selected={tab.id === current.id} aria-controls={`${baseId}-panel-${tab.id}`} tabIndex={tab.id === current.id ? 0 : -1} disabled={tab.disabled} onClick={() => setActive(tab.id)} onKeyDown={(event) => handleKeyDown(event, index)} className={`min-h-11 shrink-0 border-b-2 px-4 text-sm font-medium transition-colors duration-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 ${tab.id === current.id ? "border-brand text-brand-dark" : "border-transparent text-text-muted hover:border-sand hover:text-text"}`}>
        {tab.label}
      </button>)}
    </div>
    <div id={`${baseId}-panel-${current.id}`} role="tabpanel" aria-labelledby={`${baseId}-tab-${current.id}`} tabIndex={0} className="pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">{current.content}</div>
  </div>;
}
