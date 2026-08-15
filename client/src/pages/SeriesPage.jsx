import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import ProductThumb from "../components/ProductThumb.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function SeriesPage() {
  const { seriesSlug } = useParams();
  const { t } = useLanguage();

  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api
      .getSeries(seriesSlug)
      .then(setSeries)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [seriesSlug]);

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p className="empty-state">{t("catalog.loading")}</p>
        </div>
      </section>
    );
  }

  if (notFound || !series) {
    return (
      <section className="section">
        <div className="container">
          <p className="empty-state">{t("catalog.noResults")}</p>
        </div>
      </section>
    );
  }

  const filteredProducts = q
    ? series.products.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          (p.model || "").toLowerCase().includes(q.toLowerCase())
      )
    : series.products;

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <Breadcrumbs
            items={[
              { label: t("catalog.breadcrumbHome"), to: "/" },
              { label: t("catalog.breadcrumbProducts"), to: "/products" },
              { label: series.brand, to: `/products/brand/${series.brand_slug}` },
              { label: series.name },
            ]}
          />
          <span className="hero__meta">{series.tagline}</span>
          <h1>{series.name}</h1>
          {series.description && <p className="hero__sub">{series.description}</p>}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="catalog-tabs">
            <span className="catalog-tab is-static">
              {t("catalog.allProducts")}
              <span className="catalog-tab__count">{series.products.length}</span>
            </span>
            <Link className="catalog-tab" to={`/products/brand/${series.brand_slug}`}>
              {series.brand}
            </Link>
            <Link className="catalog-tab" to={`/products/category/${series.category_slug}`}>
              {series.category}
            </Link>
          </div>

          <div className="product-finder">
            <input
              type="text"
              placeholder={`${t("catalog.search")} ${series.name}…`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <p>{t("catalog.noResults")}</p>
            </div>
          )}

          {filteredProducts.length > 0 && (
            <div className="product-grid">
              {filteredProducts.map((p) => (
                <Link to={`/products/item/${p.slug}`} className="grid-cell product-card" key={p.id}>
                  <ProductThumb label={p.model || p.name} isNew={p.is_new} />
                  <span className="product-card__brand">{series.name}</span>
                  <h3>{p.name}</h3>
                  {p.model && <span className="product-card__model">{p.model}</span>}
                  {p.description && <p>{p.description}</p>}
                </Link>
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
