import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import SectionLabel from "../components/SectionLabel.jsx";
import Reveal from "../components/Reveal.jsx";
import { unitSep } from "./History.jsx";
import SolutionPillars from "../components/SolutionPillars.jsx";
import GroupSlider, { GroupWordmark } from "../components/GroupSlider.jsx";
import IndustriesSlider, { buildFallbackIndustries } from "../components/IndustriesSlider.jsx";
import { translations } from "../i18n/translations.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { LISTING_BASE_PATH } from "../utils/productFilterUrl.js";
import trisakLogo from "../assets/logos/trisak.png";
import faccoLogo from "../assets/logos/facco.png";
import htcLogo from "../assets/logos/htc.png";

// Company logos for the three "Our Strength" cards (same order as the cards).
// Heights are tuned per logo so all three have the same visual size (equal
// area) even though their aspect ratios differ.
const GROUP_LOGOS = [
  { src: trisakLogo, height: 45 },
  { src: faccoLogo, height: 48 },
  { src: htcLogo, height: 66 },
];


const BRANDS = ["OMRON", "YASKAWA", "NITTO"];

// The marquee loops by rendering two back-to-back copies of this list and
// animating exactly -50% — so however many logos there are, the loop is
// seamless. With very few logos that copy would look sparse (a couple of
// logos, then a big gap before they repeat), so pad it out first.
const MIN_MARQUEE_ITEMS = 8;
function padLogos(logos) {
  if (!logos.length) return logos;
  let padded = logos;
  while (padded.length < MIN_MARQUEE_ITEMS) padded = padded.concat(logos);
  return padded;
}

