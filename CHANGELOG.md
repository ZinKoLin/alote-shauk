# ပြင်ဆင်မှုမှတ်တမ်း

ဒီဖိုင်ကို အလုပ်တစ်ခုပြီးတိုင်း update လုပ်ရမည်။ ရက်စွဲသည် **Asia/Rangoon** ကိုသုံးသည်။ အသေးစိတ်အမြဲလက်ရှိအခြေအနေအတွက် [Project handoff](docs/PROJECT_HANDOFF.md) ကို ကြည့်ပါ။

## 2026-11-13 — AI handoff နှင့် documentation update စည်းကမ်း

**တောင်းဆိုချက်:** `AGENTS.md` နှင့် project တစ်ခုလုံး၏ အသေးစိတ်မှတ်တမ်းကို သိမ်းပြီး တခြား AI က ဆက်ရေးနိုင်ရန်၊ ပြင်ပြီးတိုင်း အမြဲ update လုပ်ရန်။

- Root `AGENTS.md` အသစ်: မြန်မာလိုပြန်ဖြေရန်၊ data preservation/privacy၊ language/date/attachment contracts၊ verification၊ deploy authorization နှင့် documentation ကို definition of done အဖြစ် သတ်မှတ်ထားသည်။
- `docs/PROJECT_HANDOFF.md`: product state၊ feature inventory၊ source/live deployment ဆက်စပ်မှု၊ history၊ file map၊ limitations နှင့် next-agent checklist။
- `docs/ARCHITECTURE.md`: entry points၊ consent boundary၊ storage schema/keys/TTL၊ concurrency guards၊ dates၊ document/PDF pipeline၊ typography/theme/CSS layering နှင့် network boundary။
- `docs/OPERATIONS.md`: setup၊ PowerShell/POSIX commands၊ 23-test coverage၊ Git/deployment/domain verification၊ Windows sandbox identity အတွေ့အကြုံနှင့် licensing။
- README မှ docs ကို ရှာရလွယ်အောင် link ချိတ်ထားသည်။ AI docs ကို production source upload မှ ချန်ရန် `.vercelignore` ကို update လုပ်သည်။
- Source baseline `d4475ec`၊ public GitHub visibility၊ Vercel `READY` production၊ verified domains နှင့် Git integration မရှိခြင်းကို source / GitHub CLI / scoped Vercel CLI API မှ အတည်ပြုသည်။ Vercel connector က known project ကို 404 ပြခဲ့သော်လည်း scoped CLI မှ ဖတ်နိုင်ခဲ့သည်။
- **Verification (ယခု session):** `npm run build` passed; PowerShell `CV_TEST_PREVIEW=1` ဖြင့် `npm test` → **23 passed (48.7s)**။ Documentation ဖိုင် ၆ ခု၏ relative Markdown links ၁၅ ခုနှင့် core module/config/license paths ရှိကြောင်း စစ်သည်။ Credential patterns မတွေ့၊ Git diff whitespace check passed၊ `.env.local` / `.vercel/` / `.tools/` exclusions မှန်သည်။ Public URL က HTTP 200 နှင့် မှန်သော app title ပြန်ပေးသည်။
- **Data compatibility:** app logic၊ schema၊ keys၊ user draft/photo/attachments မပြောင်း။
- **Git / deployment:** GitHub `main` သို့ မှတ်တမ်းများကို source နှင့်အတူ commit/push လုပ်သော documentation bundle ဖြစ်သည်။ Production ပြန်မတင်။ Live app သည် ယခင် `d4475ec` baseline ကို ဆက်သုံးသည်။

## 2026-11-08 — Production publish နှင့် Public GitHub

ဒီ section သည် conversation/deployment record ဖြစ်ပြီး feature source commit အသစ် မဟုတ်ပါ။

- User က latest simplified UI ကို Vercel သို့ Production တင်ရန် တောင်းဆိုသည်။
- Deployment `dpl_2VzK8z8srct5EGgjadftBdYskeHp` သည် app source baseline `d4475ec` ကို local CLI မှတင်ထားသော production deployment ဖြစ်သည်။
- Requested hostname `alote.cv.vercel` မသုံးနိုင်ခဲ့သဖြင့် `alote-cv.vercel.app` အခမဲ့ domain ကို ချိတ်ထားသည်။ Legacy `patama-cv.vercel.app` ကို ဆက်ထားသည်။
- Alias အသစ်မှာ Vercel login page ပြခဲ့ပြီး project domain အဖြစ် attach လုပ်ခြင်းဖြင့် ဖြေရှင်းခဲ့သည်။ Protection ကို မပိတ်ခဲ့ပါ။
- Public HTTP app title / current assets / verified production domain ကို စစ်ပြီး live Playwright language/data-preservation/responsive tests **2 passed**။
- User တောင်းဆိုချက်ဖြင့် GitHub repository ကို Private မှ **Public** သို့ပြောင်းပြီး `isPrivate: false`, `visibility: PUBLIC` ကို CLI မှ အတည်ပြုခဲ့သည်။

