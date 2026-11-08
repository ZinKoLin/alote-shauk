import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openApp } from "./helpers";

const draftKey = "patama.cv.draft.v1";

test("privacy requires explicit agreement before reading the existing CV or opening document storage", async ({
  page,
  context,
}, testInfo) => {
  await page.addInitScript((key) => {
    if (!sessionStorage.getItem(key))
      sessionStorage.setItem(
        key,
        JSON.stringify({
          fields: { name: "မူလအမည်", phone: "09 987 654 321" },
          photo: "",
          template: "form",
          hideEmpty: false,
          updatedAt: Date.now(),
        }),
      );
    (
      window as unknown as { documentStorageOpens: number }
    ).documentStorageOpens = 0;
    const original = indexedDB.open.bind(indexedDB);
    indexedDB.open = (...args: Parameters<IDBFactory["open"]>) => {
      (window as unknown as { documentStorageOpens: number })
        .documentStorageOpens++;
      return original(...args);
    };
  }, draftKey);
  await page.goto("/");
  const original = await page.evaluate(
    (key) => sessionStorage.getItem(key),
    draftKey,
  );
  await expect(page.getByTestId("privacy-consent")).toBeVisible();
  await expect(page.locator('[data-app-state="ready"]')).toHaveCount(0);
  await expect(page.getByLabel("အမည်အပြည့်အစုံ")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "သဘောတူပြီး ဆက်သုံးမည်", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("privacy-consent")).toBeVisible();
  await page.getByRole("button", { name: "မသဘောတူပါ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ဖောင်ကို မဖွင့်ထားပါ");
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), draftKey),
  ).toBe(original);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { documentStorageOpens: number })
          .documentStorageOpens,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your information stays with you." }),
  ).toBeVisible();
  await expect(page.getByTestId("privacy-consent")).toContainText(
    "not collected or used",
  );
  await expect(page.getByTestId("privacy-consent")).toContainText(
    "IP addresses",
  );
  await page.screenshot({ path: testInfo.outputPath("privacy-english.png") });
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "I agree and continue", exact: true })
    .click();
  await expect(page.getByLabel("Full name", { exact: false })).toHaveValue(
    "မူလအမည်",
  );
  await expect(
    page.locator(".cv-pages [data-row-id=phone] .cv-value"),
  ).toHaveText("09 987 654 321");
  await page.reload();
  await expect(page.getByTestId("privacy-consent")).toHaveCount(0);
  await expect(page.getByLabel("Full name", { exact: false })).toHaveValue(
    "မူလအမည်",
  );
  const fresh = await context.newPage();
  await fresh.goto("/");
  await expect(fresh.getByTestId("privacy-consent")).toBeVisible();
  await fresh.close();
});

