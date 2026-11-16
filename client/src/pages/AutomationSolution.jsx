import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../api/client.js";
import HeroBgMedia from "../components/HeroBgMedia.jsx";
import Reveal from "../components/Reveal.jsx";
import ContactIcon from "../components/contactIcons.jsx";
import { Icon as StepIcon } from "../components/WhyTrisak.jsx";
import IndustriesSlider from "../components/IndustriesSlider.jsx";

// One icon per engineering-process step, in order (same set as History's
// "How we work").
export const STEP_ICONS = ["consult", "design", "box", "wrench", "check", "headset"];

/**
 * Engineering-process steps: the admin-edited list (process_steps JSON) when
 * there is one, otherwise the built-in steps. Each language falls back to the
 * other, so a step translated only once still shows.
 */
export function parseProcessSteps(text) {
  try {
    const list = JSON.parse(text || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Contact page link that pre-selects "Automation Solution" and names the
// solution in the message (read by ContactForm), landing on the form.
const discussHref = (name) =>
  `/contacts?interest=automation_solution&topic=${encodeURIComponent(name)}#quote`;

const isInternal = (url) => url.startsWith("/") && !url.startsWith("//");

export default function AutomationSolution() {
  const { t, lang } = useLanguage();
  const staticSolutions = t("automationSolution.solutions");
  const builtInProcess = t("automationSolution.process");

  const [heroContent, setHeroContent] = useState(null);
  const [dbSolutions, setDbSolutions] = useState(null);
  const [industries, setIndustries] = useState(null);
  const [brokenImages, setBrokenImages] = useState({});
  const [active, setActive] = useState("");

  useEffect(() => {
    api
      .getAutomationSolutionContent()
      .then(setHeroContent)
      .catch(() => setHeroContent(null));
    api
      .getSolutions()
      .then((rows) => setDbSolutions(rows && rows.length ? rows : null))
      .catch(() => setDbSolutions(null));
    api
      .getIndustries()
      .then((rows) => setIndustries(rows && rows.length ? rows : null))
      .catch(() => setIndustries(null));
  }, []);

  // Reads `${field}_${lang}` from the admin-editable
  // automation_solution_page_content row, falling back to the
  // built-in translation if the DB row isn't loaded yet (or unedited).
  const hc = (field, fallback) => {
    if (!heroContent) return fallback;
    const value = heroContent[`${field}_${lang}`];
    return value || fallback;
  };

  // Existing blocks retain their canonical content. When Thai content has
  // been entered in the admin editor, use it for the Thai public view and
  // gracefully fall back to canonical content for legacy blocks.
  const solutions = dbSolutions || staticSolutions;
  const other = lang === "th" ? "en" : "th";
  const dbSteps = parseProcessSteps(heroContent?.process_steps);
  const process = dbSteps.length
    ? dbSteps.map((step) => ({
        icon: step.icon,
        label: step[`label_${lang}`] || step[`label_${other}`] || "",
        desc: step[`desc_${lang}`] || step[`desc_${other}`] || "",
      }))
    : builtInProcess.map((step, i) => ({ ...step, icon: STEP_ICONS[i] }));
  const heroBgImage = heroContent?.hero_bg_image || "";
  // An empty Thai list ([]) also falls back to the English one.
  const solutionText = (solution, field) => {
    if (lang !== "th") return solution[field];
    const thValue = solution[`${field}_th`];
    return (Array.isArray(thValue) ? thValue.length > 0 : thValue) ? thValue : solution[field];
  };

  // Highlight the jump-nav chip of the solution currently mid-screen.
  const slugs = solutions.map((s) => s.slug).join("|");
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    slugs.split("|").forEach((slug) => {
      const el = document.getElementById(slug);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [slugs]);

  // Reading progress through the solutions list, drawn as a line along the
  // bottom of the jump nav (CSS reads --p, 0–1). One rAF per scroll frame.
  const navRef = useRef(null);
  useEffect(() => {
    const list = document.querySelector(".sol-list");
    const nav = navRef.current;
    if (!list || !nav) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = list.getBoundingClientRect();
      const span = r.height - window.innerHeight * 0.5;
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.5 - r.top) / Math.max(1, span)));
      nav.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [slugs]);

  // On narrow screens the chip row scrolls sideways: keep the active chip in view.
  useEffect(() => {
    const chip = active && document.querySelector(`.sol-nav__chip[href="#${CSS.escape(active)}"]`);
    const row = chip?.parentElement;
    if (!row || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  const jumpTo = (e, slug) => {
    const el = document.getElementById(slug);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${slug}`);
  };

  return (
    <>
      <section className={`hero hero--compact hero--centered hero--parallax ${heroBgImage ? "hero--has-bg" : ""}`}>
        {heroBgImage && (
          <>
            <HeroBgMedia src={heroBgImage} />
            <div className="hero__bg-scrim" aria-hidden="true" />
          </>
        )}
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{hc("hero_meta", t("automationSolution.heroMeta"))}</span>
          <h1>{hc("hero_title", t("automationSolution.heroTitle"))}</h1>
          <p className="hero__sub">{hc("hero_sub", t("automationSolution.heroSub"))}</p>
        </div>
      </section>

      <nav className="sol-nav" ref={navRef} aria-label={t("automationSolution.navLabel")}>
        <span className="sol-nav__progress" aria-hidden="true" />
        <div className="container sol-nav__inner">
          {solutions.map((s) => (
            <a
              key={s.slug}
              href={`#${s.slug}`}
              className={`sol-nav__chip ${active === s.slug ? "is-active" : ""}`}
              aria-current={active === s.slug ? "location" : undefined}
              onClick={(e) => jumpTo(e, s.slug)}
            >
              {solutionText(s, "name")}
            </a>
          ))}
        </div>
      </nav>

      <section className="section sol-list">
        <div className="container">
          {solutions.map((s, i) => {
            const name = solutionText(s, "name");
            const relatedLabel = (lang === "th" && s.related_label_th) || s.related_label || t("automationSolution.relatedProducts");
            return (
              <Reveal as="article" className={`solution-block ${i % 2 ? "solution-block--flip" : ""}`} key={s.slug} id={s.slug}>
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
                      onError={() => setBrokenImages((prev) => ({ ...prev, [s.slug]: true }))}
                    />
                  ) : (
                    <span className="solution-block__glyph">{name.charAt(0)}</span>
                  )}
                </div>
                <div className="solution-block__content">
                  <h2>{name}</h2>
                  <p className="solution-block__summary">{solutionText(s, "summary")}</p>

                  <div className="solution-block__lists">
                    <div>
                      <h3 className="solution-block__list-title">{t("automationSolution.servicesLabel")}</h3>
                      <ul className="solution-block__services">
                        {(solutionText(s, "services") || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="solution-block__benefits">
                      <h3 className="solution-block__list-title">{t("automationSolution.benefitsLabel")}</h3>
                      <ul>
                        {(solutionText(s, "benefits") || []).map((item, bi) => (
                          <li key={item} style={{ "--i": bi }}>
                            <span className="solution-block__tick" aria-hidden="true">
                              <ContactIcon name="check" size={14} />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="solution-block__actions">
                    <Link to={discussHref(name)} className="btn btn-primary">
                      {t("automationSolution.discuss")} <span className="btn-arrow">→</span>
                    </Link>
                    {s.related_url &&
                      (isInternal(s.related_url) ? (
                        <Link to={s.related_url} className="solution-block__link">
                          {relatedLabel}
                          <ContactIcon name="arrow" size={16} />
                        </Link>
                      ) : (
                        <a href={s.related_url} className="solution-block__link" target="_blank" rel="noopener noreferrer">
                          {relatedLabel}
                          <ContactIcon name="external" size={16} />
                        </a>
                      ))}
                    {s.brochure_url && (
                      <a href={s.brochure_url} className="solution-block__link" target="_blank" rel="noopener noreferrer">
                        <ContactIcon name="download" size={16} />
                        {t("automationSolution.brochure")}
                      </a>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Signature section — Our Engineering Process */}
      <section className="section sol-process">
        <Reveal className="container">
          <SectionLabel
            title={hc("process_title", t("automationSolution.processTitle"))}
            lede={hc("process_lede", t("automationSolution.processLede"))}
          />
          <ol className="sol-steps" style={{ "--n": process.length }}>
            {process.map((step, i) => (
              <li className="sol-step" key={i} style={{ "--i": i }}>
                <span className="sol-step__ring">
                  <StepIcon name={step.icon || "check"} />
                </span>
                <span className="sol-step__num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="sol-step__label">{step.label}</h3>
                <p className="sol-step__desc">{step.desc}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {industries && (
        <section className="section industries-section sol-industries">
          <Reveal className="container">
            <SectionLabel title={t("automationSolution.industriesTitle")} lede={t("automationSolution.industriesLede")} />
            <IndustriesSlider industries={industries} exploreLabel={t("exploreMore")} lang={lang} />
          </Reveal>
        </section>
      )}

      <section className="cta-band history-cta">
        <Reveal className="container cta-band__wrap">
          <h2>{t("automationSolution.ctaTitle")}</h2>
          <p className="history-cta__sub">{t("automationSolution.ctaSub")}</p>
          <div className="history-cta__actions">
            <Link to={discussHref(t("automationSolution.heroTitle"))} className="btn btn-primary">
              {t("common.contactUs")} <span className="btn-arrow">→</span>
            </Link>
            <Link to="/products" className="btn">
              {t("common.viewProducts")}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
