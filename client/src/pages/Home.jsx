import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import SectionLabel from "../components/SectionLabel.jsx";
import SignalLine from "../components/SignalLine.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const BRANDS = ["OMRON", "YASKAWA", "NITTO"];

export default function Home() {
  const { t, lang } = useLanguage();
  const [industries, setIndustries] = useState(null);
  const [homeContent, setHomeContent] = useState(null);
  const [brands, setBrands] = useState(null);

  useEffect(() => {
    api
      .getIndustries()
      .then((data) => setIndustries(data?.length ? data : null))
      .catch(() => setIndustries(null));
    api
      .getHomeContent()
      .then(setHomeContent)
      .catch(() => setHomeContent(null));
    api
      .getBrands()
      .then((data) => setBrands(data?.length ? data : null))
      .catch(() => setBrands(null));
  }, []);

  // Reads `${field}_${lang}` from the admin-editable home_content row,
  // falling back to the built-in translation if the DB row isn't
  // loaded yet (or hasn't been edited from its seeded default).
  const hc = (field, fallback) => {
    if (!homeContent) return fallback;
    const value = homeContent[`${field}_${lang}`];
    return value || fallback;
  };

  const strengthsFallback = t("home.strengths");
  const strengths = strengthsFallback.map((s, i) => ({
    title: hc(`strength${i + 1}_title`, s.title),
    body: hc(`strength${i + 1}_body`, s.body),
  }));
  const pillars = t("home.pillars");
  const productTags = t("home.productTags");
  const fallbackIndustries = t("industries");

  const heroBgImage = homeContent?.hero_bg_image || "";

  return (
    <>
      {/* 01 — HERO */}
      <section className={`hero ${heroBgImage ? "hero--has-bg" : ""}`}>
        {heroBgImage && (
          <>
            <div
              className="hero__bg-image"
              style={{ backgroundImage: `url(${heroBgImage})` }}
              aria-hidden="true"
            />
            <div className="hero__bg-scrim" aria-hidden="true" />
          </>
        )}
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{hc("hero_meta", t("home.heroMeta"))}</span>
          <h1>
            {hc("hero_title_line1", t("home.heroTitleLine1"))}
            <br />
            {hc("hero_title_line2", t("home.heroTitleLine2"))}
          </h1>
          <p className="hero__sub">{hc("hero_sub", t("home.heroSub"))}</p>
          <div className="hero__actions">
            <Link to="/products" className="btn btn-primary">
              {t("common.viewProducts")} <span className="btn-arrow">→</span>
            </Link>
            <Link to="/automation-solution" className="btn">
              {t("common.automationSolution")} <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 02 — OUR STRENGTH */}
      <section className="section strength-grid">
        <div className="container">
          <SectionLabel
            index="01"
            eyebrow={hc("strength_eyebrow", t("home.strengthEyebrow"))}
            title={hc("strength_title", t("home.strengthTitle"))}
          />
          <div className="strength-signal">
            <SignalLine nodes={3} orientation="horizontal" />
          </div>
          <div className="grid cols-3">
            {strengths.map((s, i) => (
              <div className="grid-cell strength-block" key={i}>
                <span className="strength-block__index">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 03 — PRODUCTS */}
      <section className="section">
        <div className="container">
          <SectionLabel index="02" eyebrow={t("home.productsEyebrow")} title={t("home.productsTitle")} />
          <div className="brand-strip">
            {(brands || BRANDS.map((name) => ({ id: name, name, logo_url: null }))).map((b) => (
              <span className="brand-strip__item" key={b.id}>
                {b.logo_url ? (
                  <img className="brand-strip__logo" src={b.logo_url} alt={b.name} />
                ) : (
                  <span className="brand-strip__name">{b.name}</span>
                )}
              </span>
            ))}
          </div>
          <div className="products-cta-row">
            <div className="tag-list">
              {productTags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <Link to="/products" className="btn btn-primary">
              {t("common.viewProducts")} <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 04 — AUTOMATION SOLUTIONS */}
      <section className="section">
        <div className="container">
          <SectionLabel
            index="03"
            eyebrow={t("home.solutionsEyebrow")}
            title={t("home.solutionsTitle")}
            lede={t("home.solutionsLede")}
          />
          <div className="grid cols-2">
            {pillars.map((name, i) => (
              <Link to="/automation-solution" className="grid-cell pillar-card" key={name}>
                <span className="pillar-card__num">0{i + 1}</span>
                <h3>{name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 05 — INDUSTRIES */}
      <section className="section">
        <div className="container">
          <SectionLabel index="04" eyebrow={t("home.industriesEyebrow")} title={t("home.industriesTitle")} />
          <div className="industries-grid">
            {/* the database only stores English names, so only use it for
                the English UI — Thai always uses the translated list */}
            {(lang === "en" && industries
              ? industries.map((ind) => ind.name)
              : fallbackIndustries
            ).map((name) => (
              <div className="industry-cell" key={name}>
                <span className="industry-cell__dot" />
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 06 — CTA */}
      <section className="cta-band">
        <div className="container cta-band__wrap">
          <h2>
            {hc("cta_title_line1", t("home.ctaTitleLine1"))}
            <br />
            {hc("cta_title_line2", t("home.ctaTitleLine2"))}
          </h2>
          <Link to="/contacts" className="btn btn-primary">
            {t("common.contactUs")} <span className="btn-arrow">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
