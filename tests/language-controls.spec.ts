import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { openApp } from "./helpers";

test("visible language controls keep website and CV preferences separate and preserve the existing draft", async ({
  page,
}) => {
  await openApp(page);
  await page.getByRole("button", { name: "နမူနာဖြည့်ကြည့်မည်" }).click();
  await page.getByRole("button", { name: "အသိပေးချက်ပိတ်ရန်" }).click();
  await page
    .getByLabel("CV ဓာတ်ပုံရွေးရန်")
    .setInputFiles(resolve("tests/fixtures/nrc-front.png"));
  await page.getByRole("button", { name: /^စာရွက်စာတမ်းများ/ }).click();
  await page
    .getByLabel("အိမ်ထောင်စုစာရင်း ထည့်ရန်", { exact: true })
    .setInputFiles(resolve("tests/fixtures/household.png"));
  await expect(page.locator(".attachment-sheet")).toHaveCount(1);
  const attachment = await page
    .locator(".attachment-sheet img")
    .getAttribute("src");
  const before = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("patama.cv.draft.v1")!),
  );
  const toolbar = page.locator(".language-toolbar");
  await expect(
    toolbar
      .getByRole("button", { name: "English", exact: true })
      .locator("svg"),
  ).toBeVisible();
  await toolbar.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    toolbar.getByLabel("CV document language", { exact: true }),
  ).toHaveValue("my");
  await expect(page.locator(".cv-pages h2").first()).toHaveText(
    "ကိုယ်ရေးရာဇဝင်အကျဉ်း",
  );
  await toolbar
    .getByLabel("CV document language", { exact: true })
    .selectOption("en");
  await expect(page.locator(".cv-pages h2").first()).toHaveText(
    "CURRICULUM VITAE",
  );
  await toolbar.getByRole("button", { name: "မြန်မာ", exact: true }).click();
  await expect(
    toolbar.getByLabel("CV ထုတ်မည့်ဘာသာစကား", { exact: true }),
  ).toHaveValue("en");
  await expect(page.locator(".cv-pages h2").first()).toHaveText(
    "CURRICULUM VITAE",
  );
  const after = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("patama.cv.draft.v1")!),
  );
  expect(after.fields).toEqual(before.fields);
  expect(after.photo).toBe(before.photo);
  expect(after.cvLanguage).toBe("en");
  await expect(page.locator(".attachment-sheet img")).toHaveAttribute(
    "src",
    attachment!,
  );
  await page.reload();
  await expect(
    toolbar.getByLabel("CV ထုတ်မည့်ဘာသာစကား", { exact: true }),
  ).toHaveValue("en");
  await expect(page.locator(".attachment-sheet")).toHaveCount(1);
  await expect(page.locator(".site-footer")).toContainText("Developed by");
  await expect(page.locator(".site-footer-credit strong")).toHaveText(
    "ZinKoLyn",
  );
  await page.emulateMedia({ media: "print" });
  await expect(toolbar).toBeHidden();
  await expect(page.locator(".site-footer")).toBeHidden();
});

test("language selectors and developer footer fit desktop and mobile in both languages", async ({
  page,
}, testInfo) => {
  await openApp(page);
  for (const width of [360, 390, 820, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const language of ["English", "မြန်မာ"]) {
      const toolbar = page.locator(".language-toolbar");
      await toolbar
        .getByRole("button", { name: language, exact: true })
        .click();
      await page.evaluate(() => scrollTo(0, 0));
      await expect(toolbar).toBeInViewport();
      for (const control of await toolbar.locator("button, select").all()) {
        await expect(control).toBeInViewport();
        const bounds = await control.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(
          `languages-${language === "English" ? "en" : "my"}-${width}.png`,
        ),
      });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  await expect(page.locator(".site-footer-credit")).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath("developer-footer-390.png"),
  });
});
