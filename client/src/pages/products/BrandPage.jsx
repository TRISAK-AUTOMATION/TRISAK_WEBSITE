import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function BrandPage() {
  const { brandSlug } = useParams();
  const { t } = useLanguage();

  const [brand, setBrand] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    Promise.all([
      api.getBrand(brandSlug),
      api.getCategoriesForBrand(brandSlug),
    ])
      .then(([b, cats]) => {
        setBrand(b);
        setCategories(cats);
      })
      .catch(() => setNotFound(true));
  }, [brandSlug]);

  useEffect(() => {
    if (!brand) return;
    setLoading(true);
    api
      .getProducts({ brand: brandSlug, category: activeCategory, q })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [brand, brandSlug, activeCategory, q]);

  if (notFound) return <Navigate to="/products" replace />;

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <Breadcrumb
            items={[
              { label: t("nav.home"), to: "/" },
              { label: t("nav.products"), to: "/products" },
              { label: brand?.name || brandSlug },
            ]}
          />
          <span className="hero__meta">{t("products.heroMeta")}</span>
          <h1>{brand?.name || "…"}</h1>
          <p className="hero__sub">{t("products.heroSub")}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="catalog-search catalog-search--inline">
            <input
              type="text"
              placeholder={t("products.searchPlaceholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {categories.length > 0 && (
            <div className="pill-row">
              <button
                className={`pill ${activeCategory === "" ? "is-active" : ""}`}
                onClick={() => setActiveCategory("")}
              >
                {t("products.allCategories")}
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  className={`pill ${activeCategory === c.slug ? "is-active" : ""}`}
                  onClick={() => setActiveCategory(c.slug)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

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