export default function Home() {
  const { t, lang } = useLanguage();
  const [industries, setIndustries] = useState(null);
  const [homeContent, setHomeContent] = useState(null);
  const [brands, setBrands] = useState(null);
  const [customers, setCustomers] = useState(null);
  // Automation Solutions cards: undefined = loading, null = request failed
  // (SolutionPillars shows its built-in fallback), array = the active cards.
  const [pillars, setPillars] = useState(undefined);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    api
      .getHistoryContent()
      .then((data) => setStats(Array.isArray(data?.stats) ? data.stats : []))
      .catch(() => setStats([]));
    api
      .getAutomationPillars()
      .then((data) => setPillars(Array.isArray(data) ? data : null))
      .catch(() => setPillars(null));
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
    api
      .getCustomers()
      .then((data) => setCustomers(data?.length ? data : null))
      .catch(() => setCustomers(null));
  }, []);

  // Reads `${field}_${lang}` from the admin-editable home_content row,
  // falling back to the built-in translation if the DB row isn't
  // loaded yet (or hasn't been edited from its seeded default).
  // `${base}_${lang}`, English when that translation is blank (as on History).
  const pick = (row, base) => row[`${base}_${lang}`] || row[`${base}_en`] || "";

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
  const productTags = t("home.productTags");
  const fallbackIndustries = t("industries");
  // Both languages' plain-name lists, for the one case where the API has
  // no industries at all — keeps the fallback switching languages
  // correctly too, same as real data would (see buildFallbackIndustries).
  const fallbackIndustriesBothLangs = {
    en: translations.en.industries,
    th: translations.th.industries,
  };

  const heroBgImage = homeContent?.hero_bg_image || "";
  const marqueeLogos = customers ? padLogos(customers) : [];

  return (
    <>
      {/* 01 — HERO */}
      <section className={`hero hero--home ${heroBgImage ? "hero--has-bg" : ""}`}>
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
            <span className="hero__title-accent">{hc("hero_title_line2", t("home.heroTitleLine2"))}</span>
          </h1>
          <p className="hero__sub">{hc("hero_sub", t("home.heroSub"))}</p>
          <div className="hero__actions">
            <Link to="/products" className="btn btn-primary">
              {t("common.viewProducts")} <span className="btn-arrow">→</span>
            </Link>
            <Link to="/automation-solution" className="btn btn-light">
              {t("common.automationSolution")} <span className="btn-arrow">→</span>
            </Link>
          </div>

          {/* Milestones — same data as History (Admin → History → Statistics) */}
          {stats.length > 0 && (
            <div className="hero-stats">
              <span className="hero-stats__label">{t("home.heroStatsLabel")}</span>
              <div className="hero-stats__row">
                {stats.map((s) => (
                  <div className="hero-stats__cell" key={s.id}>
                    <span className="hero-stats__num">
                      {s.value}
                      {pick(s, "unit") ? unitSep(pick(s, "unit")) + pick(s, "unit") : ""}
                    </span>
                    <span className="hero-stats__name">{pick(s, "label")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <span className="hero__scroll" aria-hidden="true">Scroll</span>
      </section>

      {/* 02 — OUR CUSTOMERS */}
      {customers && customers.length > 0 && (
        <section className="section customers-section">
          <div className="customers-marquee">
            <div
              className="customers-marquee__track"
              style={{ "--marquee-duration": `${Math.min(30, Math.max(20, marqueeLogos.length * 3))}s` }}
            >
              {[...marqueeLogos, ...marqueeLogos].map((c, i) => (
                <span className="customers-marquee__item" key={`${c.id}-${i}`}>
                  <img src={c.image_url} alt="" className="customers-marquee__logo" loading="lazy" />
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 02 — OUR STRENGTH */}
      <section className="section strength-grid group-section">
        <Reveal className="container">
          <SectionLabel
            eyebrow={hc("strength_eyebrow", t("home.strengthEyebrow"))}
            title={<GroupWordmark />}
          />
          <GroupSlider
            ariaLabel="TRISAK GROUP"
            certificatePlaceholder={lang === "th" ? "รูปใบ Certificate" : "Certificate"}
            slides={strengths.map((s, i) => ({
              ...s,
              logo: GROUP_LOGOS[i]?.src,
              logoHeight: GROUP_LOGOS[i]?.height,
              certificate: homeContent?.[`strength${i + 1}_cert_image`] || null,
            }))}
          />
        </Reveal>
      </section>

      {/* 03 — PRODUCTS */}
      <section className="section">
        <Reveal className="container">
          <SectionLabel eyebrow={t("home.productsEyebrow")} title={t("home.productsTitle")} />
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
                <Link
                  className="tag tag--link"
                  key={tag}
                  to={`${LISTING_BASE_PATH}?q=${encodeURIComponent(tag)}`}
                >
                  {tag}
                </Link>
              ))}
            </div>
            <Link to="/products" className="btn btn-primary">
              {t("common.viewProducts")} <span className="btn-arrow">→</span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* 04 — AUTOMATION SOLUTIONS */}
      {/* hidden only when an admin has disabled every card */}
      {!(Array.isArray(pillars) && pillars.length === 0) && (
        <section className="section solutions-section">
          <Reveal className="container">
            <SectionLabel
              eyebrow={t("home.solutionsEyebrow")}
              title={t("home.solutionsTitle")}
              lede={t("home.solutionsLede")}
            />
            <SolutionPillars pillars={pillars} />
          </Reveal>
        </section>
      )}

      {/* 05 — INDUSTRIES */}
      <section className="section industries-section">
        <Reveal className="container">
          <SectionLabel eyebrow={t("home.industriesEyebrow")} title={t("home.industriesTitle")} />
          <IndustriesSlider
            industries={
              // each slide now carries both languages (name/nameTh,
              // description/descriptionTh) from a single fetch — the
              // slider itself picks the right one via `lang` and falls
              // back to English, so switching languages needs no refetch.
              // The fallback list only kicks in if the API returned
              // nothing at all (e.g. a request failure).
              industries && industries.length
                ? industries
                : buildFallbackIndustries(fallbackIndustriesBothLangs.en, fallbackIndustriesBothLangs.th)
            }
            exploreLabel={t("exploreMore")}
            lang={lang}
          />
        </Reveal>
      </section>

      {/* 06 — CTA */}
      <section className="cta-band">
        <Reveal className="container cta-band__wrap">
          <h2>
            {hc("cta_title_line1", t("home.ctaTitleLine1"))}
            <br />
            {hc("cta_title_line2", t("home.ctaTitleLine2"))}
          </h2>
          <Link to="/contacts" className="btn btn-primary">
            {t("common.contactUs")} <span className="btn-arrow">→</span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
