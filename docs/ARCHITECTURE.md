# Architecture နှင့် data contract

နောက်ဆုံး update: **2026-11-13**။ ဒီဖိုင်သည် source baseline `d4475ec` ကို ဖတ်ပြီး ရေးထားသော implementation map ဖြစ်သည်။ Live service state သည် [Project handoff](PROJECT_HANDOFF.md) တွင် သီးခြားရှိသည်။

## 1. Stack နှင့် entry points

`package.json` ranges: React / ReactDOM `^19.3.1`၊ TypeScript `^7.0.2`၊ Vite `^8.3.6`၊ React plugin `^6.2.1`၊ Playwright `^1.65.0`၊ Lucide React `^1.70.0`၊ jsPDF `^4.2.1`၊ html2canvas-pro `^2.6.3`၊ PDF.js `^6.5.438`၊ Inter Variable `^5.3.0`။ Resolved versions အတွက် `package-lock.json` ကို အခြေခံပါ။

`index.html` → `src/main.tsx` → `SettingsProvider` → `App` → `PrivacyConsent` သို့မဟုတ် `Workspace`။ React StrictMode အသုံးပြုသည်။ Router၊ API server နှင့် remote persistence မရှိပါ။

`SettingsProvider` သည် preferences ကို ဖတ်ပြီး `html.lang`၊ `html[data-theme]`၊ page title နှင့် theme-color meta ကို update လုပ်သည်။ OS color preference ပြောင်းမှုကို listener ဖြင့် စောင့်သည်။

## 2. Consent boundary

`App` ၏ `hasConsent()` က **consent key ကိုသာ** ဖတ်သည်။ `accepted === false` တွင် `Workspace` မရှိသေးသောကြောင့် `readDraft()` နှင့် `useDocuments()` မစပါ။

- Native modal dialog (`showModal`)၊ checkbox နှင့် Agree button ပါသည်။ Checkbox မရွေးမီ Agree disabled ဖြစ်သည်။
- Dialog `cancel` event ကို prevent လုပ်သဖြင့် Escape မကျော်နိုင်ပါ။ Decline က workspace ကို မဖွင့်ဘဲ ရှိပြီးသားဒေတာ မပြောင်းကြောင်း ပြသည်။
- Agree က session key ကို `accepted` သတ်မှတ်ပြီး workspace ကို mount လုပ်သည်။ SessionStorage မရလျှင် လက်ရှိ visit memory state ဖြင့် ဆက်သုံးနိုင်သည်။
- Consent dialog ပေါ်က UI language/theme ပြောင်းမှုသည် private CV data access မလိုပါ။ Privacy copy ပြင်လျှင် အမှန်တကယ် storage/network behavior နှင့် အမြဲကိုက်ညီစေပါ။

## 3. Browser storage contract

| Store          | Key / DB                                                  | အကြောင်းအရာ                                                                     | Lifetime                            |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| sessionStorage | `patama.cv.draft.v1`                                      | CV fields၊ profile photo data URL၊ template၊ hideEmpty၊ CV language၊ updatedAt | idle ၂ နာရီ၊ ပုံမှန် tab session         |
| sessionStorage | `patama.cv.documents.session.v1`                          | Attachment session UUID                                                        | tab session                         |
| IndexedDB      | DB `patama-cv-documents` v1၊ store `drafts`၊ keyPath `id` | `{ id, updatedAt, documents }`                                                 | idle ၂ နာရီ၊ app cleanup လုပ်ချိန် ဖယ်ရှား |
| sessionStorage | `alote-shauk.privacy-consent.v1`                          | `accepted`                                                                     | tab session                         |
| localStorage   | `alote-shauk.preferences.v1`                              | `{ language, theme }`                                                          | နောက် visit များအတွက်၊ CV data မပါ     |

အဲဒီ names ထဲက `patama` သည် legacy compatibility ဖြစ်သည်။ တစ်ခုခု rename လုပ်ခြင်းသည် ရှိပြီးသား browser data ကို မဖတ်နိုင်တော့စေနိုင်သည်။

```ts
type Draft = {
  fields: Record<FieldKey, string>;
  photo: string; // validated data:image/(jpeg|png|webp);base64,...
  template: "form" | "classic" | "modern";
  hideEmpty: boolean;
  cvLanguage: "my" | "en";
  updatedAt: number; // Date.now() milliseconds; 0 means untouched draft
};
```

Fields ၂၃ ခု (`model.ts`):

