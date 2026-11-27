import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import HeroSlideshow from "../../components/HeroSlideshow.jsx";
import Reveal from "../../components/Reveal.jsx";
import SeriesCard from "../../components/SeriesCard.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { GUIDE_BASE, cachedGuide, fill, loadGuide, seriesHref, tx, typeHref, typeName } from "../../utils/guide.js";
import { TYPE_LANDINGS, lt } from "../../data/productLandings.js";
import ProductLanding from "./ProductLanding.jsx";

// a type page built from the admin category tree: one card per sub-category with its series
const CATEGORIES_HEAD = {
  eyebrow: { en: "Categories", th: "หมวดหมู่สินค้า" },
  title: { en: "Choose by category", th: "เลือกตามหมวดหมู่" },
};

/**
 * Products guide: the main series, grouped by product type.
 *   /products/series              every type, each with its series
 *   /products/series/:typeSlug    one type: its series by sub-category, then a link to…
 *   /products/guide/:typeSlug     …the type's "pick for the job" page (`landing`)
 *   ?brand=omron                  only that brand's series
 */
const landingHref = (slug) => `/products/guide/${slug}`;

export default function GuideOverview({ landing = false }) {
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

  // /products/series/omron (a brand, not a type) → the guide filtered by that brand
  if (guide && typeSlug && brands.some((b) => b.slug === typeSlug)) {
    return <Navigate to={`${GUIDE_BASE}?brand=${encodeURIComponent(typeSlug)}`} replace />;
  }

  const allTypes = guide?.types || [];
  const focus = typeSlug ? allTypes.find((tp) => tp.slug === typeSlug) : null;
  const types = allTypes
    .map((tp) => ({ ...tp, series: tp.series.filter((s) => !brand || s.brand_slug === brand) }))
    .filter((tp) => !brand || tp.series.length); // every type shows on the overview, even before it has series

  // a type's "pick for the job" page: sections like the product sales pages (hand-written content wins)
  const landingData = focus && (TYPE_LANDINGS[focus.slug] || typeLanding(focus, guide.subcategories || [], t, lang));
  if (focus && landing) {
    return (
      <ProductLanding
        key={focus.slug}
        data={landingData}
        crumbs={[
          { label: t("nav.home"), to: "/" },
          { label: t("nav.products"), to: "/products" },
          { label: t("nav.productSeries"), to: GUIDE_BASE },
          { label: typeName(focus, lang), to: typeHref(focus.slug) },
          { label: lt(landingData.categoriesHead.title, lang) },
        ]}
      />
    );
  }
  const focusSeries = focus ? focus.series.filter((s) => !brand || s.brand_slug === brand) : [];

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
          <span className="hero__meta">{t("guide.heroMeta")}</span>
          <h1>{focus ? typeName(focus, lang) : t("guide.heroTitle")}</h1>
          <p className="hero__sub">{focus ? tx(focus, "summary", lang, "summary_en") : t("guide.heroSub")}</p>
        </div>
      </section>

      {/* brand filter, kept in view while scrolling the guide (no type chips: too many types to fit) */}
      <nav className="guide-bar" aria-label={t("guide.jumpLabel")}>
        <div className="container guide-bar__inner">
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
          {focus && (
            <Link to={landingHref(focus.slug)} className="guide-bar__pick">
              {lt(landingData.categoriesHead.title, lang)} <span aria-hidden="true">→</span>
            </Link>
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
                { label: t("nav.productSeries"), to: GUIDE_BASE },
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
              {t("guide.notFound")} <Link to={GUIDE_BASE}>{t("guide.backToGuide")} →</Link>
            </p>
          )}
          {guide && !notFound && !(focus ? focusSeries.length : types.length) && <p className="empty-state">{t("guide.empty")}</p>}

          {/* a type's page: its series (the "pick for the job" page is linked from the bar above) */}
          {focus && (
            <>
              <SeriesByCategory series={focusSeries} subcategories={guide.subcategories || []} lang={lang} />
            </>
          )}

          {/* overview lists only the types; their series are on each type's page */}
          {!focus && types.map((tp, i) => (
              <section className="guide-type" id={`type-${tp.slug}`} key={tp.slug} aria-label={typeName(tp, lang)}>
                <Reveal className="guide-type__head">
                  <span className="guide-type__index">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h2 id={`type-${tp.slug}-title`}>
                      <Link to={typeHref(tp.slug)}>{typeName(tp, lang)}</Link>
                    </h2>
                    {tx(tp, "summary", lang, "summary_en") && <p>{tx(tp, "summary", lang, "summary_en")}</p>}
                  </div>
                  {tp.series.length > 0 && <span className="guide-type__count">{fill(t("guide.seriesCount"), { n: tp.series.length })}</span>}
                </Reveal>
              </section>
          ))}
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

/** Landing content for a type from the admin category tree; text per category is added later. */
function typeLanding(type, subcategories, t, lang) {
  const name = typeName(type, lang);
  const catName = (c) => (lang === "th" && c.name_th ? c.name_th : c.name).trim();
  const link = (s) => ({ name: s.name, href: seriesHref(s) });
  const direct = type.series.filter((s) => !(s.category_path || []).length);
  const categories = subcategories
    .filter((c) => c.parent_id === type.id)
    .map((c) => ({ id: c.slug, tag: catName(c), series: type.series.filter((s) => (s.category_path || []).includes(c.id)).map(link) }));
  if (direct.length) categories.unshift({ id: `${type.slug}-series`, tag: name, series: direct.map(link) });
  return {
    title: name,
    meta: t("guide.heroMeta"),
    tagline: tx(type, "summary", lang, "summary_en"),
    quoteTopic: name,
    categoriesHead: CATEGORIES_HEAD,
    categories,
    cta: { title: t("guide.ctaTitle"), text: t("guide.ctaSub"), button: t("guide.askEngineer") },
  };
}

/**
 * One type's series split by its sub-categories (admin category tree):
 * a heading per category right under the type (e.g. Photoelectric Sensors),
 * then a label for anything deeper (e.g. General Purpose) above its cards.
 * Series filed directly on the type come first, without a heading.
 */
function SeriesByCategory({ series, subcategories, lang }) {
  const byId = new Map(subcategories.map((c, i) => [c.id, { ...c, order: i }]));
  const name = (id) => {
    const c = byId.get(id);
    return c ? (lang === "th" && c.name_th ? c.name_th : c.name).trim() : "";
  };
  const order = (id) => byId.get(id)?.order ?? -1;

  const groups = new Map();
  for (const s of series) {
    const [top = 0, ...rest] = (s.category_path || []).filter((id) => byId.has(id));
    if (!groups.has(top)) groups.set(top, { id: top, subs: new Map() });
    const subs = groups.get(top).subs;
    const key = rest.join("/");
    if (!subs.has(key)) subs.set(key, { key, first: rest[0] ?? 0, label: rest.map(name).join(" › "), series: [] });
    subs.get(key).series.push(s);
  }
  const sorted = [...groups.values()].sort((a, b) => order(a.id) - order(b.id));

  return (
    <div className="guide-cats">
      {sorted.length > 1 && (
        <nav className="guide-cats__jump" aria-label={lang === "th" ? "หมวดหมู่ย่อย" : "Sub-categories"}>
          {sorted.filter((g) => g.id).map((g) => (
            <a key={g.id} href={`#cat-${byId.get(g.id).slug}`}>
              {name(g.id)}
            </a>
          ))}
        </nav>
      )}
      {sorted.map((g) => (
        <div className="guide-cat" key={g.id} id={g.id ? `cat-${byId.get(g.id).slug}` : undefined}>
          {g.id !== 0 && <h2 className="guide-cat__title">{name(g.id)}</h2>}
          {[...g.subs.values()]
            .sort((a, b) => order(a.first) - order(b.first))
            .map((sub) => (
              <div className="guide-cat__sub" key={sub.key}>
                {sub.label && <p className="guide-cat__label">{sub.label}</p>}
                <div className="guide-type__grid">
                  {sub.series.map((s) => (
                    <SeriesCard series={s} key={s.id} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
