import type { Documents, DocumentImage } from "./documents";
import type { Locale } from "./localization";

function Image({ image }: { image: DocumentImage }) {
  return (
    <img className="document-page-image" src={image.src} alt={image.name} />
  );
}

export default function DocumentSheets({
  documents,
  language,
}: {
  documents: Documents;
  language: Locale;
}) {
  return (
    <>
      {(documents.front || documents.back) && (
        <article
          className="cv-sheet attachment-sheet nrc-sheet"
          data-orientation="portrait"
          aria-label="မှတ်ပုံတင် အရှေ့ခြမ်းနှင့် အနောက်ခြမ်း စာမျက်နှာ"
        >
          <div className="nrc-page-half">
            {documents.front && (
              <>
                <span className="document-side-label">
                  {language === "en" ? "Front" : "အရှေ့ခြမ်း"}
                </span>
                <Image image={documents.front} />
              </>
            )}
          </div>
          <div className="nrc-page-half">
            {documents.back && (
              <>
                <span className="document-side-label">
                  {language === "en" ? "Back" : "အနောက်ခြမ်း"}
                </span>
                <Image image={documents.back} />
              </>
            )}
          </div>
        </article>
      )}
      {documents.household.map((image) => (
        <article
          key={image.id}
          className="cv-sheet attachment-sheet landscape-sheet"
          data-orientation="landscape"
          aria-label={`အိမ်ထောင်စုစာရင်း ${image.name}`}
        >
          <Image image={image} />
        </article>
      ))}
      {documents.certificates.map((image) => (
        <article
          key={image.id}
          className={`cv-sheet attachment-sheet ${image.orientation === "landscape" ? "landscape-sheet" : ""}`}
          data-orientation={image.orientation}
          aria-label={`အောင်လက်မှတ် ${image.name}`}
        >
          <Image image={image} />
        </article>
      ))}
    </>
  );
}
