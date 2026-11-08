import { Monitor, Moon, Sun } from "lucide-react";
import type { Locale, Theme } from "./localization";
import { useSettings } from "./SettingsContext";
import { WebsiteLanguagePicker } from "./LanguageControls";

export default function SettingsPanel({
  cvLanguage,
  onCvLanguageChange,
  onShowPrivacy,
}: {
  cvLanguage: Locale;
  onCvLanguageChange: (language: Locale) => void;
  onShowPrivacy: () => void;
}) {
  const { language, theme, setTheme } = useSettings();
  const en = language === "en";
  const themes: { id: Theme; icon: typeof Sun; label: string }[] = [
    { id: "light", icon: Sun, label: en ? "Light" : "အလင်း" },
    { id: "dark", icon: Moon, label: en ? "Dark" : "အမှောင်" },
    { id: "system", icon: Monitor, label: en ? "System" : "စက်ဆက်တင်အတိုင်း" },
  ];
  return (
    <div className="settings-panel">
      <div className="settings-section">
        <h3>{en ? "Appearance" : "အပြင်အဆင်"}</h3>
        <div className="theme-options">
          {themes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={theme === item.id}
              onClick={() => setTheme(item.id)}
            >
              <item.icon size={21} strokeWidth={1.5} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="settings-section">
        <h3 id="settings-website-language">
          {en ? "Website language" : "ဝဘ်ဆိုက်ဘာသာစကား"}
        </h3>
        <WebsiteLanguagePicker labelledBy="settings-website-language" />
        <p>
          {en
            ? "Menus, field labels and messages use this language."
            : "Menu၊ အကွက်အမည်နဲ့ အသိပေးချက်တွေကို ဒီဘာသာစကားနဲ့ ပြပေးပါမယ်။"}
        </p>
      </div>
      <div className="settings-section">
        <label htmlFor="cv-language">
          {en ? "CV document language" : "CV ထုတ်မည့်ဘာသာစကား"}
        </label>
        <select
          id="cv-language"
          value={cvLanguage}
          onChange={(event) => onCvLanguageChange(event.target.value as Locale)}
        >
          <option value="my">မြန်မာ CV</option>
          <option value="en">English CV</option>
        </select>
        <p>
          {en
            ? "Changes the headings and labels in your CV and PDF. Your entered information, photo and attachments stay unchanged. Enter names and other details in the language you want to print."
            : "CV နဲ့ PDF ထဲက ခေါင်းစဉ်၊ အကွက်အမည်တွေကို ပြောင်းပေးပါတယ်။ ဖြည့်ထားတဲ့စာ၊ ဓာတ်ပုံနဲ့ တွဲဖက်ဖိုင်တွေ မပြောင်းပါ။ အမည်နဲ့ အခြားအချက်အလက်တွေကို ထုတ်ချင်တဲ့ဘာသာစကားနဲ့ ဖြည့်ပေးပါ။"}
        </p>
      </div>
      <div className="settings-footer">
        <span>
          Developed by <strong>ZinKoLyn</strong>
        </span>
        <button type="button" onClick={onShowPrivacy}>
          {en ? "Privacy details" : "Privacy အသေးစိတ်"}
        </button>
      </div>
    </div>
  );
}
