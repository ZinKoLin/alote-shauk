import type { Locale } from "./localization";
import { localizeCvRows } from "./cvLanguage";

export const DRAFT_KEY = "patama.cv.draft.v1";
export const DRAFT_TTL = 2 * 60 * 60 * 1000;

export const emptyFields = {
  name: "",
  desiredRole: "",
  applicationDate: "",
  age: "",
  languages: "",
  nrc: "",
  birthday: "",
  gender: "",
  nationality: "",
  religion: "",
  maritalStatus: "",
  education: "",
  skills: "",
  experience: "",
  fatherName: "",
  fatherNrc: "",
  fatherJob: "",
  motherName: "",
  motherNrc: "",
  motherJob: "",
  address: "",
  phone: "",
  email: "",
};
export type FieldKey = keyof typeof emptyFields;
export type Fields = Record<FieldKey, string>;
export type Template = "form" | "classic" | "modern";
export type Draft = {
  fields: Fields;
  photo: string;
  template: Template;
  hideEmpty: boolean;
  cvLanguage: Locale;
  updatedAt: number;
};

export const newDraft = (): Draft => ({
  fields: { ...emptyFields },
  photo: "",
  template: "form",
  hideEmpty: false,
  cvLanguage: "my",
  updatedAt: 0,
});

export function readDraft(now = Date.now()): Draft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return newDraft();
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== "object") throw new Error("Invalid draft");
    const data = saved as Record<string, unknown>;
    if (
      typeof data.updatedAt !== "number" ||
      !Number.isFinite(data.updatedAt) ||
      data.updatedAt > now ||
      now - data.updatedAt >= DRAFT_TTL
    ) {
      sessionStorage.removeItem(DRAFT_KEY);
      return newDraft();
    }
    const fields = { ...emptyFields };
    if (data.fields && typeof data.fields === "object") {
      for (const key of Object.keys(fields) as FieldKey[]) {
        const value = (data.fields as Record<string, unknown>)[key];
        if (typeof value === "string") fields[key] = value.slice(0, 1600);
      }
    }
    const photo =
      typeof data.photo === "string" &&
      /^data:image\/(jpeg|png|webp);base64,/.test(data.photo) &&
      data.photo.length <= 2_000_000
        ? data.photo
        : "";
    return {
      fields,
      photo,
      updatedAt: data.updatedAt,
      template:
        data.template === "modern" || data.template === "classic"
          ? data.template
          : "form",
      hideEmpty: data.hideEmpty === true,
      cvLanguage: data.cvLanguage === "en" ? "en" : "my",
    };
  } catch {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* Storage can be unavailable. */
    }
    return newDraft();
  }
}

export const sampleFields: Fields = {
  name: "မောင်အောင်မြင့်",
  desiredRole: "အရောင်းဝန်ထမ်း",
  applicationDate: "",
  age: "",
  languages: "မြန်မာ၊ အင်္ဂလိပ်",
  nrc: "၁၂/မရက(နိုင်)၁၂၃၄၅၆",
  birthday: "1998-05-12",
  gender: "ကျား",
  nationality: "ဗမာ / မြန်မာ",
  religion: "ဗုဒ္ဓ",
  maritalStatus: "လူပျို",
  education: "B.A. (English)\nရန်ကုန်တက္ကသိုလ်၊ ၂၀၂၀",
  skills:
    "Microsoft Word, Excel\nအင်္ဂလိပ်စာ အခြေခံ၊ အသင်းအဖွဲ့နှင့် ပူးပေါင်းဆောင်ရွက်နိုင်ခြင်း",
  experience: "အရောင်းဝန်ထမ်း — နမူနာကုမ္ပဏီ\n၂၀၂၁ – ၂၀၂၄ (၃ နှစ်)",
  fatherName: "ဦးမြင့်အောင်",
  fatherNrc: "",
  fatherJob: "ကိုယ်ပိုင်လုပ်ငန်း",
  motherName: "ဒေါ်ခင်မာ",
  motherNrc: "",
  motherJob: "အိမ်ရှင်မ",
  address: "အမှတ် (၁၂)၊ သီရိလမ်း၊ ကမာရွတ်မြို့နယ်၊ ရန်ကုန်မြို့။",
  phone: "09 123 456 789",
  email: "aungmyint@example.com",
};

export type SectionId =
  "personal" | "education" | "family" | "contact" | "documents" | "design";
export const sectionFields: Record<
  Exclude<SectionId, "design" | "documents">,
  FieldKey[]
> = {
  personal: [
    "name",
    "birthday",
    "gender",
    "nrc",
    "nationality",
    "religion",
    "maritalStatus",
  ],
  education: [
    "desiredRole",
    "applicationDate",
    "education",
    "skills",
    "experience",
    "languages",
  ],
  family: [
    "fatherName",
    "fatherNrc",
    "fatherJob",
    "motherName",
    "motherNrc",
    "motherJob",
  ],
  contact: ["phone", "email", "address"],
};

export function formatBirthday(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [year, month, day] = date.split("-");
  return `${day} / ${month} / ${year}`;
}