## 2026-11-08 — ရိုးရှင်းသော UI redesign

Commit: `d4475ec` — `Simplify CV workspace with neutral themes and compact controls`။

- User တောင်းဆိုသည့် design skill အတွက် `build-ui` ၏ Simplify workflow ကို သုံးသည်။
- Marketing hero၊ brand tagline၊ duplicate sidebar privacy text နှင့် footer branding အပိုများကို လျှော့သည်။ Create CV ခေါင်းစဉ်/တိုတောင်းသောညွှန်ကြားချက်ဖြင့် အစားထိုးသည်။
- `simple-design.css` ထည့်ပြီး screen-only neutral light/dark surfaces၊ compact sidebar/language controls/footer၊ readable controls နှင့် focus/touch target များ ပြင်သည်။
- `SettingsContext` theme-color meta ကို neutral UI နှင့်ကိုက်အောင် ပြင်သည်။ Language buttons မှာ theme transition ကြောင့် contrast ယာယီမှိန်မှုကို animation ဖယ်၍ ပြင်သည်။
- Flags၊ independent UI/CV locales၊ all form features၊ privacy consent၊ profile/attachments နှင့် PDF paper styling ကို ထိန်းထားသည်။
- **Verification:** build passed၊ full Playwright **23 passed**၊ 360/390/820/1440 responsive checks၊ light/dark screenshots၊ keyboard focus၊ text contrast နှင့် print behavior စစ်ထားသည်။ နောက်ဆုံး consent theme check နှင့် desktop/mobile rendering check ကိုလည်း ထပ်စစ်ထားသည်။
- GitHub `main` သို့ push လုပ်ထားသည်။ ဒီ commit လုပ်ချိန် user က production ကို မတင်ခိုင်းသေး၍ local/Git အထိပဲ လုပ်ခဲ့ပြီး နောက်တောင်းဆိုချက်မှသာ deploy လုပ်သည်။

## 2026-11-08 — Footer GitHub link

Commit: `422fa0a` — `Add GitHub repository link to website footer`။

- Footer မှာ `https://github.com/ZinKoLin/alote-shauk` link ထည့်သည်။ Tab အသစ်ဖွင့်ပြီး `noopener noreferrer` သတ်မှတ်ထားသည်။
- GitHub/Privacy links ကို responsive group အဖြစ်စီသည်။ Developer credit ဆက်ထားသည်။
- **Verification:** build နှင့် language/footer responsive tests **2 passed**။ Draft / attachment state မပြောင်း။
- GitHub သို့ push လုပ်ခဲ့ပြီး ဒီအလုပ်အတွက် Production deploy မလုပ်ခဲ့ပါ။

## 2026-11-08 — Initial repository snapshot

Commit: `baec124` — `Build bilingual CV app with private browser drafts and PDF attachments`။

ဒီ initial commit မတိုင်မီ local development အဆင့်များစွာ လုပ်ထားပြီး Git history ထဲတွင် တစ်ခုချင်းသီးခြား commits မရှိပါ။ အောက်ပါလုပ်ဆောင်ချက်များသည် initial snapshot ထဲပါဝင်သည်:

- User ပေးသော CV / ဘောင်ပါလျှောက်လွှာနမူနာအတိုင်း React/TypeScript/Vite browser app၊ locally bundled Pyidaungsu၊ templates ၃ မျိုး၊ live A4 preview နှင့် PDF/print export။
- Draft session storage၊ ၂ နာရီ idle TTL၊ storage-disabled memory fallback နှင့် data-preserving changes။
- Application date စိတ်ကြိုက်ရွေးခြင်း၊ day/month/year birthday validation၊ readable text sizes နှင့် profile photo sizing ပြင်ဆင်ခြင်း။
- NRC front/back တစ်ရွက်၊ full-page landscape household register၊ image/multi-page PDF certificates၊ rotate/reorder/orientation နှင့် IndexedDB temporary storage။
- Product အမည်ကို **အလုပ်လျှောက်** ပြောင်းခြင်း၊ Light/Dark/System၊ Burmese/English website နှင့် separate CV document language၊ flags ဖြင့် visible controls။
- Privacy gate ကို Agree ပေးမှဖွင့်ခြင်း၊ data processing/hosting metadata အကြောင်း မှန်ကန်သောရှင်းလင်းချက်များ၊ Developed by ZinKoLyn footer။
- Security headers၊ local fonts/PDF.js assets နှင့် Playwright synthetic fixtures/tests။
- Git repository ကို `main` branch ဖြင့် စတင်ပြီး Private GitHub repo သို့ တင်ခဲ့သည်။ `.env` / CLI credentials / cache / user data ကို မတင်ခဲ့ပါ။

## နောက် entry အတွက် template

```text
## YYYY-MM-DD — ပြောင်းလဲမှုခေါင်းစဉ်
- Request / reason:
- Resulting changes and affected files:
- Data compatibility / migration:
- Verification actually run (commands + result):
- Git status / branch / push status:
- Deployment: not deployed, or URL + ID + source baseline + verified state:
- Remaining work / known limitations:
```
