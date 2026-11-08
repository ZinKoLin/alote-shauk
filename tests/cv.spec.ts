import { openApp } from "./helpers";
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const key = "patama.cv.draft.v1";
const sampleButton = "နမူနာဖြည့်ကြည့်မည်";

test("application date accepts past and future dates without changing the existing draft", async ({
  page,
}) => {
  await openApp(page);
  await page.getByRole("button", { name: sampleButton }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.locator(".cv-pages .cv-photo img")).toHaveCount(1);
  const before = await page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)!),
    key,
  );
  await expect(page.getByLabel("မွေးရက်", { exact: true })).toHaveValue("12");
  await expect(page.getByLabel("မွေးလ", { exact: true })).toHaveValue("05");
  await expect(page.getByLabel("မွေးနှစ်", { exact: true })).toHaveValue(
    "1998",
  );
  await page.getByRole("button", { name: "ရှေ့ဆက်ရန်", exact: true }).click();
  const applicationDate = page.getByLabel("အလုပ်လျှောက်သည့်ရက်စွဲ", {
    exact: true,
  });
  for (const date of ["2035-12-25", "1990-01-01", "2028-02-29"]) {
    await applicationDate.fill(date);
    await expect(applicationDate).toHaveValue(date);
    expect(
      await applicationDate.evaluate((input: HTMLInputElement) =>
        input.checkValidity(),
      ),
    ).toBe(true);
    const [year, month, day] = date.split("-");
    await expect(
      page.locator(".cv-pages [data-row-id=applicationDate] .cv-value"),
    ).toHaveText(`${day} / ${month} / ${year}`);
  }
  await page.reload();
  const after = await page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)!),
    key,
  );
  expect(after.fields).toEqual({
    ...before.fields,
    applicationDate: "2028-02-29",
  });
  expect(after.photo).toBe(before.photo);
  expect(after.template).toBe(before.template);
  expect(after.hideEmpty).toBe(before.hideEmpty);
  await expect(page.getByLabel("အမည်အပြည့်အစုံ")).toHaveValue(
    before.fields.name,
  );
});

