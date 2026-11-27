import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Reveal from "../../components/Reveal.jsx";
import SeriesCard, { SeriesVisual } from "../../components/SeriesCard.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { GUIDE_BASE, fill, seriesHref, tk, tx, typeHref } from "../../utils/guide.js";
import { productHref } from "../../utils/productAvailability.js";
import Pagination from "../../components/Pagination.jsx";

const MODELS_PER_PAGE = 10;

/**
 * One series in the products guide: overview, key figures, highlights with
 * pictures, specifications, applications, catalog and related series.
 *   /products/series/:typeSlug/:seriesSlug
 */
export default function SeriesGuide() {
  const { typeSlug, seriesSlug } = useParams();
  const { t, lang } = useLanguage();
  const [series, setSeries] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing
  const [modelsPage, setModelsPage] = useState(1);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setModelsPage(1);
    api
      .getGuideSeries(typeSlug, seriesSlug)
      .then((s) => {
        if (!alive) return;
        setSeries(s);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("missing"));
    return () => {
      alive = false;
    };
  }, [typeSlug, seriesSlug]);

  if (status !== "ready") {
    return (
      <section className="section guide-series guide-series--empty">
        <div className="container">
          <p className="empty-state">
            {status === "loading" ? (
              t("guide.loading")
            ) : (
              <>
                {t("guide.notFound")} <Link to={GUIDE_BASE}>{t("guide.backToGuide")} →</Link>
              </>
            )}
          </p>
        </div>
      </section>
    );
  }

  const s = series;
  const type = lang === "th" ? s.type_name_th || s.type_name : s.type_name;
  const description = tx(s, "description", lang);
  const applications = s.application_items || [];
  const highlights = s.highlights || [];
  const pictured = highlights.filter((h) => h.image);
  const textOnly = highlights.filter((h) => !h.image);
  const groups = s.spec_groups || [];
  const keySpecs = s.key_specs || [];
  // the contact form pre-selects "Products" and starts the message with the series
  const quoteHref = `/contacts?interest=products&topic=${encodeURIComponent(`${s.brand} ${s.name}`)}`;

  return (
    <>
      <section className="guide-series">
        <div className="container">
          <Breadcrumb
            items={[
              { label: t("nav.home"), to: "/" },
              { label: t("nav.products"), to: "/products" },
              { label: t("nav.productSeries"), to: GUIDE_BASE },
              { label: type, to: typeHref(s.type_slug) },
              { label: s.name },
            ]}
          />

          <div className="guide-series__hero">
            <div className="guide-series__intro">
              <div className="guide-series__brand">
                {s.brand_logo ? <img src={s.brand_logo} alt={s.brand} /> : <span>{s.brand}</span>}
                {s.is_new && <span className="series-badge series-badge--new">{t("guide.newBadge")}</span>}
                {s.is_legacy && <span className="series-badge">{t("guide.legacy")}</span>}
              </div>
              <h1>{s.name}</h1>
              {tx(s, "tagline", lang) && <p className="guide-series__tagline">{tx(s, "tagline", lang)}</p>}

              {s.is_legacy && s.replaced_by && (
                <p className="guide-series__successor">
                  {fill(t("guide.replacedBy"), { name: s.replaced_by.name })}{" "}
                  <Link to={seriesHref(s.replaced_by)}>{fill(t("guide.seeSuccessor"), { name: s.replaced_by.name })} →</Link>
                </p>
              )}

              <div className="guide-series__actions">
                <Link to={quoteHref} className="btn btn-primary">
                  {t("guide.requestQuote")} <span className="btn-arrow">→</span>
                </Link>
                {s.catalog_url && (
                  <a href={s.catalog_url} className="btn" target="_blank" rel="noopener noreferrer">
                    {t("guide.downloadCatalog")}
                  </a>
                )}
              </div>
            </div>
            <SeriesVisual series={s} className="guide-series__visual" />
          </div>
        </div>
      </section>

      {keySpecs.length > 0 && (
        <section className="guide-figures" aria-label={t("guide.keySpecs")}>
          <div className="container">
            <dl className="guide-figures__list" style={{ "--n": Math.min(keySpecs.length, 4) }}>
              {keySpecs.map((k, i) => (
                <Reveal key={i} className="guide-figures__item" style={{ transitionDelay: `${i * 60}ms` }}>
                  {/* label first for valid <dl>; CSS shows the figure on top */}
                  <dt>{tk(k, "label", lang)}</dt>
                  <dd>{k.value}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>
      )}

      {description && (
        <section className="guide-about">
          <div className="container">
            <Reveal className="guide-about__text">
              {description.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {highlights.length > 0 && (
        <section className="guide-highlights" aria-labelledby="guide-highlights-title">
          <div className="container">
            <h2 className="guide-section-title" id="guide-highlights-title">
              {t("guide.highlights")}
            </h2>
            {pictured.map((h, i) => (
              <Reveal className={`guide-feature${i % 2 ? " is-flipped" : ""}`} key={`p${i}`}>
                <div className="guide-feature__media">
                  <img src={h.image} alt="" loading="lazy" decoding="async" />
                </div>
                <div className="guide-feature__text">
                  <span className="guide-feature__index">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{tk(h, "title", lang)}</h3>
                  {tk(h, "body", lang) && <p>{tk(h, "body", lang)}</p>}
                </div>
              </Reveal>
            ))}
            {textOnly.length > 0 && (
              <div className="guide-points">
                {textOnly.map((h, i) => (
                  <Reveal className="guide-point" key={`t${i}`} style={{ transitionDelay: `${i * 60}ms` }}>
                    <span className="guide-feature__index">{String(pictured.length + i + 1).padStart(2, "0")}</span>
                    <h3>{tk(h, "title", lang)}</h3>
                    {tk(h, "body", lang) && <p>{tk(h, "body", lang)}</p>}
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {groups.length > 0 && (
        <section className="guide-specs" aria-labelledby="guide-specs-title">
          <div className="container">
            <h2 className="guide-section-title" id="guide-specs-title">
              {t("guide.specs")}
            </h2>
            <div className="guide-specs__groups">
              {groups.map((g, i) => (
                <div className="guide-specs__group" key={i}>
                  {tk(g, "title", lang) && <h3>{tk(g, "title", lang)}</h3>}
                  <table className="guide-specs__table">
                    <tbody>
                      {(g.rows || []).map((r, j) => (
                        <tr key={j}>
                          <th scope="row">{tk(r, "label", lang)}</th>
                          <td>{r.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
            <p className="guide-specs__note">{t("guide.modelsNote")}</p>
          </div>
        </section>
      )}

      {applications.length > 0 && (
        <section className="guide-apps" aria-labelledby="guide-apps-title">
          <div className="container">
            <h2 className="guide-section-title" id="guide-apps-title">
              {t("guide.applications")}
            </h2>
            <ul className="guide-apps__list">
              {applications.map((a, i) => (
                <Reveal as="li" className="guide-apps__item" key={i} style={{ transitionDelay: `${i * 60}ms` }}>
                  <div className="guide-apps__media">
                    {a.image && <img src={a.image} alt="" loading="lazy" decoding="async" />}
                  </div>
                  <h3>{tk(a, "title", lang)}</h3>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {s.models?.length > 0 && (
        <section className="guide-models" aria-labelledby="guide-models-title">
          <div className="container">
            <h2 className="guide-section-title" id="guide-models-title">
              {t("guide.models")}
            </h2>
            <ul className="guide-models__list">
              {s.models.slice((modelsPage - 1) * MODELS_PER_PAGE, modelsPage * MODELS_PER_PAGE).map((m) => {
                const label = m.name || m.item_no;
                return (
                  <li className="guide-models__item" key={m.id}>
                    <div className="guide-models__name">
                      {m.has_page ? <Link to={productHref(m)}>{label}</Link> : <strong>{label}</strong>}
                    </div>
                    {m.datasheet_url && (
                      <a
                        href={m.datasheet_url}
                        className="guide-models__doc"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={fill(t("guide.datasheetFor"), { name: label })}
                        title={t("guide.datasheet")}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="4" y="3" width="16" height="18" rx="3" />
                          <path d="M8 9h8M8 13h8M8 17h5" />
                        </svg>
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <Pagination
              page={modelsPage}
              totalPages={Math.ceil(s.models.length / MODELS_PER_PAGE)}
              onChange={setModelsPage}
            />
          </div>
        </section>
      )}

      {s.sources?.length > 0 && (
        <section className="guide-sources" aria-labelledby="guide-sources-title">
          <div className="container">
            <h2 className="guide-sources__title" id="guide-sources-title">
              {t("guide.sources")}
            </h2>
            <ul className="guide-sources__list">
              {s.sources.map((src, i) => (
                <li key={i}>
                  <a href={src.url} target="_blank" rel="noopener noreferrer">
                    {src.label || src.url}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="guide-sources__note">{t("guide.sourcesNote")}</p>
          </div>
        </section>
      )}

      {s.related?.length > 0 && (
        <section className="guide-related" aria-labelledby="guide-related-title">
          <div className="container">
            <h2 className="guide-section-title" id="guide-related-title">
              {fill(t("guide.related"), { type })}
            </h2>
            <div className="guide-type__grid">
              {s.related.map((r) => (
                <SeriesCard series={r} key={r.id} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="cta-band products-cta">
        <div className="products-cta__light" aria-hidden="true" />
        <Reveal className="container cta-band__wrap guide-cta">
          <div>
            <h2>{t("guide.ctaTitle")}</h2>
            <p>{t("guide.ctaSub")}</p>
          </div>
          <Link to={quoteHref} className="btn btn-primary">
            {t("guide.askEngineer")} <span className="btn-arrow">→</span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
