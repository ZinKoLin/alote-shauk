export async function exportPdf(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  await document.fonts.ready;
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  pdf.setProperties({
    title: element.querySelector(".cv-english")
      ? "Curriculum Vitae"
      : "ကိုယ်ရေးရာဇဝင်အကျဉ်း",
    creator: "အလုပ်လျှောက် CV",
  });
  const sheets = element.querySelectorAll<HTMLElement>(".cv-sheet");
  if (!sheets.length) throw new Error("No document pages");
  const holder = document.createElement("div");
  holder.className = "pdf-render-holder";
  holder.setAttribute("aria-hidden", "true");
  document.body.append(holder);
  try {
    for (let i = 0; i < sheets.length; i++) {
      const clone = sheets[i].cloneNode(true) as HTMLElement;
      holder.replaceChildren(clone);
      const images = [...clone.querySelectorAll("img")];
      await Promise.all(images.map((image) => image.decode()));
      const landscape = sheets[i].dataset.orientation === "landscape";
      const pageWidth = landscape ? 297 : 210;
      const pageHeight = landscape ? 210 : 297;
      if (i > 0) pdf.addPage("a4", landscape ? "landscape" : "portrait");
      // Scanned pages are already images: keep their full resolution and avoid
      // rasterizing the entire app again for every certificate.
      if (
        clone.classList.contains("attachment-sheet") &&
        !clone.classList.contains("nrc-sheet") &&
        images.length === 1
      ) {
        const image = images[0];
        const style = getComputedStyle(clone);
        const left =
          (parseFloat(style.paddingLeft) * pageWidth) / clone.offsetWidth;
        const right =
          (parseFloat(style.paddingRight) * pageWidth) / clone.offsetWidth;
        const top =
          (parseFloat(style.paddingTop) * pageHeight) / clone.offsetHeight;
        const bottom =
          (parseFloat(style.paddingBottom) * pageHeight) / clone.offsetHeight;
        const ratio = Math.min(
          (pageWidth - left - right) / image.naturalWidth,
          (pageHeight - top - bottom) / image.naturalHeight,
        );
        const width = image.naturalWidth * ratio;
        const height = image.naturalHeight * ratio;
        pdf.addImage(
          image.src,
          "JPEG",
          left + (pageWidth - left - right - width) / 2,
          top + (pageHeight - top - bottom - height) / 2,
          width,
          height,
          undefined,
          "FAST",
        );
        continue;
      }
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        width: clone.offsetWidth,
        height: clone.offsetHeight,
        windowWidth: 1280,
        scrollX: 0,
        scrollY: 0,
      });
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        "FAST",
      );
      canvas.width = 0;
      canvas.height = 0;
    }
    const safeName =
      filename
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
        .slice(0, 80)
        .trim() || "my-cv";
    pdf.save(`${safeName}-CV.pdf`);
  } finally {
    holder.remove();
  }
}

export async function preparePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("JPG၊ PNG သို့မဟုတ် WebP ပုံကို ရွေးပေးပါ။");
  if (file.size > 8 * 1024 * 1024)
    throw new Error("ဓာတ်ပုံအရွယ်အစား 8 MB ထက် မကျော်ရပါ။");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error("ဒီဓာတ်ပုံကို ဖတ်မရပါ။ အခြားပုံတစ်ပုံ ရွေးပေးပါ။");
    }
    const canvas = document.createElement("canvas");
    const ratio = Math.min(
      1,
      640 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("ဓာတ်ပုံထည့်၍ မရပါ။ အခြား browser ဖြင့် စမ်းကြည့်ပါ။");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}
