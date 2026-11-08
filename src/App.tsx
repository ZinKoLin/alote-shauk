import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  FilePenLine,
  FileText,
  GraduationCap,
  LayoutTemplate,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Maximize2,
  Minus,
  Palette,
  Paperclip,
  Phone,
  Plus,
  Printer,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CvDocument, { PAGE_HEIGHT, PAGE_WIDTH } from "./CvDocument";
import DocumentEditor from "./DocumentEditor";
import {
  documentImageCount,
  documentPageCount,
  documentPageSizes,
} from "./documents";
import { useDocuments } from "./useDocuments";
import { exportPdf, preparePhoto } from "./export";
import {
  DRAFT_KEY,
  DRAFT_TTL,
  ageFromBirthday,
  emptyFields,
  newDraft,
  readDraft,
  sampleFields,
  sectionFields,
} from "./model";
import type { Draft, FieldKey, SectionId, Template } from "./model";
import { englishSampleFields } from "./model";
import { useSettings } from "./SettingsContext";
import SettingsPanel from "./SettingsPanel";
import LanguageToolbar from "./LanguageControls";
import SiteFooter from "./SiteFooter";
import BirthdayField, { useBirthdayInput } from "./BirthdayField";
import PrivacyConsent, { hasConsent, PrivacyDetails } from "./PrivacyConsent";

const steps: {
  id: Exclude<SectionId, "design" | "documents">;
  title: string;
  short: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "personal",
    title: "ကိုယ်ရေးအချက်အလက်",
    short: "ကိုယ်ရေး",
    description: "သင့်အကြောင်း အခြေခံအချက်အလက်တွေ ဖြည့်ပါ။",
    icon: UserRound,
  },
  {
    id: "education",
    title: "ပညာရေးနှင့် အတွေ့အကြုံ",
    short: "ပညာရေး",
    description: "သင့်အရည်အချင်းနဲ့ အတွေ့အကြုံတွေကို ဖော်ပြပါ။",
    icon: GraduationCap,
  },
  {
    id: "family",
    title: "မိသားစုအချက်အလက်",
    short: "မိသားစု",
    description: "လိုအပ်သလောက်သာ ဖြည့်စွက်နိုင်ပါတယ်။",
    icon: UsersRound,
  },
  {
    id: "contact",
    title: "ဆက်သွယ်ရန်အချက်အလက်",
    short: "ဆက်သွယ်ရန်",
    description: "အလုပ်ရှင်က သင့်ကို ပြန်လည်ဆက်သွယ်နိုင်ဖို့ပါ။",
    icon: Phone,
  },
];

function Logo({ compact = false }: { compact?: boolean }) {
  const { t } = useSettings();
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <span className="brand-mark">
        <FilePenLine size={25} strokeWidth={1.6} />
      </span>
      <div>
        <strong>
          {t("အလုပ်လျှောက်")}
          <span className="brand-dot">.</span>
        </strong>
      </div>
    </div>
  );
}

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const { t } = useSettings();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="dialog"
    >
      <div className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label={t("ပိတ်ရန်")}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function App() {
  const [accepted, setAccepted] = useState(hasConsent);
  return accepted ? (
    <Workspace />
  ) : (
    <PrivacyConsent onAgree={() => setAccepted(true)} />
  );
}

