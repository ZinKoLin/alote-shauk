# တခြား AI နဲ့ project ဆက်ရေးရန် prompt

အောက်က prompt ကို ကူးပြီး တခြား AI ထံပေးပါ။ နောက်ဆုံး `[ဒီနေရာမှာ ပြင်ချင်တဲ့ feature သို့မဟုတ် ပြဿနာကို ရေးပါ]` နေရာတွင် မိမိဆက်လုပ်ချင်သောအလုပ်ကို အစားထိုးရေးပါ။

```text
ဒီ project ကို လက်ရှိအခြေအနေကနေ ဆက်ရေးပေးပါ။

Repository: https://github.com/ZinKoLin/alote-shauk
Website: https://alote-cv.vercel.app

အရင်ဆုံး repository ထဲက ဖိုင်တွေကို အစဉ်လိုက်ဖတ်ပါ။
1. AGENTS.md
2. docs/PROJECT_HANDOFF.md
3. CHANGELOG.md
4. docs/ARCHITECTURE.md
5. docs/OPERATIONS.md
6. README.md

လက်ရှိ checkout ရှိရင် အဲဒါကိုသုံးပါ။ မရှိရင် clone လုပ်ပါ။
git status နဲ့ git log ကို စစ်ပြီး ရှိပြီးသားပြင်ဆင်ချက်တွေကို မဖျက်ပါနဲ့။
မှတ်တမ်းနဲ့ code မကိုက်ရင် လက်ရှိ source ကိုစစ်ပြီး မှတ်တမ်းကိုပါ ပြင်ပါ။

Project အကြောင်း:
- “အလုပ်လျှောက်” ဆိုတဲ့ မြန်မာ/English CV ဖန်တီးပြီး PDF ထုတ်နိုင်သော website ဖြစ်ပါတယ်။
- React + TypeScript + Vite သုံးထားပြီး backend မရှိပါ။
- CV ဒေတာနဲ့ attachments ကို browser ထဲမှာပဲ ယာယီသိမ်းပါတယ်။
- မြန်မာစာအတွက် Pyidaungsu font သုံးပါတယ်။

မဖြစ်မနေထိန်းရမယ့်အချက်များ:
- ဖြည့်ထားတဲ့ CV၊ ဓာတ်ပုံနဲ့ attachments မပျောက်စေရပါ။
- Storage keys နဲ့ schema ကို မလိုအပ်ဘဲ မပြောင်းပါနဲ့။
- Privacy consent ပေးပြီးမှ ဖောင်ဖွင့်ရပါမယ်။ ကိုယ်ရေးဒေတာကို server မပို့ရပါ။
- Website language နဲ့ CV document language သီးခြားဖြစ်ရပါမယ်။
- ရိုးရှင်းတဲ့ design၊ language flags၊ Light/Dark/System theme၊ birthday ရက်/လ/နှစ်ရွေးခြင်းနဲ့ PDF လုပ်ဆောင်ချက်တွေကို ထိန်းပါ။
- Footer မှာ Developed by ZinKoLyn နဲ့ GitHub link ဆက်ထားပါ။
- .env၊ credentials နဲ့ ကိုယ်ရေးဒေတာကို Git သို့မတင်ပါနဲ့။

လုပ်ငန်းပြီးစီးမှု:
- အစီအစဉ်ပြောရုံနဲ့ မရပ်ဘဲ တောင်းဆိုထားတဲ့အလုပ်ကို အကောင်အထည်ဖော်ပါ။
- ပြောင်းလဲမှုနဲ့သက်ဆိုင်တဲ့ build/tests ကို စစ်ပါ။
- UI ပြင်ရင် phone/desktop နဲ့ light/dark ကို ကြည့်စစ်ပါ။
- ပြင်ပြီးတိုင်း CHANGELOG.md၊ PROJECT_HANDOFF.md နဲ့ သက်ဆိုင်ရာ docs ကို update လုပ်ပါ။
- စမ်းမထားတဲ့အရာကို အောင်မြင်တယ်လို့ မရေးပါနဲ့။
- Production deploy ကို သီးခြားတောင်းဆိုမှ လုပ်ပါ။
- ပြောင်းထားတာ၊ စမ်းသပ်ရလဒ်၊ Git/deployment အခြေအနေနဲ့ အလုပ်ကျန်ကို မြန်မာလို ပြန်ပြောပါ။

အခု ဆက်လုပ်ချင်တာ:
[ဒီနေရာမှာ ပြင်ချင်တဲ့ feature သို့မဟုတ် ပြဿနာကို ရေးပါ]
```

ဒီဖိုင်သည် AI ထံပေးရန် copyable prompt ဖြစ်ပြီး project စည်းကမ်းအပြည့်အစုံသည် [AGENTS.md](../AGENTS.md) တွင် ရှိသည်။ Product behavior၊ နာမည်၊ repository၊ website လိပ်စာ သို့မဟုတ် handoff workflow ပြောင်းလျှင် ဒီ prompt ကိုပါ သက်ဆိုင်ရာ docs နှင့်အတူ update လုပ်ပါ။
