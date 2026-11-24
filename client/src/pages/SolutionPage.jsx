import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import HeroBgMedia from "../components/HeroBgMedia.jsx";
import Reveal from "../components/Reveal.jsx";
import SectionLabel from "../components/SectionLabel.jsx";
import ContactIcon from "../components/contactIcons.jsx";
import { Icon } from "../components/WhyTrisak.jsx";
import { discussHref } from "./AutomationSolution.jsx";

const SOLUTIONS_URL = "/automation-solution";

// The service being read: the last one whose top has passed the upper third
// of the screen (the first one until any has).
function useServiceInView(count, slug) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    setActive(0);
    if (!count) return undefined;
    const els = [...Array(count)].map((_, i) => document.getElementById(`svc-${i}`)).filter(Boolean);
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      let i = 0;
      els.forEach((el, n) => {
        if (el.getBoundingClientRect().top <= line) i = n;
      });
      setActive(i);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count, slug]);
  return active;
}

// One automation solution's own page (/automation-solution/:slug).
// shortcut: names and content come from the built-in translations
// (automationSolution.solutions / .details), not the admin DB; a solution
// without details shows the hero only. Move to the DB when admins need to edit it.
export default function SolutionPage() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const solutions = t("automationSolution.solutions");
  const solution = solutions.find((s) => s.slug === slug);
  const detail = solution ? t("automationSolution.details")?.[slug] : null;
  const services = detail?.services || [];
  const active = useServiceInView(services.length, slug);
  // on phones the tab row scrolls sideways: bring this solution's tab into view
  const tabsRef = useRef(null);
  useEffect(() => {
    const row = tabsRef.current;
    const tab = row?.querySelector(".is-active");
    if (tab) row.scrollLeft = tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2;
  }, [slug]);
  if (!solution) return <Navigate to={SOLUTIONS_URL} replace />;

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
          <Link to={SOLUTIONS_URL} className="hero__meta">
            {t("automationSolution.heroTitle")}
          </Link>
          <h1>{solution.name}</h1>
          <p className="hero__sub">{detail?.tagline || solution.summary}</p>
        </div>
      </section>

      {/* switch between the solutions without going back to the overview */}
      <nav className="sol-nav sol-nav--static" aria-label={t("automationSolution.navLabel")}>
        <div className="container sol-nav__inner" ref={tabsRef}>
          {solutions.map((s) => (
            <Link
              key={s.slug}
              to={`${SOLUTIONS_URL}/${s.slug}`}
              className={`sol-nav__chip${s.slug === slug ? " is-active" : ""}`}
              aria-current={s.slug === slug ? "page" : undefined}
            >
              {s.name}
            </Link>
          ))}
        </div>
      </nav>

      {detail && (
        <>
          <section className="section sol-scope">
            <div className="container sol-scope__grid">
              {/* status panel: one lamp per service, lit for the one on screen */}
              <aside className="sol-panel">
                <p className="sol-panel__title">{t("automationSolution.detailServices")}</p>
                <ol className="sol-panel__list">
                  {services.map((svc, i) => (
                    <li key={svc.title}>
                      <Link
                        to={`#svc-${i}`}
                        className={`sol-panel__row${i === active ? " is-on" : ""}`}
                        aria-current={i === active ? "true" : undefined}
                      >
                        <span className="sol-panel__lamp" aria-hidden="true" />
                        {svc.title}
                      </Link>
                    </li>
                  ))}
                </ol>
                <Link to={discussHref(solution.name)} className="btn btn-primary sol-panel__cta">
                  {t("automationSolution.discuss")}
                </Link>
              </aside>

              <div className="sol-scope__body">
                {services.map((svc, i) => (
                  <article className="sol-svc" id={`svc-${i}`} key={svc.title}>
                    <header className="sol-svc__head">
                      <span className="sol-svc__icon">
                        <Icon name={svc.icon} />
                      </span>
                      <h3>{svc.title}</h3>
                    </header>
                    <ul className={`sol-svc__list${svc.items.length > 3 ? " sol-svc__list--2col" : ""}`}>
                      {svc.items.map((item) => (
                        <li key={item}>
                          <span className="sol-svc__tick" aria-hidden="true">
                            <ContactIcon name="check" size={14} />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="section sol-gains">
            <div className="container">
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
            <Link to={SOLUTIONS_URL} className="btn">
              {t("automationSolution.heroTitle")}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
