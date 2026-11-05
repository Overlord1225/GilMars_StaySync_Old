import { describe, expect, it } from "vitest";
import { accountLinks, headerLinks } from "./siteNav";

const targets = (role: Parameters<typeof headerLinks>[0]) =>
  headerLinks(role).map((l) => l.to);

describe("siteNav", () => {
  it("signed out gets only public links", () => {
    expect(targets(null)).toEqual(["/units", "/help"]);
    expect(accountLinks(null).map((l) => l.to)).toEqual([
      "/login",
      "/register",
    ]);
  });

  it("guest gets guest links and no staff links", () => {
    const t = targets("guest");
    expect(t).toContain("/my-bookings");
    expect(t).toContain("/account");
    expect(
      t.some((p) => p.startsWith("/admin") || p.startsWith("/super")),
    ).toBe(false);
  });

  it("admin never links to /super or guest pages", () => {
    const t = targets("admin");
    expect(t).toContain("/admin");
    expect(t).not.toContain("/super");
    expect(t).not.toContain("/my-bookings");
  });

  it("super admin never links to /admin or /tests", () => {
    const t = targets("super_admin");
    expect(t).toContain("/super");
    expect(t).toContain("/super/account");
    expect(
      t.some((p) => p.startsWith("/admin") || p.startsWith("/tests")),
    ).toBe(false);
  });
});