test("dark theme and English UI/CV settings persist without changing filled data, photos or attachments", async ({
  page,
}, testInfo) => {
  await openApp(page);
  await page.getByRole("button", { name: "နမူနာဖြည့်ကြည့်မည်" }).click();
  await page.getByRole("button", { name: "အသိပေးချက်ပိတ်ရန်" }).click();
  await page
    .getByLabel("CV ဓာတ်ပုံရွေးရန်")
    .setInputFiles(resolve("tests/fixtures/nrc-front.png"));
  await expect(page.locator(".cv-pages .cv-photo img")).toHaveCount(1);
  await page.getByRole("button", { name: /^စာရွက်စာတမ်းများ/ }).click();
  await page
    .getByLabel("အိမ်ထောင်စုစာရင်း ထည့်ရန်", { exact: true })
    .setInputFiles(resolve("tests/fixtures/household.png"));
  await expect(page.locator(".attachment-sheet")).toHaveCount(1);
  const attachment = await page
    .locator(".attachment-sheet img")
    .getAttribute("src");
  const before = await page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)!),
    draftKey,
  );
  await page
    .getByRole("button", { name: "ဝဘ်ဆိုက်ဆက်တင်", exact: true })
    .click();
  await page.getByRole("button", { name: "အမှောင်", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "English", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Website settings" }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByLabel("CV document language", { exact: true })
    .selectOption("en");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const after = await page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)!),
    draftKey,
  );
  expect(after.fields).toEqual(before.fields);
  expect(after.photo).toBe(before.photo);
  expect(after.cvLanguage).toBe("en");
  await expect(page.locator(".attachment-sheet img")).toHaveAttribute(
    "src",
    attachment!,
  );
  await expect(
    page.locator(".cv-pages [data-row-id=gender] .cv-value"),
  ).toHaveText("Male");
  await expect(page.locator(".cv-pages h2").first()).toHaveText(
    "CURRICULUM VITAE",
  );
  expect(
    await page
      .locator(".cv-pages .cv-sheet")
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe("rgb(255, 255, 255)");
  expect(await page.locator(".form-card").innerText()).not.toMatch(
    /[\u1000-\u109f]/,
  );
  await page.getByRole("button", { name: /^Personal details/ }).click();
  await page.getByLabel("Full name", { exact: false }).fill("Alex Aung");
  await expect(
    page.getByLabel("Gender", { exact: true }).locator("option:checked"),
  ).toHaveText("Male");
  await page.reload();
  await expect(page.getByLabel("Full name", { exact: false })).toHaveValue(
    "Alex Aung",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".attachment-sheet")).toHaveCount(1);
  await page.screenshot({
    path: testInfo.outputPath("dark-english-1440.png"),
    fullPage: true,
  });
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  const download = await promise;
  const path = testInfo.outputPath("english-CV-with-household.pdf");
  await download.saveAs(path);
  const pdf = (await readFile(path)).toString("latin1");
  expect(pdf.match(/\/Type\s*\/Page\b/g)).toHaveLength(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Dismiss notification", exact: true })
    .click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("dark-english-390.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("new English forms support all templates and long English text in the PDF", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "I agree and continue", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Try sample details", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Dismiss notification", exact: true })
    .click();
  await expect(page.getByLabel("Full name", { exact: false })).toHaveValue(
    "Aung Myint",
  );
  expect(await page.locator(".cv-pages").innerText()).not.toMatch(
    /[\u1000-\u109f]/,
  );
  await page
    .getByRole("button", { name: "Design & layout", exact: true })
    .click();
  await page.getByRole("button", { name: "Classic", exact: true }).click();
  await expect(
    page.locator(".cv-pages .template-classic").first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Modern", exact: true }).click();
  await expect(page.locator(".cv-pages h2").first()).toHaveText("Aung Myint");
  await page.getByRole("button", { name: "Application", exact: true }).click();
  await page.getByRole("button", { name: /^Education & experience/ }).click();
  const experience = Array.from(
    { length: 45 },
    (_, index) => `${index + 1}. Example experience`,
  ).join("\n");
  await page.getByLabel("Work experience", { exact: true }).fill(experience);
  await expect
    .poll(() => page.locator(".cv-pages .cv-sheet").count())
    .toBeGreaterThan(1);
  expect(
    (
      await page
        .locator(".cv-pages [data-row-id=experience] .cv-value")
        .allTextContents()
    ).join(""),
  ).toBe(experience);
  await expect(page.locator(".cv-pages")).toContainText("(continued)");
  const count = await page.locator(".cv-pages .cv-sheet").count();
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  const download = await promise;
  const path = testInfo.outputPath("long-english-CV.pdf");
  await download.saveAs(path);
  expect(
    (await readFile(path)).toString("latin1").match(/\/Type\s*\/Page\b/g),
  ).toHaveLength(count);
});

test("system theme follows the device and both consent languages fit a phone", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByTestId("privacy-consent")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("privacy-myanmar-dark-390.png"),
  });
  const bounds = await page.getByTestId("privacy-consent").boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.height).toBeLessThanOrEqual(844);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "I agree and continue", exact: true }),
  ).toBeDisabled();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({
    path: testInfo.outputPath("privacy-english-light-390.png"),
  });
});
