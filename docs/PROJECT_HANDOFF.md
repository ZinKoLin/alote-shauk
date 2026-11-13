# Project လက်လွှဲမှတ်တမ်း — အလုပ်လျှောက်

နောက်ဆုံး update: **2026-11-13 (Asia/Rangoon)**။ အခြား AI က ဒီဖိုင်နှင့် root `AGENTS.md` ကို ဖတ်ပြီး ဆက်ရေးနိုင်ရန် ရေးထားသည်။ Secrets၊ user CV ဒေတာ၊ NRC နံပါတ်အစစ်၊ မူရင်းဓာတ်ပုံနှင့် login code မပါဝင်ပါ။

## 1. Product နှင့် ရည်ရွယ်ချက်

**အလုပ်လျှောက်** သည် မြန်မာ / English CV ကို browser ထဲတွင် ဖြည့်၊ တိုက်ရိုက်နမူနာကြည့်၊ A4 PDF ထုတ်နိုင်သည့် website ဖြစ်သည်။ အသုံးပြုသူပေးထားသော မြန်မာ CV နှင့် ဘောင်ပါအလုပ်လျှောက်လွှာနမူနာများကို အခြေခံထားသည်။ Profile photo၊ မှတ်ပုံတင်နှစ်ဖက်၊ အိမ်ထောင်စုစာရင်း၊ ဘွဲ့နှင့်အောင်လက်မှတ်များကို တစ်ဖိုင်တည်းတွဲထုတ်နိုင်သည်။

Client-only app ဖြစ်ပြီး backend၊ login account၊ server database၊ analytics နှင့် CV upload endpoint မရှိပါ။ သုံးသူ၏စက်နှင့် browser ကိုပဲ အသုံးပြုသည်။

## 2. လက်ရှိ အခြေအနေ

| အချက်                                   | အခြေအနေ                                                               |
| -------------------------------------- | --------------------------------------------------------------------- |
| GitHub                                 | https://github.com/ZinKoLin/alote-shauk                               |
| Repository visibility                  | Public — 2026-11-13 တွင် GitHub CLI မှ ပြန်စစ်ထားသည်                        |
| Branch                                 | `main`                                                                |
| Documentation မတိုင်မီ app source baseline | `d4475ec` — simplified UI၊ 2026-11-08                                 |
| Production URL                         | https://alote-cv.vercel.app                                           |
| Legacy URL                             | https://patama-cv.vercel.app                                          |
| Vercel project                         | `patama-cv`၊ scope `zinkolins-projects`                               |
| Project ID                             | `prj_5CObONjShEFTjvJGzZKxhQ6Eh8bu`                                    |
| Team ID                                | `team_P10R0Tm0yva4qOGBrNoSh0Mg`                                       |
| Production deployment                  | `dpl_2VzK8z8srct5EGgjadftBdYskeHp`၊ 2026-11-08 deployment             |
| Deployment URL                         | https://patama-72j8icor4-zinkolins-projects.vercel.app                |
| Live state                             | 2026-11-13 CLI စစ်ချိန်တွင် `READY`၊ domains နှစ်ခု verified                  |
| Git → Vercel auto deploy               | 2026-11-13 တွင် project Git link မရှိပါ။ CLI ကနေ deploy လုပ်ခဲ့သည်             |
| Environment variables                  | App runtime အတွက် မလိုပါ။ Local CLI credential ဖိုင်များသည် app feature မဟုတ်ပါ |

ဒီအချက်များသည် snapshot ဖြစ်သည်။ နောက်အလုပ်စမည့် AI က `git status`၊ `git log` နှင့် လိုအပ်သည့် remote state ကို ပြန်စစ်ပါ။ Source baseline hash သည် ဒီ documentation commit ကို ရည်ညွှန်းခြင်း မဟုတ်ပါ။

### Domain ဆိုင်ရာ ဆုံးဖြတ်ချက်

User က `alote.cv.vercel` ကို လိုချင်ခဲ့သည်။ အဲဒီ hostname ကို လက်ရှိအကောင့်မှ မသုံးနိုင်ခဲ့သောကြောင့် Vercel ၏ `.vercel.app` ပုံစံနှင့်ကိုက်သော `alote-cv.vercel.app` ကို ရွေးပြီး project Production domain အဖြစ် ချိတ်ထားသည်။ Legacy domain ကို မဖျက်ထားပါ။ Domain မဝယ်ခဲ့ပါ။

## 3. လုပ်ပြီးသော feature များ

