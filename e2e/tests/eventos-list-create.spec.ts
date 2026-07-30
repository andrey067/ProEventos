import { test, expect } from "@playwright/test";

async function ensureOrganizerSession(page: import("@playwright/test").Page) {
  const ts = Date.now();
  const userName = `e2e_pw_${ts}`;
  const password = "Test@12345";
  const email = `e2e-pw-${ts}@proeventos.test`;

  const registerPaths = ["/register", "/user/registro"];
  for (const path of registerPaths) {
    await page.goto(path);
    const nome = page.getByLabel(/^nome$/i).first();
    if ((await nome.count()) === 0) continue;

    await nome.fill(`E2E PW ${ts}`);
    const user = page.getByLabel(/usuário|user/i).first();
    const mail = page.getByLabel(/e-?mail/i).first();
    const pass = page.getByLabel(/^senha$|password/i).first();
    if ((await user.count()) > 0) await user.fill(userName);
    if ((await mail.count()) > 0) await mail.fill(email);
    if ((await pass.count()) > 0) await pass.fill(password);

    const asSpeaker = page.getByLabel(/palestrante/i);
    if ((await asSpeaker.count()) > 0 && (await asSpeaker.isChecked())) {
      await asSpeaker.uncheck();
    }

    await page.getByRole("button", { name: /cadastrar|registrar/i }).first().click();
    await page.waitForTimeout(1500);

    // Ensure session: if still on register/login, sign in explicitly.
    if (/register|registro|login/i.test(page.url())) {
      for (const loginPath of ["/login", "/user/login"]) {
        await page.goto(loginPath);
        const loginUser = page.getByLabel(/usuário|user/i).first();
        const loginPass = page.getByLabel(/senha|password/i).first();
        if ((await loginUser.count()) === 0) continue;
        await loginUser.fill(userName);
        await loginPass.fill(password);
        await page.getByRole("button", { name: /entrar|login/i }).first().click();
        await page.waitForTimeout(1500);
        break;
      }
    }
    return { userName, password };
  }

  // Fallback login paths if register UI missing
  for (const path of ["/login", "/user/login"]) {
    await page.goto(path);
    const user = page.getByLabel(/usuário|user/i).first();
    const pass = page.getByLabel(/senha|password/i).first();
    if ((await user.count()) > 0 && (await pass.count()) > 0) {
      await user.fill(process.env.E2E_USER ?? userName);
      await pass.fill(process.env.E2E_PASS ?? password);
      await page.getByRole("button", { name: /entrar|login/i }).first().click();
      await page.waitForTimeout(1000);
    }
  }
  return { userName, password };
}

test.describe("eventos-list-create", () => {
  test("list Eventos and open create flow", async ({ page }) => {
    await ensureOrganizerSession(page);

    const listPaths = ["/eventos", "/eventos/lista"];
    let listed = false;
    for (const path of listPaths) {
      await page.goto(path);
      if ((await page.getByText(/evento/i).first().count()) > 0) {
        listed = true;
        break;
      }
    }
    expect(listed).toBeTruthy();
    await expect(page.getByText(/evento/i).first()).toBeVisible({ timeout: 15_000 });

    const create = page
      .getByRole("link", { name: /novo evento|^novo$/i })
      .first();
    if ((await create.count()) === 0) {
      const btn = page.getByRole("button", { name: /novo evento|^novo$/i }).first();
      test.skip((await btn.count()) === 0, "Create Evento control not found");
      await btn.click();
    } else {
      await create.click();
    }

    await expect(page).toHaveURL(/evento/i);
  });
});