```text
name, desiredRole, applicationDate, age, languages, nrc, birthday,
gender, nationality, religion, maritalStatus, education, skills, experience,
fatherName, fatherNrc, fatherJob, motherName, motherNrc, motherJob,
address, phone, email
```

`readDraft()` သည် unknown JSON ကို validate လုပ်ပြီး default fields နှင့် merge လုပ်သည်။ String field များကို restore လုပ်ရာတွင် 1600 characters အထိသာ ယူသည်။ Missing `cvLanguage` ကို `my` အဖြစ် normalize လုပ်သည်။ Photo string သည် data-image prefix မှန်ပြီး length ≤ 2,000,000 ဖြစ်ရသည်။ Malformed / expired / future-dated `updatedAt` draft များကို discard လုပ်သည်။ ဒီလို validation ကို styling change အတွက် မပိတ်ပါနှင့်။

မူကြမ်းမရှိသောအခါ `Workspace` က initial CV language ကို UI language နှင့်လိုက်ထားသည်။ ရှိပြီးသားမူကြမ်းရှိလျှင် ၎င်း၏ CV language ကို ထိန်းသည်။

## 4. Lifecycle နှင့် concurrency

- `updateField()` / `updateDraft()` က previous state ကို merge လုပ်ပြီး `updatedAt` ကို အချိန်အသစ်ပေးသည်။ Partial update က အခြား field / photo များကို ထိန်းရသည်။
- Attachments ready ဖြစ်ပြီးမှ `Workspace` က nonempty draft ကို sessionStorage သို့ ရေးသည်။ Storage exception ဖြစ်လျှင် memory fallback warning ပြသည်။
- `DRAFT_TTL = 2 * 60 * 60 * 1000`။ Open workspace သည် 15 seconds interval၊ window focus နှင့် document visibility event တွင် expiry ကိုစစ်သည်။ Expire ချိန် birthday controller၊ draft၊ photo-loading generation နှင့် attachments ကို reset လုပ်သည်။
- `useDocuments` initialize လုပ်ရာတွင် session UUID ကို restore / generate လုပ်သည်။ `loadDocuments()` cursor က expired records အားလုံးကို cleanup လုပ်ပြီး လက်ရှိ tab record ကို ပြန်ပေးသည်။
- Attachment `replace()` သည် persistence ကို ကြိုးစားပြီး version counter မှန်သေးမှ state ကို apply လုပ်သည်။ Draft activity သည် 600ms debounce ဖြင့် attachment record `updatedAt` ကို touch လုပ်သည်။
- Attachment clear သည် version counter နှင့် `resetVersion` ကို တိုးစေ၍ pending import / restore အဟောင်းက reset ပြီး state ကို ပြန်မဖြည့်စေရန် ကာကွယ်သည်။ Photo import သည် generation counter ကို သုံးသည်။
- IndexedDB quota/blocked/error ဖြစ်လျှင် attachments ကို memory ထဲမှာ ဆက်ထားပြီး persistence warning ပြသည်။ Server upload fallback မရှိပါ။
- Reset / sample fill သည် destructive ဖြစ်နိုင်သဖြင့် ရှိပြီးသားဒေတာရှိလျှင် confirmation dialog ရှိသည်။ Tests အတွက် synthetic context ကိုသာ reset လုပ်ပါ။

## 5. Date handling နှင့် validation

`BirthdayField.tsx` တွင် `useBirthdayInput(value, onChange)` controller ကို `Workspace` က own လုပ်သည်။ Day/month/year UI parts၊ incomplete state နှင့် notice ကို ထိန်းပြီး complete date ဖြစ်မှ ISO `YYYY-MM-DD` value ထုတ်သည်။ မပြည့်စုံသည့် parts ကို component navigation အတွင်း controller က ထိန်းထားသော်လည်း session draft ထဲတွင် partial structure မသိမ်းပါ။

- လရွေးမှု၊ ရက်ထပ်နှစ်နှင့် ရက်အရေအတွက်ကို တွက်သည်။ Invalid day သို့မဟုတ် future day ကို တိတ်တဆိတ် အခြားရက်ပြောင်းမပေးဘဲ clear + notice ပြသည်။
- Year options သည် လက်ရှိနှစ်မှ ၁၂၀ နှစ်အရင်အထိဖြစ်ပြီး loaded year မပါလျှင် အဲဒီနှစ်ကိုပါ ထည့်ထားသည်။
- Export/print validation: name nonempty၊ birthday သည် empty သို့မဟုတ် complete ဖြစ်ရသည်။ Photo/document processing သို့မဟုတ် exporting ဖြစ်နေစဉ် duplicate export ကို ကာကွယ်သည်။
- CV display က `DD / MM / YYYY`။ `age` မဖြည့်ထားလျှင် `ageFromBirthday()` ဖြင့်တွက်သည်။
- `applicationDate` သည် သီးခြား field ဖြစ်ပြီး birthday ၏ future-date limitation မသုံးပါ။

