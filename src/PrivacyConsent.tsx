import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  Clock3,
  FilePenLine,
  Globe2,
  HardDrive,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useSettings } from "./SettingsContext";
import { WebsiteLanguagePicker } from "./LanguageControls";

export const CONSENT_KEY = "alote-shauk.privacy-consent.v1";
export function hasConsent(): boolean {
  try {
    return sessionStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function PrivacyDetails() {
  const { language } = useSettings();
  const en = language === "en";
  return (
    <div className="privacy-details">
      <div className="privacy-detail privacy-detail-primary">
        <ShieldCheck size={23} />
        <div>
          <h3>
            {en
              ? "Your personal information is not collected or used"
              : "သင့်ကိုယ်ရေးဒေတာကို စုဆောင်း၊ ယူသုံးခြင်း မပြုပါ"}
          </h3>
          <p>
            {en
              ? "This app does not send your CV fields, ID card, household register, photos or certificates to our servers. We do not collect, read, reuse, share or sell that content. There is no analytics or advertising tracker in the app."
              : "ဒီ website က သင့် CV အချက်အလက်၊ မှတ်ပုံတင်၊ အိမ်ထောင်စုစာရင်း၊ ဓာတ်ပုံနဲ့ အောင်လက်မှတ်တွေကို server ဆီ မပို့ပါ။ အဲဒီအကြောင်းအရာတွေကို developer က စုဆောင်းခြင်း၊ ဖတ်ရှုခြင်း၊ ယူသုံးခြင်း၊ မျှဝေခြင်း၊ ရောင်းချခြင်း မပြုပါ။ Analytics နဲ့ ကြော်ငြာခြေရာခံစနစ်လည်း မထည့်ထားပါ။"}
          </p>
        </div>
      </div>
      <div className="privacy-detail">
        <HardDrive size={21} />
        <div>
          <h3>
            {en
              ? "Everything is processed in your browser"
              : "သင့် browser ထဲမှာပဲ လုပ်ဆောင်ပါတယ်"}
          </h3>
          <p>
            {en
              ? "Form filling, document processing and PDF creation happen on your device. The CV draft stays in this tab. Attachments use temporary browser storage so they can survive a refresh. Only language and theme preferences are kept for future visits."
              : "ဖောင်ဖြည့်ခြင်း၊ စာရွက်စာတမ်းပြင်ဆင်ခြင်းနဲ့ PDF ထုတ်ခြင်းကို သင့်စက်ပေါ်မှာပဲ လုပ်ဆောင်ပါတယ်။ CV မူကြမ်းကို ဒီ tab ထဲမှာ၊ တွဲဖက်ဖိုင်တွေကို refresh လုပ်လည်း ပြန်ရနိုင်တဲ့ browser ယာယီသိမ်းဆည်းမှုမှာ ထားပါတယ်။ နောက်တစ်ကြိမ်အတွက် ဘာသာစကားနဲ့ theme ဆက်တင်တွေပဲ မှတ်ထားပါတယ်။"}
          </p>
        </div>
      </div>
      <div className="privacy-detail">
        <Clock3 size={21} />
        <div>
          <h3>
            {en
              ? "Temporary data expires after two idle hours"
              : "မပြင်ဆင်ဘဲ ၂ နာရီကြာလျှင် သက်တမ်းကုန်ပါတယ်"}
          </h3>
          <p>
            {en
              ? "The open app clears an expired draft and its attachments. Files left behind when a tab closes are removed on the next app visit after expiry. Some browsers can restore a closed tab. Use “Start over” to immediately clear this draft and its attachments."
              : "ဖွင့်ထားတဲ့ app က သက်တမ်းကုန်မူကြမ်းနဲ့ တွဲဖက်ဖိုင်တွေကို ဖျက်ပေးပါတယ်။ Tab ပိတ်ပြီး ကျန်နေတဲ့ သက်တမ်းကုန်ဖိုင်တွေကို app ပြန်ဖွင့်ချိန်မှာ ရှင်းပေးပါတယ်။ တချို့ browser တွေက ပိတ်ထားတဲ့ tab ကို ပြန်ဖွင့်နိုင်လို့ ချက်ချင်းရှင်းချင်ရင် “အသစ်စရန်” ကို သုံးပါ။"}
          </p>
        </div>
      </div>
      <div className="privacy-detail">
        <ArrowDownToLine size={21} />
        <div>
          <h3>
            {en
              ? "Downloaded PDFs belong to you"
              : "ဒေါင်းလုဒ်ရထားတဲ့ PDF က သင့်ဆီမှာ ကျန်ပါတယ်"}
          </h3>
          <p>
            {en
              ? "The app cannot delete a PDF you have downloaded. The hosting provider may process ordinary connection metadata, such as IP addresses and request logs, when serving the website. Your form content and attachments are not included in those requests."
              : "ဒေါင်းလုဒ်ရယူထားတဲ့ PDF ကို website က ပြန်မဖျက်နိုင်ပါ။ Website ကို ဖွင့်ပေးရာမှာ hosting ဝန်ဆောင်မှုက IP လိပ်စာနဲ့ ပုံမှန်တောင်းဆိုမှုမှတ်တမ်းလို ချိတ်ဆက်မှုအချက်အလက်တွေကို ကိုင်တွယ်နိုင်ပါတယ်။ သင့်ဖောင်အကြောင်းအရာနဲ့ တွဲဖက်ဖိုင်တွေကိုတော့ အဲဒီတောင်းဆိုမှုတွေထဲ မထည့်ပါ။"}
          </p>
          <a
            href="https://vercel.com/legal/privacy-notice"
            target="_blank"
            rel="noreferrer"
          >
            {en
              ? "Hosting provider privacy notice"
              : "Hosting ဝန်ဆောင်မှု၏ privacy အချက်အလက်"}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PrivacyConsent({ onAgree }: { onAgree: () => void }) {
  const { language, resolvedTheme, setTheme } = useSettings();
  const en = language === "en";
  const dialog = useRef<HTMLDialogElement>(null);
  const [understood, setUnderstood] = useState(false);
  const [declined, setDeclined] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const agree = () => {
    if (!understood) return;
    try {
      sessionStorage.setItem(CONSENT_KEY, "accepted");
    } catch {
      /* Consent remains valid in memory for this visit. */
    }
    onAgree();
  };
  return (
    <div className="consent-screen" data-app-state="consent">
      <dialog
        ref={dialog}
        data-testid="privacy-consent"
        className="privacy-consent-dialog"
        aria-labelledby="consent-title"
        aria-describedby="consent-description"
        onCancel={(event) => event.preventDefault()}
      >
        <div className="consent-top">
          <div className="consent-brand">
            <FilePenLine size={23} />
            <strong>
              အလုပ်လျှောက်<span>.</span>
            </strong>
          </div>
          <div className="consent-tools">
            <WebsiteLanguagePicker compact />
            <button
              className="icon-button"
              aria-label={en ? "Switch color theme" : "Theme ပြောင်းရန်"}
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>
          </div>
        </div>
        <div className="consent-shield">
          <ShieldCheck size={29} strokeWidth={1.5} />
        </div>
        <h1 id="consent-title">
          {en
            ? "Your information stays with you."
            : "သင့်အချက်အလက်၊ သင့်ဆီမှာပဲ။"}
        </h1>
        <p id="consent-description" className="consent-description">
          {en
            ? "Please read how your data is handled before using အလုပ်လျှောက်. The CV form opens only after you agree."
            : "အလုပ်လျှောက်ကို အသုံးမပြုမီ ဒေတာကိုင်တွယ်ပုံကို ဖတ်ပေးပါ။ သဘောတူပြီးမှ CV ဖောင်ကို ဖွင့်ပေးပါမယ်။"}
        </p>
        <PrivacyDetails />
        {declined && (
          <p className="consent-declined" role="status">
            {en
              ? "The form remains closed. Your existing draft has not been read or changed. You can close this tab, or agree below when you are ready."
              : "ဖောင်ကို မဖွင့်ထားပါ။ ရှိပြီးသားမူကြမ်းကို ဖတ်ရှုခြင်း၊ ပြောင်းလဲခြင်း မလုပ်ထားပါ။ ဒီ tab ကို ပိတ်နိုင်ပါတယ်။ သုံးချင်တဲ့အခါ အောက်မှာ သဘောတူပေးနိုင်ပါတယ်။"}
          </p>
        )}
        <label className="consent-checkbox">
          <input
            type="checkbox"
            checked={understood}
            onChange={(event) => setUnderstood(event.target.checked)}
          />
          <span>
            {en
              ? "I have read and understood the temporary storage and privacy information."
              : "ယာယီသိမ်းဆည်းပုံနဲ့ privacy အချက်အလက်တွေကို ဖတ်ရှုနားလည်ပြီးပါပြီ။"}
          </span>
        </label>
        <div className="consent-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setUnderstood(false);
              setDeclined(true);
            }}
          >
            {en ? "I do not agree" : "မသဘောတူပါ"}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!understood}
            onClick={agree}
          >
            {en ? "I agree and continue" : "သဘောတူပြီး ဆက်သုံးမည်"}
            <Check size={17} />
          </button>
        </div>
        <div className="consent-footer">
          <span>
            <Globe2 size={13} />
            {en
              ? "No account needed · No CV data upload"
              : "အကောင့်မလိုပါ · CV ဒေတာကို server ဆီ မပို့ပါ"}
          </span>
          <span>
            Developed by <strong>ZinKoLyn</strong>
          </span>
        </div>
      </dialog>
    </div>
  );
}
