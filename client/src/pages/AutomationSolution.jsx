import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function AutomationSolution() {
  const { t } = useLanguage();
  const solutions = t("automationSolution.solutions");
  const process = t("automationSolution.process");

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{t("automationSolution.heroMeta")}</span>
          <h1>{t("automationSolution.heroTitle")}</h1>
          <p className="hero__sub">{t("automationSolution.heroSub")}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {solutions.map((s, i) => (
            <div className="solution-block" key={s.slug}>
              <div className="solution-block__visual" aria-hidden="true">
                <span className="solution-block__glyph">0{i + 1}</span>
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