- ကိုယ်ရေး၊ ပညာရေး/အလုပ်လျှောက်ရာထူး၊ မိသားစု၊ ဆက်သွယ်ရန်အချက်အလက် စသည့် အဆင့် ၄ ဆင့်။ Attachments နှင့် Design အပိုင်း သီးခြားရှိသည်။
- CV template ၃ မျိုး: `form` (ဘောင်ပါလျှောက်လွှာ၊ default)၊ `classic` (ရိုးရှင်း)၊ `modern` (ခေတ်မီ)။ မဖြည့်သောအချက်များကို ဖျောက်နိုင်သည်။
- Application date ကို date input ဖြင့် အတိတ်နှင့်အနာဂတ် စိတ်ကြိုက်ရွေးနိုင်သည်။
- Birthday ကို ရက် / လအမည် / နှစ် ခွဲရွေးနိုင်သည်။ Leap year၊ လအလိုက်ရက်အရေအတွက်နှင့် future date ကို စစ်ပေးသည်။ အသက်ကို ကိုယ်တိုင်မဖြည့်ထားလျှင် မွေးနေ့မှ တွက်ပေးသည်။
- Birthday ရွေးနေဆဲ incomplete state ကို `Workspace` ထဲရှိ controller က ထိန်းထားသောကြောင့် ဖောင်အပိုင်းပြောင်းလည်း မပျောက်ပါ။ မပြည့်စုံလျှင် export ပိတ်ထားပြီး ပြည့်စုံအောင်ရွေးရန် သို့မဟုတ် clear လုပ်ရန် ပြသည်။ Partial state ကို refresh ကျော်ပြီးသိမ်းထားမည်ဟု မကတိပေးပါ။
- Profile photo ထည့်/ပြောင်း/ဖယ်နိုင်သည်။ CV template များ၏ profile photo အရွယ်အစားကို အစောပိုင်း version ထက် ကြီးထားသည်။
- NRC ရှေ့/နောက်ကို portrait A4 တစ်ရွက်ပေါ် အပေါ်/အောက်၊ household register ကို landscape A4 full-page ထည့်သည်။ Certificate များကို portrait/landscape ရွေးပြီး ဆက်ထည့်နိုင်သည်။
- Attachments အတွက် image / multi-page PDF import၊ လှည့်ခြင်း၊ အစီအစဉ်ပြောင်းခြင်း၊ ဖယ်ခြင်း၊ document/page count နှင့် invalid-file handling ပါသည်။
- CV စာရှည်များကို grapheme မပျက်အောင် စာမျက်နှာခွဲသည်။ Section heading ကို နောက်ဆက်တွဲအချက်နှင့် ကပ်ထားသည်။
- PDF export သည် မြန်မာစာ/ပုံစံထိန်းထားရန် raster CV pages နှင့် တိုက်ရိုက် image attachment pages ကို ပေါင်းထားသည်။ Print လုပ်ရာတွင် mixed portrait/landscape pages ကို ဆက်ထုတ်နိုင်သည်။
- Privacy consent dialog ကို အရင်ပြသည်။ နားလည်ကြောင်း checkbox နှင့် Agree ကို ပေးပြီးမှ workspace ဖွင့်သည်။ Decline / Escape ဖြင့် privacy gate ကို မကျော်နိုင်ပါ။
- Website UI ဘာသာစကား `my` / `en` နှင့် CV document language သီးခြားရှိသည်။ Flags ကို Windows တွင်ပါ မှန်ကန်စွာပြရန် inline SVG သုံးထားသည်။
- Light / Dark / System theme။ UI ကိုသာ ပြောင်းပြီး CV paper ကို အဖြူအတိုင်းထားသည်။
- ဖတ်ရလွယ်သောစာလုံး၊ ဖုန်းပေါ် 16px inputs၊ 44px ခန့်နှင့်အထက် interactive targets၊ keyboard focus၊ mobile editor/preview tabs ပါသည်။
- ရိုးရှင်းသော neutral UI: ကြီးသော marketing hero၊ ထပ်နေသော brand/tagline/ရှင်းလင်းချက်များကို ဖယ်ထားသည်။ Language controls ကို အပေါ်ဆုံးတွင် ဆက်ထားသည်။
- Footer: **Developed by ZinKoLyn**၊ Public GitHub link (tab အသစ်) နှင့် Privacy။
- Storage မရသည့် browser တွင် memory fallback အသိပေးသည်။ Sample fill၊ reset confirmation၊ loading/error notification နှင့် Help ပါသည်။

