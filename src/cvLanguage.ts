import type { CvRow } from "./model";
import type { Locale } from "./localization";

const labels: Record<string, string> = {
  desiredRole: "Position applied for",
  applicationDate: "Application date",
  name: "Full name",
  fatherName: "Father’s name",
  motherName: "Mother’s name",
  nrc: "National registration number",
  birthday: "Date of birth",
  age: "Age",
  gender: "Gender",
  maritalStatus: "Marital status",
  nationalityReligion: "Ethnicity / religion",
  nationality: "Ethnicity / nationality",
  religion: "Religion",
  education: "Education",
  skills: "Other qualifications",
  experience: "Work experience",
  languages: "Languages",
  address: "Address",
  phone: "Phone number",
  email: "Email address",
  fatherNrc: "Father’s NRC number",
  motherNrc: "Mother’s NRC number",
  fatherJob: "Father’s occupation",
  motherJob: "Mother’s occupation",
  "heading-0": "PERSONAL DETAILS",
  "heading-1": "EDUCATION & EXPERIENCE",
  "heading-2": "FAMILY DETAILS",
  "heading-3": "CONTACT",
};
const choices: Record<string, string> = {
  ကျား: "Male",
  မ: "Female",
  အခြား: "Other",
  လူပျို: "Single",
  အပျို: "Single",
  အိမ်ထောင်ရှိ: "Married",
};
export function localizeCvRows(rows: CvRow[], language: Locale): CvRow[] {
  if (language !== "en") return rows;
  return rows.map((row) => ({
    ...row,
    label: labels[row.id] || row.label,
    value:
      row.id === "gender" || row.id === "maritalStatus"
        ? choices[row.value] || row.value
        : row.value,
  }));
}
