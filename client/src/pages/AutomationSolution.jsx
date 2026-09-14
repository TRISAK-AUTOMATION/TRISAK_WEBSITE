import { useEffect, useState } from "react";
import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../api/client.js";

export default function AutomationSolution() {
  const { t, lang } = useLanguage();
  const staticSolutions = t("automationSolution.solutions");
  const process = t("automationSolution.process");

  const [heroContent, setHeroContent] = useState(null);
  const [dbSolutions, setDbSolutions] = useState(null);
  const [brokenImages, setBrokenImages] = useState({});

  useEffect(() => {
    api
      .getAutomationSolutionContent()
      .then(setHeroContent)
      .catch(() => setHeroContent(null));
    api
      .getSolutions()
      .then((rows) => setDbSolutions(rows && rows.length ? rows : null))
      .catch(() => setDbSolutions(null));
  }, []);

  // Reads `${field}_${lang}` from the admin-editable
  // automation_solution_page_content row, falling back to the
  // built-in translation if the DB row isn't loaded yet (or unedited).
  const hc = (field, fallback) => {
    if (!heroContent) return fallback;
    const value = heroContent[`${field}_${lang}`];
    return value || fallback;
  };

  // Solution block text (name/summary/services/benefits) is managed
  // from Admin Sidebar > Edit > Automation Solution and is
  // single-language (like Brand/Category/Series names elsewhere),
  // so it doesn't change with the EN/TH toggle once edited. Falls
  // back to the fully-translated static list until an admin adds
  // at least one block from the DB.
  const solutions = dbSolutions || staticSolutions;

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{hc("hero_meta", t("automationSolution.heroMeta"))}</span>
          <h1>{hc("hero_title", t("automationSolution.heroTitle"))}</h1>
          <p className="hero__sub">{hc("hero_sub", t("automationSolution.heroSub"))}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {solutions.map((s, i) => (
            <div className="solution-block" key={s.slug}>
              <div className="solution-block__visual" aria-hidden="true">
                {s.image_url && !brokenImages[s.slug] ? (
                  <img
                    src={s.image_url}
                    alt=""
                    className="solution-block__image"
                    loading="lazy"
                    decoding="async"
                    style={{
                      objectPosition: `${s.image_position_x ?? 50}% ${s.image_position_y ?? 50}%`,
                    }}
                    onError={() =>
                      setBrokenImages((prev) => ({ ...prev, [s.slug]: true }))
                    }
                  />
                ) : (
                  <span className="solution-block__glyph">0{i + 1}</span>
                )}
              </div>
              <div>
                <span className="solution-block__num">
                  {t("automationSolution.solutionLabel")} 0{i + 1}
                </span>
                <h2>{s.name}</h2>
                <p className="solution-block__summary">{s.summary}</p>
                <div className="solution-block__lists">
                  <div>
                    <h4>{t("automationSolution.servicesLabel")}</h4>
                    <ul>
                      {(s.services || []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>{t("automationSolution.benefitsLabel")}</h4>
                    <ul>
                      {(s.benefits || []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Signature section — Our Engineering Process */}
      <section className="section">
        <div className="container">
          <SectionLabel
            index="05"
            eyebrow={t("automationSolution.processEyebrow")}
            title={t("automationSolution.processTitle")}
            lede={t("automationSolution.processLede")}
          />
          <div className="process-flow panel">
            {process.map((step, i) => (
              <div
                className="process-step"
                key={step.label}
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--line)",
                  padding: "22px 28px",
                }}
              >
                <span className="process-step__index">0{i + 1}</span>
                <span className="process-step__label">{step.label}</span>
                <span className="process-step__desc">{step.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
