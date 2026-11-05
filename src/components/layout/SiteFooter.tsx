import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { accountLinks, exploreLinks } from "@/components/layout/siteNav";
import { todayManila } from "@/lib/dates";
import { BrandMark } from "@/components/ui/BrandMark";
import { CONTACT_EMAIL, SOCIAL_NAME } from "@/lib/policies";

const linkClass =
  "inline-flex min-h-11 items-center rounded-control text-white/80 transition-colors hover:text-white hover:underline";

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
      <h2 id={id} className="font-heading text-lg font-medium text-white">
        {title}
      </h2>
      <ul className="mt-2">
        {links.map((l) => (
          <li key={`${l.to}-${l.label}`}>
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
    <footer className="bg-brand-dark px-4 py-12 text-sm text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-control"
          >
            <BrandMark className="h-9 w-auto text-white" />
            <span className="font-heading text-xl font-medium text-white">
              GilMars StaySync
            </span>
          </Link>
          <p className="max-w-xs text-white/80">
            Reserve a GilMars stay and message the team about dates, bookings or
            anything else.
          </p>
          <p className="text-white/80">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex min-h-11 items-center hover:text-white hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            <br />
            Facebook and Instagram: {SOCIAL_NAME}
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
            // Guests already get "Ask a question" in their account column.
            ...(role === "guest"
              ? []
              : [
                  {
                    label: "Ask a question",
                    to: !role ? "/inquire" : "/help",
                  },
                ]),
            { label: "Help and booking rules", to: "/help" },
          ]}
        />
      </div>
      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-1 border-t border-white/20 pt-4 text-xs text-white/80 sm:flex-row sm:justify-between">
        <p>© {year} GilMars StaySync</p>
        <ul className="flex flex-wrap gap-x-4">
          {(
            [
              ["/privacy", "Privacy"],
              ["/terms", "Terms"],
              ["/cancellation-policy", "Cancellation"],
              ["/house-rules", "House rules"],
            ] as const
          ).map(([to, label]) => (
            <li key={to}>
              <Link
                to={to}
                className="inline-flex min-h-11 items-center hover:text-white hover:underline"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <p>All dates and times are Asia/Manila.</p>
      </div>
    </footer>
  );
}
