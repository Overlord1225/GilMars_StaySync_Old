import type { Profile } from "@/lib/types";

/** A session is trusted only when its database profile exists and is active. */
export function hasActiveProfile(profile: Profile | null): profile is Profile {
  return profile !== null && profile.is_active;
}

/** Ignore asynchronous auth work after a newer session event has arrived. */
export function isCurrentAuthRequest(
  requestVersion: number,
  currentVersion: number,
): boolean {
  return requestVersion === currentVersion;
}