export type CvRow = {
  id: string;
  label: string;
  value: string;
  heading?: boolean;
};
export function ageFromBirthday(birthday: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return "";
  const [year, month, day] = birthday.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - year;
  if (
    now.getMonth() + 1 < month ||
    (now.getMonth() + 1 === month && now.getDate() < day)
  )
    age--;
  return age >= 0 && age <= 120 ? String(age) : "";
}
export function getRows(draft: Draft): CvRow[] {
  const f = draft.fields;
  if (draft.template === "form") {
    const rows: CvRow[] = [
      {
        id: "desiredRole",
        label: "လျှောက်ထားလိုသည့်ရာထူး",
        value: f.desiredRole,
      },
      {
        id: "applicationDate",
        label: "အလုပ်လျှောက်သည့်ရက်စွဲ",
        value: formatBirthday(f.applicationDate),
      },
      { id: "name", label: "အမည်", value: f.name },
      { id: "fatherName", label: "အဘအမည်", value: f.fatherName },
      { id: "nrc", label: "နိုင်ငံသားမှတ်ပုံတင်အမှတ်", value: f.nrc },
      {
        id: "birthday",
        label: "မွေးသက္ကရာဇ်",
        value: formatBirthday(f.birthday),
      },
      { id: "age", label: "အသက်", value: f.age || ageFromBirthday(f.birthday) },
      { id: "gender", label: "ကျား / မ", value: f.gender },
      {
        id: "maritalStatus",
        label: "အိမ်ထောင်ရှိ / မရှိ",
        value: f.maritalStatus,
      },
      {
        id: "nationalityReligion",
        label: "လူမျိုး / ဘာသာ",
        value: [f.nationality, f.religion]
          .map((value) => value.trim())
          .filter(Boolean)
          .join(" / "),
      },
      { id: "education", label: "ပညာအရည်အချင်း", value: f.education },
      { id: "skills", label: "အခြားပညာအရည်အချင်း", value: f.skills },
      { id: "experience", label: "လုပ်ငန်းအတွေ့အကြုံ", value: f.experience },
      { id: "languages", label: "တတ်ကျွမ်းသည့်ဘာသာစကား", value: f.languages },
      { id: "address", label: "နေရပ်လိပ်စာ", value: f.address },
      { id: "phone", label: "ဆက်သွယ်ရန်ဖုန်းနံပါတ်", value: f.phone },
    ];
    if (f.email.trim())
      rows.push({ id: "email", label: "အီးမေးလ်", value: f.email });
    return localizeCvRows(
      rows.filter((row) => !draft.hideEmpty || row.value.trim()),
      draft.cvLanguage,
    );
  }
  const groups: { heading: string; rows: [FieldKey, string][] }[] = [
    {
      heading: "ကိုယ်ရေးအချက်အလက်",
      rows: [
        ["name", "အမည်"],
        ["desiredRole", "လျှောက်ထားလိုသောရာထူး"],
        ["applicationDate", "အလုပ်လျှောက်သည့်ရက်စွဲ"],
        ["nrc", "နိုင်ငံသားစိစစ်ရေးကတ်ပြားအမှတ်"],
        ["birthday", "မွေးသက္ကရာဇ်"],
        ["age", "အသက်"],
        ["gender", "ကျား / မ"],
        ["nationality", "လူမျိုး / နိုင်ငံသား"],
        ["religion", "ကိုးကွယ်သည့်ဘာသာ"],
        ["maritalStatus", "အိမ်ထောင်ရေးအခြေအနေ"],
      ],
    },
    {
      heading: "ပညာရေးနှင့် အတွေ့အကြုံ",
      rows: [
        ["education", "ပညာအရည်အချင်း"],
        ["skills", "အခြားကျွမ်းကျင်မှုများ"],
        ["experience", "အလုပ်အတွေ့အကြုံ"],
        ["languages", "တတ်ကျွမ်းသည့်ဘာသာစကား"],
      ],
    },
    {
      heading: "မိသားစုအချက်အလက်",
      rows: [
        ["fatherName", "အဘအမည်"],
        ["fatherNrc", "နိုင်ငံသားစိစစ်ရေးကတ်ပြားအမှတ် (အဘ)"],
        ["fatherJob", "အလုပ်အကိုင် (အဘ)"],
        ["motherName", "အမိအမည်"],
        ["motherNrc", "နိုင်ငံသားစိစစ်ရေးကတ်ပြားအမှတ် (အမိ)"],
        ["motherJob", "အလုပ်အကိုင် (အမိ)"],
      ],
    },
    {
      heading: "ဆက်သွယ်ရန်",
      rows: [
        ["address", "နေရပ်လိပ်စာ"],
        ["phone", "ဖုန်းနံပါတ်"],
        ["email", "အီးမေးလ်"],
      ],
    },
  ];
  return localizeCvRows(
    groups.flatMap((group, index) => {
      const rows = group.rows
        .map(([key, label]) => ({
          id: key,
          label,
          value:
            key === "birthday" || key === "applicationDate"
              ? formatBirthday(f[key])
              : key === "age"
                ? f.age || ageFromBirthday(f.birthday)
                : f[key].trim(),
        }))
        .filter((row) => !draft.hideEmpty || row.value.trim());
      if (draft.template === "modern" && rows.length)
        return [
          {
            id: `heading-${index}`,
            label: group.heading,
            value: "",
            heading: true,
          },
          ...rows,
        ];
      return rows;
    }),
    draft.cvLanguage,
  );
}

export const englishSampleFields: Fields = {
  name: "Aung Myint",
  desiredRole: "Sales Assistant",
  applicationDate: "",
  age: "",
  languages: "Burmese, English",
  nrc: "12/MaYaKa(N)123456",
  birthday: "1998-05-12",
  gender: "ကျား",
  nationality: "Bamar / Myanmar",
  religion: "Buddhist",
  maritalStatus: "လူပျို",
  education: "B.A. (English)\nUniversity of Yangon, 2020",
  skills: "Microsoft Word and Excel\nEnglish communication and teamwork",
  experience: "Sales Assistant — Example Company\n2021–2024 (3 years)",
  fatherName: "U Myint Aung",
  fatherNrc: "",
  fatherJob: "Self-employed",
  motherName: "Daw Khin Mar",
  motherNrc: "",
  motherJob: "Homemaker",
  address: "No. 12, Thiri Street, Kamayut, Yangon.",
  phone: "09 123 456 789",
  email: "aungmyint@example.com",
};
