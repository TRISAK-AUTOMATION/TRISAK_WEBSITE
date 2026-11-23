import { Link, Navigate, useParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import HeroBgMedia from "../components/HeroBgMedia.jsx";
import Reveal from "../components/Reveal.jsx";
import SectionLabel from "../components/SectionLabel.jsx";
import ContactIcon from "../components/contactIcons.jsx";
import { Icon } from "../components/WhyTrisak.jsx";
import { discussHref } from "./AutomationSolution.jsx";

// One automation solution's own page (/automation-solution/:slug).
// shortcut: names and content come from the built-in translations
// (automationSolution.solutions / .details), not the admin DB; a solution
// without details shows the hero only. Move to the DB when admins need to edit it.
export default function SolutionPage() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const solution = t("automationSolution.solutions").find((s) => s.slug === slug);
  if (!solution) return <Navigate to="/automation-solution" replace />;
  const detail = t("automationSolution.details")?.[slug];

  return (
    <>
      <section className={`hero hero--compact hero--centered ${detail?.image ? "hero--has-bg" : ""}`}>
        {detail?.image && (
          <>
            <HeroBgMedia src={detail.image} />
            <div className="hero__bg-scrim" aria-hidden="true" />
          </>
        )}
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <Link to="/automation-solution" className="hero__meta">
            {t("automationSolution.heroTitle")}
          </Link>
          <h1>{solution.name}</h1>
          <p className="hero__sub">{detail?.tagline || solution.summary}</p>
        </div>
      </section>

      {detail && (
        <>
          <section className="section sol-rack-section">
            <div className="container">
              <SectionLabel title={t("automationSolution.detailServices")} />
              {/* services as units in a control-cabinet rack; LEDs switch on in view */}
              <Reveal className="sol-rack">
                {detail.services.map((svc, i) => (
                  <article className="sol-unit" id={`svc-${i}`} key={svc.title}>
                    <div className="sol-unit__face">
                      <span className="sol-unit__led" style={{ "--i": i }} aria-hidden="true" />
                      <span className="sol-unit__icon">
                        <Icon name={svc.icon} />
                      </span>
                      <h3>{svc.title}</h3>
                    </div>
                    <ul className={`sol-unit__list${svc.items.length > 3 ? " sol-unit__list--2col" : ""}`}>
                      {svc.items.map((item) => (
                        <li key={item}>
                          <span className="solution-block__tick" aria-hidden="true">
                            <ContactIcon name="check" size={14} />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </Reveal>
            </div>
          </section>

          <section className="section sol-gains">
            <div className="container sol-gains__inner">
              <SectionLabel title={t("automationSolution.detailBenefits")} />
              <ul className="sol-gains__list">
                {detail.benefits.map((b) => (
                  <li key={b.text}>
                    <Icon name={b.icon} />
                    <span className="sol-gains__text">
                      {b.text}
                      {b.desc && <small>{b.desc}</small>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      <section className="cta-band history-cta">
        <Reveal className="container cta-band__wrap">
          <h2>{t("automationSolution.ctaTitle")}</h2>
          <p className="history-cta__sub">{t("automationSolution.ctaSub")}</p>
          <div className="history-cta__actions">
            <Link to={discussHref(solution.name)} className="btn btn-primary">
              {t("automationSolution.discuss")} <span className="btn-arrow">→</span>
            </Link>
            <Link to="/automation-solution" className="btn">
              {t("automationSolution.heroTitle")}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
