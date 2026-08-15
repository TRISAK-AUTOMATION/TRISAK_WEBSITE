import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function SeriesPage() {
  const { brandSlug, categorySlug, seriesSlug } = useParams();
  const { t } = useLanguage();

  const [series, setSeries] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    Promise.all([
      api.getSeries(brandSlug, categorySlug, seriesSlug),
      api.getProducts({ brand: brandSlug, category: categorySlug, series: seriesSlug }),
    ])
      .then(([s, prods]) => {
        setSeries(s);
        setProducts(prods);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [brandSlug, categorySlug, seriesSlug]);

  if (notFound) return <Navigate to={`/products/${brandSlug}/${categorySlug}`} replace />;

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <Breadcrumb
            items={[
              { label: t("nav.home"), to: "/" },
              { label: t("nav.products"), to: "/products" },
              { label: series?.brand_name || brandSlug, to: `/products/${brandSlug}` },
              {
                label: series?.category_name || categorySlug,
                to: `/products/${brandSlug}/${categorySlug}`,
              },
              { label: series?.name || seriesSlug },
            ]}
          />
          <span className="hero__meta">{series?.tagline}</span>
          <h1>{series?.name || "…"}</h1>
          {series?.description && <p className="hero__sub">{series.description}</p>}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading && <p className="empty-state">{t("products.loadingProducts")}</p>}
          {!loading && products.length === 0 && (
            <p className="empty-state">{t("products.emptyState")}</p>
          )}
          {!loading && products.length > 0 && (
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard product={p} key={p.id} />
              ))}
            </div>
          )}
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
