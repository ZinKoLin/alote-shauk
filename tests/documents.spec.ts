import { openApp } from "./helpers";
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { jsPDF } from "jspdf";

const key = "patama.cv.draft.v1";
const fixture = (name: string) => resolve("tests/fixtures", name);
const stored = async (page: import("@playwright/test").Page) =>
  page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)!), key);

async function start(page: import("@playwright/test").Page) {
  await openApp(page);
  await page.getByRole("button", { name: "နမူနာဖြည့်ကြည့်မည်" }).click();
  await page.getByRole("button", { name: "အသိပေးချက်ပိတ်ရန်" }).click();
  await page
    .getByLabel("CV ဓာတ်ပုံရွေးရန်")
    .setInputFiles(fixture("nrc-front.png"));
  await expect(page.locator(".cv-photo img")).toHaveCount(2); // Includes the hidden measuring copy.
  await page.getByRole("button", { name: /^စာရွက်စာတမ်းများ/ }).click();
  await expect(page.locator(".document-editor")).toBeVisible();
}

test("appends ID sides, landscape household and image/PDF certificates while preserving the original CV", async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    if (
      !/^(http:\/\/(127\.0\.0\.1|localhost):\d+\/|data:|blob:)/.test(
        request.url(),
      )
    )
      external.push(request.url());
  });
  await start(page);
  const before = await stored(page);
  await page
    .getByLabel("အရှေ့ခြမ်းပုံထည့်ရန်", { exact: true })
    .setInputFiles(fixture("nrc-front.png"));
  await expect(page.locator(".nrc-sheet img")).toHaveCount(1);
  await page
    .getByLabel("အနောက်ခြမ်းပုံထည့်ရန်", { exact: true })
    .setInputFiles(fixture("nrc-back.png"));
  await expect(page.locator(".nrc-sheet img")).toHaveCount(2);
  await page
    .getByLabel("အိမ်ထောင်စုစာရင်း ထည့်ရန်", { exact: true })
    .setInputFiles(fixture("household.png"));
  await expect(page.locator(".attachment-sheet.landscape-sheet")).toHaveCount(
    1,
  );
  await page
    .getByLabel("ဘွဲ့ / အောင်လက်မှတ် ထည့်ရန်", { exact: true })
    .setInputFiles(fixture("certificate.png"));
  await expect(page.locator(".attachment-sheet")).toHaveCount(3);
  const input = new jsPDF();
  input.setFontSize(24);
  input.text("FIRST PDF CERTIFICATE", 20, 30);
  input.addPage("a4", "landscape");
  input.text("SECOND PDF CERTIFICATE", 20, 30);
  await page
    .getByLabel("ဘွဲ့ / အောင်လက်မှတ် ထည့်ရန်", { exact: true })
    .setInputFiles({
      name: "two-certificates.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(input.output("arraybuffer")),
    });
  await expect(page.locator(".attachment-sheet")).toHaveCount(5);
  await expect(page.locator(".attachment-sheet.landscape-sheet")).toHaveCount(
    2,
  );
  await page.reload();
  await expect(page.locator(".attachment-sheet")).toHaveCount(5);
  const after = await stored(page);
  expect(after.fields).toEqual(before.fields);
  expect(after.photo).toBe(before.photo);
  expect(after.template).toBe(before.template);
  await expect(
    page.locator(".cv-pages [data-row-id=name] .cv-value"),
  ).toHaveText(before.fields.name);
  const isolated = await context.newPage();
  await openApp(isolated);
  await expect(isolated.getByLabel("အမည်အပြည့်အစုံ")).toHaveValue("");
  await expect(
    isolated.getByRole("button", { name: "PDF ဒေါင်းလုဒ်", exact: true }),
  ).toBeEnabled();
  await expect(isolated.locator(".attachment-sheet")).toHaveCount(0);
  await isolated.close();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "PDF ဒေါင်းလုဒ်", exact: true })
    .click();
  const download = await downloadPromise;
  const output = testInfo.outputPath("complete-application.pdf");
  await download.saveAs(output);
  const pdf = (await readFile(output)).toString("latin1");
  expect(pdf.match(/\/Type\s*\/Page\b/g)).toHaveLength(6);
  const boxes = [
    ...pdf.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g),
  ].map((match) =>
    Number(match[1]) > Number(match[2]) ? "landscape" : "portrait",
  );
  expect(boxes).toEqual([
    "portrait",
    "portrait",
    "landscape",
    "portrait",
    "portrait",
    "landscape",
  ]);
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: testInfo.outputPath("complete-application-print.pdf"),
    preferCSSPageSize: true,
    printBackground: true,
  });
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: /^စာရွက်စာတမ်းများ/ }).click();
  const toastClose = page.getByRole("button", { name: "အသိပေးချက်ပိတ်ရန်" });
  if (await toastClose.count()) await toastClose.click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("document-editor-1440.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("document rotation, order, orientation and removal keep CV fields intact on desktop and phone", async ({
  page,
}, testInfo) => {
  await start(page);
  const before = await stored(page);
  await page
    .getByLabel("အရှေ့ခြမ်းပုံထည့်ရန်", { exact: true })
    .setInputFiles(fixture("nrc-front.png"));
  await expect(page.locator(".nrc-sheet img")).toHaveCount(1);
  await page
    .getByRole("button", { name: "nrc-front.png ပုံလှည့်ရန်", exact: true })
    .click();
  await expect
    .poll(() =>
      page
        .locator(".nrc-sheet img")
        .evaluate(
          (image: HTMLImageElement) => image.naturalHeight > image.naturalWidth,
        ),
    )
    .toBe(true);
  await page
    .getByLabel("ဘွဲ့ / အောင်လက်မှတ် ထည့်ရန်", { exact: true })
    .setInputFiles([fixture("certificate.png"), fixture("household.png")]);
  await expect(page.locator(".attachment-sheet")).toHaveCount(3);
  await page
    .getByRole("button", { name: "household.png ရှေ့ရွှေ့ရန်", exact: true })
    .click();
  await expect(
    page.locator(".attachment-sheet").nth(1).locator("img"),
  ).toHaveAttribute("alt", "household.png");
  await page
    .getByLabel("certificate.png စာမျက်နှာအနေအထား", { exact: true })
    .selectOption("landscape");
  await expect(page.locator(".attachment-sheet.landscape-sheet")).toHaveCount(
    2,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("document-editor-390.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /နမူနာကြည့်ရန်/ }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("document-preview-390.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "ဖောင်ဖြည့်ရန်", exact: true })
    .click();
  await page
    .getByRole("button", { name: "nrc-front.png ဖယ်ရန်", exact: true })
    .click();
  await expect(page.locator(".nrc-sheet")).toHaveCount(0);
  expect((await stored(page)).fields).toEqual(before.fields);
  expect((await stored(page)).photo).toBe(before.photo);
  await page.getByRole("button", { name: "အသစ်စရန်", exact: true }).click();
  await page
    .getByRole("button", { name: "ဖျက်ပြီး အသစ်စမည်", exact: true })
    .click();
  await expect(page.locator(".attachment-sheet")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".attachment-sheet")).toHaveCount(0);
  await expect(page.getByLabel("အမည်အပြည့်အစုံ")).toHaveValue("");
});

