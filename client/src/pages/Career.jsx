import { useEffect, useRef, useState } from "react";
import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../api/client.js";

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
  apply: (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  ),
  contact: (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
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
  const [careerJobs, setCareerJobs] = useState(null); // null = loading
  const [activeId, setActiveId] = useState(null);
  const detailRef = useRef(null);
  const applyRef = useRef(null);
  const [pageContent, setPageContent] = useState(null);

  useEffect(() => {
    api
      .getCareerJobs()
      .then((list) => setCareerJobs(Array.isArray(list) ? list : []))
      .catch(() => setCareerJobs([]));
    api
      .getCareerPageContent()
      .then(setPageContent)
      .catch(() => setPageContent(null));
  }, []);

  const tr = (field) => (field ? field[lang] || field.en || field.th || "" : "");
  const jobs = careerJobs || [];
  const active = jobs.find((job) => job.id === activeId) || jobs[0];

  // How to Apply — admin-managed list of { en, th }; falls back to the
  // built-in default steps until the content row is loaded / filled in.
  const adminSteps = Array.isArray(pageContent?.apply_steps) ? pageContent.apply_steps : null;
  const applySteps = adminSteps && adminSteps.length
    ? adminSteps.map((s) => s[lang] || s.en || s.th).filter(Boolean)
    : t("career.defaultApplySteps");

  // HR contact — admin-managed; blank fields are hidden.
  const hrName = pageContent?.[`hr_name_${lang}`] || pageContent?.hr_name_en || pageContent?.hr_name_th || "";
  const hrPhone = pageContent?.hr_phone || "";
  const hrEmail = pageContent?.hr_email || "";
  const hrLine = pageContent?.hr_line_id || "";
  const contactRows = [
    hrPhone && { key: "phone", label: t("career.phoneLabel"), value: hrPhone, href: `tel:${hrPhone.replace(/[^\d+]/g, "")}` },
    hrEmail && { key: "email", label: t("career.emailLabel"), value: hrEmail, href: `mailto:${hrEmail}` },
    hrLine && {
      key: "line",
      label: t("career.lineLabel"),
      value: hrLine,
      href: `https://line.me/ti/p/~${encodeURIComponent(hrLine.replace(/^@/, ""))}`,
      external: true,
    },
  ].filter(Boolean);
  const showContact = Boolean(hrName || contactRows.length);

  const hero = (field, fallback) => pageContent?.[`${field}_${lang}`] || fallback;
  const heroSub = hero("hero_sub", t("career.heroSub"));
  const heroBgImage = pageContent?.hero_bg_image || "";

  const scrollToApply = () => {
    applyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectJob = (id) => {
    setActiveId(id);
    // On narrow screens the detail panel sits below the list — bring it into view.
    if (window.matchMedia("(max-width: 900px)").matches && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* 1. Hero — admin-editable (Admin > ตำแหน่งงาน > Hero), falls back to translations */}
      <section className={`hero hero--compact career-hero${heroBgImage ? " hero--has-bg" : ""}`}>
        {heroBgImage && (
          <>
            <div className="hero__bg-image" style={{ backgroundImage: `url(${heroBgImage})` }} aria-hidden="true" />
            <div className="hero__bg-scrim" aria-hidden="true" />
          </>
        )}
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{hero("hero_meta", t("career.heroMeta"))}</span>
          <h1>{hero("hero_title", t("career.heroTitle"))}</h1>
          {heroSub && <p className="hero__sub">{heroSub}</p>}
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

          {careerJobs === null ? (
            <p className="career-empty">{t("career.loading")}</p>
          ) : jobs.length === 0 ? (
            <p className="career-empty">{t("career.noPositions")}</p>
          ) : (
            <div className="career-board">
              <div className="career-list">
                <div className="career-list__head">
                  <span className="career-list__count">
                    {jobs.length} {t("career.positionsCount")}
                  </span>
                  <span className="career-list__hint">{t("career.selectHint")}</span>
                </div>

                {jobs.map((job) => {
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
                  </div>
                  <button type="button" className="btn btn-primary career-detail__apply" onClick={scrollToApply}>
                    {t("career.applyNow")}
                  </button>
                  <div className="career-detail__chips">
                    <span className="career-chip">
                      <PinIcon />
                      {tr(active.location)}
                    </span>
                    <span className="career-chip">
                      <MoneyIcon />
                      {tr(active.salary)}
                    </span>
                    {tr(active.type) && (
                      <span className="career-chip">
                        <ClockIcon />
                        {tr(active.type)}
                      </span>
                    )}
                  </div>
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

                {Array.isArray(applySteps) && applySteps.length > 0 && (
                  <section className="career-detail__section career-detail__section--apply" ref={applyRef}>
                    <h4 className="career-detail__section-title">
                      <span className="career-detail__section-icon">{sectionIcons.apply}</span>
                      {t("career.howToApplyTitle")}
                    </h4>
                    <ol className="career-steps">
                      {applySteps.map((step, i) => (
                        <li key={i} className="career-steps__item">
                          <span className="career-steps__no" aria-hidden="true">{i + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {showContact && (
                  <section className="career-detail__section">
                    <h4 className="career-detail__section-title">
                      <span className="career-detail__section-icon">{sectionIcons.contact}</span>
                      {t("career.contactTitle")}
                    </h4>
                    <div className="career-contact">
                      <div className="career-contact__person">
                        <span className="career-contact__dept">{t("career.hrDepartment")}</span>
                        {hrName && <span className="career-contact__name">{hrName}</span>}
                      </div>
                      {contactRows.length > 0 && (
                        <dl className="career-contact__list">
                          {contactRows.map((row) => (
                            <div key={row.key} className="career-contact__row">
                              <dt>{row.label}</dt>
                              <dd>
                                <a
                                  href={row.href}
                                  {...(row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                >
                                  {row.value}
                                </a>
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  </section>
                )}
              </article>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
