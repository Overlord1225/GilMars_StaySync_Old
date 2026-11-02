import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/useAuth";
import { roleHome } from "@/features/auth/roleRedirect";

const linkClass =
  "inline-flex min-h-11 items-center justify-center rounded-control px-4 font-medium";

export default function NotFound() {
  const { user } = useAuth();
  const home = user?.is_active && user.role ? roleHome(user.role) : "/";

  return (
    <div className="flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md space-y-3 text-center">
        <h1 className="text-3xl font-semibold text-brand-dark">
          Page not found
        </h1>
        <p className="text-text-muted">This page doesn’t exist or has moved.</p>
        <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:justify-center">
          <Link
            to={home}
            className={`${linkClass} bg-brand text-white hover:bg-brand-dark`}
          >
            {home === "/" ? "Home" : "Go to my dashboard"}
          </Link>
          <Link
            to="/units"
            className={`${linkClass} border border-border bg-surface text-text hover:bg-mist`}
          >
            Browse stays
          </Link>
        </div>
      </Card>
    </div>
  );
}