## 4. နောက် AI က သတိထားရမည့် ကန့်သတ်ချက်များ

1. **ဒေတာမပျောက်ရေးသည် အဓိက။** Branding / styling ပြောင်းရန်အတွက် storage keys ကို မပြောင်းပါနှင့်။ Theme/language/template ပြောင်းလဲခြင်းနှင့် attachments ပြင်ခြင်းက အခြား field များကို မဖျက်ရ။
2. **Origin ခွဲခြားမှု။** `localhost:5173`၊ `127.0.0.1:4173`၊ `patama-cv.vercel.app` နှင့် `alote-cv.vercel.app` တို့၏ browser storage သီးခြားဖြစ်သည်။ Domain ပြောင်းပြီး ဒေတာမပေါ်ခြင်းသည် အလိုအလျောက် migration ဖြစ်မည်ဟု မယူဆရ။ Cross-domain migration မရေးထားပါ။
3. **Idle TTL။** မပြင်ဆင်ဘဲ ၂ နာရီကြာလျှင် ယာယီ draft/attachments သက်တမ်းကုန်သည်။ 2026-11-08 တွင် သုံးထားသော browser draft ကို 2026-11-13 မှာ ရှိနေမည်ဟု မကတိပေးရ။
4. IndexedDB သည် tab ပိတ်ပြီးနောက် disk ပေါ်ကျန်နိုင်သည်။ သက်တမ်းကုန် records ကို နောက် app visit တွင် ရှင်းသည်။ Browser tab restore က session ကို ပြန်ရနိုင်သည်။ PDF download ကို app က ပြန်မဖျက်နိုင်ပါ။
5. Developer က CV content ကို မယူသုံးသော်လည်း hosting provider သည် ပုံမှန် IP/request metadata ကို ကိုင်တွယ်နိုင်သည်။ Privacy copy ကို လက်ရှိ behavior နှင့် ကိုက်ညီစေပါ။
6. Form template တွင် father name ပါသော်လည်း family fields အပြည့်အစုံအတွက် classic / modern ကို ရွေးရသည်။ Form template တွင် အမိအချက်အလက်မပေါ်ခြင်းကို user input ပျက်ခြင်းဟု မယူဆရ။
7. Default download PDF သည် အဓိကအားဖြင့် image-based ဖြစ်သည်။ Selectable text လိုလျှင် Print → Save as PDF ကို စမ်းပါ။ Scanned attachments ၏စာသားသည် မူလအတိုင်းပုံသာဖြစ်သည်။ OCR မရှိပါ။
8. PDF password input မရှိပါ။ Password-protected PDF ကို reject လုပ်သည်။ Original PDF ကို server သို့ပို့ဖတ်သည့် service မထည့်ထားပါ။
9. `package.json` ၏ `private: true` သည် npm publish ကာကွယ်မှုဖြစ်ပြီး GitHub visibility မဟုတ်ပါ။ GitHub repository သည် Public ဖြစ်သည်။
10. Package၊ storage နှင့် Vercel project အမည် `patama-cv` ကျန်ခြင်းသည် compatibility / existing project linkage အတွက် ဖြစ်သည်။ Product label က **အလုပ်လျှောက်** ဖြစ်သည်။
11. ယခု document များက အခြား AI အတွက်ညွှန်ကြားချက်ဖြစ်သည်။ Background daemon၊ scheduler သို့မဟုတ် file watcher ဖြင့် docs auto-generate လုပ်ထားခြင်း မဟုတ်ပါ။ ပြင်ဆင်သော AI က `AGENTS.md` အတိုင်း တစ်ခါတည်း update လုပ်ရမည်။

## 5. Development အမြန်စရန်

Node.js 24 နှင့် Google Chrome ဖြင့် စမ်းထားသည်။ Lockfile ထဲက dependency version များကို ထိန်းရန် `npm ci` ကို သုံးပါ။

```sh
git clone https://github.com/ZinKoLin/alote-shauk.git
cd alote-shauk
npm ci
npm run dev
```

Local source `http://localhost:5173/`၊ production build preview `http://127.0.0.1:4173/`။ Port သည် အခြား process နှင့်တိုက်လျှင် Vite terminal output ကို ကြည့်ပါ။

```sh
npm run build
npm run preview
npm test
```

Preview/CSP ဖြင့်စမ်းရန် PowerShell:

