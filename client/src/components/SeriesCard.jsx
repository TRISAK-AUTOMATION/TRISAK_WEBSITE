import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { seriesHref, tk, tx } from "../utils/guide.js";

/** Picture of a series, or a quiet brand plate when it has none yet. */
export function SeriesVisual({ series, className = "" }) {
  return (
    <div className={`series-visual ${className}`}>
      {series.image_url ? (
        <img src={series.image_url} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="series-visual__plate" aria-hidden="true">
          <small>{series.brand}</small>
          <b>{series.name}</b>
        </span>
      )}
    </div>
  );
}

/** One series in the guide: picture, brand, name, tagline and up to three key figures. */
export default function SeriesCard({ series }) {
  const { t, lang } = useLanguage();
  const specs = (series.key_specs || []).slice(0, 3);
  return (
    <Link to={seriesHref(series)} className={`series-card${series.is_legacy ? " is-legacy" : ""}`}>
      <SeriesVisual series={series} className="series-card__visual" />
      <div className="series-card__body">
        <div className="series-card__meta">
          {series.brand_logo ? (
            <img className="series-card__brand-logo" src={series.brand_logo} alt={series.brand} />
          ) : (
            <span className="series-card__brand">{series.brand}</span>
          )}
          {series.is_new && <span className="series-badge series-badge--new">{t("guide.newBadge")}</span>}
          {series.is_legacy && <span className="series-badge">{t("guide.legacy")}</span>}
        </div>
        <h3 className="series-card__name">{series.name}</h3>
        {tx(series, "tagline", lang) && <p className="series-card__tagline">{tx(series, "tagline", lang)}</p>}
        {specs.length > 0 && (
          <dl className="series-card__specs">
            {specs.map((k, i) => (
              <div key={i}>
                <dt>{tk(k, "label", lang)}</dt>
                <dd>{k.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <span className="series-card__cta">
          {t("guide.viewSeries")} <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