## 6. Attachments နှင့် input limits

```ts
type DocumentImage = {
  id: string;
  name: string;
  src: string; // normalized JPEG data URL
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
};
type Documents = {
  front: DocumentImage | null;
  back: DocumentImage | null;
  household: DocumentImage[];
  certificates: DocumentImage[];
};
```

| Input                    | Limit / behavior                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| Profile photo            | JPG/PNG/WebP၊ တစ်ဖိုင် 8 MiB အထိ၊ longest edge 640px အထိ resize၊ white canvas၊ JPEG quality 0.9 |
| Attachment file          | တစ်ဖိုင် 20 MiB အထိ                                                                            |
| Attachment content count | စုစုပေါင်း ၂၀ ပုံ/PDF pages၊ NRC ရှေ့/နောက်ကို တစ်ပုံစီတွက်သည်                                             |
| NRC                      | Images only; front/back တစ်ခုစီ                                                              |
| Household/certificates   | Images နှင့် unencrypted PDF; PDF စာမျက်နှာအားလုံး import                                        |
| Image normalization      | longest edge 2400px အထိ၊ white background၊ JPEG quality 0.92                               |
| PDF rendering            | scale `min(3, 2400 / max(pageWidth,pageHeight))`                                          |

Content count နှင့် output page count မတူပါ။ NRC images နှစ်ပုံသည် output portrait page တစ်ရွက်ပေါ် ပေါင်းသည်။ Household item တစ်ခုစီသည် landscape A4 တစ်ရွက်။ Certificate orientation ကို item property မှယူသည်။ Export အစီအစဉ်မှာ CV pages → NRC → household pages → certificates ဖြစ်သည်။

PDF.js worker ကို Vite `?url` import ဖြင့် locally bundle လုပ်သည်။ CMaps၊ standard fonts နှင့် WASM assets သည် `public/pdfjs/` တွင်ရှိသည်။ လက်ရှိ `getDocument` options တွင် `useWasm: false` နှင့် `disableWorkerRendering: true` သတ်မှတ်ထားသည်။ PDF passwords မတောင်းဘဲ task ကို destroy လုပ်၍ reject လုပ်သည်။

## 7. CV rendering၊ pagination နှင့် PDF

- `getRows(draft)` က template-specific label/value rows ကို compose လုပ်ပြီး `localizeCvRows()` က CV language အတွက် label နှင့် gender/marital enum တချို့ကို ပြောင်းပေးသည်။ User free text ကို မဘာသာပြန်ပါ။
- Portrait page coordinate သည် **794 × 1123 px**၊ landscape သည် ပြောင်းပြန်။ PDF physical page သည် **210 × 297 mm** / **297 × 210 mm** A4။
- `CvDocument` က off-screen measurement DOM ကို template classes နှင့်တူညီစွာ render လုပ်သည်။ Actual row `offsetHeight` ကိုယူပြီး page breaks ခွဲသည်။ `document.fonts.ready` နောက် တစ်ခါထပ်တိုင်းသည်။
- Row တစ်ခုသည် စာမျက်နှာထက်ရှည်လျှင် `Intl.Segmenter("my", { granularity: "grapheme" })` နှင့် binary-search fitting ဖြင့် ခွဲသည်။ Myanmar combining characters မပျက်စေရန် ordinary string slicing ဖြင့် အစားမထိုးပါနှင့်။
- Page count သည် CV count နှင့် attachment output count ပေါင်းထားခြင်းဖြစ်သည်။ Preview container သည် ResizeObserver / transform scaling သုံးပြီး original page dimensions မပြောင်းပါ။
- `exportPdf()` သည် fonts အပြီးစောင့်၊ sheet clone ကို hidden holder ထဲထား၊ images decode ပြီးမှ export လုပ်သည်။ CV/NRC ကို html2canvas-pro scale 2 ဖြင့် rasterize လုပ်သည်။ Single-image household/certificate pages ကို jsPDF သို့ တိုက်ရိုက် embed လုပ်၍ resolution နှင့် performance ထိန်းသည်။
- Page တစ်ခုချင်း `data-orientation` ကိုလိုက်ပြီး PDF orientation ပြောင်းသည်။ Export filename ကို invalid filename characters ဖယ်၊ length 80 အထိ trim လုပ်ပြီး `-CV.pdf` ထည့်သည်။
- Holder နှင့် object URLs / PDF tasks ကို cleanup လုပ်ရသည်။ Print styles သည် controls၊ sidebar၊ footer နှင့် language bar ကို ဖျောက်ပြီး document pages သာထုတ်ရသည်။