test("documents expire with the CV and invalid uploads do not replace existing documents", async ({
  page,
}) => {
  await page.clock.install();
  await start(page);
  await page
    .getByLabel("အိမ်ထောင်စုစာရင်း ထည့်ရန်", { exact: true })
    .setInputFiles(fixture("household.png"));
  await expect(page.locator(".attachment-sheet")).toHaveCount(1);
  await page
    .getByLabel("အိမ်ထောင်စုစာရင်း ထည့်ရန်", { exact: true })
    .setInputFiles({
      name: "bad.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("broken PDF"),
    });
  await expect(page.getByRole("alert")).toContainText("PDF ကို ဖတ်မရပါ");
  await expect(page.locator(".attachment-sheet")).toHaveCount(1);
  await page.clock.fastForward(2 * 60 * 60 * 1000 + 16_000);
  await expect(page.locator(".attachment-sheet")).toHaveCount(0);
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), key),
  ).toBeNull();
  await page.reload();
  await expect(page.getByLabel("အမည်အပြည့်အစုံ")).toHaveValue("");
  await expect(page.locator(".attachment-sheet")).toHaveCount(0);
});

test("blocked document storage keeps existing CV data and reports the document fallback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      get: () => {
        throw new DOMException("Disabled", "SecurityError");
      },
    });
  });
  await start(page);
  const before = await stored(page);
  await page
    .getByLabel("အိမ်ထောင်စုစာရင်း ထည့်ရန်", { exact: true })
    .setInputFiles(fixture("household.png"));
  await expect(page.locator(".attachment-sheet")).toHaveCount(1);
  await expect(page.locator(".document-storage-warning")).toBeVisible();
  expect((await stored(page)).fields).toEqual(before.fields);
  await page.reload();
  await expect(page.getByLabel("အမည်အပြည့်အစုံ")).toHaveValue(
    before.fields.name,
  );
});
