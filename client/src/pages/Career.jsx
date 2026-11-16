import { useEffect, useRef, useState } from "react";
import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../api/client.js";
import ApplyJobModal from "../components/ApplyJobModal.jsx";
import HeroBgMedia from "../components/HeroBgMedia.jsx";
import Reveal from "../components/Reveal.jsx";
import ContactIcon from "../components/contactIcons.jsx";
import { Icon as LineIcon } from "../components/WhyTrisak.jsx";

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

// Placeholder values staff type when a field doesn't apply ("-", "—", "n/a").
const isBlank = (v) => !v || /^\s*(-+|—|–|n\/?a|none)\s*$/i.test(v);

// ?job=<id> deep links straight to a position (shareable by HR).
const jobIdFromUrl = () => {
  const n = parseInt(new URLSearchParams(window.location.search).get("job"), 10);
  return Number.isNaN(n) ? null : n;
};

function CopyChip({ text, label, doneLabel, icon = "copy" }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* clipboard blocked — nothing else to do */
    }
  };
  return (
    <button type="button" className={`copy-btn career-copy ${done ? "is-done" : ""}`} onClick={copy}>
      <ContactIcon name={done ? "check" : icon} size={15} />
      <span aria-live="polite">{done ? doneLabel : label}</span>
    </button>
  );
}