```powershell
npm run build
$env:CV_TEST_PREVIEW = '1'
npm test
Remove-Item Env:CV_TEST_PREVIEW -ErrorAction SilentlyContinue
```

နောက်ထပ် command များနှင့် deployment အတွက် [Operations](OPERATIONS.md) ကို ဖတ်ပါ။

## 6. Code နေရာ အမြန်ရှာရန်

| ပြင်ချင်သောနေရာ                                         | အဓိကဖိုင်                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Form/navigation/state/export/reset                    | `src/App.tsx`                                                           |
| Draft schema၊ default fields၊ CV row composition၊ TTL | `src/model.ts`                                                          |
| Birthday UI/controller                                | `src/BirthdayField.tsx`                                                 |
| Consent / privacy copy                                | `src/PrivacyConsent.tsx`                                                |
| App language/theme preferences                        | `src/SettingsContext.tsx`, `src/SettingsPanel.tsx`                      |
| Translations                                          | `src/localization.ts`, `src/en.json`, `src/cvLanguage.ts`               |
| Top language controls / flag SVG                      | `src/LanguageControls.tsx`, `src/language-controls.css`                 |
| Footer GitHub / credit                                | `src/SiteFooter.tsx`                                                    |
| CV layout / pagination                                | `src/CvDocument.tsx`, `src/form-template.css`, `src/styles.css`         |
| Document importing / rotating / counts                | `src/documents.ts`                                                      |
| Attachment editor / rendering                         | `src/DocumentEditor.tsx`, `src/DocumentSheets.tsx`, `src/documents.css` |
| Attachment lifecycle / IndexedDB                      | `src/useDocuments.ts`, `src/documentStorage.ts`                         |
| PDF export / profile photo conversion                 | `src/export.ts`                                                         |
| UI theme / readability / final simple design          | `src/theme.css`, `src/readability.css`, `src/simple-design.css`         |
| CSS order / providers                                 | `src/main.tsx`                                                          |
| Fonts / PDF.js static assets                          | `src/fonts.css`, `public/fonts/`, `public/pdfjs/`                       |
| Build / preview / deployed headers                    | `vite.config.ts`, `vercel.json`                                         |
| End-to-end tests                                      | `tests/`, `playwright.config.ts`                                        |

အသေးစိတ် schema နှင့် flow ကို [Architecture](ARCHITECTURE.md) တွင် ဖတ်ပါ။

## 7. Verification၊ အလုပ်ကျန်နှင့် ဆက်လုပ်ပုံ

- 2026-11-08 implementation session: full Playwright suite **23 passed**၊ final consent theme screenshot check နှင့် desktop/mobile rendering check passed။ Production public URL တွင် language/draft/attachment preservation နှင့် responsive tests **2 passed**။
- 2026-11-13 documentation session: `npm run build` passed; PowerShell တွင် `CV_TEST_PREVIEW=1` ဖြင့် `npm test` run ပြီး **23 passed (48.7s)**။ Documentation ဖိုင် ၆ ခု၊ relative Markdown links ၁၅ ခုနှင့် documented core module/config/license paths ကို စစ်ပြီး credential pattern မတွေ့ပါ။ Runtime / storage / tests / dependencies source မပြောင်းကြောင်း Git diff ဖြင့် အတည်ပြုထားသည်။
- 2026-11-13 live verification: public URL သည် HTTP 200 နှင့် မှန်ကန်သော app title ကို ပြန်ပေးသည်။ Scoped Vercel CLI API က ယခင် production deployment `READY`၊ domain နှစ်ခု verified နှင့် Git link မရှိခြင်းကို ပြသည်။ ဒီ documentation update အတွက် deploy မလုပ်ပါ။
- User က လက်ရှိတောင်းထားသော feature/bug fix အလုပ်ကျန် မရှိပါ။ ဒီ request သည် documentation နှင့် အမြဲ update လုပ်မည့် working rules သိမ်းရန် ဖြစ်သည်။
- User CV migration၊ server backend၊ OCR၊ cloud sync၊ account system၊ GitHub auto deploy၊ documentation automation တို့သည် အကောင်အထည်ဖော်ထားသော feature မဟုတ်ပါ။ တောင်းဆိုချက်အသစ်မရှိဘဲ backlog task အဖြစ် ယူမလုပ်ရ။
- နောက်အလုပ်စချိန် read docs → inspect actual state → implement preserving data → relevant checks → update docs → authorized Git operations ဟူသောအစဉ်ကို သုံးပါ။