test("empty draft validates name and filled data survives refresh only in this tab", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openApp(page);
  await page
    .getByRole("button", { name: "PDF ဒေါင်းလုဒ်", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("သင့်အမည်");
  await expect(page.getByLabel("အမည်အပြည့်အစုံ")).toBeFocused();
  await page.getByLabel("အမည်အပြည့်အစုံ").fill("မောင်စမ်းသပ်");
  await page
    .getByLabel("နိုင်ငံသားစိစစ်ရေးကတ်ပြားအမှတ်", { exact: true })
    .fill("၁၂/မရက(နိုင်)၁၂၃၄၅၆");
  await expect(
    page.locator(".cv-pages [data-row-id=name] .cv-value"),
  ).toHaveText("မောင်စမ်းသပ်");
  await page.reload();
  await expect(page.getByLabel("အမည်အပြည့်အစုံ")).toHaveValue("မောင်စမ်းသပ်");
  const isolatedTab = await context.newPage();
  await openApp(isolatedTab);
  await expect(isolatedTab.getByLabel("အမည်အပြည့်အစုံ")).toHaveValue("");
  await expect(page.getByLabel("အမည်အပြည့်အစုံ")).toHaveValue("မောင်စမ်းသပ်");
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([
    "alote-shauk.preferences.v1",
  ]);
  expect(errors).toEqual([]);
  await isolatedTab.close();
});

test("all form sections, templates, hiding blank fields, photo upload and reset work", async ({
  page,
}) => {
  await openApp(page);
  await page.getByRole("button", { name: sampleButton }).click();
  await expect(page.getByLabel("အမည်အပြည့်အစုံ")).toHaveValue(
    "မောင်အောင်မြင့်",
  );
  await page.getByRole("button", { name: "ရှေ့ဆက်ရန်", exact: true }).click();
  await page
    .getByLabel("အလုပ်အတွေ့အကြုံ")
    .fill("လုပ်ငန်းအတွေ့အကြုံအသစ်\nဒုတိယစာကြောင်း");
  await expect(page.locator(".cv-pages")).toContainText(
    "လုပ်ငန်းအတွေ့အကြုံအသစ်",
  );
  await page.getByRole("button", { name: "ရှေ့ဆက်ရန်", exact: true }).click();
  await expect(page.getByLabel("အဘအမည်", { exact: true })).toHaveValue(
    "ဦးမြင့်အောင်",
  );
  await page.getByRole("button", { name: "ရှေ့ဆက်ရန်", exact: true }).click();
  await page.getByLabel("ဖုန်းနံပါတ်", { exact: true }).fill("09 999 888 777");
  await page.getByRole("button", { name: "ရှေ့ဆက်ရန်", exact: true }).click();
  await page.getByRole("button", { name: "ရှေ့ဆက်ရန်", exact: true }).click();
  await page.getByRole("button", { name: "ခေတ်မီ", exact: true }).click();
  await expect(
    page.locator(".cv-pages .template-modern").first(),
  ).toBeVisible();
  await expect(page.locator(".cv-pages h2").first()).toHaveText(
    "မောင်အောင်မြင့်",
  );
  await page.getByRole("checkbox", { name: /မဖြည့်ထားတဲ့အချက်များ/ }).check();
  await expect(page.locator(".cv-pages .cv-value.is-empty")).toHaveCount(0);
  await page.locator("input[type=file]").setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.locator(".cv-pages .cv-photo img").first()).toBeVisible();
  await expect(page.locator(".cv-pages .cv-photo img")).toHaveCount(
    await page.locator(".cv-pages .cv-sheet").count(),
  );
  await page.getByRole("button", { name: "ဓာတ်ပုံဖယ်ရန်" }).click();
  await expect(page.locator(".cv-pages .cv-photo img")).toHaveCount(0);
  await page.getByRole("button", { name: "အသစ်စရန်", exact: true }).click();
  await page.getByRole("button", { name: "မလုပ်တော့ပါ", exact: true }).click();
  await expect(page.locator(".cv-pages")).toContainText("မောင်အောင်မြင့်");
  await page.getByRole("button", { name: "အသစ်စရန်", exact: true }).click();
  await page
    .getByRole("button", { name: "ဖျက်ပြီး အသစ်စမည်", exact: true })
    .click();
  await expect(page.getByLabel("အမည်အပြည့်အစုံ")).toHaveValue("");
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), key),
  ).toBeNull();
});

test("expired, malformed and future-dated drafts are discarded on load", async ({
  page,
}) => {
  await openApp(page);
  for (const value of [
    JSON.stringify({
      fields: { name: "expired" },
      updatedAt: Date.now() - 2 * 60 * 60 * 1000 - 1000,
    }),
    "{not-json",
    JSON.stringify({
      fields: { name: "future" },
      updatedAt: Date.now() + 60_000,
    }),
  ]) {
    await page.evaluate(
      ({ key, value }) => sessionStorage.setItem(key, value),
      { key, value },
    );
    await page.reload();
    await expect(page.getByLabel("အမည်အပြည့်အစုံ")).toHaveValue("");
    expect(
      await page.evaluate((key) => sessionStorage.getItem(key), key),
    ).toBeNull();
  }
});

test("open draft expires after two idle hours", async ({ page }) => {
  await page.clock.install();
  await openApp(page);
  await page.getByLabel("အမည်အပြည့်အစုံ").fill("ယာယီအမည်");
  await page.clock.fastForward(2 * 60 * 60 * 1000 + 16_000);
  await expect(page.getByLabel("အမည်အပြည့်အစုံ")).toHaveValue("");
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), key),
  ).toBeNull();
});

test("storage-disabled browser still edits and reports memory fallback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Disabled", "SecurityError");
    };
  });
  await openApp(page);
  await page.getByLabel("အမည်အပြည့်အစုံ").fill("စမ်းသပ်အမည်");
  await expect(page.locator(".save-status")).toContainText("ယခုဖွင့်ထားစဉ်သာ");
  await expect(page.locator(".cv-pages")).toContainText("စမ်းသပ်အမည်");
});