function Workspace() {
  const { t, language } = useSettings();
  const [draft, setDraft] = useState<Draft>(() => {
    const existing = readDraft();
    return existing.updatedAt
      ? existing
      : { ...existing, cvLanguage: language };
  });
  const [active, setActive] = useState<SectionId>("personal");
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [documentBusy, setDocumentBusy] = useState(false);
  const touchDraft = useCallback(
    () => setDraft((previous) => ({ ...previous, updatedAt: Date.now() })),
    [],
  );
  const attachmentStore = useDocuments(draft.updatedAt, touchDraft);
  const documents = attachmentStore.documents;
  const documentLocked = documentBusy || !attachmentStore.ready;
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(
    null,
  );
  const [modal, setModal] = useState<
    "privacy" | "help" | "reset" | "sample" | "settings" | null
  >(null);
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");
  const [previewWidth, setPreviewWidth] = useState(550);
  const [zoom, setZoom] = useState(1);
  const [cvPageCount, setCvPageCount] = useState(1);
  const pageCount = cvPageCount + documentPageCount(documents);
  const documentRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const photoGeneration = useRef(0);
  const latestDraft = useRef(draft);
  const activeStep = steps.findIndex((step) => step.id === active);
  const step = steps[activeStep];
  const filled = (Object.keys(emptyFields) as FieldKey[]).filter((key) =>
    draft.fields[key].trim(),
  ).length;
  const completion = Math.round(
    (filled / Object.keys(emptyFields).length) * 100,
  );
  const hasData =
    filled > 0 || !!draft.photo || documentImageCount(documents) > 0;
  const closeModal = () => setModal(null);
  const notify = useCallback(
    (text: string, error = false) => setToast({ text: t(text), error }),
    [t],
  );
  const updateDraft = (changes: Partial<Draft>) =>
    setDraft((previous) => ({
      ...previous,
      ...changes,
      updatedAt: Date.now(),
    }));
  const updateField = (key: FieldKey, value: string) =>
    setDraft((previous) => ({
      ...previous,
      fields: { ...previous.fields, [key]: value },
      updatedAt: Date.now(),
    }));
  const birthdayInput = useBirthdayInput(draft.fields.birthday, (value) =>
    updateField("birthday", value),
  );

  useEffect(() => {
    latestDraft.current = draft;
    if (!attachmentStore.ready) return;
    try {
      if (draft.updatedAt && hasData)
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      else sessionStorage.removeItem(DRAFT_KEY);
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [draft, hasData, attachmentStore.ready]);

  useEffect(() => {
    const expire = () => {
      const current = latestDraft.current;
      if (current.updatedAt && Date.now() - current.updatedAt >= DRAFT_TTL) {
        photoGeneration.current++;
        birthdayInput.clear();
        setDraft(newDraft());
        setPhotoLoading(false);
        attachmentStore.clear();
        notify(
          t("၂ နာရီကြာ မပြင်ဆင်ထားတဲ့ ယာယီအချက်အလက်တွေကို ဖျက်လိုက်ပါပြီ။"),
        );
      }
    };
    const timer = window.setInterval(expire, 15_000);
    window.addEventListener("focus", expire);
    document.addEventListener("visibilitychange", expire);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", expire);
      document.removeEventListener("visibilitychange", expire);
    };
  }, [notify, attachmentStore.clear]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 6500);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width > 0) setPreviewWidth(width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [mobileView]);

  const goTo = (section: SectionId) => {
    if (documentBusy) {
      notify(t("ဖိုင်ပြင်ဆင်မှု ပြီးဆုံးသည်အထိ ခဏစောင့်ပေးပါ။"));
      return;
    }
    setActive(section);
    setMobileView("form");
  };

  const reset = (sample = false) => {
    birthdayInput.clear();
    attachmentStore.clear();
    photoGeneration.current++;
    setPhotoLoading(false);
    setDraft(
      sample
        ? {
            ...newDraft(),
            cvLanguage: draft.cvLanguage,
            fields: {
              ...(draft.cvLanguage === "en"
                ? englishSampleFields
                : sampleFields),
            },
            updatedAt: Date.now(),
          }
        : { ...newDraft(), cvLanguage: draft.cvLanguage },
    );
    setActive("personal");
    setModal(null);
    notify(
      sample
        ? t(
            "နမူနာအချက်အလက်တွေ ဖြည့်ထားပါပြီ။ သင့်အချက်အလက်နဲ့ ပြန်ပြင်နိုင်ပါတယ်။",
          )
        : t("အချက်အလက်အားလုံး ဖျက်ပြီး ဖောင်အသစ်စထားပါပြီ။"),
    );
  };

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const generation = ++photoGeneration.current;
    setPhotoLoading(true);
    try {
      const photo = await preparePhoto(file);
      if (generation === photoGeneration.current) updateDraft({ photo });
    } catch (error) {
      if (generation === photoGeneration.current)
        notify(
          error instanceof Error ? error.message : t("ဓာတ်ပုံထည့်၍ မရပါ။"),
          true,
        );
    } finally {
      if (generation === photoGeneration.current) setPhotoLoading(false);
    }
  };

  const validate = () => {
    if (!draft.fields.name.trim()) {
      goTo("personal");
      notify(t("CV မထုတ်မီ သင့်အမည်ကို အရင်ဖြည့်ပေးပါ။"), true);
      setTimeout(() => document.getElementById("field-name")?.focus(), 50);
      return false;
    }
    if (birthdayInput.incomplete) {
      goTo("personal");
      notify(
        language === "en"
          ? "Please select the complete day, month and year, or clear the date."
          : "မွေးရက်၊ မွေးလ၊ မွေးနှစ် သုံးခုလုံးရွေးပါ၊ သို့မဟုတ် မွေးသက္ကရာဇ်ကို ဖျက်ထားပါ။",
        true,
      );
      setTimeout(() => document.getElementById("birthday-day")?.focus(), 50);
      return false;
    }
    return true;
  };

  const download = async () => {
    if (
      exporting ||
      photoLoading ||
      documentLocked ||
      !validate() ||
      !documentRef.current
    )
      return;
    setExporting(true);
    try {
      await exportPdf(documentRef.current, draft.fields.name);
      notify(t("CV ကို PDF ဖိုင်အဖြစ် ဒေါင်းလုဒ်လုပ်ပြီးပါပြီ။"));
    } catch (error) {
      console.error(
        "PDF export failed",
        error instanceof Error ? error.message : "Unknown error",
      );
      notify(
        t("PDF ထုတ်၍ မရသေးပါ။ ထပ်စမ်းပါ သို့မဟုတ် ပုံနှိပ်ရန်ကို အသုံးပြုပါ။"),
        true,
      );
    } finally {
      setExporting(false);
    }
  };

  const print = async () => {
    if (documentLocked || !validate()) return;
    await document.fonts.ready;
    const oldTitle = document.title;
    document.title = `${draft.fields.name}-CV`;
    window.print();
    document.title = oldTitle;
  };

  const field = (
    key: FieldKey,
    label: string,
    options: {
      placeholder?: string;
      type?: string;
      wide?: boolean;
      multiline?: boolean;
      choices?: string[];
      maxLength?: number;
      hint?: string;
    } = {},
  ) => (
    <div className={`field ${options.wide ? "field-wide" : ""}`} key={key}>
      <label htmlFor={`field-${key}`}>
        {label}
        {key === "name" && <span className="required"> *</span>}
      </label>
      {options.choices ? (
        <div className="select-wrap">
          <select
            id={`field-${key}`}
            value={draft.fields[key]}
            onChange={(event) => updateField(key, event.target.value)}
          >
            <option value="">{t("ရွေးချယ်ပါ")}</option>
            {options.choices.map((choice) => (
              <option key={choice} value={choice}>
                {t(choice)}
              </option>
            ))}
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </div>
      ) : options.multiline ? (
        <textarea
          id={`field-${key}`}
          value={draft.fields[key]}
          onChange={(event) => updateField(key, event.target.value)}
          placeholder={options.placeholder}
          maxLength={options.maxLength || 700}
          rows={3}
        />
      ) : (
        <input
          id={`field-${key}`}
          value={draft.fields[key]}
          onChange={(event) => updateField(key, event.target.value)}
          placeholder={options.placeholder}
          type={options.type || "text"}
          maxLength={options.maxLength || 140}
          autoComplete="off"
          required={key === "name"}
        />
      )}
      {options.hint && <span className="field-hint">{options.hint}</span>}
    </div>
  );

  const photoUpload = (
    <div className="photo-upload">
      <div className={`upload-avatar ${draft.photo ? "with-photo" : ""}`}>
        {draft.photo ? (
          <img src={draft.photo} alt={t("ရွေးထားသည့်ဓာတ်ပုံ")} />
        ) : (
          <UserRound size={29} strokeWidth={1.3} />
        )}
      </div>
      <div className="upload-copy">
        <strong>{t("သင့်ဓာတ်ပုံ")}</strong>
        <span>{t("JPG၊ PNG၊ WebP · 8 MB အထိ")}</span>
        <div className="upload-actions">
          <button
            className="small-button"
            type="button"
            disabled={photoLoading || exporting}
            onClick={() => photoRef.current?.click()}
          >
            {photoLoading ? (
              <LoaderCircle className="spinning" size={14} />
            ) : (
              <Upload size={14} />
            )}
            {draft.photo ? t("ပုံပြောင်းရန်") : t("ဓာတ်ပုံထည့်ရန်")}
          </button>
          {draft.photo && (
            <button
              type="button"
              className="remove-photo"
              onClick={() => {
                photoGeneration.current++;
                setPhotoLoading(false);
                updateDraft({ photo: "" });
              }}
              aria-label={t("ဓာတ်ပုံဖယ်ရန်")}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const templatePicker = (
    <div className="template-options">
      {(["form", "classic", "modern"] as Template[]).map((template) => (
        <button
          key={template}
          type="button"
          aria-pressed={draft.template === template}
          className={`template-option ${draft.template === template ? "selected" : ""}`}
          onClick={() => updateDraft({ template })}
        >
          <div className={`mini-document mini-${template}`} aria-hidden="true">
            <div className="mini-heading">
              <i />
              <b />
            </div>
            <div className="mini-lines">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i}>
                  <i />
                  <b />
                </span>
              ))}
            </div>
          </div>
          <div className="template-caption">
            <span>
              {template === "form"
                ? t("ဖောင်ပုံစံ")
                : template === "classic"
                  ? t("ရိုးရှင်း")
                  : t("ခေတ်မီ")}
            </span>
            <span className="radio-dot">
              {draft.template === template && (
                <Check size={11} strokeWidth={3} />
              )}
            </span>
          </div>
        </button>
      ))}
    </div>
  );

  const attachmentSizes = documentPageSizes(documents);
  const maximumPageWidth = Math.max(
    PAGE_WIDTH,
    ...attachmentSizes.map((size) => size.width),
  );
  const previewHeight =
    cvPageCount * PAGE_HEIGHT +
    attachmentSizes.reduce((sum, size) => sum + size.height, 0) +
    (pageCount - 1) * 24;
  const scale = Math.min((previewWidth - 4) / maximumPageWidth, 0.85) * zoom;

  return (
    <div className="app-shell" data-app-state="ready">
      <input
        type="file"
        ref={photoRef}
        onChange={uploadPhoto}
        accept="image/jpeg,image/png,image/webp"
        className="visually-hidden"
        tabIndex={-1}
        aria-label={t("CV ဓာတ်ပုံရွေးရန်")}
      />
      <aside className="sidebar">
        <Logo />
        <div className="sidebar-content">
          <div className="workspace-label">
            {t("သင့်ကိုယ်ရေးအကျဉ်း")}
            <span>CV</span>
          </div>
          <nav aria-label={t("ဖောင်အဆင့်များ")} className="step-nav">
            {steps.map((item, index) => {
              const count = sectionFields[item.id].filter((key) =>
                draft.fields[key].trim(),
              ).length;
              const done = count === sectionFields[item.id].length;
              return (
                <button
                  key={item.id}
                  className={`step-link ${active === item.id ? "active" : ""}`}
                  aria-current={active === item.id ? "step" : undefined}
                  onClick={() => goTo(item.id)}
                >
                  <span className="step-icon">
                    <item.icon size={19} strokeWidth={1.6} />
                  </span>
                  <span>{t(item.title)}</span>
                  <span className={`step-number ${done ? "done" : ""}`}>
                    {done ? <Check size={13} /> : `0${index + 1}`}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="sidebar-divider" />
          <button
            className={`step-link design-link ${active === "documents" ? "active" : ""}`}
            onClick={() => goTo("documents")}
          >
            <span className="step-icon">
              <Paperclip size={19} strokeWidth={1.6} />
            </span>
            <span>{t("စာရွက်စာတမ်းများ")}</span>
            {documentPageCount(documents) > 0 && (
              <span className="step-number">
                {documentPageCount(documents)}
              </span>
            )}
          </button>
          <button
            className={`step-link design-link ${active === "design" ? "active" : ""}`}
            onClick={() => goTo("design")}
          >
            <span className="step-icon">
              <Palette size={19} strokeWidth={1.6} />
            </span>
            <span>{t("ပုံစံနှင့် အပြင်အဆင်")}</span>
          </button>
          <div className="progress-card">
            <div className="progress-label">
              <span>{t("ဖြည့်စွက်ပြီးစီးမှု")}</span>
              <strong>
                {completion}
                <small>%</small>
              </strong>
            </div>
            <div className="progress-track">
              <div style={{ width: `${completion}%` }} />
            </div>
            <p>
              {filled === 0
                ? t("သင့်အမည်ကနေ စလိုက်ကြရအောင်။")
                : t("အချက်အလက် {v0} / {v1} ခု ဖြည့်ထားပြီးပါပြီ။", {
                    v0: filled,
                    v1: Object.keys(emptyFields).length,
                  })}
            </p>
          </div>
          <button
            className="sample-button"
            disabled={exporting || photoLoading || documentLocked}
            onClick={() => (hasData ? setModal("sample") : reset(true))}
          >
            <Sparkles size={16} />
            <span>{t("နမူနာဖြည့်ကြည့်မည်")}</span>
            <ArrowRight size={15} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <button className="privacy-link" onClick={() => setModal("privacy")}>
            {t("သိမ်းဆည်းပုံကို လေ့လာရန်")}
            <ArrowRight size={13} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-logo">
            <Logo compact />
          </div>
          <div className="breadcrumb">
            <FileText size={16} />
            <span>{t("ကိုယ်ရေးအကျဉ်း")}</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{t("အသစ်ဖန်တီးရန်")}</strong>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button settings-button"
              aria-label={t("ဝဘ်ဆိုက်ဆက်တင်")}
              title={t("ဝဘ်ဆိုက်ဆက်တင်")}
              onClick={() => setModal("settings")}
            >
              <Settings2 size={20} strokeWidth={1.5} />
            </button>
            <span
              className={`save-status ${!storageAvailable ? "memory-only" : ""}`}
            >
              <span />
              {storageAvailable
                ? t("ယာယီသိမ်းဆည်းမှု ဖွင့်ထားသည်")
                : t("ယခုဖွင့်ထားစဉ်သာ သိမ်းထားသည်")}
            </span>
            <button
              className="icon-button help-button"
              aria-label={t("အသုံးပြုနည်း")}
              onClick={() => setModal("help")}
            >
              <CircleHelp size={20} strokeWidth={1.5} />
            </button>
            <button
              className="primary-button download-button"
              onClick={() => void download()}
              disabled={exporting || photoLoading || documentLocked}
            >
              {exporting ? (
                <LoaderCircle size={17} className="spinning" />
              ) : (
                <ArrowDownToLine size={17} />
              )}
              <span>
                {exporting ? t("PDF ထုတ်နေသည်…") : t("PDF ဒေါင်းလုဒ်")}
              </span>
            </button>
          </div>
        </header>

        <div className="page-content">
          <LanguageToolbar
            cvLanguage={draft.cvLanguage}
            onCvLanguageChange={(cvLanguage) => updateDraft({ cvLanguage })}
            disabled={exporting}
          />
          <section className="intro">
            <div>
              <h1>
                {language === "en"
                  ? "Create your CV"
                  : "ကိုယ်ရေးအကျဉ်း ဖန်တီးရန်"}
              </h1>
              <p>
                {language === "en"
                  ? "Fill in your details, check the preview and download your PDF."
                  : "အချက်အလက်ဖြည့်ပါ၊ နမူနာကြည့်ပြီး PDF ထုတ်ယူပါ။"}
              </p>
            </div>
          </section>

          <nav
            className="mobile-step-nav"
            aria-label={t("မိုဘိုင်း ဖောင်အဆင့်များ")}
          >
            {steps.map((item, index) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className={active === item.id ? "active" : ""}
              >
                <span>{index + 1}</span>
                {t(item.short)}
              </button>
            ))}
            <button
              onClick={() => goTo("documents")}
              className={active === "documents" ? "active" : ""}
            >
              <Paperclip size={15} />
              {t("စာရွက်စာတမ်း")}
            </button>
            <button
              onClick={() => goTo("design")}
              className={active === "design" ? "active" : ""}
            >
              <Palette size={15} />
              {t("ပုံစံ")}
            </button>
          </nav>
          <div className="mobile-view-tabs">
            <button
              onClick={() => setMobileView("form")}
              className={mobileView === "form" ? "active" : ""}
            >
              <FilePenLine size={16} />
              {t("ဖောင်ဖြည့်ရန်")}
            </button>
            <button
              onClick={() => setMobileView("preview")}
              className={mobileView === "preview" ? "active" : ""}
            >
              <FileText size={16} />
              {t("နမူနာကြည့်ရန်")}
              <span>{pageCount}</span>
            </button>
          </div>

          <div className={`builder-layout mobile-show-${mobileView}`}>
            <section
              className="editor-column"
              aria-label={t("CV ဖြည့်စွက်ရန်")}
            >
              <div className="form-card">
                <div className="form-card-header">
                  <span className="section-badge">
                    {active === "documents" ? (
                      <Paperclip size={22} strokeWidth={1.4} />
                    ) : active === "design" ? (
                      <LayoutTemplate size={22} strokeWidth={1.4} />
                    ) : (
                      step && <step.icon size={22} strokeWidth={1.4} />
                    )}
                  </span>
                  <span className="step-counter">
                    {active === "documents" ? (
                      t("တွဲဖက်စာရွက်စာတမ်း")
                    ) : active === "design" ? (
                      t("အပြင်အဆင်")
                    ) : (
                      <>
                        {t("အဆင့် 0")}
                        {activeStep + 1}
                        <span> / 04</span>
                      </>
                    )}
                  </span>
                </div>
                <h2>
                  {active === "design"
                    ? t("သင့်စိတ်ကြိုက် ရွေးချယ်ပါ")
                    : active === "documents"
                      ? t("စာရွက်စာတမ်းများ တွဲထည့်ရန်")
                      : step && t(step.title)}
                </h2>
                <p className="section-description">
                  {active === "design"
                    ? t("သင့်အကြောင်းကို သပ်သပ်ရပ်ရပ် ဖော်ပြလိုက်ပါ။")
                    : active === "documents"
                      ? t(
                          "မှတ်ပုံတင်၊ အိမ်ထောင်စုစာရင်းနဲ့ အောင်လက်မှတ်တွေကို တစ်ဖိုင်တည်း တွဲထုတ်ပါ။",
                        )
                      : step && t(step.description)}
                </p>
                <form onSubmit={(event) => event.preventDefault()} noValidate>
                  <fieldset disabled={exporting} className="form-fields">
                    {active === "documents" && (
                      <DocumentEditor
                        documents={documents}
                        ready={attachmentStore.ready}
                        persistent={attachmentStore.persistent}
                        resetVersion={attachmentStore.resetVersion}
                        disabled={exporting}
                        onChange={attachmentStore.replace}
                        onBusy={setDocumentBusy}
                        onError={(message) => notify(message, true)}
                      />
                    )}
                    {active === "personal" && (
                      <>
                        {photoUpload}
                        <div className="fields-grid">
                          {field("name", t("အမည်အပြည့်အစုံ"), {
                            wide: true,
                            placeholder: t("ဥပမာ — မောင်အောင်မြင့်"),
                          })}
                          <BirthdayField input={birthdayInput} />
                          {field("age", t("အသက်"), {
                            placeholder:
                              ageFromBirthday(draft.fields.birthday) ||
                              t("ဥပမာ — ၂၈"),
                            hint: t("မဖြည့်လျှင် မွေးသက္ကရာဇ်မှ တွက်ပေးပါမယ်။"),
                          })}
                          {field("gender", t("ကျား / မ"), {
                            choices: ["ကျား", "မ", "အခြား"],
                          })}
                          {field("maritalStatus", t("အိမ်ထောင်ရေးအခြေအနေ"), {
                            wide: true,
                            choices: [
                              "လူပျို",
                              "အပျို",
                              "အိမ်ထောင်ရှိ",
                              "အခြား",
                            ],
                          })}
                          {field("nrc", t("နိုင်ငံသားစိစစ်ရေးကတ်ပြားအမှတ်"), {
                            wide: true,
                            placeholder: t("ဥပမာ — ၁၂/မရက(နိုင်)၁၂၃၄၅၆"),
                          })}
                          {field("nationality", t("လူမျိုး / နိုင်ငံသား"), {
                            placeholder: t("ဥပမာ — ဗမာ / မြန်မာ"),
                          })}
                          {field("religion", t("ကိုးကွယ်သည့်ဘာသာ"), {
                            placeholder: t("ဥပမာ — ဗုဒ္ဓ"),
                          })}
                        </div>
                        <p className="optional-note">
                          <span>*</span>
                          {t(
                            "အမည်မှလွဲ၍ ကျန်အချက်များကို မဖြည့်ဘဲထားနိုင်ပါတယ်။",
                          )}
                        </p>
                      </>
                    )}
                    {active === "education" && (
                      <div className="fields-grid">
                        {field("desiredRole", t("လျှောက်ထားလိုသောရာထူး"), {
                          wide: true,
                          placeholder: t("ဥပမာ — အရောင်းဝန်ထမ်း"),
                        })}
                        {field("applicationDate", t("အလုပ်လျှောက်သည့်ရက်စွဲ"), {
                          wide: true,
                          type: "date",
                        })}
                        {field("education", t("ပညာအရည်အချင်း"), {
                          wide: true,
                          multiline: true,
                          placeholder: t(
                            "ဘွဲ့ / အတန်း၊ တက္ကသိုလ် / ကျောင်း၊ ပြီးဆုံးသည့်နှစ်",
                          ),
                          hint: t("တစ်ကြောင်းစီ ခွဲရေးနိုင်ပါတယ်။"),
                        })}
                        {field("skills", t("အခြားကျွမ်းကျင်မှုများ"), {
                          wide: true,
                          multiline: true,
                          placeholder: t(
                            "ဥပမာ — Microsoft Word, Excel၊ အင်္ဂလိပ်စာ",
                          ),
                        })}
                        {field("experience", t("အလုပ်အတွေ့အကြုံ"), {
                          wide: true,
                          multiline: true,
                          maxLength: 1600,
                          placeholder: t(
                            "ရာထူး၊ ကုမ္ပဏီအမည်၊ လုပ်ကိုင်ခဲ့သည့်ကာလ",
                          ),
                          hint: t(
                            "အတွေ့အကြုံမရှိသေးလျှင် မဖြည့်ဘဲထားနိုင်ပါတယ်။",
                          ),
                        })}
                        {field("languages", t("တတ်ကျွမ်းသည့်ဘာသာစကား"), {
                          wide: true,
                          placeholder: t("ဥပမာ — မြန်မာ၊ အင်္ဂလိပ်"),
                        })}
                      </div>
                    )}
                    {active === "family" && (
                      <>
                        <div className="subsection-label">
                          <UsersRound size={16} />
                          {t("အဘအချက်အလက်")}
                        </div>
                        <div className="fields-grid">
                          {field("fatherName", t("အဘအမည်"), {
                            wide: true,
                            placeholder: t("ဥပမာ — ဦးမြင့်အောင်"),
                          })}
                          {field(
                            "fatherNrc",
                            t("နိုင်ငံသားစိစစ်ရေးကတ်ပြားအမှတ်"),
                            {
                              wide: true,
                              placeholder: t("အဘ၏ မှတ်ပုံတင်အမှတ်"),
                            },
                          )}
                          {field("fatherJob", t("အလုပ်အကိုင်"), {
                            wide: true,
                            placeholder: t("ဥပမာ — ကိုယ်ပိုင်လုပ်ငန်း"),
                          })}
                        </div>
                        <div className="subsection-label second">
                          <UsersRound size={16} />
                          {t("အမိအချက်အလက်")}
                        </div>
                        <div className="fields-grid">
                          {field("motherName", t("အမိအမည်"), {
                            wide: true,
                            placeholder: t("ဥပမာ — ဒေါ်ခင်မာ"),
                          })}
                          {field(
                            "motherNrc",
                            t("နိုင်ငံသားစိစစ်ရေးကတ်ပြားအမှတ်"),
                            {
                              wide: true,
                              placeholder: t("အမိ၏ မှတ်ပုံတင်အမှတ်"),
                            },
                          )}
                          {field("motherJob", t("အလုပ်အကိုင်"), {
                            wide: true,
                            placeholder: t("ဥပမာ — အိမ်ရှင်မ"),
                          })}
                        </div>
                        {draft.template === "form" && (
                          <div className="inline-tip">
                            <FileText size={17} />
                            <p>
                              {t(
                                "ဖောင်ပုံစံတွင် အဘအမည်ကိုသာ ဖော်ပြပါတယ်။ မိသားစုအချက်အလက် အပြည့်အစုံအတွက် ရိုးရှင်း သို့မဟုတ် ခေတ်မီ ပုံစံကို ရွေးနိုင်ပါတယ်။",
                              )}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {active === "contact" && (
                      <>
                        <div className="contact-illustration">
                          <Mail size={25} strokeWidth={1.3} />
                          <span>
                            {t("ဆက်သွယ်ရလွယ်ကူတဲ့ အချက်အလက်တွေကို ဖြည့်ပေးပါ။")}
                          </span>
                        </div>
                        <div className="fields-grid">
                          {field("phone", t("ဖုန်းနံပါတ်"), {
                            wide: true,
                            type: "tel",
                            placeholder: t("ဥပမာ — 09 123 456 789"),
                          })}
                          {field("email", t("အီးမေးလ်"), {
                            wide: true,
                            type: "email",
                            placeholder: t("ဥပမာ — yourname@example.com"),
                          })}
                          {field("address", t("လက်ရှိနေရပ်လိပ်စာ"), {
                            wide: true,
                            multiline: true,
                            placeholder: t(
                              "အိမ်အမှတ်၊ လမ်း၊ ရပ်ကွက်၊ မြို့နယ်၊ မြို့",
                            ),
                          })}
                        </div>
                        <div className="inline-tip">
                          <MapPin size={17} />
                          <p>
                            {t(
                              "သင်ဆန္ဒရှိသလောက်သာ ဖော်ပြပါ။ မြို့နဲ့ မြို့နယ်ကိုပဲ ထည့်ထားလည်း ရပါတယ်။",
                            )}
                          </p>
                        </div>
                      </>
                    )}
                    {active === "design" && (
                      <>
                        <div className="design-label">{t("CV ပုံစံ")}</div>
                        {templatePicker}
                        <div className="design-label photo-design-label">
                          {t("ကိုယ်ရေးဓာတ်ပုံ")}
                        </div>
                        {photoUpload}
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={draft.hideEmpty}
                            onChange={(event) =>
                              updateDraft({ hideEmpty: event.target.checked })
                            }
                          />
                          <span>
                            {t("မဖြည့်ထားတဲ့အချက်များကို ဖျောက်ထားမည်")}
                            <small>
                              {t(
                                "ဖြည့်ထားတဲ့ အချက်အလက်တွေပဲ CV မှာ ပါဝင်ပါမယ်။",
                              )}
                            </small>
                          </span>
                        </label>
                        <div className="paper-settings">
                          <FileText size={20} strokeWidth={1.4} />
                          <div>
                            <strong>{t("A4 စာရွက်အရွယ်အစား")}</strong>
                            <span>{t("210 × 297 mm · ဒေါင်လိုက်")}</span>
                          </div>
                          <Check size={17} />
                        </div>
                      </>
                    )}
                  </fieldset>
                </form>
                <div className="form-navigation">
                  <button
                    className="back-button"
                    disabled={
                      active === "personal" || exporting || documentLocked
                    }
                    onClick={() =>
                      goTo(
                        active === "design"
                          ? "documents"
                          : active === "documents"
                            ? "contact"
                            : steps[activeStep - 1].id,
                      )
                    }
                  >
                    <ArrowLeft size={16} />
                    {t("နောက်သို့")}
                  </button>
                  <button
                    className="next-button"
                    disabled={exporting || documentLocked}
                    onClick={() =>
                      active === "design"
                        ? setMobileView("preview")
                        : active === "documents"
                          ? goTo("design")
                          : goTo(
                              activeStep === 3
                                ? "documents"
                                : steps[activeStep + 1].id,
                            )
                    }
                  >
                    {active === "design" ? t("နမူနာကြည့်ရန်") : t("ရှေ့ဆက်ရန်")}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              <div className="editor-foot">
                <LockKeyhole size={13} />
                <span>{t("အချက်အလက်များကို server ပေါ် မသိမ်းဆည်းပါ။")}</span>
                <button
                  onClick={() => (hasData ? setModal("reset") : reset())}
                  disabled={exporting || documentLocked}
                >
                  <RotateCcw size={13} />
                  {t("အသစ်စရန်")}
                </button>
              </div>
            </section>

            <section className="preview-column" aria-label={t("CV နမူနာ")}>
              <div className="preview-toolbar">
                <div className="preview-label">
                  <span className="live-dot" />
                  <h2>{t("တိုက်ရိုက်နမူနာ")}</h2>
                  <span className="a4-badge">A4</span>
                </div>
                <div className="preview-actions">
                  <button
                    className="icon-button"
                    onClick={() => setZoom(1)}
                    aria-label={t("စာမျက်နှာကို အံဝင်အောင်ပြရန်")}
                    title={t("အံဝင်အောင်ပြရန်")}
                  >
                    <Maximize2 size={16} strokeWidth={1.5} />
                  </button>
                  <span className="toolbar-divider" />
                  <button
                    className="icon-button"
                    onClick={() => void print()}
                    disabled={exporting || photoLoading || documentLocked}
                    aria-label={t("CV ပုံနှိပ်ရန်")}
                    title={t("ပုံနှိပ်ရန်")}
                  >
                    <Printer size={17} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              <div className="preview-canvas" ref={previewRef}>
                <div
                  className="preview-scaled-space"
                  style={{
                    width: maximumPageWidth * scale,
                    height: previewHeight * scale,
                  }}
                >
                  <div
                    className="preview-scale"
                    style={{
                      transform: `scale(${scale})`,
                      width: maximumPageWidth,
                    }}
                  >
                    <CvDocument
                      draft={draft}
                      documentRef={documentRef}
                      onPageCount={setCvPageCount}
                      documents={documents}
                    />
                  </div>
                </div>
              </div>
              <div className="preview-bottom">
                <span>
                  <FileText size={13} />
                  {pageCount} {t("စာမျက်နှာ")}
                  <span className="preview-bottom-dot">·</span>
                  {draft.template === "form"
                    ? t("ဖောင်ပုံစံ")
                    : draft.template === "classic"
                      ? t("ရိုးရှင်းသောပုံစံ")
                      : t("ခေတ်မီသောပုံစံ")}
                </span>
                <div className="zoom-controls">
                  <button
                    aria-label={t("နမူနာချုံ့ရန်")}
                    disabled={zoom <= 0.7}
                    onClick={() =>
                      setZoom((z) =>
                        Math.max(0.7, Math.round((z - 0.1) * 10) / 10),
                      )
                    }
                  >
                    <Minus size={13} />
                  </button>
                  <span>{Math.round(scale * 100)}%</span>
                  <button
                    aria-label={t("နမူနာချဲ့ရန်")}
                    disabled={zoom >= 1.4}
                    onClick={() =>
                      setZoom((z) =>
                        Math.min(1.4, Math.round((z + 0.1) * 10) / 10),
                      )
                    }
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
              <div className="preview-hint">
                <BadgeCheck size={15} strokeWidth={1.6} />
                <span>{t("ဒီမှာမြင်ရတဲ့အတိုင်း PDF မှာလည်း ရရှိပါမယ်။")}</span>
              </div>
            </section>
          </div>
          <SiteFooter onPrivacy={() => setModal("privacy")} />
        </div>
      </main>

      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? <CircleHelp size={18} /> : <CheckCheck size={18} />}
          <span>{toast.text}</span>
          <button
            className="icon-button"
            aria-label={t("အသိပေးချက်ပိတ်ရန်")}
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal === "settings" && (
        <Dialog title={t("ဝဘ်ဆိုက်ဆက်တင်")} onClose={closeModal}>
          <SettingsPanel
            cvLanguage={draft.cvLanguage}
            onCvLanguageChange={(cvLanguage) => updateDraft({ cvLanguage })}
            onShowPrivacy={() => setModal("privacy")}
          />
        </Dialog>
      )}
      {modal === "privacy" && (
        <Dialog title={t("သင့်အချက်အလက်၊ သင့်ဆီမှာပဲ")} onClose={closeModal}>
          <PrivacyDetails />
          <button
            className="primary-button dialog-confirm"
            onClick={closeModal}
          >
            {t("နားလည်ပါပြီ")}
            <Check size={16} />
          </button>
        </Dialog>
      )}
      {modal === "help" && (
        <Dialog title={t("CV တစ်စောင်၊ လွယ်လွယ်ကူကူ")} onClose={closeModal}>
          <ol className="help-steps">
            <li>
              <span>01</span>
              <div>
                <strong>{t("သင့်အကြောင်း ဖြည့်စွက်ပါ")}</strong>
                <p>
                  {t(
                    "ကိုယ်ရေး၊ ပညာရေး၊ မိသားစုနဲ့ ဆက်သွယ်ရန်အချက်အလက်တွေ ဖြည့်ပါ။ အမည်တစ်ခုပဲ မဖြစ်မနေလိုပါတယ်။",
                  )}
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>{t("ပုံစံရွေးပြီး နမူနာစစ်ပါ")}</strong>
                <p>
                  {t(
                    "ဓာတ်ပုံထည့်နိုင်ပြီး ဖောင်ပုံစံ၊ ရိုးရှင်း၊ ခေတ်မီ ပုံစံတို့ကို ရွေးနိုင်ပါတယ်။ မဖြည့်ထားတဲ့အချက်တွေကိုလည်း ဖျောက်နိုင်ပါတယ်။",
                  )}
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>{t("အဆင်သင့်ဖြစ်ရင် PDF ထုတ်ပါ")}</strong>
                <p>
                  {t(
                    "“စာရွက်စာတမ်းများ” မှာ မှတ်ပုံတင်အရှေ့/အနောက်၊ အိမ်ထောင်စုစာရင်း၊ ဘွဲ့နဲ့ အောင်လက်မှတ် ပုံများ / PDF များကို ထည့်နိုင်ပါတယ်။ “PDF ဒေါင်းလုဒ်” ကိုနှိပ်ပါ။ ပရင်တာသင်္ကေတကနေ တိုက်ရိုက်ပုံနှိပ်နိုင်ပါတယ်။ စာရှည်ရင် စာမျက်နှာအလိုက် ခွဲပေးပါတယ်။",
                  )}
                </p>
              </div>
            </li>
          </ol>
          <button
            className="primary-button dialog-confirm"
            onClick={closeModal}
          >
            {t("စတင်ဖြည့်စွက်မည်")}
            <ArrowRight size={16} />
          </button>
        </Dialog>
      )}
      {(modal === "reset" || modal === "sample") && (
        <Dialog
          title={
            modal === "reset"
              ? t("ဖောင်အသစ် စတင်မလား။")
              : t("နမူနာအချက်အလက် ဖြည့်မလား။")
          }
          onClose={closeModal}
        >
          <p className="confirm-copy">
            {t(
              "လက်ရှိဖြည့်ထားတဲ့ အချက်အလက်၊ ဓာတ်ပုံနဲ့ တွဲဖက်စာရွက်စာတမ်းတွေကို ဖျက်ပြီး",
            )}{" "}
            {modal === "reset"
              ? t("ဖောင်အလွတ်တစ်ခုနဲ့ စတင်ပါမယ်။")
              : t("စမ်းသပ်ရန် နမူနာအချက်အလက်တွေနဲ့ အစားထိုးပါမယ်။")}
          </p>
          <div className="dialog-buttons">
            <button className="secondary-button" onClick={closeModal}>
              {t("မလုပ်တော့ပါ")}
            </button>
            <button
              className="primary-button"
              onClick={() => reset(modal === "sample")}
            >
              {modal === "reset" ? t("ဖျက်ပြီး အသစ်စမည်") : t("နမူနာဖြည့်မည်")}
              <ArrowRight size={16} />
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
