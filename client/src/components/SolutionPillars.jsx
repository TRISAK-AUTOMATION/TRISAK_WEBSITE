import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { translations } from "../i18n/translations.js";
import FeatureIcon from "./featureIcons.jsx";

const pick = (lang, en, th) => (lang === "th" ? th || en : en) || "";
const isInternal = (url) => typeof url === "string" && url.startsWith("/");

/**
 * One Automation Solutions card. Used by the Home page (a link) and by the
 * admin's live preview (`preview` → a plain block, so nothing navigates).
 *
 * `pillar` is the API shape: { number, title, titleTh, description,
 * descriptionTh, features: [{ label, labelTh, icon }], imageUrl, imageAlt,
 * imageAltTh, linkUrl }.
 */
export function PillarCard({ pillar, index = 0, lang = "en", preview = false }) {
  const number = pillar.number || String(index + 1).padStart(2, "0");
  const alt = pick(lang, pillar.imageAlt, pillar.imageAltTh);
  const features = pillar.features || [];

  const inner = (
    <div className="pillar-card__inner">
      <div className="pillar-card__body">
        <span className="pillar-card__num">{number}</span>
        <h3>{pick(lang, pillar.title, pillar.titleTh)}</h3>
        <p>{pick(lang, pillar.description, pillar.descriptionTh)}</p>
        {features.length > 0 && (
          <ul className="pillar-card__features">
            {features.map((f, i) => (
              <li key={i}>
                <span className="pillar-card__icon">
                  <FeatureIcon icon={f.icon} />
                </span>
                <span className="pillar-card__label">{pick(lang, f.label, f.labelTh)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {pillar.imageUrl && (
        <div className="pillar-card__media">
          <img
            src={pillar.imageUrl}
            alt={alt}
            loading={preview ? "eager" : "lazy"}
            decoding="async"
            style={{ objectPosition: `${pillar.imagePositionX ?? 50}% ${pillar.imagePositionY ?? 50}%` }}
          />
        </div>
      )}
    </div>
  );

  if (preview) return <div className="pillar-card pillar-card--preview">{inner}</div>;
  if (isInternal(pillar.linkUrl)) {
    return (
      <Link to={pillar.linkUrl} className="pillar-card">
        {inner}
      </Link>
    );
  }
  return (
    <a href={pillar.linkUrl} className="pillar-card" rel="noopener">
      {inner}
    </a>
  );
}

// Only used when the cards cannot be loaded from the API at all (server
// down / table missing), so the section never goes blank. Same content and
// pictures as the seeded database rows; the database is the source of truth.
const FALLBACK_ASSETS = [
  { image: "/images/solutions/hmi-plc.webp", icons: ["monitor", "chip", "dashboard"] },
  { image: "/images/solutions/drive-motion.webp", icons: ["servo-drive", "servo-motor", "motion"] },
  { image: "/images/solutions/robotics.webp", icons: ["robot-arm", "cobot", "gear"] },
  { image: "/images/solutions/smart-factory.webp", icons: ["cloud", "database", "network-nodes"] },
];

function buildFallbackPillars() {
  const en = translations.en.home;
  const th = translations.th.home;
  return FALLBACK_ASSETS.map((asset, i) => ({
    id: `fallback-${i}`,
    number: "",
    title: en.pillars[i],
    titleTh: th.pillars[i],
    description: en.pillarItems[i].desc,
    descriptionTh: th.pillarItems[i].desc,
    features: en.pillarItems[i].features.map((label, j) => ({
      label,
      labelTh: th.pillarItems[i].features[j],
      icon: asset.icons[j],
    })),
    imageUrl: asset.image,
    imageAlt: "",
    imageAltTh: "",
    imagePositionX: [40, 58, 38, 82][i],
    imagePositionY: 50,
    linkUrl: "/automation-solution",
  }));
}

/**
 * The Automation Solutions cards on the Home page (2 × 2 on desktop, one
 * column on mobile), straight from the admin-managed database rows.
 *
 * `pillars`: undefined while loading · null if the request failed (built-in
 * fallback) · an array of the active cards otherwise (Home hides the whole
 * section when that array is empty).
 */
export default function SolutionPillars({ pillars }) {
  const { lang } = useLanguage();

  if (pillars === undefined) return <div className="pillar-grid-placeholder" aria-hidden="true" />;
  const cards = pillars === null ? buildFallbackPillars() : pillars;

  return (
    <div className="pillar-grid">
      {cards.map((pillar, i) => (
        <PillarCard key={pillar.id} pillar={pillar} index={i} lang={lang} />
      ))}
    </div>
  );
}
