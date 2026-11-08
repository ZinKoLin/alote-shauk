import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  FileImage,
  ImagePlus,
  LoaderCircle,
  RotateCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  documentImageCount,
  documentPageCount,
  MAX_DOCUMENT_IMAGES,
  readDocumentFiles,
  rotateDocument,
} from "./documents";
import { useSettings } from "./SettingsContext";
import type {
  DocumentGroup,
  DocumentImage,
  Documents,
  Orientation,
} from "./documents";

export default function DocumentEditor({
  documents,
  ready,
  persistent,
  disabled,
  resetVersion,
  onChange,
  onBusy,
  onError,
}: {
  documents: Documents;
  ready: boolean;
  persistent: boolean;
  disabled: boolean;
  resetVersion: number;
  onChange: (next: Documents) => Promise<void>;
  onBusy: (busy: boolean) => void;
  onError: (message: string) => void;
}) {
  const { t } = useSettings();
  const [busy, setBusy] = useState<DocumentGroup | null>(null);
  const generation = useRef(0);
  const inputs = useRef<
    Partial<Record<DocumentGroup, HTMLInputElement | null>>
  >({});
  const locked = disabled || !!busy || !ready;

  useEffect(() => {
    generation.current++;
    setBusy(null);
    onBusy(false);
    return () => {
      generation.current++;
      onBusy(false);
    };
  }, [resetVersion, onBusy]);

  const commit = async (
    group: DocumentGroup,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (!files.length) return;
    const version = ++generation.current;
    setBusy(group);
    onBusy(true);
    try {
      const single = group === "front" || group === "back";
      const remaining =
        MAX_DOCUMENT_IMAGES -
        documentImageCount(documents) +
        (single && documents[group] ? 1 : 0);
      const images = await readDocumentFiles(
        single ? files.slice(0, 1) : files,
        remaining,
        single,
      );
      if (version !== generation.current) return;
      await onChange({
        ...documents,
        [group]: single
          ? images[0]
          : [
              ...documents[group],
              ...images.map((image) =>
                group === "household"
                  ? { ...image, orientation: "landscape" as const }
                  : image,
              ),
            ],
      });
    } catch (error) {
      if (version === generation.current)
        onError(
          error instanceof Error && /[\u1000-\u109f]/.test(error.message)
            ? error.message
            : t("ဖိုင်ထည့်၍ မရပါ။ ထပ်စမ်းကြည့်ပါ။"),
        );
    } finally {
      if (version === generation.current) {
        setBusy(null);
        onBusy(false);
      }
    }
  };

  const changeImage = (
    group: DocumentGroup,
    id: string,
    image: DocumentImage | null,
  ) => {
    if (group === "front" || group === "back")
      return onChange({ ...documents, [group]: image });
    return onChange({
      ...documents,
      [group]: documents[group].flatMap((item) =>
        item.id === id ? (image ? [image] : []) : [item],
      ),
    });
  };

  const rotate = async (group: DocumentGroup, image: DocumentImage) => {
    const version = ++generation.current;
    setBusy(group);
    onBusy(true);
    try {
      const rotated = await rotateDocument(image);
      if (version === generation.current)
        await changeImage(
          group,
          image.id,
          group === "household"
            ? { ...rotated, orientation: "landscape" }
            : rotated,
        );
    } catch {
      if (version === generation.current)
        onError(t("ပုံကို လှည့်၍ မရပါ။ ထပ်စမ်းကြည့်ပါ။"));
    } finally {
      if (version === generation.current) {
        setBusy(null);
        onBusy(false);
      }
    }
  };

  const move = (
    group: "household" | "certificates",
    index: number,
    direction: number,
  ) => {
    const next = [...documents[group]];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    void onChange({ ...documents, [group]: next });
  };

  const item = (group: DocumentGroup, image: DocumentImage, index = 0) => (
    <div className="document-item" key={image.id}>
      <img src={image.src} alt={image.name} />
      <div className="document-item-details">
        <strong title={image.name}>{image.name}</strong>
        {group === "certificates" ? (
          <select
            aria-label={t("{v0} စာမျက်နှာအနေအထား", { v0: image.name })}
            value={image.orientation}
            disabled={locked}
            onChange={(event) =>
              void changeImage(group, image.id, {
                ...image,
                orientation: event.target.value as Orientation,
              })
            }
          >
            <option value="portrait">{t("A4 ဒေါင်လိုက်")}</option>
            <option value="landscape">{t("A4 အလျားလိုက်")}</option>
          </select>
        ) : (
          <span>
            {group === "household"
              ? t("A4 အလျားလိုက် · တစ်မျက်နှာအပြည့်")
              : group === "front"
                ? t("အရှေ့ခြမ်း")
                : t("အနောက်ခြမ်း")}
          </span>
        )}
        <div className="document-item-actions">
          <button
            type="button"
            disabled={locked}
            onClick={() => void rotate(group, image)}
            aria-label={t("{v0} ပုံလှည့်ရန်", { v0: image.name })}
            title={t("ပုံလှည့်ရန်")}
          >
            <RotateCw size={15} />
          </button>
          {(group === "certificates" || group === "household") && (
            <>
              <button
                type="button"
                disabled={locked || index === 0}
                onClick={() => move(group, index, -1)}
                aria-label={t("{v0} ရှေ့ရွှေ့ရန်", { v0: image.name })}
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                disabled={locked || index === documents[group].length - 1}
                onClick={() => move(group, index, 1)}
                aria-label={t("{v0} နောက်ရွှေ့ရန်", { v0: image.name })}
              >
                <ArrowDown size={15} />
              </button>
            </>
          )}
          <button
            type="button"
            className="document-delete"
            disabled={locked}
            onClick={() => void changeImage(group, image.id, null)}
            aria-label={t("{v0} ဖယ်ရန်", { v0: image.name })}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  const upload = (group: DocumentGroup, label: string, single = false) => (
    <>
      <input
        type="file"
        className="visually-hidden"
        ref={(element) => {
          inputs.current[group] = element;
        }}
        aria-label={label}
        accept={
          single
            ? "image/jpeg,image/png,image/webp"
            : "image/jpeg,image/png,image/webp,application/pdf"
        }
        multiple={!single}
        onChange={(event) => void commit(group, event)}
        disabled={locked}
      />
      <button
        type="button"
        className="document-upload"
        disabled={locked}
        onClick={() => inputs.current[group]?.click()}
      >
        {busy === group ? (
          <LoaderCircle className="spinning" size={17} />
        ) : (
          <ImagePlus size={17} />
        )}
        <span>{busy === group ? t("ဖိုင်ပြင်ဆင်နေသည်…") : label}</span>
      </button>
    </>
  );

  if (!ready)
    return (
      <div className="document-loading" role="status">
        <LoaderCircle className="spinning" size={21} />
        {t("သိမ်းထားတဲ့ စာရွက်စာတမ်းတွေကို ပြန်ဖွင့်နေပါတယ်…")}
      </div>
    );
  return (
    <div className="document-editor">
      <div className="document-summary">
        <FileImage size={20} />
        <div>
          <strong>{t("CV နှင့်အတူ PDF တစ်ဖိုင်တည်း")}</strong>
          <span>
            {t("တွဲဖက်စာမျက်နှာ")} {documentPageCount(documents)}{" "}
            {t("မျက်နှာ · ပုံ")} {documentImageCount(documents)} /{" "}
            {MAX_DOCUMENT_IMAGES}
          </span>
        </div>
      </div>
      {!persistent && (
        <p className="document-storage-warning" role="alert">
          {t(
            "ဒီ browser မှာ စာရွက်စာတမ်းတွေကို ယာယီသိမ်းမရပါ။ Refresh မလုပ်မီ PDF ဒေါင်းလုဒ်ယူထားပါ။ လက်ရှိ CV အချက်အလက်တွေကို ဖျက်မထားပါဘူး။",
          )}
        </p>
      )}
      <section className="document-group" aria-label={t("မှတ်ပုံတင်ပုံများ")}>
        <div className="document-group-title">
          <span>01</span>
          <h3>{t("နိုင်ငံသားစိစစ်ရေးကတ်ပြား")}</h3>
        </div>
        <p>
          {t(
            "အရှေ့ခြမ်းနဲ့ အနောက်ခြမ်းကို A4 ဒေါင်လိုက် တစ်မျက်နှာတည်းမှာ အပေါ်၊ အောက် ပြပေးပါမယ်။",
          )}
        </p>
        <div className="nrc-upload-slots">
          <div>
            <label>{t("အရှေ့ခြမ်း")}</label>
            {documents.front && item("front", documents.front)}
            {upload(
              "front",
              documents.front
                ? t("အရှေ့ခြမ်းပုံပြောင်းရန်")
                : t("အရှေ့ခြမ်းပုံထည့်ရန်"),
              true,
            )}
          </div>
          <div>
            <label>{t("အနောက်ခြမ်း")}</label>
            {documents.back && item("back", documents.back)}
            {upload(
              "back",
              documents.back
                ? t("အနောက်ခြမ်းပုံပြောင်းရန်")
                : t("အနောက်ခြမ်းပုံထည့်ရန်"),
              true,
            )}
          </div>
        </div>
      </section>
      <section
        className="document-group"
        aria-label={t("အိမ်ထောင်စုစာရင်းများ")}
      >
        <div className="document-group-title">
          <span>02</span>
          <h3>{t("အိမ်ထောင်စုစာရင်း")}</h3>
        </div>
        <p>
          {t(
            "A4 အလျားလိုက် တစ်မျက်နှာအပြည့် ပြပါမယ်။ ပုံ သို့မဟုတ် PDF ကို ထည့်နိုင်ပါတယ်။",
          )}
        </p>
        {documents.household.map((image, index) =>
          item("household", image, index),
        )}
        {upload("household", t("အိမ်ထောင်စုစာရင်း ထည့်ရန်"))}
      </section>
      <section
        className="document-group"
        aria-label={t("ဘွဲ့နှင့်အောင်လက်မှတ်များ")}
      >
        <div className="document-group-title">
          <span>03</span>
          <h3>{t("ဘွဲ့နှင့် အောင်လက်မှတ်များ")}</h3>
        </div>
        <p>
          {t(
            "ဖိုင်အများအပြား ရွေးထည့်နိုင်ပြီး PDF ထဲက စာမျက်နှာအားလုံးကိုလည်း တွဲပေးပါမယ်။",
          )}
        </p>
        {documents.certificates.map((image, index) =>
          item("certificates", image, index),
        )}
        {upload("certificates", t("ဘွဲ့ / အောင်လက်မှတ် ထည့်ရန်"))}
      </section>
      <p className="document-file-note">
        {t(
          "JPG၊ PNG၊ WebP၊ PDF · တစ်ဖိုင် 20 MB အထိ။ ပုံကို မဖြတ်ဘဲ စာမျက်နှာနဲ့ အံဝင်အောင် ပြပေးပါတယ်။",
        )}
      </p>
      <div className="inline-tip">
        <ShieldCheck size={17} />
        <p>
          {t(
            "စာရွက်စာတမ်းတွေကိုလည်း ဒီ browser ထဲမှာပဲ ယာယီသိမ်းပါတယ်။ Server ဆီ ပို့မထားပါဘူး။",
          )}
        </p>
      </div>
    </div>
  );
}
