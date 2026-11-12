import { useEffect, useState } from "react";
import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../api/client.js";
import HeroBgMedia from "../components/HeroBgMedia.jsx";
import BrandLogoGrid from "../components/BrandLogoGrid.jsx";

export const BRANDS = ["OMRON", "YASKAWA", "NITTO"];

// A stat's unit/suffix attaches directly to symbols ("30+"), but gets a
// space when it's a word ("30 years").
export const unitSep = (unit) => (/^\p{L}/u.test(unit) ? " " : "");

// Partners & Brands: the BRANDS from Admin > Brands (for their logos), in
// BRANDS order. A brand missing from the DB still shows as its name.
export function PartnerBrands({ brands }) {
  const items = BRANDS.map(
    (name) =>
      (brands || []).find((b) => b.name?.trim().toUpperCase() === name) || {
        slug: name.toLowerCase(),
        name,
        logo_url: null,
      }
  );
  return <BrandLogoGrid brands={items} getHref={(b) => `/products/${b.slug}`} />;
}

export default function History() {
  const { t, lang } = useLanguage();
  const [aboutContent, setAboutContent] = useState(null);
  // Timeline / statistics / organization chart come from the database
  // (Admin → History). The built-in translations below are only a safety
  // net for when that request fails, so the page never renders empty.
  const [historyContent, setHistoryContent] = useState(null);
  const [historyFailed, setHistoryFailed] = useState(false);
  const [brands, setBrands] = useState(null);

  useEffect(() => {
    api
      .getBrands()
      .then(setBrands)
      .catch(() => setBrands(null));
    api
      .getAboutContent()
      .then(setAboutContent)
      .catch(() => setAboutContent(null));
    api
      .getHistoryContent()
      .then(setHistoryContent)
      .catch(() => setHistoryFailed(true));
  }, []);

  // `${base}_${lang}` with English as the fallback for a blank translation.
  const pick = (row, base) => row[`${base}_${lang}`] || row[`${base}_en`] || "";

  let timeline = [];
  let stats = [];
  if (historyContent) {
    timeline = historyContent.timeline.map((m) => ({
      id: m.id,
      year: pick(m, "year"),
      title: pick(m, "title"),
      body: pick(m, "description"),
      image: m.image_url,
    }));
    stats = historyContent.stats.map((s) => ({
      id: s.id,
      num: s.value,
      unit: pick(s, "unit"),
      label: pick(s, "label"),
    }));
  } else if (historyFailed) {
    timeline = t("history.milestones").map((m) => ({ id: m.title, ...m, body: m.body, image: null }));
    stats = t("history.stats").map((s) => ({ id: s.label, num: s.num, unit: "", label: s.label }));
  }

  // Reads `${field}_${lang}` from the admin-editable about_content
  // row, falling back to the built-in translation if the DB row
  // isn't loaded yet (or hasn't been edited from its default).
  const ac = (field, fallback) => {
    if (!aboutContent) return fallback;
    const value = aboutContent[`${field}_${lang}`];
    return value || fallback;
  };

  const heroBgImage = aboutContent?.hero_bg_image || "";

  return (
    <>
      <section className={`hero hero--compact hero--centered${heroBgImage ? " hero--has-bg" : ""}`}>
        {heroBgImage && (
          <>
            <HeroBgMedia src={heroBgImage} />
            <div className="hero__bg-scrim" aria-hidden="true" />
          </>
        )}
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{ac("hero_meta", t("history.heroMeta"))}</span>
          <h1>{ac("hero_title", t("history.heroTitle"))}</h1>
          <p className="hero__sub">{ac("hero_sub", t("history.heroSub"))}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel
            eyebrow={ac("intro_eyebrow", t("history.introEyebrow"))}
            title={ac("intro_title", t("history.introTitle"))}
            lede={ac("intro_lede", t("history.introLede"))}
          />
          <p className="lede" style={{ maxWidth: "62ch" }}>
            {ac("intro_body", t("history.introBody"))}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel eyebrow={t("history.timelineEyebrow")} title={t("history.timelineTitle")} />
          <div className="timeline">
            {timeline.map((m) => (
              <div className="timeline__item" key={m.id}>
                <span className="timeline__year">{m.year}</span>
                <h3>{m.title}</h3>
                {m.body && <p>{m.body}</p>}
                {m.image && <img className="timeline__image" src={m.image} alt="" loading="lazy" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel eyebrow={t("history.statsEyebrow")} title={t("history.statsTitle")} />
          <div className="stat-row">
            {stats.map((s) => (
              <div className="stat-cell" key={s.id}>
                <span className="stat-cell__num">
                  {s.num}
                  {s.unit ? unitSep(s.unit) + s.unit : ""}
                </span>
                <span className="stat-cell__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel
            eyebrow={t("history.experienceEyebrow")}
            title={t("history.experienceTitle")}
            lede={t("history.experienceLede")}
          />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel eyebrow={t("history.partnersEyebrow")} title={t("history.partnersTitle")} />
          <PartnerBrands brands={brands} />
        </div>
      </section>
    </>
  );
}
