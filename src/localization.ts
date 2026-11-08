import messages from "./en.json";

export type Locale = "my" | "en";
export type Theme = "light" | "dark" | "system";
export type Translator = (
  text: string,
  values?: Record<string, string | number>,
) => string;

// Burmese source phrases remain stable keys. User-entered CV values are never translated here.
export const english: Record<string, string> = messages;

export function translator(language: Locale): Translator {
  return (text, values) => {
    let translated = language === "en" ? (english[text] ?? text) : text;
    for (const [key, value] of Object.entries(values || {}))
      translated = translated.replaceAll(`{${key}}`, String(value));
    return translated;
  };
}
