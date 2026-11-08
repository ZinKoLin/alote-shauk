import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function openApp(page: Page) {
  const response = await page.goto("/");
  await expect(page.locator("[data-app-state]")).toBeVisible();
  if (await page.getByTestId("privacy-consent").count()) {
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", {
        name: /သဘောတူပြီး ဆက်သုံးမည်|I agree and continue/,
      })
      .click();
  }
  await expect(page.locator('[data-app-state="ready"]')).toBeVisible();
  return response;
}
