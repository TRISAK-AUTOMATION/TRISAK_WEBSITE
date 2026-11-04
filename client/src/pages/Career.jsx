import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Career() {
  const { t } = useLanguage();

  return (
    <>
      {/* 1. Hero */}
      <section className="hero hero--compact career-hero">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{t("career.heroMeta")}</span>
          <h1>{t("career.heroTitle")}</h1>
        </div>
      </section>

      {/* 2. Open Positions */}
      <section className="section career-positions" id="open-positions">
        <div className="container">
          <SectionLabel
            eyebrow={t("career.openPositionsEyebrow")}
            title={t("career.openPositionsTitle")}
          />
          <div className="career-positions__list">{/* job position list — to be specified */}</div>
        </div>
      </section>

      {/* 3. Job Details */}
      <section className="section career-details" id="job-details">
        <div className="container">
          <SectionLabel
            eyebrow={t("career.jobDetailsEyebrow")}
            title={t("career.jobDetailsTitle")}
          />
          <div className="career-details__content">{/* selected job details — to be specified */}</div>
        </div>
      </section>
    </>
  );
}
