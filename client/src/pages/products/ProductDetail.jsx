import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const TABS = ["overview", "specifications", "documents", "related"];

export default function ProductDetail() {
  const { brandSlug, categorySlug, seriesSlug, productSlug } = useParams();
  const { t } = useLanguage();

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // productSlug may be undefined when the route has no series segment —
  // App.jsx registers both patterns and passes whichever slug is present.
  const slug = productSlug || seriesSlug;

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setActiveTab("overview");
    setActiveImage(0);
    api
      .getProductBySlug(slug)
      .then(setProduct)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (notFound) return <Navigate to={`/products/${brandSlug}/${categorySlug}`} replace />;
  if (loading || !product) {
    return (
      <section className="section" style={{ paddingTop: 160 }}>
        <div className="container">
          <p className="empty-state">{t("products.loadingProducts")}</p>
        </div>
      </section>
    );
  }

  const images = product.images?.length ? product.images : [{ image_url: null }];

  return (
    <section className="product-detail">
      <div className="container">
        <Breadcrumb
          items={[
            { label: t("nav.home"), to: "/" },
            { label: t("nav.products"), to: "/products" },
            { label: product.brand, to: `/products/${product.brand_slug}` },
            {
              label: product.category,
              to: `/products/${product.brand_slug}/${product.category_slug}`,
            },
            ...(product.series
              ? [
                  {
                    label: product.series,
                    to: `/products/${product.brand_slug}/${product.category_slug}/${product.series_slug}`,
                  },
                ]
              : []),
            { label: product.name },
          ]}
        />

        <div className="product-detail__layout">
          <div className="product-detail__gallery">
            <div className="product-detail__main-image">
              {images[activeImage]?.image_url ? (
                <img src={images[activeImage].image_url} alt={product.name} />
              ) : (
                <span className="product-detail__image-placeholder">{product.model}</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="product-detail__thumbs">
                {images.map((img, i) => (
                  <button
                    key={img.id || i}
                    className={`product-detail__thumb ${i === activeImage ? "is-active" : ""}`}
                    onClick={() => setActiveImage(i)}
                  >
                    {img.image_url ? <img src={img.image_url} alt="" /> : product.model}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail__info">
            <span className="hero__meta">{product.brand}</span>
            <h1>{product.name}</h1>
            {product.series && <p className="product-detail__series">{product.series}</p>}
            {product.short_description && <p className="lede">{product.short_description}</p>}

            <div className="product-detail__actions">
              <Link to="/contacts" className="btn btn-primary">
                {t("products.requestQuotation")}
              </Link>
              <Link to="/contacts" className="btn">
                {t("common.contactUs")}
              </Link>
              {product.documents?.[0] && (
                <a href={product.documents[0].file_url} className="btn">
                  {t("products.downloadCatalog")}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="product-detail__tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`product-detail__tab ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {t(`products.tabs.${tab}`)}
            </button>
          ))}
        </div>

        <div className="product-detail__tab-panel">
          {activeTab === "overview" && (
            <div className="product-detail__overview">
              {product.description && <p>{product.description}</p>}
              {product.features?.length > 0 && (
                <div className="feature-grid">
                  {product.features.map((f) => (
                    <div className="feature-chip" key={f}>
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "specifications" && (
            <table className="spec-table">
              <tbody>
                {(product.specs || []).length === 0 && (
                  <tr>
                    <td>{t("products.noSpecs")}</td>
                  </tr>
                )}
                {(product.specs || []).map((s) => (
                  <tr key={s.id}>
                    <th>{s.label}</th>
                    <td>{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "documents" && (
            <div className="document-list">
              {(product.documents || []).length === 0 && (
                <p className="empty-state">{t("products.noDocuments")}</p>
              )}
              {(product.documents || []).map((d) => (
                <a href={d.file_url} className="document-row" key={d.id}>
                  <span>{d.label}</span>
                  <span className="btn-arrow">↓</span>
                </a>
              ))}
            </div>
          )}

          {activeTab === "related" && (
            <div className="product-grid">
              {(product.relatedProducts || []).length === 0 && (
                <p className="empty-state">{t("products.noRelated")}</p>
              )}
              {(product.relatedProducts || []).map((rp) => (
                <Link
                  key={rp.id}
                  to={`/products/${rp.brand_slug}/${rp.category_slug}${
                    rp.series_slug ? `/${rp.series_slug}` : ""
                  }/${rp.slug}`}
                  className="grid-cell product-card"
                >
                  <div className="product-card__image" aria-hidden="true">
                    <span className="product-card__image-placeholder">{rp.model || rp.name}</span>
                  </div>
                  <h3>{rp.name}</h3>
                  {rp.model && <span className="product-card__model">{rp.model}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