export default function Career() {
  const { t, lang } = useLanguage();
  const [careerJobs, setCareerJobs] = useState(null); // null = loading
  const [activeId, setActiveId] = useState(jobIdFromUrl);
  const detailRef = useRef(null);
  const applyRef = useRef(null);
  const [applyJob, setApplyJob] = useState(null); // job the popup is open for
  const [pageContent, setPageContent] = useState(null);
  const [founded, setFounded] = useState(null);
  const [detailInView, setDetailInView] = useState(false);

  useEffect(() => {
    api
      .getCareerJobs()
      .then((list) => setCareerJobs(Array.isArray(list) ? list : []))
      .catch(() => setCareerJobs([]));
    api
      .getCareerPageContent()
      .then(setPageContent)
      .catch(() => setPageContent(null));
    // founding year = earliest numeric year on the History timeline
    api
      .getHistoryContent()
      .then((h) => {
        const years = (h?.timeline || []).map((m) => parseInt(m.year_en || m.year_th, 10)).filter((n) => n > 1800);
        setFounded(years.length ? Math.min(...years) : null);
      })
      .catch(() => setFounded(null));
  }, []);

  const tr = (field) => (field ? field[lang] || field.en || field.th || "" : "");
  const jobs = careerJobs || [];
  const active = jobs.find((job) => job.id === activeId) || jobs[0];

  // A deep link arriving with ?job= scrolls to the board once jobs load.
  useEffect(() => {
    if (!careerJobs?.length || jobIdFromUrl() == null) return;
    const id = setTimeout(
      () => document.getElementById("open-positions")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      300
    );
    return () => clearTimeout(id);
  }, [careerJobs]);

  // Mobile: show the sticky "Apply" bar while the job details are on screen.
  useEffect(() => {
    const el = detailRef.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setDetailInView(entry.isIntersecting), {
      rootMargin: "-20% 0px -20% 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [careerJobs]);

  // How to Apply — admin-managed list of { en, th }; falls back to the
  // built-in default steps until the content row is loaded / filled in.
  const adminSteps = Array.isArray(pageContent?.apply_steps) ? pageContent.apply_steps : null;
  const applySteps = adminSteps && adminSteps.length
    ? adminSteps.map((s) => s[lang] || s.en || s.th).filter(Boolean)
    : t("career.defaultApplySteps");

  // HR contact — admin-managed; blank fields (and "-" placeholders) are hidden.
  const hrName = pageContent?.[`hr_name_${lang}`] || pageContent?.hr_name_en || pageContent?.hr_name_th || "";
  const hrPhone = isBlank(pageContent?.hr_phone) ? "" : pageContent.hr_phone;
  const hrEmail = isBlank(pageContent?.hr_email) ? "" : pageContent.hr_email;
  const hrLine = isBlank(pageContent?.hr_line_id) ? "" : pageContent.hr_line_id;
  const contactRows = [
    hrPhone && { key: "phone", icon: "phone", label: t("career.phoneLabel"), value: hrPhone, href: `tel:${hrPhone.replace(/\s*(ต่อ|ext\.?|x)\s*\d+.*$/i, "").replace(/[^\d+]/g, "")}` },
    hrEmail && { key: "email", icon: "mail", label: t("career.emailLabel"), value: hrEmail, href: `mailto:${hrEmail}` },
    hrLine && {
      key: "line",
      icon: "chat",
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

  // Company-wide welfare: every distinct benefit listed on any open position.
  const allBenefits = [...new Set(jobs.flatMap((job) => (job.benefits || []).map(tr)).filter(Boolean))];
  const years = founded ? new Date().getFullYear() - founded : null;
  // "{years}" in a title needs the founding year; without it use titleNoYears.
  const reasons = t("career.whyReasons").map((r) => ({
    ...r,
    title: r.title.includes("{years}") ? (years ? r.title.replace("{years}", String(years)) : r.titleNoYears) : r.title,
  }));

  const jobLink = (id) => `${window.location.origin}${window.location.pathname}?job=${id}`;

  const selectJob = (id) => {
    setActiveId(id);
    window.history.replaceState(null, "", `?job=${id}`);
    // On narrow screens the detail panel sits below the list — bring it into view.
    if (window.matchMedia("(max-width: 900px)").matches && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToPositions = () =>
    document.getElementById("open-positions")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const generalApplyHref = hrEmail
    ? `mailto:${hrEmail}?subject=${encodeURIComponent(t("career.generalSubject"))}`
    : "";

  return (
    <>
      {/* 1. Hero — admin-editable (Admin > ตำแหน่งงาน > Hero), falls back to translations */}
      <section className={`hero hero--compact hero--centered career-hero${heroBgImage ? " hero--has-bg" : ""}`}>
        {heroBgImage && (
          <>
            <HeroBgMedia src={heroBgImage} />
            <div className="hero__bg-scrim" aria-hidden="true" />
          </>
        )}
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{hero("hero_meta", t("career.heroMeta"))}</span>
          <h1>{hero("hero_title", t("career.heroTitle"))}</h1>
          {heroSub && <p className="hero__sub">{heroSub}</p>}
          {jobs.length > 0 && (
            <div className="hero__actions">
              <button type="button" className="btn btn-primary" onClick={scrollToPositions}>
                {t("career.viewPositions")} ({jobs.length}) <span className="btn-arrow">↓</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. Why join — facts the site already states, plus every benefit listed on the open positions */}
      <section className="section career-why">
        <Reveal className="container">
          <SectionLabel title={t("career.whyTitle")} lede={t("career.whyLede")} />
          <ul className="career-why__list">
            {reasons.map((r, i) => (
              <li className="career-why__item" key={r.title} style={{ "--i": i }}>
                <span className="career-why__icon">
                  <LineIcon name={r.icon} />
                </span>
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </li>
            ))}
          </ul>
          {allBenefits.length > 0 && (
            <div className="career-perks">
              <h3 className="career-perks__title">
                <span className="career-detail__section-icon">{sectionIcons.benefits}</span>
                {t("career.perksTitle")}
              </h3>
              <ul className="career-perks__list">
                {allBenefits.map((b) => (
                  <li key={b}>
                    <CheckIcon />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Reveal>
      </section>

      {/* 3. Open Positions — cards (left) + selected job details (right) */}
      <section className="section career-positions" id="open-positions">
        <div className="container">
          <SectionLabel title={t("career.openPositionsTitle")} lede={t("career.openPositionsLede")} />

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
                      <span className="career-card__more" aria-hidden="true">
                        {t("career.viewDetails")}
                        <ContactIcon name="arrow" size={15} />
                      </span>
                    </button>
                  );
                })}

                {generalApplyHref && (
                  <div className="career-general">
                    <strong>{t("career.generalTitle")}</strong>
                    <p>{t("career.generalText")}</p>
                    <a className="career-general__link" href={generalApplyHref}>
                      <ContactIcon name="mail" size={16} />
                      {t("career.generalCta")}
                    </a>
                  </div>
                )}
              </div>

              <article
                className="career-detail"
                id="career-job-detail"
                ref={detailRef}
                aria-live="polite"
                key={active.id}
              >
                <header className="career-detail__head">
                  <div className="career-detail__heading">
                    <h3 className="career-detail__title">{tr(active.title)}</h3>
                  </div>
                  <div className="career-detail__head-actions">
                    <button type="button" className="btn btn-primary career-detail__apply" onClick={() => setApplyJob(active)}>
                      {t("career.applyNow")}
                    </button>
                    <CopyChip
                      text={jobLink(active.id)}
                      label={t("career.copyLink")}
                      doneLabel={t("career.linkCopied")}
                    />
                  </div>
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
                        <ul className="career-contact__links">
                          {contactRows.map((row) => (
                            <li key={row.key} className={`career-contact__link career-contact__link--${row.key}`}>
                              <a
                                href={row.href}
                                aria-label={`${row.label}: ${row.value}`}
                                {...(row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                              >
                                <span className="career-contact__icon">
                                  <ContactIcon name={row.icon} size={16} />
                                </span>
                                <span className="career-contact__value">{row.value}</span>
                              </a>
                              {row.key !== "line" && (
                                <CopyChip text={row.value} label={t("contacts.copy")} doneLabel={t("contacts.copied")} />
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                )}

                {/* closing call to action, so nobody scrolls back up to apply */}
                <div className="career-detail__cta">
                  <div>
                    <strong>{t("career.ctaTitle")}</strong>
                    <span>{tr(active.title)}</span>
                  </div>
                  <button type="button" className="btn btn-primary" onClick={() => setApplyJob(active)}>
                    {t("career.applyNow")} <span className="btn-arrow">→</span>
                  </button>
                </div>
              </article>
            </div>
          )}
        </div>
      </section>

      {/* mobile: apply bar pinned to the bottom while reading a position */}
      {active && (
        <div className={`career-applybar ${detailInView && !applyJob ? "is-shown" : ""}`} aria-hidden={!detailInView}>
          <span className="career-applybar__title">{tr(active.title)}</span>
          <button
            type="button"
            className="btn btn-primary"
            tabIndex={detailInView ? 0 : -1}
            onClick={() => setApplyJob(active)}
          >
            {t("career.applyShort")}
          </button>
        </div>
      )}

      {applyJob && (
        <ApplyJobModal job={applyJob} jobTitle={tr(applyJob.title)} onClose={() => setApplyJob(null)} />
      )}
    </>
  );
}
