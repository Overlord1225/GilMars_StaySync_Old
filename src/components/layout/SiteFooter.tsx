import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { accountLinks, exploreLinks } from "@/components/layout/siteNav";
import { todayManila } from "@/lib/dates";
import logo from "@/assets/logo.png";

const linkClass =
  "inline-flex min-h-11 items-center rounded-control text-text-muted transition-colors hover:text-brand hover:underline";

function Column({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  const id = `footer-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <nav aria-labelledby={id}>
      <h2
        id={id}
        className="font-heading text-base font-semibold text-brand-dark"
      >
        {title}
      </h2>
      <ul className="mt-2">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className={linkClass}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  const { user } = useAuth();
  const role = user?.is_active && user.role ? user.role : null;
  const year = todayManila().slice(0, 4);

  return (
    <footer className="border-t border-border bg-surface px-4 py-10 text-sm sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-control"
          >
            <img
              src={logo}
              alt=""
              width="48"
              height="40"
              className="h-10 w-auto"
            />
            <span className="font-heading text-lg font-semibold text-brand-dark">
              GilMars StaySync
            </span>
          </Link>
          <p className="max-w-xs text-text-muted">
            Reserve one of our five GilMars stays and message the team about
            dates, bookings or anything else.
          </p>
        </div>
        <Column title="Explore" links={exploreLinks} />
        <Column
          title={role ? "Your account" : "Get started"}
          links={accountLinks(role)}
        />
        <Column
          title="Contact"
          links={[
            {
              label: "Ask a question",
              to: role === "guest" || !role ? "/inquire" : "/help",
            },
            { label: "Help and booking rules", to: "/help" },
          ]}
        />
      </div>
      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-1 border-t border-border pt-4 text-xs text-text-muted sm:flex-row sm:justify-between">
        <p>© {year} GilMars StaySync</p>
        <p>All dates and times are Asia/Manila.</p>
      </div>
    </footer>
  );
}
