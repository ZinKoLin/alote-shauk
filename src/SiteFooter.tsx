import { FilePenLine, ShieldCheck } from "lucide-react";
import { useSettings } from "./SettingsContext";

export default function SiteFooter({ onPrivacy }: { onPrivacy: () => void }) {
  const { language } = useSettings();
  return (
    <footer
      className="page-footer site-footer"
      aria-label={language === "en" ? "Website footer" : "Website အောက်ခြေ"}
    >
      <div className="site-footer-brand">
        <div>
          <FilePenLine size={22} strokeWidth={1.5} />
          <strong>
            အလုပ်လျှောက်<span>.</span>
          </strong>
        </div>
        <p>
          {language === "en"
            ? "Ready for your next opportunity."
            : "အခွင့်အလမ်းကောင်းတိုင်းအတွက် အဆင်သင့်။"}
        </p>
      </div>
      <div className="site-footer-credit">
        <span>Developed by</span>
        <strong>ZinKoLyn</strong>
      </div>
      <button type="button" onClick={onPrivacy}>
        <ShieldCheck size={17} />
        {language === "en" ? "Privacy" : "ကိုယ်ရေးအချက်အလက် လုံခြုံမှု"}
      </button>
    </footer>
  );
}
