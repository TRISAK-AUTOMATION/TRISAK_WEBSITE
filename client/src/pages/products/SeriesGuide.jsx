import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import Reveal from "../../components/Reveal.jsx";
import SeriesCard, { SeriesVisual } from "../../components/SeriesCard.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { fill, lines, seriesHref, tk, tx } from "../../utils/guide.js";

/**
 * One series in the products guide: overview, key figures, highlights with
 * pictures, specifications, applications, catalog and related series.
 *
 * The same two-segment URL was the old brand/category listing
 * (/products/omron/plc-hmi), so when no series matches, the old URL is
 * resolved and redirected instead of showing "not found".
 */
export default function SeriesGuide() {
  const { typeSlug, seriesSlug } = useParams();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const [series, setSeries] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing
  const [redirect, setRedirect] = useState(null);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setRedirect(null);
    api
      .getGuideSeries(typeSlug, seriesSlug)
      .then((s) => {
        if (!alive) return;
        setSeries(s);
        setStatus("ready");
      })
      .catch(() =>
        api
          .resolveGuidePath(location.pathname)
          .then((r) => {
            if (!alive) return;
            if (r?.to && r.to !== location.pathname) setRedirect(r.to);
            else setStatus("missing");
          })
          .catch(() => alive && setStatus("missing"))
      );
    return () => {
      alive = false;
    };
  }, [typeSlug, seriesSlug]);

  if (redirect) return <Navigate to={redirect} replace />;

  if (status !== "ready") {
    return (
      <section className="section guide-series guide-series--empty">
        <div className="container">
          <p className="empty-state">
            {status === "loading" ? (
              t("guide.loading")
            ) : (
              <>
                {t("guide.notFound")} <Link to="/products">{t("guide.backToGuide")} →</Link>
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
  const applications = lines(lang === "th" ? s.applications_th || s.applications_en : s.applications_en || s.applications_th);
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
              { label: type, to: `/products/${s.type_slug}` },
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

      {(description || applications.length > 0) && (
        <section className="guide-about">
          <div className="container guide-about__grid">
            {description && (
              <Reveal className="guide-about__text">
                {description.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </Reveal>
            )}
            {applications.length > 0 && (
              <Reveal className="guide-about__apps">
                <h2>{t("guide.applications")}</h2>
                <ul>
                  {applications.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </Reveal>
            )}
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
