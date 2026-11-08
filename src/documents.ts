export type Orientation = "portrait" | "landscape";
export type DocumentImage = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  orientation: Orientation;
};
export type Documents = {
  front: DocumentImage | null;
  back: DocumentImage | null;
  household: DocumentImage[];
  certificates: DocumentImage[];
};
export type DocumentGroup = keyof Documents;
export const MAX_DOCUMENT_IMAGES = 20;
export const emptyDocuments = (): Documents => ({
  front: null,
  back: null,
  household: [],
  certificates: [],
});
export const documentImageCount = (docs: Documents) =>
  Number(!!docs.front) +
  Number(!!docs.back) +
  docs.household.length +
  docs.certificates.length;
export const documentPageCount = (docs: Documents) =>
  Number(!!docs.front || !!docs.back) +
  docs.household.length +
  docs.certificates.length;
export const documentPageSizes = (docs: Documents) => [
  ...(docs.front || docs.back ? [{ width: 794, height: 1123 }] : []),
  ...docs.household.map(() => ({ width: 1123, height: 794 })),
  ...docs.certificates.map((doc) =>
    doc.orientation === "landscape"
      ? { width: 1123, height: 794 }
      : { width: 794, height: 1123 },
  ),
];

function canvasImage(
  canvas: HTMLCanvasElement,
  name: string,
  orientation?: Orientation,
): DocumentImage {
  return {
    id: crypto.randomUUID(),
    name,
    src: canvas.toDataURL("image/jpeg", 0.92),
    width: canvas.width,
    height: canvas.height,
    orientation:
      orientation || (canvas.width > canvas.height ? "landscape" : "portrait"),
  };
}

async function imageFromFile(file: File): Promise<DocumentImage> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const ratio = Math.min(
      1,
      2400 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("ပုံကို ပြင်ဆင်၍ မရပါ။");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvasImage(canvas, file.name);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function readDocumentFiles(
  files: File[],
  remaining: number,
  imagesOnly = false,
): Promise<DocumentImage[]> {
  const result: DocumentImage[] = [];
  for (const file of files) {
    if (file.size > 20 * 1024 * 1024)
      throw new Error("တစ်ဖိုင်လျှင် 20 MB ထက် မကျော်ရပါ။");
    if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      if (result.length >= remaining)
        throw new Error(
          "စာရွက်စာတမ်းပုံ စုစုပေါင်း ၂၀ ပုံအထိသာ ထည့်နိုင်ပါတယ်။",
        );
      try {
        result.push(await imageFromFile(file));
      } catch {
        throw new Error(
          "ပုံကို ဖတ်မရပါ။ JPG၊ PNG သို့မဟုတ် WebP ပုံမှန်ဖိုင်ကို ရွေးပေးပါ။",
        );
      }
    } else if (file.type === "application/pdf" && !imagesOnly) {
      const [pdfjs, { default: workerSrc }] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
      ]);
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      const task = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        useSystemFonts: true,
        useWasm: false,
        disableWorkerRendering: true,
        cMapUrl: "/pdfjs/cmaps/",
        cMapPacked: true,
        standardFontDataUrl: "/pdfjs/standard_fonts/",
        wasmUrl: "/pdfjs/wasm/",
      });
      // Fail promptly for password-protected PDFs; never ask for a password in this form.
      task.onPassword = () => {
        void task.destroy();
      };
      try {
        const pdf = await task.promise;
        if (pdf.numPages + result.length > remaining)
          throw new Error(
            "စာရွက်စာတမ်းပုံ စုစုပေါင်း ၂၀ ပုံအထိသာ ထည့်နိုင်ပါတယ်။",
          );
        for (let number = 1; number <= pdf.numPages; number++) {
          const page = await pdf.getPage(number);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({
            scale: Math.min(3, 2400 / Math.max(base.width, base.height)),
          });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({
            canvas,
            viewport,
            background: "rgb(255,255,255)",
          }).promise;
          result.push(
            canvasImage(
              canvas,
              pdf.numPages > 1 ? `${file.name} (${number})` : file.name,
            ),
          );
          canvas.width = 0;
          canvas.height = 0;
          page.cleanup();
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("၂၀")) throw error;
        throw new Error(
          "PDF ကို ဖတ်မရပါ။ စကားဝှက်မပါသော ပုံမှန် PDF ဖိုင်ကို ရွေးပေးပါ။",
        );
      } finally {
        await task.destroy().catch(() => {});
      }
    } else
      throw new Error(
        imagesOnly
          ? "မှတ်ပုံတင်အတွက် JPG၊ PNG သို့မဟုတ် WebP ပုံကို ရွေးပေးပါ။"
          : "JPG၊ PNG၊ WebP သို့မဟုတ် PDF ဖိုင်ကို ရွေးပေးပါ။",
      );
  }
  return result;
}

export async function rotateDocument(
  doc: DocumentImage,
): Promise<DocumentImage> {
  const image = new Image();
  image.src = doc.src;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalHeight;
  canvas.height = image.naturalWidth;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ပုံကို လှည့်၍ မရပါ။");
  context.translate(canvas.width, 0);
  context.rotate(Math.PI / 2);
  context.drawImage(image, 0, 0);
  return { ...canvasImage(canvas, doc.name), id: doc.id };
}
