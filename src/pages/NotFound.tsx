import { Link } from "react-router-dom";
import { buttonClass } from "@/components/ui/buttonStyles";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/useAuth";
import { roleHome } from "@/features/auth/roleRedirect";

export default function NotFound() {
  const { user } = useAuth();
  const home = user?.is_active && user.role ? roleHome(user.role) : "/";

  return (
    <div className="flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md space-y-3 text-center">
        <h1 className="text-3xl text-brand-dark">Page not found</h1>
        <p className="text-ink-muted">This page doesn’t exist or has moved.</p>
        <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:justify-center">
          <Link to={home} className={buttonClass("primary")}>
            {home === "/" ? "Home" : "Go to my dashboard"}
          </Link>
          <Link to="/units" className={buttonClass("secondary")}>
            Browse stays
          </Link>
        </div>
      </Card>
    </div>
  );
}
