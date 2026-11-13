# Development၊ စမ်းသပ်မှုနှင့် deployment

နောက်ဆုံး update: **2026-11-13**။ အရင်ဆုံး `AGENTS.md` နှင့် [Project handoff](PROJECT_HANDOFF.md) ကို ဖတ်ပါ။ ဒီ runbook သည် deploy လုပ်ရန် ခွင့်ပြုချက်မဟုတ်ပါ။

## 1. Checkout နှင့် setup

```sh
git clone https://github.com/ZinKoLin/alote-shauk.git
cd alote-shauk
npm ci
npm run dev
```

လက်ရှိ Windows workspace သည် `C:\Projects\EBS Installer\ebs` ဖြစ်သည်။ တခြားစက်တွင် clone path မတူနိုင်သဖြင့် source ထဲ hardcode မလုပ်ပါနှင့်။ Node.js 24 ဖြင့် local စမ်းထားပြီး Vercel project setting သည် 2026-11-13 snapshot အရ Node `26.x` ဖြစ်သည်။ မလိုအပ်ဘဲ toolchain အဆင့်မြှင့်ခြင်း မလုပ်ပါနှင့်။

Scripts: `npm run dev` (Vite 5173)၊ `npm run build` (`tsc -b && vite build`)၊ `npm run preview` (4173)၊ `npm test` (Playwright)။ Vite dev/preview scripts သည် `--host 0.0.0.0` သုံးထားသည်။ Strictly loopback လိုလျှင် `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173` ဖြင့် run နိုင်သည်။

Runtime secret / API key မလိုပါ။ `.env.local` ရှိခြင်းသည် local deploy tooling က ရေးထားခြင်း ဖြစ်နိုင်သည်။ ၎င်းထဲက values ကို ဖတ်ထုတ်၊ documentation ထဲရေး၊ source ထဲထည့်၊ Git သို့တင်ခြင်း မပြုပါနှင့်။

## 2. Tests

Playwright config က installed **Google Chrome** (`channel: "chrome"`) ကို သုံးသည်။ Workers 1၊ desktop default 1440×1080၊ 60s timeout၊ assertion timeout 10s။ Matching local server ရှိလျှင် ပြန်သုံးသည်။ User browser session နှင့်မဆိုင်သော isolated test contexts ကိုသုံးသည်။

```sh
npm test
npx playwright test tests/birthday.spec.ts
npx playwright test tests/documents.spec.ts
npx playwright test tests/settings.spec.ts
npx playwright test tests/language-controls.spec.ts
```

Production-like local preview ကို CSP headers နှင့်တူအောင် စမ်းရန်:

```powershell
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$env:CV_TEST_PREVIEW = '1'
npm test
Remove-Item Env:CV_TEST_PREVIEW -ErrorAction SilentlyContinue
```

POSIX shell: `npm run build && CV_TEST_PREVIEW=1 npm test`။ Preview test သည် `dist` ကိုသုံးသောကြောင့် source ပြင်ပြီး build မလုပ်လျှင် အဟောင်းကို စမ်းမိနိုင်သည်။ Dev tests သည် 5173၊ preview tests သည် 4173 ဖြစ်သည်။

