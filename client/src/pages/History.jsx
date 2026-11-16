import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionLabel from "../components/SectionLabel.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../api/client.js";
import WhyTrisak, { Icon as StatIcon, localizeIconList } from "../components/WhyTrisak.jsx";

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

// The authorized brands as a compact row of logos (intro facts); a brand
// without a logo in Admin > Brands shows as its name.
function BrandLogoRow({ brands }) {
  return (
    <span className="brand-logo-row">
      {brandRows(brands).map((b) => (
        <Link key={b.slug} to={`/products/${b.slug}`} className="brand-logo-row__item" title={b.name}>
          {b.logo_url ? (
            <img src={b.logo_url} alt={b.name} loading="lazy" />
          ) : (
            <span className="brand-logo-row__name">{b.name}</span>
          )}
        </Link>
      ))}
    </span>
  );
}

// Three equal cells, logos normalised to one optical height (see .partner-logos).
export function PartnerBrands({ brands }) {
  return (
    <ul className="partner-logos">
      {brandRows(brands).map((b) => (
        <li key={b.slug}>
          <Link to={`/products/${b.slug}`} className="partner-logos__cell" title={b.name}>
            {b.logo_url ? (
              <img className="partner-logos__img" src={b.logo_url} alt={b.name} loading="lazy" />
            ) : (
              <span className="partner-logos__name">{b.name}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
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

// Organization chart (Admin > History > Organization): a node, then its
// children joined by one bracket line, recursively.
function OrgNode({ node, root = false }) {
  return (
    <li className="org-tree__item">
      <div className={`org-tree__node${root ? " org-tree__node--root" : ""}`}>
        {node.image && <img className="org-tree__img" src={node.image} alt="" loading="lazy" />}
        <span className="org-tree__name">{node.name}</span>
        {node.person && <span className="org-tree__person">{node.person}</span>}
      </div>
      {node.children.length > 0 && (
        <ul className="org-tree__children">
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrgChart({ roots }) {
  return (
    <ul className="org-tree">
      {roots.map((node) => (
        <OrgNode key={node.id} node={node} root />
      ))}
    </ul>
  );
}

// The photo card: an uploaded photo replaces the built-in one (CSS), with the
// same navy toning.
const expPhotoStyle = (photo) =>
  photo
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(11, 22, 64, 0) 55%, rgba(11, 22, 64, 0.32) 100%), url("${photo.replace(/["\\]/g, "")}")`,
      }
    : undefined;

// Default icon per statistic card by position (customers, projects,
// experience) when the statistic has none set in Admin > History.
export const STAT_ICONS = ["gear", "handshake", "team"];
export const statIcon = (s, i) => s.icon || STAT_ICONS[i % STAT_ICONS.length];

/**
 * "Our Experience": heading + lede on the left with the statistics as
 * icon cards, the photo as a framed card on the right over blue geometric
 * shapes. Children (Partners & Brands) get their own white band underneath.
 * `renderStat` / `renderIcon` let Admin > History swap a card's number +
 * label and its icon for edit controls (the card and accent bar stay).
 */
export function ExperienceBanner({ eyebrow, title, lede, stats, children, photo, renderStat, renderIcon }) {
  return (
    <section className="exp-banner">
      <div className="exp-banner__shapes" aria-hidden="true" />
      <div className="container exp-banner__inner">
        <div className="exp-banner__text">
          <span className="exp-banner__eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          {lede && <p className="exp-banner__lede">{lede}</p>}
          {stats.length > 0 && (
            <div className="exp-banner__stats" style={{ "--n": stats.length }}>
              {stats.map((s, i) => (
                <div className="exp-banner__stat" key={s.id}>
                  {renderIcon ? (
                    renderIcon(s, i)
                  ) : (
                    <span className="exp-banner__stat-icon" aria-hidden="true">
                      <StatIcon name={statIcon(s, i)} />
                    </span>
                  )}
                  {renderStat ? (
                    renderStat(s)
                  ) : (
                    <>
                      <span className="exp-banner__num">
                        {s.num}
                        {s.unit ? unitSep(s.unit) + s.unit : ""}
                      </span>
                      <span className="exp-banner__label">{s.label}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="exp-banner__media" aria-hidden="true">
          <div className="exp-banner__dots" />
          <div className="exp-banner__frame">
            <div className="exp-banner__photo" style={expPhotoStyle(photo)} />
          </div>
        </div>
      </div>
      {children && (
        <div className="exp-banner__after">
          <div className="container exp-partners">{children}</div>
        </div>
      )}
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
  let orgRoots = [];
  if (historyContent) {
    const toNode = (n) => ({
      id: n.id,
      name: pick(n, "name"),
      person: pick(n, "person"),
      image: n.image_url,
      children: (n.children || []).map(toNode),
    });
    orgRoots = (historyContent.org || []).map(toNode);
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
      icon: s.icon,
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

  // Founding year = the earliest numeric year on the timeline (e.g. 1978);
  // the intro facts only show when the timeline actually has one.
  const firstYear = Math.min(...timeline.map((m) => yearNum(m.year)));
  const founded = Number.isFinite(firstYear) && firstYear > 1800 ? firstYear : null;
  const yearsActive = founded ? new Date().getFullYear() - founded : null;

  return (
    <>
      <section className="intro">
        <img className="intro__bg" src={aboutContent?.intro_image || INTRO_IMAGE_DEFAULT} alt="" />
        <div className="container intro__text">
          <h1>{ac("intro_title", t("history.introTitle"))}</h1>
          <p className="intro__lede">{ac("intro_lede", t("history.introLede"))}</p>
          <p className="intro__body">{ac("intro_body", t("history.introBody"))}</p>
          {founded && (
            <dl className="intro__facts">
              <div>
                <dt>{t("history.factSince")}</dt>
                <dd>{founded}</dd>
              </div>
              <div>
                <dt>{t("history.factYears")}</dt>
                <dd>{yearsActive}</dd>
              </div>
              <div>
                <dt>{t("history.factAuthorized")}</dt>
                <dd className="intro__facts-brands">
                  <BrandLogoRow brands={brands} />
                </dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      <section className="section history-section">
        <div className="container">
          <SectionLabel title={t("history.timelineTitle")} />
          <BrandLanesTimeline items={timeline} brands={brands} />
        </div>
      </section>

      {orgRoots.length > 0 && (
        <section className="section history-section history-org">
          <div className="container">
            <SectionLabel title={t("history.structureTitle")} />
            <OrgChart roots={orgRoots} />
          </div>
        </section>
      )}

      <WhyTrisak
        title={ac("why_title", t("history.whyTitle"))}
        lede={ac("why_lede", t("history.whyLede"))}
        reasons={localizeIconList(aboutContent?.why_reasons, lang, t("history.whyReasons"))}
        processTitle={ac("why_process_title", t("history.whyProcessTitle"))}
        steps={localizeIconList(aboutContent?.why_steps, lang, t("history.whySteps"))}
        bgImage={aboutContent?.why_bg_image}
      />

      <ExperienceBanner
        eyebrow={ac("exp_eyebrow", t("history.experienceEyebrow"))}
        title={ac("exp_title", t("history.experienceTitle"))}
        lede={ac("exp_lede", t("history.experienceLede"))}
        stats={stats}
        photo={aboutContent?.exp_image}
      >
        <SectionLabel
          eyebrow={ac("partners_eyebrow", t("history.partnersEyebrow"))}
          title={ac("partners_title", t("history.partnersTitle"))}
        />
        <PartnerBrands brands={brands} />
      </ExperienceBanner>

      <section className="cta-band history-cta">
        <div className="container cta-band__wrap">
          <h2>{t("history.ctaTitle")}</h2>
          <p className="history-cta__sub">{t("history.ctaSub")}</p>
          <div className="history-cta__actions">
            <Link to="/contacts" className="btn btn-primary">
              {t("common.contactUs")} <span className="btn-arrow">→</span>
            </Link>
            <Link to="/products" className="btn">
              {t("common.viewProducts")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
