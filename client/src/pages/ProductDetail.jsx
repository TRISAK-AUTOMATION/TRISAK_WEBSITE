import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import ProductThumb from "../components/ProductThumb.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const TABS = ["overview", "specifications", "documents", "related"];

export default function ProductDetail() {
  const { productSlug } = useParams();
  const { t } = useLanguage();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setTab("overview");
    api
      .getProduct(productSlug)
      .then(setProduct)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [productSlug]);

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p className="empty-state">{t("catalog.loading")}</p>
        </div>
      </section>
    );
  }

  if (notFound || !product) {
    return (
      <section className="section">
        <div className="container">
          <p className="empty-state">{t("catalog.noResults")}</p>
        </div>
      </section>
    );
  }

  const specs = product.specs && typeof product.specs === "object" ? Object.entries(product.specs) : [];
  const documents = Array.isArray(product.documents) ? product.documents : [];
  const related = Array.isArray(product.related) ? product.related : [];

  const breadcrumbItems = [
    { label: t("catalog.breadcrumbHome"), to: "/" },
    { label: t("catalog.breadcrumbProducts"), to: "/products" },
    { label: product.brand, to: `/products/brand/${product.brand_slug}` },
  ];
  if (product.series) {
    breadcrumbItems.push({ label: product.series, to: `/products/series/${product.series_slug}` });
  }
  breadcrumbItems.push({ label: product.model || product.name });

  return (
    <>
      <section className="section product-detail-hero">
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="product-detail-hero__grid">
            <ProductThumb label={product.model || product.name} isNew={product.is_new} size="lg" />

            <div className="product-detail-hero__info">
              <span className="eyebrow">{product.brand}</span>
              <h1>{product.model || product.name}</h1>
              {product.series && <span className="product-detail-hero__series">{product.series}</span>}
              <p className="lede">{product.name}</p>

              <div className="product-detail-hero__actions">
                <Link to="/contacts" className="btn btn-primary">
                  {t("catalog.requestQuotation")} <span className="btn-arrow">→</span>
                </Link>
                <Link to="/contacts" className="btn">
                  {t("catalog.contactUs")}
                </Link>
                {documents[0] && (
                  <a href={documents[0].url} className="btn">
                    {t("catalog.downloadCatalog")}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section product-detail-body">
        <div className="container">
          <div className="catalog-tabs">
            {TABS.map((key) => (
              <button
                key={key}
                className={`catalog-tab ${tab === key ? "is-active" : ""}`}
                onClick={() => setTab(key)}
              >
                {t(`catalog.${key === "specifications" ? "specificationsTab" : key === "documents" ? "documentsTab" : key === "related" ? "relatedProductsTab" : "overviewTab"}`)}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="product-detail-panel">
              <p className="product-detail-panel__desc">{product.description}</p>
              {product.highlights?.length > 0 && (
                <div className="highlight-grid">
                  {product.highlights.map((h) => (
                    <span className="highlight-chip" key={h}>
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "specifications" && (
            <div className="product-detail-panel">
              {specs.length === 0 ? (
                <p className="empty-state">{t("catalog.noResults")}</p>
              ) : (
                <table className="spec-table">
                  <tbody>
                    {specs.map(([key, value]) => (
                      <tr key={key}>
                        <th>{key}</th>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "documents" && (
            <div className="product-detail-panel">
              {documents.length === 0 ? (
                <p className="empty-state">{t("catalog.noResults")}</p>
              ) : (
                <ul className="document-list">
                  {documents.map((doc) => (
                    <li key={doc.label}>
                      <a href={doc.url}>
                        <span className="document-list__icon" aria-hidden="true" />
                        {doc.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "related" && (
            <div className="product-detail-panel">
              {related.length === 0 ? (
                <p className="empty-state">{t("catalog.noResults")}</p>
              ) : (
                <div className="product-grid product-grid--related">
                  {related.map((p) => (
                    <Link to={`/products/item/${p.slug}`} className="grid-cell product-card" key={p.id}>
                      <ProductThumb label={p.model || p.name} />
                      <h3>{p.name}</h3>
                      {p.model && <span className="product-card__model">{p.model}</span>}
                    </Link>
                  ))}
                </div>
              )}
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
