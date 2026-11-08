import { ExternalLink, ShieldCheck } from "lucide-react";
import { useSettings } from "./SettingsContext";

export default function SiteFooter({ onPrivacy }: { onPrivacy: () => void }) {
  const { language } = useSettings();
  return (
    <footer
      className="page-footer site-footer"
      aria-label={language === "en" ? "Website footer" : "Website အောက်ခြေ"}
    >
      <div className="site-footer-credit">
        <span>Developed by</span>
        <strong>ZinKoLyn</strong>
      </div>
      <div className="site-footer-links">
        <a
          href="https://github.com/ZinKoLin/alote-shauk"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={17} aria-hidden="true" />
          GitHub repository
        </a>
        <button type="button" onClick={onPrivacy}>
          <ShieldCheck size={17} />
          {language === "en" ? "Privacy" : "ကိုယ်ရေးအချက်အလက် လုံခြုံမှု"}
        </button>
      </div>
    </footer>
  );
}
