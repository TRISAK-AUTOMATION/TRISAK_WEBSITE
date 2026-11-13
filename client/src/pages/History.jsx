import { useEffect, useState } from "react";
import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../api/client.js";
import BrandLogoGrid from "../components/BrandLogoGrid.jsx";
import WhyTrisak from "../components/WhyTrisak.jsx";

export const BRANDS = ["OMRON", "YASKAWA", "NITTO"];

// Company Introduction photo when none is uploaded in Admin > History.
export const INTRO_IMAGE_DEFAULT = "/images/solutions/smart-factory.webp";

// A stat's unit/suffix attaches directly to symbols ("30+"), but gets a
// space when it's a word ("30 years").
export const unitSep = (unit) => (/^\p{L}/u.test(unit) ? " " : "");

// Partners & Brands: the BRANDS from Admin > Brands (for their logos), in
// BRANDS order. A brand missing from the DB still shows as its name.
const brandRows = (brands) =>
  BRANDS.map(
    (name) =>
      (brands || []).find((b) => b.name?.trim().toUpperCase() === name) || {
        slug: name.toLowerCase(),
        name,
        logo_url: null,
      }
  );

export function PartnerBrands({ brands }) {
  return <BrandLogoGrid brands={brandRows(brands)} getHref={(b) => `/products/${b.slug}`} />;
}

// shortcut: an entry's brand is guessed from the BRANDS name in its title/description;
// add a brand field to Admin > Timeline if entries ever get misplaced.
const brandOf = (m) => {
  const text = `${m.title} ${m.body || ""}`.toUpperCase();
  const hits = BRANDS.filter((b) => text.includes(b));
  return hits.length === 1 ? hits[0] : null;
};

const yearNum = (y) => {
  const n = parseInt(y, 10);
  return Number.isNaN(n) ? Infinity : n;
};

function LaneEntry({ m, side }) {
  return (
    <li className={`lanes__item lanes__item--${side}`}>
      <span className="lanes__year">{m.year}</span>
      <div className="lanes__body">
        {m.brand && <span className="lanes__brand">{m.brand}</span>}
        <h3>{m.title}</h3>
        {m.body && <p>{m.body}</p>}
        {m.image && <img className="lanes__image" src={m.image} alt="" loading="lazy" />}
      </div>
    </li>
  );
}

// Company timeline on one year spine: each group company sits in the lane of
// the brand it distributes (OMRON left, YASKAWA right), companies tied to no
// single brand sit on the spine. Falls back to one lane unless exactly two
// brands appear.
export function BrandLanesTimeline({ items, brands }) {
  const entries = items
    .map((m) => ({ ...m, brand: brandOf(m) }))
    .sort((a, b) => yearNum(a.year) - yearNum(b.year));
  const laneNames = BRANDS.filter((b) => entries.some((m) => m.brand === b));
  const twoLanes = laneNames.length === 2;
  const sideOf = (m) => (!m.brand ? "center" : m.brand === laneNames[0] ? "left" : "right");
  const firstBranded = entries.findIndex((m) => m.brand);
  const head = firstBranded === -1 ? entries : entries.slice(0, firstBranded);
  const rest = firstBranded === -1 ? [] : entries.slice(firstBranded);
  const logos = brandRows(brands);

  return (
    <div className={`lanes${twoLanes ? "" : " lanes--single"}`}>
      {head.length > 0 && (
        <ol className="lanes__list">
          {head.map((m) => (
            <LaneEntry key={m.id} m={m} side="center" />
          ))}
        </ol>
      )}
      {twoLanes && (
        <div className="lanes__heads" aria-hidden="true">
          {laneNames.map((name) => {
            const b = logos.find((l) => l.name.trim().toUpperCase() === name);
            return (
              <span className="lanes__head" key={name}>
                {b?.logo_url ? <img src={b.logo_url} alt="" /> : name}
              </span>
            );
          })}
        </div>
      )}
      {rest.length > 0 && (
        <ol className="lanes__list">
          {rest.map((m) => (
            <LaneEntry key={m.id} m={m} side={twoLanes ? sideOf(m) : "center"} />
          ))}
        </ol>
      )}
    </div>
  );
}

// "Our Experience" full-bleed banner: text + statistics row, then whatever
// is passed as children (Partners & Brands) inside the same background.
export function ExperienceBanner({ eyebrow, title, lede, stats, children }) {
  return (
    <section className="exp-banner">
      <div className="exp-banner__dots" aria-hidden="true" />
      <div className="exp-banner__photo" aria-hidden="true" />
      <div className="exp-banner__edge" aria-hidden="true" />
      <div className="container exp-banner__inner">
        <div className="exp-banner__text">
          <span className="exp-banner__eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          {lede && <p>{lede}</p>}
          {stats.length > 0 && (
          <div className="exp-banner__stats">
            {stats.map((s) => (
              <div className="exp-banner__stat" key={s.id}>
                <span className="exp-banner__num">
                  {s.num}
                  {s.unit ? unitSep(s.unit) + s.unit : ""}
                </span>
                <span className="exp-banner__label">{s.label}</span>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
      {children && <div className="container exp-banner__after">{children}</div>}
    </section>
  );
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


  return (
    <>
      <section className="intro">
        <img className="intro__bg" src={aboutContent?.intro_image || INTRO_IMAGE_DEFAULT} alt="" />
        <div className="container intro__text">
          <h1>{ac("intro_title", t("history.introTitle"))}</h1>
          <p className="intro__lede">{ac("intro_lede", t("history.introLede"))}</p>
          <p className="intro__body">{ac("intro_body", t("history.introBody"))}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel title={t("history.timelineTitle")} />
          <BrandLanesTimeline items={timeline} brands={brands} />
        </div>
      </section>

      <WhyTrisak
        title={t("history.whyTitle")}
        lede={t("history.whyLede")}
        reasons={t("history.whyReasons")}
        processTitle={t("history.whyProcessTitle")}
        steps={t("history.whySteps")}
      />

      <ExperienceBanner
        eyebrow={t("history.experienceEyebrow")}
        title={t("history.experienceTitle")}
        lede={t("history.experienceLede")}
        stats={stats}
      >
        <SectionLabel eyebrow={t("history.partnersEyebrow")} title={t("history.partnersTitle")} />
        <PartnerBrands brands={brands} />
      </ExperienceBanner>
    </>
  );
}
