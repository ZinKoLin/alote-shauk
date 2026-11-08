import { useId } from "react";
import { ChevronDown, FileText, Globe2 } from "lucide-react";
import type { Locale } from "./localization";
import { useSettings } from "./SettingsContext";

// Inline flags render consistently on platforms that do not display flag emoji.
export function LanguageFlag({ language }: { language: Locale }) {
  return (
    <span className="language-flag" aria-hidden="true">
      {language === "my" ? (
        <svg viewBox="0 0 30 20" focusable="false">
          <path fill="#fecb00" d="M0 0h30v7H0z" />
          <path fill="#34b233" d="M0 7h30v6H0z" />
          <path fill="#ea2839" d="M0 13h30v7H0z" />
          <path
            fill="#fff"
            d="m15 3 1.8 5.3h5.6l-4.5 3.3 1.7 5.3-4.6-3.3-4.6 3.3 1.7-5.3-4.5-3.3h5.6z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 30 20" focusable="false">
          <path fill="#012169" d="M0 0h30v20H0z" />
          <path stroke="#fff" strokeWidth="5" d="m0 0 30 20M30 0 0 20" />
          <path stroke="#c8102e" strokeWidth="2" d="m0 0 30 20M30 0 0 20" />
          <path stroke="#fff" strokeWidth="7" d="M15 0v20M0 10h30" />
          <path stroke="#c8102e" strokeWidth="4" d="M15 0v20M0 10h30" />
        </svg>
      )}
    </span>
  );
}

export function WebsiteLanguagePicker({
  labelledBy,
  compact = false,
}: {
  labelledBy?: string;
  compact?: boolean;
}) {
  const { language, setLanguage } = useSettings();
  return (
    <div
      className={`website-language-picker ${compact ? "compact" : ""}`}
      role="group"
      aria-labelledby={labelledBy}
      aria-label={
        labelledBy
          ? undefined
          : language === "en"
            ? "Website language"
            : "ဝဘ်ဆိုက်ဘာသာစကား"
      }
    >
      {(["my", "en"] as Locale[]).map((locale) => (
        <button
          key={locale}
          type="button"
          aria-label={locale === "my" ? "မြန်မာ" : "English"}
          aria-pressed={language === locale}
          onClick={() => setLanguage(locale)}
        >
          <LanguageFlag language={locale} />
          <span>{locale === "my" ? "မြန်မာ" : "English"}</span>
        </button>
      ))}
    </div>
  );
}

export default function LanguageToolbar({
  cvLanguage,
  onCvLanguageChange,
  disabled = false,
}: {
  cvLanguage: Locale;
  onCvLanguageChange: (language: Locale) => void;
  disabled?: boolean;
}) {
  const { language } = useSettings();
  const en = language === "en";
  const websiteLabel = useId();
  const cvSelect = useId();
  return (
    <section
      className="language-toolbar"
      aria-label={en ? "Language preferences" : "ဘာသာစကားရွေးချယ်မှု"}
    >
      <div className="language-control">
        <h2 id={websiteLabel}>
          <Globe2 size={18} />
          {en ? "Website language" : "ဝဘ်ဆိုက်ဘာသာစကား"}
        </h2>
        <WebsiteLanguagePicker labelledBy={websiteLabel} />
      </div>
      <div className="language-control">
        <label htmlFor={cvSelect}>
          <FileText size={18} />
          {en ? "CV document language" : "CV ထုတ်မည့်ဘာသာစကား"}
        </label>
        <div className="cv-language-select">
          <LanguageFlag language={cvLanguage} />
          <select
            id={cvSelect}
            value={cvLanguage}
            disabled={disabled}
            onChange={(event) =>
              onCvLanguageChange(event.target.value as Locale)
            }
          >
            <option value="my">မြန်မာ CV</option>
            <option value="en">English CV</option>
          </select>
          <ChevronDown size={17} aria-hidden="true" />
        </div>
      </div>
      <p>
        {en
          ? "Website language changes the menus. CV language changes the document headings. Your entered details stay unchanged."
          : "Website ဘာသာစကားက menu တွေကို ပြောင်းပေးပါတယ်။ CV ဘာသာစကားက စာရွက်ထဲက ခေါင်းစဉ်တွေကို ပြောင်းပေးပြီး ဖြည့်ထားတဲ့ဒေတာတွေ မပြောင်းပါ။"}
      </p>
    </section>
  );
}
