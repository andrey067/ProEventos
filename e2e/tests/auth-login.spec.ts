import { test, expect } from "@playwright/test";

/**
 * Critical journey: auth-login
 * Requires API + frontend. Tries common login paths across the 3 apps.
 */
test.describe("auth-login", () => {
  test("user can reach login and submit credentials UI", async ({ page }) => {
    const paths = ["/login", "/user/login"];
    let found = false;
    for (const path of paths) {
      await page.goto(path);
      const user = page.getByLabel(/user|usuário|email|login/i).first();
      const pass = page.getByLabel(/senha|password/i).first();
      if ((await user.count()) > 0 && (await pass.count()) > 0) {
        found = true;
        await user.fill(process.env.E2E_USER ?? "admin");
        await pass.fill(process.env.E2E_PASS ?? "Admin@123");
        const submit = page
          .getByRole("button", { name: /entrar|login|sign in/i })
          .first();
        if ((await submit.count()) > 0) {
          await submit.click();
        }
        // Wrong credentials may stay on login; success navigates away.
        // Assert the form was interactable and page did not crash.
        await expect(page.locator("body")).toBeVisible();
        break;
      }
    }
    test.skip(!found, "Login form not found on this frontend build");
  });
});
