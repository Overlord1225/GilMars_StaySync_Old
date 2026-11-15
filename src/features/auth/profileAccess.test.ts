import { describe, expect, it } from "vitest";
import type { Profile } from "@/lib/types";
import {
  AccountDeactivatedError,
  deactivatedMessage,
  hasActiveProfile,
  isCurrentAuthRequest,
} from "./profileAccess";

const profile = { is_active: true } as Profile;

describe("hasActiveProfile", () => {
  it("rejects a missing or inactive profile", () => {
    expect(hasActiveProfile(null)).toBe(false);
    expect(hasActiveProfile({ ...profile, is_active: false })).toBe(false);
  });

  it("accepts an active profile", () => {
    expect(hasActiveProfile(profile)).toBe(true);
  });
});

describe("isCurrentAuthRequest", () => {
  it("accepts the latest request and rejects a result superseded by a newer auth event", () => {
    expect(isCurrentAuthRequest(4, 4)).toBe(true);
    expect(isCurrentAuthRequest(3, 4)).toBe(false);
  });
});

describe("deactivatedMessage", () => {
  it("includes the staff reason when there is one", () => {
    expect(deactivatedMessage("Repeated no-shows")).toContain(
      "Reason: Repeated no-shows",
    );
  });

  it("ends the reason with one full stop before the next sentence", () => {
    expect(deactivatedMessage("Late fees")).toContain(
      "Reason: Late fees. Contact",
    );
    expect(deactivatedMessage("Late fees.")).toContain(
      "Reason: Late fees. Contact",
    );
  });

  it("falls back to a generic message without a reason", () => {
    expect(deactivatedMessage(null)).toBe(
      "Your account has been deactivated. Contact the GilMars team for help.",
    );
    expect(deactivatedMessage("   ")).not.toContain("Reason");
  });
});

describe("AccountDeactivatedError", () => {
  it("keeps a trimmed reason and treats blank as none", () => {
    expect(new AccountDeactivatedError("  late fees ").reason).toBe(
      "late fees",
    );
    expect(new AccountDeactivatedError("  ").reason).toBeNull();
  });
});
