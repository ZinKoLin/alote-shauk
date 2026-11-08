import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSettings } from "./SettingsContext";

type Part = "day" | "month" | "year";
type DateParts = Record<Part, string>;
const emptyParts = (): DateParts => ({ day: "", month: "", year: "" });
const pad = (value: number) => String(value).padStart(2, "0");
const parse = (value: string): DateParts => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match
    ? { year: match[1], month: match[2], day: match[3] }
    : emptyParts();
};
const daysInMonth = (month: string, year: string) =>
  month ? new Date(Number(year || "2000"), Number(month), 0).getDate() : 31;

export function useBirthdayInput(
  value: string,
  onChange: (value: string) => void,
) {
  const [parts, setParts] = useState(() => parse(value));
  const [notice, setNotice] = useState<"invalid-day" | "future" | "">("");
  const lastEmitted = useRef(value);
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setParts(parse(value));
      setNotice("");
    }
  }, [value]);

  const emit = (next: DateParts) => {
    setParts(next);
    const date =
      next.day && next.month && next.year
        ? `${next.year}-${next.month}-${next.day}`
        : "";
    lastEmitted.current = date;
    onChange(date);
  };
  const change = (part: Part, value: string) => {
    const next = { ...parts, [part]: value };
    const today = new Date();
    setNotice("");
    if (
      Number(next.year) === today.getFullYear() &&
      Number(next.month) > today.getMonth() + 1
    ) {
      next.month = "";
      next.day = "";
      setNotice("future");
    }
    if (Number(next.day) > daysInMonth(next.month, next.year)) {
      next.day = "";
      setNotice("invalid-day");
    }
    if (
      next.day &&
      next.month &&
      next.year &&
      Number(next.year) === today.getFullYear() &&
      Number(next.month) === today.getMonth() + 1 &&
      Number(next.day) > today.getDate()
    ) {
      next.day = "";
      setNotice("future");
    }
    emit(next);
  };
  const clear = () => {
    setNotice("");
    emit(emptyParts());
  };
  const incomplete =
    Object.values(parts).some(Boolean) && !Object.values(parts).every(Boolean);
  return { parts, change, clear, incomplete, notice };
}

const months = {
  my: [
    "ဇန်နဝါရီ",
    "ဖေဖော်ဝါရီ",
    "မတ်",
    "ဧပြီ",
    "မေ",
    "ဇွန်",
    "ဇူလိုင်",
    "ဩဂုတ်",
    "စက်တင်ဘာ",
    "အောက်တိုဘာ",
    "နိုဝင်ဘာ",
    "ဒီဇင်ဘာ",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

export default function BirthdayField({
  input,
}: {
  input: ReturnType<typeof useBirthdayInput>;
}) {
  const { language, t } = useSettings();
  const en = language === "en";
  const today = new Date();
  const currentYear = today.getFullYear();
  const years = Array.from({ length: 121 }, (_, index) =>
    String(currentYear - index),
  );
  if (input.parts.year && !years.includes(input.parts.year))
    years.push(input.parts.year);
  const currentYearSelected = Number(input.parts.year) === currentYear;
  const currentMonthSelected =
    currentYearSelected && Number(input.parts.month) === today.getMonth() + 1;
  const maximumDay = Math.min(
    daysInMonth(input.parts.month, input.parts.year),
    currentMonthSelected ? today.getDate() : 31,
  );
  const labels: Record<Part, string> = en
    ? { day: "Day", month: "Month", year: "Year" }
    : { day: "မွေးရက်", month: "မွေးလ", year: "မွေးနှစ်" };
  const placeholders: Record<Part, string> = en
    ? { day: "DD", month: "Month", year: "YYYY" }
    : { day: "ရက်", month: "လရွေးပါ", year: "နှစ်" };
  return (
    <fieldset
      className="field field-wide birthday-field"
      aria-describedby="birthday-hint"
    >
      <legend>{t("မွေးသက္ကရာဇ်")}</legend>
      <div className="birthday-parts">
        {(["day", "month", "year"] as Part[]).map((part) => (
          <div className="birthday-part" key={part}>
            <label htmlFor={`birthday-${part}`}>{labels[part]}</label>
            <div className="select-wrap">
              <select
                id={`birthday-${part}`}
                value={input.parts[part]}
                onChange={(event) => input.change(part, event.target.value)}
                aria-describedby="birthday-hint"
              >
                <option value="">{placeholders[part]}</option>
                {part === "day" &&
                  Array.from(
                    { length: maximumDay },
                    (_, index) => index + 1,
                  ).map((day) => (
                    <option value={pad(day)} key={day}>
                      {pad(day)}
                    </option>
                  ))}
                {part === "month" &&
                  months[language].map((month, index) => (
                    <option
                      key={month}
                      value={pad(index + 1)}
                      disabled={currentYearSelected && index > today.getMonth()}
                    >
                      {month}
                    </option>
                  ))}
                {part === "year" &&
                  years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>
      <div className="birthday-help">
        <span
          id="birthday-hint"
          className={`field-hint ${input.notice || input.incomplete ? "birthday-notice" : ""}`}
          role={input.notice ? "status" : undefined}
        >
          {input.notice === "future"
            ? en
              ? "Choose a date on or before today."
              : "ယနေ့ထက် နောက်ကျသော မွေးသက္ကရာဇ်ကို မရွေးနိုင်ပါ။"
            : input.notice === "invalid-day"
              ? en
                ? "That day does not exist in this month. Please choose the day again."
                : "ဒီလမှာ အဲဒီရက် မရှိလို့ မွေးရက်ကို ပြန်ရွေးပေးပါ။"
              : input.incomplete
                ? en
                  ? "Please choose all three: day, month and year."
                  : "မွေးရက်၊ မွေးလနဲ့ မွေးနှစ် သုံးခုလုံးကို ရွေးပေးပါ။"
                : en
                  ? "Choose day / month / year separately. The month name prevents date-format confusion."
                  : "မွေးရက် / မွေးလ / မွေးနှစ်ကို သီးခြားရွေးပါ။ လအမည်ကို စာသားနဲ့ ပြထားပါတယ်။"}
        </span>
        {Object.values(input.parts).some(Boolean) && (
          <button
            type="button"
            className="birthday-clear"
            onClick={input.clear}
          >
            {en ? "Clear date" : "မွေးသက္ကရာဇ်ဖျက်ရန်"}
          </button>
        )}
      </div>
    </fieldset>
  );
}
