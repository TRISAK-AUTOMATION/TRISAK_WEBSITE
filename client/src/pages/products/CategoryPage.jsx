import { useEffect, useState } from "react";
import { useParams, Link, NavLink, Navigate } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function CategoryPage() {
  const { brandSlug, categorySlug } = useParams();
  const { t } = useLanguage();

  const [brand, setBrand] = useState(null);
  const [category, setCategory] = useState(null);
  const [sidebarCategories, setSidebarCategories] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    Promise.all([
      api.getBrand(brandSlug),
      api.getCategory(categorySlug),
      api.getCategoriesForBrand(brandSlug),
      api.getSeriesList({ brand: brandSlug, category: categorySlug }),
      api.getProducts({ brand: brandSlug, category: categorySlug }),
    ])
      .then(([b, c, cats, series, prods]) => {
        setBrand(b);
        setCategory(c);
        setSidebarCategories(cats);
        setSeriesList(series);
        setProducts(prods);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [brandSlug, categorySlug]);

  if (notFound) return <Navigate to={`/products/${brandSlug}`} replace />;

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
              { label: category?.name || categorySlug },
            ]}
          />
          <span className="hero__meta">{brand?.name}</span>
          <h1>{category?.name || "…"}</h1>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container category-layout">
          <aside className="category-sidebar">
            <div className="category-sidebar__heading">{t("products.categoriesTitle")}</div>
            <nav className="category-sidebar__list">
              {sidebarCategories.map((c) => (
                <NavLink
                  key={c.slug}
                  to={`/products/${brandSlug}/${c.slug}`}
                  className={({ isActive }) =>
                    `category-sidebar__item ${isActive ? "is-active" : ""}`
                  }
                >
                  {c.name}
                </NavLink>
              ))}
            </nav>
          </aside>

          <div className="category-main">
            {loading && <p className="empty-state">{t("products.loadingProducts")}</p>}

            {!loading && seriesList.length === 0 && unseriesedProducts.length === 0 && (
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
                    categorySlug={categorySlug}
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

const PREVIEW_LIMIT = 5;

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