test("PDF is a real A4 download and print layout contains only the document", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await openApp(page);
  await page.getByRole("button", { name: sampleButton }).click();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page
      .locator(".cv-pages .cv-sheet")
      .evaluate((element) => getComputedStyle(element).fontFamily),
  ).toContain("Pyidaungsu");
  expect(
    await page.evaluate(() =>
      document.fonts.check("16px Pyidaungsu", "ကိုယ်ရေးအကျဉ်း"),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "အသိပေးချက်ပိတ်ရန်" }).click();
  const promise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "PDF ဒေါင်းလုဒ်", exact: true })
    .click();
  const download = await promise;
  const path = testInfo.outputPath("sample-CV.pdf");
  await download.saveAs(path);
  const pdf = await readFile(path);
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  expect(pdf.length).toBeGreaterThan(25_000);
  expect(pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".topbar")).toBeHidden();
  await expect(page.locator(".editor-column")).toBeHidden();
  await expect(page.locator(".cv-pages .cv-sheet")).toBeVisible();
  await page.pdf({
    path: testInfo.outputPath("print-CV.pdf"),
    preferCSSPageSize: true,
    printBackground: true,
  });
  expect(errors).toEqual([]);
});

test("long fields paginate without losing or clipping their content", async ({
  page,
}, testInfo) => {
  await openApp(page);
  await page.getByRole("button", { name: sampleButton }).click();
  await page.getByRole("button", { name: "ရှေ့ဆက်ရန်", exact: true }).click();
  const content = Array.from(
    { length: 65 },
    (_, i) => `${i + 1}. အလုပ်အတွေ့အကြုံ`,
  ).join("\n");
  await page.getByLabel("အလုပ်အတွေ့အကြုံ").fill(content);
  await expect
    .poll(async () => page.locator(".cv-pages .cv-sheet").count())
    .toBeGreaterThan(2);
  const rendered = await page
    .locator(".cv-pages [data-row-id=experience] .cv-value")
    .allTextContents();
  expect(rendered.join("")).toBe(content);
  expect(
    await page.locator(".cv-pages .cv-sheet").evaluateAll((sheets) =>
      sheets.every((sheet) => {
        const rows = [...sheet.querySelectorAll(".cv-row")];
        return rows.every(
          (row) =>
            row.getBoundingClientRect().bottom <=
            sheet.getBoundingClientRect().bottom - 20,
        );
      }),
    ),
  ).toBe(true);
  const expectedPages = await page.locator(".cv-pages .cv-sheet").count();
  const promise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "PDF ဒေါင်းလုဒ်", exact: true })
    .click();
  const download = await promise;
  const path = testInfo.outputPath("multi-page-CV.pdf");
  await download.saveAs(path);
  const pdf = await readFile(path);
  expect(pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)).toHaveLength(
    expectedPages,
  );
});

test("desktop and phone layouts render without horizontal overflow or external data requests", async ({
  page,
  baseURL,
}, testInfo) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (
      !request.url().startsWith(baseURL!) &&
      !/^(data:|blob:)/.test(request.url())
    )
      externalRequests.push(request.url());
  });
  await openApp(page);
  await page.getByRole("button", { name: sampleButton }).click();
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "အသိပေးချက်ပိတ်ရန်" }).click();
  await page.screenshot({
    path: testInfo.outputPath("desktop-1440.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: testInfo.outputPath("phone-form-390.png"),
    fullPage: true,
  });
  await expect(page.locator(".editor-column")).toBeVisible();
  await expect(page.locator(".preview-column")).toBeHidden();
  await page.getByRole("button", { name: /နမူနာကြည့်ရန်/ }).click();
  await expect(page.locator(".cv-pages .cv-sheet")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("phone-preview-390.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(externalRequests).toEqual([]);
});
