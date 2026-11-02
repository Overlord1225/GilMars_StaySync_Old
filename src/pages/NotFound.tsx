import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center bg-mist px-4 py-16">
      <Card className="w-full max-w-md space-y-3 text-center">
        <h1 className="text-3xl font-semibold text-brand-dark">
          Page not found
        </h1>
        <p className="text-text-muted">This page doesn’t exist or has moved.</p>
        <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate("/")}>Home</Button>
          <Link
            to="/units"
            className="inline-flex min-h-11 items-center justify-center rounded-control border border-border bg-surface px-4 font-medium text-text hover:bg-mist"
          >
            Browse stays
          </Link>
        </div>
      </Card>
    </div>
  );
}
