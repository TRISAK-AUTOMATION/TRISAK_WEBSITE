import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import ProductImage from "../../components/ProductImage.jsx";
import AvailabilityBadge from "../../components/AvailabilityBadge.jsx";
import { productHref } from "../../utils/productAvailability.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { categoryBreadcrumbItems } from "../../utils/categoryBreadcrumb.js";

const ALL_TABS = ["overview", "specifications", "documents", "related"];

export default function ProductDetail() {
  const { brandSlug, categorySlug, seriesSlug, productSlug } = useParams();
  const { t } = useLanguage();

  const [product, setProduct] = useState(null);
  const [categoryCrumb, setCategoryCrumb] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [movedTo, setMovedTo] = useState(null); // product URL changed (ITEM NO edited): follow the redirect

  // productSlug may be undefined when the route has no series segment —
  // App.jsx registers both patterns and passes whichever slug is present.
  const slug = productSlug || seriesSlug;

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setMovedTo(null);
    setActiveTab("overview");
    setActiveImage(0);
    api
      .getProductBySlug(slug)
      .then(async (p) => {
        if (p.redirectTo) {
          setMovedTo(p.redirectTo);
          return;
        }
        const crumb = await api.getCategoryBreadcrumb(p.category_id);
        setProduct(p);
        setCategoryCrumb(crumb);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (movedTo) return <Navigate to={productHref(movedTo)} replace />;
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
  // Hide the Documents tab entirely when the product has no PDF documents.
  const TABS = ALL_TABS.filter((tab) => tab !== "documents" || (product.documents || []).length > 0);

  return (
    <section className="product-detail">
      <div className="container">
        <Breadcrumb
          items={[
            { label: t("nav.home"), to: "/" },
            { label: t("nav.products"), to: "/products" },
            { label: product.brand, to: `/products/${product.brand_slug}` },
            ...categoryBreadcrumbItems(product.brand_slug, categoryCrumb),
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
              <ProductImage src={images[activeImage]?.image_url} alt={product.name} loading="eager" />
            </div>
            {images.length > 1 && (
              <div className="product-detail__thumbs">
                {images.map((img, i) => (
                  <button
                    key={img.id || i}
                    className={`product-detail__thumb ${i === activeImage ? "is-active" : ""}`}
                    onClick={() => setActiveImage(i)}
                  >
                    <ProductImage src={img.image_url} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail__info">
            <span className="hero__meta">{product.brand}</span>
            <h1>{product.name}</h1>
            {product.series && <p className="product-detail__series">{product.series}</p>}
            {product.model && (
              <p className="product-detail__model">
                {t("products.modelNumber")}: <strong>{product.model}</strong>
              </p>
            )}
            {product.short_description && <p className="lede">{product.short_description}</p>}

            <div className="product-detail__status">
              <AvailabilityBadge status={product.availability_status} />
              {product.status_note && <p className="product-detail__status-note">{product.status_note}</p>}
              {product.replacementProduct && (
                <p className="product-detail__replacement">
                  {t("products.replacementModel")}:{" "}
                  <Link to={productHref(product.replacementProduct)}>
                    {product.replacementProduct.model || product.replacementProduct.name}
                  </Link>
                </p>
              )}
            </div>

            <div className="product-detail__actions">
              <Link to="/contacts" className="btn btn-primary">
                {t("products.requestQuotation")}
              </Link>
              <Link to="/contacts" className="btn">
                {t("common.contactUs")}
              </Link>
              {product.documents?.[0] && (
                <a href={product.documents[0].fileUrl} className="btn" target="_blank" rel="noopener noreferrer">
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
              {(product.documents || []).map((d) => (
                <div className="document-row" key={d.id}>
                  <span className="document-row__title">{d.title}</span>
                  <span className="document-row__actions">
                    <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="btn">
                      {t("products.viewPdf")}
                    </a>
                    <a href={d.fileUrl} download={d.fileName} className="btn btn-primary">
                      {t("common.download")}
                    </a>
                  </span>
                </div>
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
                    <ProductImage src={rp.image_url} />
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
