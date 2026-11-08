import { useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { UserRound } from "lucide-react";
import { getRows } from "./model";
import type { CvRow, Draft } from "./model";
import type { Documents } from "./documents";
import DocumentSheets from "./DocumentSheets";

export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;

function SheetHeader({
  draft,
  continued = false,
}: {
  draft: Draft;
  continued?: boolean;
}) {
  return (
    <header className="cv-header">
      <div className="cv-heading">
        <p className="cv-eyebrow">
          {draft.template === "modern" ? "CURRICULUM VITAE" : ""}
        </p>
        <h2>
          {draft.template === "modern" ? (
            draft.fields.name ||
            (draft.cvLanguage === "en" ? "Your name" : "သင့်အမည်")
          ) : draft.cvLanguage === "en" ? (
            "CURRICULUM VITAE"
          ) : draft.template === "form" ? (
            "ကိုယ်ရေးရာဇဝင်အကျဉ်း"
          ) : (
            <>
              ကိုယ်ရေးရာဇဝင်
              <br />
              အကျဉ်း
            </>
          )}
        </h2>
        {draft.template === "modern" && draft.fields.desiredRole && (
          <p className="cv-role">{draft.fields.desiredRole}</p>
        )}
        {continued && (
          <span className="cv-continued">
            {draft.cvLanguage === "en"
              ? "Curriculum Vitae (continued)"
              : "ကိုယ်ရေးရာဇဝင်အကျဉ်း (အဆက်)"}
          </span>
        )}
      </div>
      <div className={`cv-photo ${draft.photo ? "has-photo" : ""}`}>
        {draft.photo ? (
          <img
            src={draft.photo}
            alt={draft.cvLanguage === "en" ? "CV photo" : "CV ဓာတ်ပုံ"}
          />
        ) : (
          <>
            <UserRound size={33} strokeWidth={1} />
            <span>{draft.cvLanguage === "en" ? "Photo" : "ဓာတ်ပုံ"}</span>
            <small>
              {draft.cvLanguage === "en" ? "1.5 × 2 in" : "၁.၅ × ၂ လက်မ"}
            </small>
          </>
        )}
      </div>
    </header>
  );
}

function Row({ row, index }: { row: CvRow; index: number }) {
  return row.heading ? (
    <div className="cv-section-heading" data-row-index={index}>
      {row.label}
    </div>
  ) : (
    <div
      className="cv-row"
      data-row-index={index}
      data-row-id={row.id.split("-")[0]}
    >
      <span className="cv-label">{row.label}</span>
      <span className="cv-separator">-</span>
      <span className={`cv-value ${row.value ? "" : "is-empty"}`}>
        {row.value || (
          <>
            <span className="empty-dash">—</span>
            <span className="cv-blank-lines" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </>
        )}
      </span>
    </div>
  );
}

export default function CvDocument({
  draft,
  documentRef,
  onPageCount,
  documents,
}: {
  draft: Draft;
  documentRef: RefObject<HTMLDivElement | null>;
  onPageCount: (count: number) => void;
  documents: Documents;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const rows = getRows(draft);
  const [layout, setLayout] = useState<{ rows: CvRow[]; ends: number[] }>({
    rows,
    ends: [rows.length],
  });

  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      if (!measureRef.current || cancelled) return;
      const nodes = [
        ...measureRef.current.querySelectorAll<HTMLElement>("[data-row-index]"),
      ];
      const style = getComputedStyle(measureRef.current);
      const available =
        PAGE_HEIGHT -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom) -
        measureRef.current.querySelector<HTMLElement>(".cv-header")!
          .offsetHeight -
        28;
      const prepared: { row: CvRow; height: number }[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const height = nodes[i].offsetHeight;
        if (height <= available || rows[i].heading) {
          prepared.push({ row: rows[i], height });
          continue;
        }
        // A single long field must also wrap across sheets, without losing text.
        const clone = nodes[i].cloneNode(true) as HTMLElement;
        nodes[i].parentElement!.append(clone);
        try {
          const value = clone.querySelector<HTMLElement>(".cv-value")!;
          const label = clone.querySelector<HTMLElement>(".cv-label")!;
          const graphemes = [
            ...new Intl.Segmenter("my", { granularity: "grapheme" }).segment(
              rows[i].value,
            ),
          ].map((item) => item.segment);
          let offset = 0;
          let part = 0;
          while (offset < graphemes.length) {
            const nextLabel =
              rows[i].label +
              (part
                ? draft.cvLanguage === "en"
                  ? " (continued)"
                  : " (အဆက်)"
                : "");
            label.textContent = nextLabel;
            let low = 1;
            let high = graphemes.length - offset;
            let fit = 1;
            while (low <= high) {
              const middle = Math.floor((low + high) / 2);
              value.textContent = graphemes
                .slice(offset, offset + middle)
                .join("");
              if (clone.offsetHeight <= available - 2) {
                fit = middle;
                low = middle + 1;
              } else high = middle - 1;
            }
            const text = graphemes.slice(offset, offset + fit).join("");
            value.textContent = text;
            prepared.push({
              row: {
                ...rows[i],
                id: `${rows[i].id}-${part}`,
                label: nextLabel,
                value: text,
              },
              height: clone.offsetHeight,
            });
            offset += fit;
            part++;
          }
        } finally {
          clone.remove();
        }
      }
      const ends: number[] = [];
      let used = 0;
      for (let i = 0; i < prepared.length; i++) {
        const { height, row } = prepared[i];
        // Keep section headings together with at least the first information row.
        const nextHeight = row.heading ? prepared[i + 1]?.height || 0 : 0;
        if (used > 0 && used + height + nextHeight > available) {
          ends.push(i);
          used = 0;
        }
        used += height;
      }
      ends.push(prepared.length);
      const next = { rows: prepared.map((item) => item.row), ends };
      setLayout((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
      onPageCount(ends.length);
    };
    measure();
    void document.fonts.ready.then(measure);
    return () => {
      cancelled = true;
    };
  }, [draft, onPageCount]);

  let start = 0;
  return (
    <>
      <div className="cv-measure" aria-hidden="true">
        <div
          ref={measureRef}
          className={`cv-sheet template-${draft.template} ${draft.cvLanguage === "en" ? "cv-english" : ""}`}
        >
          <SheetHeader draft={draft} />
          <div className="cv-rows">
            {rows.map((row, i) => (
              <Row key={row.id} row={row} index={i} />
            ))}
          </div>
        </div>
      </div>
      <div ref={documentRef} className="cv-pages">
        {layout.ends.map((end, pageIndex) => {
          const pageRows = layout.rows.slice(start, end);
          start = end;
          return (
            <article
              className={`cv-sheet template-${draft.template} ${draft.cvLanguage === "en" ? "cv-english" : ""}`}
              key={pageIndex}
              aria-label={`CV စာမျက်နှာ ${pageIndex + 1}`}
            >
              <SheetHeader draft={draft} continued={pageIndex > 0} />
              <div className="cv-rows">
                {pageRows.map((row, i) => (
                  <Row key={row.id} row={row} index={i} />
                ))}
              </div>
              {layout.ends.length > 1 && (
                <footer className="cv-page-number">
                  {pageIndex + 1} / {layout.ends.length}
                </footer>
              )}
            </article>
          );
        })}
        <DocumentSheets documents={documents} language={draft.cvLanguage} />
      </div>
    </>
  );
}
