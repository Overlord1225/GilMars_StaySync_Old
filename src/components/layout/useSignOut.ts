import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/components/ui/useToast";

export function useSignOut() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login");
    } catch {
      showToast("We couldn’t sign you out. Please try again.", "error");
    } finally {
      setSigningOut(false);
    }
  }

  return { signingOut, handleSignOut: () => void handleSignOut() };
}
