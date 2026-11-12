import { expect, test } from "@playwright/test";

// Read-only checks: no writes reach the Supabase project.
// Client redirects are UX only; real authorization is RLS/RPCs.

for (const path of [
  "/admin",
  "/admin/reservations",
  "/super",
  "/my-bookings",
  "/account",
]) {
  test(`anonymous visit to ${path} redirects to /login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  });
}

for (const path of ["/", "/units", "/help", "/login", "/register"]) {
  test(`public page ${path} renders`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("unknown route shows not-found, not a blank page", async ({ page }) => {
  await page.goto("/no-such-page");
  await expect(page.locator("main")).toBeVisible();
});