| Test file                         | Tests | အဓိက coverage                                                                                                                                                                             |
| --------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/cv.spec.ts`                | 9     | Application date၊ restore/tab isolation၊ all sections/templates/photo/reset၊ invalid/expired drafts၊ idle TTL၊ disabled storage၊ A4 export/print၊ long text pagination၊ overflow/network |
| `tests/documents.spec.ts`         | 4     | NRC/household/certificate ordering၊ image/PDF import၊ mixed orientation/export/print၊ rotation/reorder/remove၊ expiry/invalid upload၊ IndexedDB fallback                                 |
| `tests/settings.spec.ts`          | 4     | Consent-before-private-storage၊ decline/escape၊ independent UI/CV languages၊ dark/system theme၊ data/photo/attachment preservation၊ English templates/PDF                                |
| `tests/birthday.spec.ts`          | 4     | Existing date preservation၊ separate date parts၊ leap/future checks၊ incomplete navigation/export/reset၊ readability at 360/390/820/1440                                                 |
| `tests/language-controls.spec.ts` | 2     | Visible flags/selectors၊ independent language state၊ draft/photo/attachment preservation၊ footer၊ print hiding၊ responsive                                                               |

စုစုပေါင်း **23 tests** (အရေအတွက်ပြောင်းလျှင် ဒီဇယားကိုပါ ပြင်ပါ)။ `tests/helpers.ts` က consent flow ကို test context ထဲ ဖြတ်ပေးသည်။ `tests/fixtures/` ပုံများသည် synthetic ဖြစ်ပြီး တကယ့်ကိုယ်ရေးဒေတာမပါပါ။

Screenshot/PDF output သည် `test-results/` တွင်ရှိပြီး Git မှ ignore လုပ်ထားသည်။ နောက် test run က output ဖျက်နိုင်သဖြင့် review အတွက်လိုသော artifact ကို သီးခြားနေရာသို့ အရင်ကူးပါ။ `--output .tools/<name>` ဖြင့် output ကို သီးခြားထားနိုင်သည်။ `.tools/` သည် Git/deploy မှ ignore ဖြစ်ပြီး clone အသစ်တွင် ရှိမည်ဟု မယူဆရ။

Settings dialog နှင့် main toolbar မှ CV language selects နှစ်ခု ရှိနိုင်သည်။ Locator ambiguity မဖြစ်ရန် `getByRole("dialog")` သို့မဟုတ် `.language-toolbar` အောက် scope လုပ်ပါ။ User text preservation စစ်ရာတွင် pagination ကြောင့် row ခွဲနိုင်သဖြင့် split row values ကို အစီအစဉ်အတိုင်းပေါင်းနှိုင်းပါ။

## 3. Verification ရွေးချယ်ပုံ

- Documentation-only: Markdown links / relative paths၊ source names/values၊ diff whitespace နှင့် secret exclusions စစ်ပါ။ App behavior ပြောင်းခြင်းမရှိလျှင် tests အသစ်ရေးရန် မလိုပါ။
- Feature/code: build နှင့် ထိသည့် existing tests။ Storage၊ export၊ translation၊ common CSS ပြောင်းလျှင် full suite သင့်တော်သည်။
- UI: rendered phone/desktop၊ light/dark၊ focus၊ touch size၊ overflow၊ long/missing content နှင့် print ကို စစ်ပါ။ ဥပမာ widths 360 / 390 / 820 / 1440။
- Deploy: production state `READY` ကိုစစ်ပြီး login မဝင်သော public HTTP request၊ correct app title၊ current CSS/JS၊ fonts/PDF.js assets နှင့် appropriate live smoke test ကို စစ်ပါ။ HTTP 200 တစ်ခုတည်းဖြင့် မပြီးပါ — Vercel login page ကလည်း 200 ဖြစ်နိုင်သည်။
- Actual user browser storage၊ user ဓာတ်ပုံ သို့မဟုတ် attachment ကို စမ်းသပ်ရန် မရှင်းပါနှင့်။

## 4. Git workflow

Repository Public၊ branch `main`။ ဒေတာ/credential ဖိုင်များကို မတင်ပါနှင့်။ `package.json private: true` သည် npm publish ကာကွယ်မှုသာဖြစ်သည်။

```sh
git status --short --branch
git log -5 --oneline
git diff --check
# Implement, verify, update CHANGELOG.md and relevant docs.
git add <changed-source-files> <changed-documentation-files>
git diff --cached --check
git diff --cached --stat
git commit -m "Describe the concrete resulting change"
git push origin main
```

User က Git operations ကို ခွင့်ပြုထားသည့် scope အတွင်းသာ commit/push လုပ်ပါ။ မသက်ဆိုင်သော user changes ကို မတင်ပါနှင့်။ Normal push ကိုသုံးပြီး force push / history rewrite မလုပ်ပါနှင့်။ GitHub login မရလျှင် credential ကို chat ထဲမတောင်းဘဲ official login/device flow ဖြင့် ဖြေရှင်းပါ။

### Windows execution မှတ်ချက်

Codex sandbox user နှင့် folder owner မတူလျှင် Git `dubious ownership` ပြနိုင်သည်။ ဒီ trusted checkout အတွက် command တစ်ကြိမ်သာ scope လုပ်ပါ:

```powershell
git -c safe.directory='C:/Projects/EBS Installer/ebs' status --short --branch
```

Global `safe.directory=*` မသတ်မှတ်ပါနှင့်။ Sandbox identity သည် user host ၏ authenticated GitHub/Vercel keyring ကို မမြင်နိုင်နိုင်သည်။ ခွင့်ပြုထားသော host execution ရှိလျှင် account အစစ်၏ login ကို အရင်စစ်ပါ။ Sandbox ထဲ login failure တစ်ခုပဲမြင်၍ user account token သက်တမ်းကုန်သည်ဟု အတည်မပြုပါနှင့်။

GitHub CLI ကို per-command HTTPS credential helper အဖြစ်လိုအပ်လျှင် `git -c credential.helper= -c 'credential.https://github.com.helper=!gh auth git-credential' push origin main` ကို အသုံးပြုနိုင်သည်။ Token value ကို command / output ထဲမထည့်ပါနှင့်။

## 5. Vercel deploy — explicit user request ရှိမှသာ

လက်ရှိ project ကို reuse လုပ်ပါ။ အသစ်ထပ်မဖန်တီး၊ legacy project/storage ကိုမဖျက်ပါနှင့်။ Available Vercel connector ကို ဦးစားပေးနိုင်ပြီး connector 404/access error နှင့် CLI account scope ကွာနိုင်သည်။ Known project/team IDs ကိုသုံးပြီး account/team အမှန်ကို စစ်ပါ။ Secrets/env values မဖတ်ပါနှင့်။

```sh
vercel whoami
vercel project inspect patama-cv --scope zinkolins-projects
vercel link --project patama-cv --scope zinkolins-projects
npm run build
# Run the appropriate tests before proceeding.
vercel deploy --prod --yes --scope zinkolins-projects
vercel inspect <returned-deployment-url> --scope zinkolins-projects
```

Fresh clone မှ `.vercel/project.json` မပါသောကြောင့် link လုပ်ရန်လိုနိုင်သည်။ Production က `vercel.json` ကိုအသုံးပြုပြီး framework `vite`၊ build `npm run build`၊ output `dist` ဖြစ်သည်။ Dashboard project `framework` field သည် null ဖြစ်ခဲ့သော်လည်း repository config က build ကို အလုပ်လုပ်စေထားသည်။

`vercel.json` တွင် no-referrer / nosniff / frame denial / permissions / CSP headers ပါသည်။ Security headers ကို deploy အောင်စေရုံအတွက် မဖယ်ပါနှင့်။

### Domain workflow နှင့် တွေ့ခဲ့သည့်ပြဿနာ

လက်ရှိ `alote-cv.vercel.app` နှင့် `patama-cv.vercel.app` ကို project production domains အဖြစ် verified လုပ်ထားသည်။ Normal future production deploy တွင် ဒီ domain များကို မှန်ကန်သော latest deployment သို့ ချိတ်ပေးရမည်။

အစောပိုင်း `vercel alias set` တစ်ခုတည်းသုံးချိန် custom alias က Vercel login page ပြခဲ့သည်။ `vercel domains add alote-cv.vercel.app patama-cv --scope zinkolins-projects` ဖြင့် project domain အဖြစ် attach လုပ်ပြီးမှ public app ဖွင့်နိုင်ခဲ့သည်။ ပြန်ဖြစ်လျှင် protection ကိုပိတ်ခြင်းမလုပ်မီ domain attachment / target ကို အရင်စစ်ပါ။

```sh
vercel domains verify alote-cv.vercel.app --scope zinkolins-projects
vercel api "/v9/projects/prj_5CObONjShEFTjvJGzZKxhQ6Eh8bu/domains?teamId=team_P10R0Tm0yva4qOGBrNoSh0Mg&limit=100" --method GET
```

Deploy လုပ်ပြီး target၊ deployment ID၊ public URLs၊ verification ရလဒ်နှင့် source baseline ကို `CHANGELOG.md` / `PROJECT_HANDOFF.md` တွင် update လုပ်ပါ။ Git push သာလုပ်ထားလျှင် production updated ဟု မပြောပါနှင့်။ ယခု Git integration မရှိပါ; အနာဂတ်တွင် ချိတ်ထားလျှင် push က auto deploy ဖြစ်နိုင်သဖြင့် user ၏ deployment constraint ကို အရင်စစ်ပါ။

## 6. File packaging နှင့် licensing

- `.gitignore`: `.env*`၊ `.vercel/`၊ `node_modules/`၊ `dist/`၊ cache၊ tools၊ local skills နှင့် tests output များ မတင်ပါ။ Source၊ tests နှင့် synthetic fixtures ကို version control လုပ်သည်။
- `.vercelignore`: `.git/`၊ env၊ local tools/cache၊ tests/config/output၊ AI handoff docs ကို deploy source upload မှ ချန်ထားသည်။ Vite က `public/` ကို `dist` သို့ကူးပြီး public မှာ serve လုပ်မည်ဖြစ်၍ confidential docs ကို `public/` ထဲ မထားရ။
- `public/fonts/`: Pyidaungsu 2.5.3 Regular/Bold နှင့် SIL OFL license / provenance။
- `public/pdfjs/`: CMaps၊ standard fonts၊ WASM နှင့် third-party licenses။ Build/size လျှော့ရန်ဆိုပြီး license သို့မဟုတ် runtime asset များကို အထင်ဖြင့်မဖျက်ပါနှင့်။

## 7. နောက် AI ထံ လွှဲရာတွင်

ဒီ runbook၊ `PROJECT_HANDOFF.md`၊ `ARCHITECTURE.md` နှင့် `CHANGELOG.md` ကို source နဲ့အတူ ပေးပါ။ Files/commands/live state ပြောင်းလျှင် update လုပ်ပါ။ Pending user request၊ incomplete checks၊ exact blocker နှင့် deploy လုပ်ပြီး/မပြီးကို ထင်ရှားစွာရေးပါ။ Credentials သို့မဟုတ် user CV ကို လက်လွှဲမှတ်တမ်းထဲ မထည့်ပါနှင့်။
