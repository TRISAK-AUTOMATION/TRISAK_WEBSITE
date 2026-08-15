import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import ProductThumb from "../components/ProductThumb.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const { t } = useLanguage();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    setCategory(null);
    api.getCategory(categorySlug).catch(() => null).then(setCategory);
  }, [categorySlug]);

  useEffect(() => {
    setLoading(true);
    const params = { category: categorySlug };
    if (brand) params.brand = brand;
    if (q) params.q = q;
    api
      .getProducts(params)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categorySlug, brand, q]);

  const categoryName = category?.name || categorySlug;

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <Breadcrumbs
            items={[
              { label: t("catalog.breadcrumbHome"), to: "/" },
              { label: t("catalog.breadcrumbProducts"), to: "/products" },
              { label: categoryName },
            ]}
          />
          <span className="hero__meta">{t("products.categoriesEyebrow")}</span>
          <h1>{categoryName}</h1>
          <p className="hero__sub">{t("products.heroSub")}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="catalog-tabs">
            <button
              className={`catalog-tab ${!brand ? "is-active" : ""}`}
              onClick={() => setBrand("")}
            >
              {t("catalog.allProducts")}
              {category && <span className="catalog-tab__count">{category.product_count}</span>}
            </button>
            {category?.brands?.map((b) => (
              <button
                key={b.slug}
                className={`catalog-tab ${brand === b.slug ? "is-active" : ""}`}
                onClick={() => setBrand(b.slug)}
              >
                {b.name}
                <span className="catalog-tab__count">{b.product_count}</span>
              </button>
            ))}
          </div>

          <div className="product-finder">
            <input
              type="text"
              placeholder={`${t("catalog.search")} ${categoryName}…`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {loading && <p className="empty-state">{t("catalog.loading")}</p>}

          {!loading && products.length === 0 && (
            <div className="empty-state">
              <p>{t("catalog.noResults")}</p>
              <p>{t("catalog.noResultsHint")}</p>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="product-grid">
              {products.map((p) => (
                <Link to={`/products/item/${p.slug}`} className="grid-cell product-card" key={p.id}>
                  <ProductThumb label={p.model || p.name} isNew={p.is_new} />
                  <span className="product-card__brand">
                    {p.brand}
                    {p.series && <span className="product-card__series"> — {p.series}</span>}
                  </span>
                  <h3>{p.name}</h3>
                  {p.model && <span className="product-card__model">{p.model}</span>}
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
