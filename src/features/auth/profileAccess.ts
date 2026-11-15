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

/** Thrown at sign-in when the account exists but staff deactivated it. */
export class AccountDeactivatedError extends Error {
  readonly reason: string | null;

  constructor(reason: string | null) {
    super("This account has been deactivated.");
    this.name = "AccountDeactivatedError";
    this.reason = reason?.trim() || null;
  }
}

/** What the person sees on the sign-in screen, including the staff reason. */
export function deactivatedMessage(reason: string | null): string {
  const base = "Your account has been deactivated.";
  const why = reason?.trim();
  return why
    ? `${base} Reason: ${/[.!?]$/.test(why) ? why : `${why}.`} Contact the GilMars team if you think this is a mistake.`
    : `${base} Contact the GilMars team for help.`;
}
