import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function CategoryPage() {
  const { brandSlug, categorySlug } = useParams();
  const { t } = useLanguage();

  const [brand, setBrand] = useState(null);
  const [category, setCategory] = useState(null);
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
      api.getSeriesList({ brand: brandSlug, category: categorySlug }),
      api.getProducts({ brand: brandSlug, category: categorySlug }),
    ])
      .then(([b, c, series, prods]) => {
        setBrand(b);
        setCategory(c);
        setSeriesList(series);
        setProducts(prods);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [brandSlug, categorySlug]);

  if (notFound) return <Navigate to={`/products/${brandSlug}`} replace />;

  // products that don't belong to any series — shown directly in the grid
  const seriesSlugs = new Set(seriesList.map((s) => s.slug));
  const unseriesedProducts = products.filter((p) => !p.series_slug || !seriesSlugs.has(p.series_slug));

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

      {loading && (
        <section className="section">
          <div className="container">
            <p className="empty-state">{t("products.loadingProducts")}</p>
          </div>
        </section>
      )}

      {!loading && seriesList.length > 0 && (
        <section className="section">
          <div className="container">
            <SeriesGrid seriesList={seriesList} brandSlug={brandSlug} categorySlug={categorySlug} t={t} />
          </div>
        </section>
      )}

      {!loading && unseriesedProducts.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="product-grid">
              {unseriesedProducts.map((p) => (
                <ProductCard product={p} key={p.id} />
              ))}
            </div>
          </div>
        </section>
      )}

      {!loading && seriesList.length === 0 && unseriesedProducts.length === 0 && (
        <section className="section">
          <div className="container">
            <p className="empty-state">{t("products.emptyState")}</p>
          </div>
        </section>
      )}

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

function SeriesGrid({ seriesList, brandSlug, categorySlug, t }) {
  return (
    <div className="grid cols-3">
      {seriesList.map((s) => (
        <Link
          to={`/products/${brandSlug}/${categorySlug}/${s.slug}`}
          className="grid-cell series-tile"
          key={s.slug}
        >
          {s.is_new && <span className="badge-new">NEW</span>}
          <h3>{s.name}</h3>
          {s.tagline && <p>{s.tagline}</p>}
          <span className="series-tile__count">
            {s.product_count} {t("products.modelsCount")}
          </span>
        </Link>
      ))}
    </div>
  );
}
