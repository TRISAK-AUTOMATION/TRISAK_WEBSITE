import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { categoryLevelHref, categoryBreadcrumbItems } from "../../utils/categoryBreadcrumb.js";

const PREVIEW_LIMIT = 5;

export default function CategoryPage() {
  const params = useParams();
  const { brandSlug, categorySlug } = params;
  // "/products/:brand/:categorySlug/cat/*" — splat is a "/"-joined chain
  // of subcategory ids, e.g. "12/45". Empty/undefined at the top level.
  const splat = params["*"] || "";
  const idChain = splat.split("/").filter(Boolean).map(Number);
  const { t } = useLanguage();

  const [brand, setBrand] = useState(null);
  const [category, setCategory] = useState(null); // current node
  const [crumb, setCrumb] = useState([]); // [{id,name,slug}, ...] root..current
  const [siblings, setSiblings] = useState([]); // same-level categories (sidebar)
  const [children, setChildren] = useState([]); // subcategories of current node
  const [seriesList, setSeriesList] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    async function run() {
      try {
        const b = await api.getBrand(brandSlug);
        if (cancelled) return;

        let currentId;
        if (idChain.length > 0) {
          currentId = idChain[idChain.length - 1];
        } else {
          const topCat = await api.getCategory(categorySlug);
          currentId = topCat.id;
        }

        const [cat, crumbChain, kids] = await Promise.all([
          api.getCategoryById(currentId),
          api.getCategoryBreadcrumb(currentId),
          api.getCategoryChildren(currentId, brandSlug),
        ]);
        if (cancelled) return;

        const sibs = cat.parent_id
          ? await api.getCategoryChildren(cat.parent_id, brandSlug)
          : await api.getCategoriesForBrand(brandSlug);
        if (cancelled) return;

        let series = [];
        let prods = [];
        [series, prods] = await Promise.all([
          api.getSeriesList({ brand: brandSlug, categoryId: currentId }),
          api.getProducts({ brand: brandSlug, categoryId: currentId }),
        ]);
        if (cancelled) return;

        setBrand(b);
        setCategory(cat);
        setCrumb(crumbChain);
        setChildren(kids);
        setSiblings(sibs);
        setSeriesList(series);
        setProducts(prods);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandSlug, categorySlug, splat]);

  if (notFound) return <Navigate to={`/products/${brandSlug}`} replace />;

  const basePath = `/products/${brandSlug}/${categorySlug}`;
  const isTop = crumb.length <= 1;

  const childHref = (childId) => {
    const chain = [...crumb.slice(1).map((c) => c.id), childId];
    return `${basePath}/cat/${chain.join("/")}`;
  };
  const siblingHref = (sib) => {
    if (isTop) return `/products/${brandSlug}/${sib.slug}`;
    const chain = [...crumb.slice(1, -1).map((c) => c.id), sib.id];
    return `${basePath}/cat/${chain.join("/")}`;
  };
  const crumbHref = (i) => categoryLevelHref(brandSlug, crumb, i);

  // group products under their series, so each series card can list its models
  const productsBySeries = {};
  const unseriesedProducts = [];
  for (const p of products) {
    if (p.series_slug) {
      (productsBySeries[p.series_slug] ||= []).push(p);
    } else {
      unseriesedProducts.push(p);
    }
  }

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <Breadcrumb
            items={[
              { label: t("nav.home"), to: "/" },
              { label: t("nav.products"), to: "/products" },
              { label: brand?.name || brandSlug, to: `/products/${brandSlug}` },
              ...crumb.map((c, i) => ({
                label: c.name,
                to: i === crumb.length - 1 ? undefined : crumbHref(i),
              })),
            ]}
          />
          <span className="hero__meta">{brand?.name}</span>
          <h1>{category?.name || "…"}</h1>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container category-layout">
          <aside className="category-sidebar">
            <div className="category-sidebar__heading">{brand?.name}</div>
            <nav className="category-sidebar__tree">
              {crumb.slice(0, -1).map((c, i) => (
                <Link
                  key={c.id}
                  to={categoryLevelHref(brandSlug, crumb, i)}
                  className="category-sidebar__ancestor"
                  style={{ paddingLeft: 20 + i * 18 }}
                >
                  {c.name}
                </Link>
              ))}
              {siblings.map((s) => (
                <Link
                  key={s.id}
                  to={siblingHref(s)}
                  style={{ paddingLeft: 20 + Math.max(crumb.length - 1, 0) * 18 }}
                  className={`category-sidebar__item ${s.id === category?.id ? "is-active" : ""}`}
                >
                  {s.name}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="category-main">
            {loading && <p className="empty-state">{t("products.loadingProducts")}</p>}

            {!loading && children.length > 0 && (
              <div className="grid cols-3" style={{ marginBottom: seriesList.length || unseriesedProducts.length ? 48 : 0 }}>
                {children.map((child) => (
                  <Link key={child.id} to={childHref(child.id)} className="grid-cell subcategory-tile">
                    <h3>{child.name}</h3>
                    <span className="btn-arrow">→</span>
                  </Link>
                ))}
              </div>
            )}

            {!loading && children.length === 0 && seriesList.length === 0 && unseriesedProducts.length === 0 && (
              <p className="empty-state">{t("products.emptyState")}</p>
            )}

            {!loading && (seriesList.length > 0 || unseriesedProducts.length > 0) && (
              <div className="series-card-grid">
                {seriesList.map((s) => (
                  <SeriesCard
                    key={s.slug}
                    series={s}
                    products={productsBySeries[s.slug] || []}
                    brandSlug={brandSlug}
                    categorySlug={s.category_slug}
                    t={t}
                  />
                ))}

                {unseriesedProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.brand_slug}/${p.category_slug}/${p.slug}`}
                    className="series-card series-card--single"
                  >
                    <div className="series-card__header">
                      <h3>{p.name}</h3>
                      {p.is_new && <span className="badge-new badge-new--inline">NEW</span>}
                    </div>
                    {p.short_description && (
                      <p className="series-card__desc">{p.short_description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-band__wrap">
          <h2>{t("products.ctaTitle")}</h2>
          <Link to="/contacts" className="btn btn-primary">
            {t("common.contactUs")} <span className="btn-arrow">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}

function SeriesCard({ series, products, brandSlug, categorySlug, t }) {
  const seriesHref = `/products/${brandSlug}/${categorySlug}/${series.slug}`;
  const preview = products.slice(0, PREVIEW_LIMIT);
  const remaining = products.length - preview.length;

  return (
    <div className="series-card">
      <Link to={seriesHref} className="series-card__header">
        <h3>{series.name}</h3>
        {series.is_new && <span className="badge-new badge-new--inline">NEW</span>}
      </Link>

      {series.tagline && <p className="series-card__desc">{series.tagline}</p>}

      {preview.length > 0 && (
        <ul className="series-card__list">
          {preview.map((p) => (
            <li key={p.id}>
              <Link to={`/products/${p.brand_slug}/${p.category_slug}/${p.series_slug}/${p.slug}`}>
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link to={seriesHref} className="series-card__view-all">
        {remaining > 0
          ? `${t("products.viewAll")} (${products.length}) →`
          : `${t("products.viewSeries")} →`}
      </Link>
    </div>
  );
}