## 8. Language၊ themes နှင့် CSS ownership

- `localization.ts` translator သည် Burmese phrases ကို stable keys အဖြစ် သုံးပြီး `en.json` မှ English ယူသည်။ Missing translation သည် original phrase သို့ fallback လုပ်သည်။ `{v0}` placeholder substitution ပါသည်။
- `SettingsContext` သည် website language/theme အတွက်၊ `draft.cvLanguage` သည် document labels အတွက်ဖြစ်သည်။ Template/CV language ဆက်တင်ပြောင်းရုံဖြင့် `fields` ကို ပြန်မရေးပါနှင့်။
- `LanguageControls` သည် Myanmar/UK SVG flags၊ နာမည်ပါ buttons၊ selected `aria-pressed` နှင့် labelled CV select ကို render လုပ်သည်။ Settings modal ထဲတွင်လည်း language controls ရှိသဖြင့် tests မှာ select locator ကို toolbar / dialog ဖြင့် scope လုပ်ပါ။
- `SettingsPanel` သည် Light/Dark/System နှင့် locale preferences ကို ပြောင်းသည်။ Website/UI root attribute ပြောင်းသော်လည်း CV paper သည် white ဖြစ်ရသည်။

`main.tsx` ၏ CSS order ကို ထိန်းပါ:

```text
fonts.css → Inter package → styles.css → form-template.css → documents.css
→ theme.css → readability.css → language-controls.css → simple-design.css
```

- `styles.css`: မူလ layout / form / classic-modern document / print styling။
- `form-template.css`: ဘောင်ပါ form CV template နှင့် ၎င်း၏ paper typography/photo sizing။
- `documents.css`: attachment editor၊ NRC/full-page sheets နှင့် orientation print rules။
- `theme.css`: UI dark theme၊ settings၊ consent နှင့် language typography အခြေခံ။
- `readability.css`: မြန်မာ/English စာလုံးအရွယ်၊ birthday fields၊ responsive adjustments နှင့် document row sizing။
- `language-controls.css`: flag controls နှင့် footer link styling။
- `simple-design.css`: နောက်ဆုံး UI design override; `@media screen` ဖြင့် paper/print ကို မထိ။ `html[lang][data-theme]` specificity သုံး၍ theme အဟောင်းများ မရောစေသည်။

Light tokens: background `#f7f8f9`၊ surface `#fff`၊ text `#242b2e`၊ muted `#606b70`၊ accent `#275d50`။ Dark: background `#15191b`၊ surface `#1d2225`၊ text `#edf0f1`၊ muted `#abb4b8`၊ accent `#a3d2c0`။

Responsive behavior: sidebar သည် width ≤1050px တွင် ဖျောက်ပြီး horizontal step nav ကိုသုံးသည်။ Width ≤760px တွင် editor/preview tabs ဖြင့် တစ်ခုချင်းပြသည်။ Language bar သည် ≤640px တွင် compact rows ဖြစ်သည်။ Measurement DOM နှင့် actual CV sheets အကြား CSS မတူသွားပါက pagination ပျက်နိုင်သည်။

## 9. Security / network boundary

Font နှင့် PDF.js assets များကို locally serve လုပ်သည်။ `vercel.json` သည် CSP၊ `nosniff`၊ `Referrer-Policy: no-referrer`၊ `X-Frame-Options: DENY` နှင့် camera/microphone/geolocation ပိတ်ထားသော Permissions-Policy သတ်မှတ်သည်။ `vite.config.ts` က အဲဒီ headers ကို preview server တွင်ပါ သုံးသည်။

GitHub နှင့် hosting privacy links သည် သုံးသူနှိပ်မှ website အသစ်ဖွင့်သည်။ Form values/attachments ကို background network request ထဲ မထည့်ပါ။ Browser storage သည် encrypted vault မဟုတ်သကဲ့သို့ origin ခြား data migration၊ cloud sync၊ OCR နှင့် server-side deletion မရှိပါ။
