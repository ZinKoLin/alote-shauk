import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { openApp } from "./helpers";

const key = "patama.cv.draft.v1";
const saved = (page: import("@playwright/test").Page) =>
  page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)!), key);

test("separate day/month/year restore the existing birthday and preserve all other data and attachments", async ({
  page,
}, testInfo) => {
  await page.clock.install({ time: new Date("2026-11-08T06:00:00Z") });
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
  const before = await saved(page);
  await page
    .getByRole("navigation", { name: "ဖောင်အဆင့်များ", exact: true })
    .getByRole("button", { name: /^ကိုယ်ရေးအချက်အလက်/ })
    .click();
  await expect(page.getByLabel("မွေးရက်", { exact: true })).toHaveValue("12");
  await expect(
    page.getByLabel("မွေးလ", { exact: true }).locator("option:checked"),
  ).toHaveText("မေ");
  await expect(page.getByLabel("မွေးနှစ်", { exact: true })).toHaveValue(
    "1998",
  );
  await page.getByLabel("မွေးနှစ်", { exact: true }).selectOption("2000");
  await page.getByLabel("မွေးလ", { exact: true }).selectOption("02");
  await page.getByLabel("မွေးရက်", { exact: true }).selectOption("13");
  await expect(
    page.locator(".cv-pages [data-row-id=birthday] .cv-value"),
  ).toHaveText("13 / 02 / 2000");
  await expect(
    page.locator(".cv-pages [data-row-id=age] .cv-value"),
  ).toHaveText("26");
  await page.reload();
  await expect(page.getByLabel("မွေးရက်", { exact: true })).toHaveValue("13");
  await expect(page.getByLabel("မွေးလ", { exact: true })).toHaveValue("02");
  await expect(page.getByLabel("မွေးနှစ်", { exact: true })).toHaveValue(
    "2000",
  );
  const after = await saved(page);
  expect(after.fields).toEqual({ ...before.fields, birthday: "2000-02-13" });
  expect(after.photo).toBe(before.photo);
  await expect(page.locator(".attachment-sheet img")).toHaveAttribute(
    "src",
    attachment!,
  );
  await page
    .getByRole("button", { name: "ဝဘ်ဆိုက်ဆက်တင်", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "English", exact: true })
    .click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByLabel("Day", { exact: true })).toHaveValue("13");
  await expect(
    page.getByLabel("Month", { exact: true }).locator("option:checked"),
  ).toHaveText("February");
  await expect(page.getByLabel("Year", { exact: true })).toHaveValue("2000");
  await page.screenshot({
    path: testInfo.outputPath("readable-birthday-1440.png"),
    fullPage: true,
  });
});

test("birthday validates leap years, impossible dates and future dates without silently changing the day", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-08T06:00:00Z") });
  await openApp(page);
  await page.getByLabel("အမည်အပြည့်အစုံ").fill("စမ်းသပ်အမည်");
  const day = page.getByLabel("မွေးရက်", { exact: true });
  const month = page.getByLabel("မွေးလ", { exact: true });
  const year = page.getByLabel("မွေးနှစ်", { exact: true });
  await year.selectOption("2024");
  await month.selectOption("02");
  await day.selectOption("29");
  expect((await saved(page)).fields.birthday).toBe("2024-02-29");
  await year.selectOption("2023");
  await expect(day).toHaveValue("");
  await expect(month).toHaveValue("02");
  await expect(year).toHaveValue("2023");
  await expect(day.locator('option[value="29"]')).toHaveCount(0);
  await expect(page.locator("#birthday-hint")).toContainText("ရက်ကို ပြန်ရွေး");
  await day.selectOption("28");
  expect((await saved(page)).fields.birthday).toBe("2023-02-28");
  await year.selectOption("2026");
  await month.selectOption("11");
  await expect(day).toHaveValue("");
  await day.selectOption("08");
  expect((await saved(page)).fields.birthday).toBe("2026-11-08");
  await expect(day.locator('option[value="09"]')).toHaveCount(0);
  await expect(month.locator('option[value="12"]')).toBeDisabled();
  await expect(year.locator('option[value="2027"]')).toHaveCount(0);
  await page
    .getByRole("button", { name: "မွေးသက္ကရာဇ်ဖျက်ရန်", exact: true })
    .click();
  await expect(day).toHaveValue("");
  await expect(month).toHaveValue("");
  await expect(year).toHaveValue("");
  expect((await saved(page)).fields.name).toBe("စမ်းသပ်အမည်");
});

test("an unfinished birthday persists while navigating, blocks export and clears with start over", async ({
  page,
}) => {
  await openApp(page);
  await page.getByLabel("အမည်အပြည့်အစုံ").fill("မောင်စမ်းသပ်");
  await page.getByLabel("မွေးရက်", { exact: true }).selectOption("12");
  await page.getByRole("button", { name: "ရှေ့ဆက်ရန်", exact: true }).click();
  await page
    .getByRole("button", { name: "PDF ဒေါင်းလုဒ်", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("သုံးခုလုံးရွေးပါ");
  await expect(page.getByLabel("မွေးရက်", { exact: true })).toHaveValue("12");
  await page.getByRole("button", { name: "အသစ်စရန်", exact: true }).click();
  await page
    .getByRole("button", { name: "ဖျက်ပြီး အသစ်စမည်", exact: true })
    .click();
  await expect(page.getByLabel("မွေးရက်", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("မွေးလ", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("မွေးနှစ်", { exact: true })).toHaveValue("");
});

test("larger text and day/month/year controls stay readable without overflow at phone, tablet and desktop sizes", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const privacyText = page.locator(".privacy-detail p").first();
  await expect(privacyText).toBeVisible();
  expect(
    await privacyText.evaluate((element) =>
      parseFloat(getComputedStyle(element).fontSize),
    ),
  ).toBeGreaterThanOrEqual(14);
  await page.screenshot({
    path: testInfo.outputPath("readable-privacy-390.png"),
  });
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "သဘောတူပြီး ဆက်သုံးမည်", exact: true })
    .click();
  for (const width of [360, 390, 820, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const id of ["birthday-day", "birthday-month", "birthday-year"]) {
      const size = await page.locator(`#${id}`).evaluate((element) => ({
        font: parseFloat(getComputedStyle(element).fontSize),
        width: element.getBoundingClientRect().width,
      }));
      expect(size.font).toBeGreaterThanOrEqual(16);
      expect(size.width).toBeGreaterThan(60);
    }
    const parts = await page
      .locator(".birthday-part")
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().left),
      );
    expect(parts[0]).toBeLessThan(parts[1]);
    expect(parts[1]).toBeLessThan(parts[2]);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath(`readable-form-${width}.png`),
      fullPage: true,
    });
  }
});
