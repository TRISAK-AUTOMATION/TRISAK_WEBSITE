import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import HeroSlideshow from "../../components/HeroSlideshow.jsx";
import Reveal from "../../components/Reveal.jsx";
import SeriesCard from "../../components/SeriesCard.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { cachedGuide, fill, loadGuide, tx, typeName } from "../../utils/guide.js";

/**
 * Products guide: the main series, grouped by product type.
 *   /products              every type, each with its series
 *   /products/:typeSlug    one type
 *   ?brand=omron           only that brand's series (old /products/:brand links land here)
 */
export default function GuideOverview() {
  const { typeSlug } = useParams();
  const { t, lang } = useLanguage();
  const [guide, setGuide] = useState(cachedGuide);
  const [failed, setFailed] = useState(false);
  const [pageContent, setPageContent] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    let alive = true;
    loadGuide()
      .then((g) => alive && setGuide(g))
      .catch(() => alive && setFailed(true));
    api
      .getProductsPageContent()
      .then((c) => alive && setPageContent(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const brands = guide?.brands || [];
  const brandParam = searchParams.get("brand") || "";
  const brand = brands.some((b) => b.slug === brandParam) ? brandParam : "";
  const setBrand = (slug) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (slug) next.set("brand", slug);
      else next.delete("brand");
      return next;
    }, { replace: true });

  // an old brand page (/products/omron) → the guide filtered by that brand
  if (guide && typeSlug && brands.some((b) => b.slug === typeSlug)) {
    return <Navigate to={`/products?brand=${encodeURIComponent(typeSlug)}`} replace />;
  }

  const allTypes = guide?.types || [];
  const focus = typeSlug ? allTypes.find((tp) => tp.slug === typeSlug) : null;
  const types = (focus ? [focus] : allTypes)
    .map((tp) => ({ ...tp, series: tp.series.filter((s) => !brand || s.brand_slug === brand) }))
    .filter((tp) => tp.series.length || focus);

  const heroImages = Array.isArray(pageContent?.hero_bg_images) && pageContent.hero_bg_images.length
    ? pageContent.hero_bg_images
    : pageContent?.hero_bg_image
      ? [pageContent.hero_bg_image]
      : [];

  const notFound = guide && typeSlug && !focus;

  return (
    <>
      <section className={`hero hero--compact hero--products guide-hero ${heroImages.length ? "hero--has-bg" : ""}`}>
        {heroImages.length > 0 && (
          <>
            <HeroSlideshow images={heroImages} />
            <div className="hero__bg-scrim" aria-hidden="true" />
          </>
        )}
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          {focus ? (
            <>
              <span className="hero__meta">{t("guide.heroMeta")}</span>
              <h1>{typeName(focus, lang)}</h1>
              {tx(focus, "summary", lang, "summary_en") && <p className="hero__sub">{tx(focus, "summary", lang, "summary_en")}</p>}
            </>
          ) : (
            <>
              <span className="hero__meta">{t("guide.heroMeta")}</span>
              <h1>{t("guide.heroTitle")}</h1>
              <p className="hero__sub">{t("guide.heroSub")}</p>
            </>
          )}
        </div>
      </section>

      {/* product types + brand filter, kept in view while scrolling the guide */}
      <nav className="guide-bar" aria-label={t("guide.jumpLabel")}>
        <div className="container guide-bar__inner">
          <div className="guide-bar__types">
            {allTypes.map((tp) =>
              focus ? (
                <Link key={tp.slug} to={`/products/${tp.slug}${brand ? `?brand=${brand}` : ""}`} className={`guide-chip${tp.slug === focus.slug ? " is-active" : ""}`}>
                  {typeName(tp, lang)}
                </Link>
              ) : (
                <a key={tp.slug} href={`#type-${tp.slug}`} className="guide-chip">
                  {typeName(tp, lang)}
                </a>
              )
            )}
          </div>
          {brands.length > 1 && (
            <div className="guide-bar__brands" role="group" aria-label={t("guide.allBrands")}>
              <button type="button" className={`guide-chip guide-chip--brand${!brand ? " is-active" : ""}`} onClick={() => setBrand("")} aria-pressed={!brand}>
                {t("guide.allBrands")}
              </button>
              {brands.map((b) => (
                <button
                  type="button"
                  key={b.slug}
                  className={`guide-chip guide-chip--brand${brand === b.slug ? " is-active" : ""}`}
                  onClick={() => setBrand(brand === b.slug ? "" : b.slug)}
                  aria-pressed={brand === b.slug}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="guide">
        <div className="container">
          {focus && (
            <Breadcrumb
              items={[
                { label: t("nav.home"), to: "/" },
                { label: t("nav.products"), to: "/products" },
                { label: typeName(focus, lang) },
              ]}
            />
          )}

          {!guide && !failed && <p className="empty-state">{t("guide.loading")}</p>}
          {failed && !guide && (
            <p className="empty-state">
              {t("guide.loadError")}{" "}
              <button type="button" className="guide-retry" onClick={() => window.location.reload()}>
                {t("guide.retry")}
              </button>
            </p>
          )}
          {notFound && (
            <p className="empty-state">
              {t("guide.notFound")} <Link to="/products">{t("guide.backToGuide")} →</Link>
            </p>
          )}
          {guide && !notFound && types.every((tp) => !tp.series.length) && <p className="empty-state">{t("guide.empty")}</p>}

          {types.map((tp, i) =>
            tp.series.length ? (
              <section className="guide-type" id={`type-${tp.slug}`} key={tp.slug} aria-labelledby={`type-${tp.slug}-title`}>
                <Reveal className="guide-type__head">
                  <span className="guide-type__index">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h2 id={`type-${tp.slug}-title`}>
                      {focus ? (
                        typeName(tp, lang)
                      ) : (
                        <Link to={`/products/${tp.slug}${brand ? `?brand=${brand}` : ""}`}>{typeName(tp, lang)}</Link>
                      )}
                    </h2>
                    {tx(tp, "summary", lang, "summary_en") && <p>{tx(tp, "summary", lang, "summary_en")}</p>}
                  </div>
                  <span className="guide-type__count">{fill(t("guide.seriesCount"), { n: tp.series.length })}</span>
                </Reveal>
                <div className="guide-type__grid">
                  {tp.series.map((s) => (
                    <SeriesCard series={s} key={s.id} />
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      </div>

      <section className="cta-band products-cta">
        <div className="products-cta__light" aria-hidden="true" />
        <Reveal className="container cta-band__wrap guide-cta">
          <div>
            <h2>{t("guide.ctaTitle")}</h2>
            <p>{t("guide.ctaSub")}</p>
          </div>
          <Link to="/contacts" className="btn btn-primary">
            {t("guide.askEngineer")} <span className="btn-arrow">→</span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
