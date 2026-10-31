import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="text-6xl font-bold text-brand">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-6">
          Page not found
        </h2>
        <p className="text-slate-600 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Button className="w-full" onClick={() => navigate("/")}>
          Back to home
        </Button>
        <Link
          to="/units"
          className="block mt-3 text-sm text-brand hover:underline"
        >
          Browse units
        </Link>
      </Card>
    </div>
  );
}
