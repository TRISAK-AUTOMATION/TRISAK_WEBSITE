import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { careerJobs } from "../data/careerJobs.js";

const PinIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

const MoneyIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 9.5v5M18 9.5v5" />
  </svg>
);

const ClockIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const CheckIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const sectionIcons = {
  responsibilities: (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="17" rx="2" />
      <path d="M9 3h6v3H9zM8 11h8M8 15h6" />
    </svg>
  ),
  requirements: (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  benefits: (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z" />
    </svg>
  ),
};

export default function Career() {
  const { t, lang } = useLanguage();
  const [activeId, setActiveId] = useState(careerJobs[0]?.id);
  const detailRef = useRef(null);

  const tr = (field) => (field ? field[lang] || field.en : "");
  const active = careerJobs.find((job) => job.id === activeId) || careerJobs[0];

  const selectJob = (id) => {
    setActiveId(id);
    // On narrow screens the detail panel sits below the list — bring it into view.
    if (window.matchMedia("(max-width: 900px)").matches && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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

      {/* 2. Open Positions — cards (left) + selected job details (right) */}
      <section className="section career-positions" id="open-positions">
        <div className="container">
          <SectionLabel
            eyebrow={t("career.openPositionsEyebrow")}
            title={t("career.openPositionsTitle")}
            lede={t("career.openPositionsLede")}
          />

          {careerJobs.length === 0 ? (
            <p className="career-empty">{t("career.noPositions")}</p>
          ) : (
            <div className="career-board">
              <div className="career-list">
                <div className="career-list__head">
                  <span className="career-list__count">
                    {careerJobs.length} {t("career.positionsCount")}
                  </span>
                  <span className="career-list__hint">{t("career.selectHint")}</span>
                </div>

                {careerJobs.map((job) => {
                  const selected = job.id === active.id;
                  return (
                    <button
                      key={job.id}
                      type="button"
                      className={`career-card${selected ? " is-active" : ""}`}
                      aria-pressed={selected}
                      aria-controls="career-job-detail"
                      onClick={() => selectJob(job.id)}
                    >
                      <span className="career-card__title">{tr(job.title)}</span>
                      <span className="career-card__meta">
                        <span className="career-card__meta-item">
                          <PinIcon />
                          {tr(job.location)}
                        </span>
                        <span className="career-card__meta-item">
                          <MoneyIcon />
                          {tr(job.salary)}
                        </span>
                      </span>
                      <span className="career-card__summary">{tr(job.summary)}</span>
                    </button>
                  );
                })}
              </div>

              <article
                className="career-detail"
                id="career-job-detail"
                ref={detailRef}
                aria-live="polite"
              >
                <header className="career-detail__head">
                  <div className="career-detail__heading">
                    <h3 className="career-detail__title">{tr(active.title)}</h3>
                    <div className="career-detail__chips">
                      <span className="career-chip">
                        <PinIcon />
                        {tr(active.location)}
                      </span>
                      <span className="career-chip">
                        <MoneyIcon />
                        {tr(active.salary)}
                      </span>
                      {active.type && (
                        <span className="career-chip">
                          <ClockIcon />
                          {tr(active.type)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link to="/contacts" className="btn btn-primary career-detail__apply">
                    {t("career.applyNow")}
                  </Link>
                </header>

                <section className="career-detail__section">
                  <h4 className="career-detail__section-title">
                    <span className="career-detail__section-icon">{sectionIcons.responsibilities}</span>
                    {t("career.responsibilitiesTitle")}
                  </h4>
                  <ul className="career-detail__list">
                    {active.responsibilities.map((item, i) => (
                      <li key={i}>{tr(item)}</li>
                    ))}
                  </ul>
                </section>

                <section className="career-detail__section">
                  <h4 className="career-detail__section-title">
                    <span className="career-detail__section-icon">{sectionIcons.requirements}</span>
                    {t("career.requirementsTitle")}
                  </h4>
                  <ul className="career-detail__list">
                    {active.requirements.map((item, i) => (
                      <li key={i}>{tr(item)}</li>
                    ))}
                  </ul>
                </section>

                <section className="career-detail__section">
                  <h4 className="career-detail__section-title">
                    <span className="career-detail__section-icon">{sectionIcons.benefits}</span>
                    {t("career.benefitsTitle")}
                  </h4>
                  <ul className="career-benefits">
                    {active.benefits.map((item, i) => (
                      <li key={i} className="career-benefits__item">
                        <CheckIcon />
                        <span>{tr(item)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </article>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
