import { describe, expect, it } from "vitest";
import type { Profile } from "@/lib/types";
import { hasActiveProfile, isCurrentAuthRequest } from "./profileAccess";

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
