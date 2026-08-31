import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import SectionLabel from "../../components/SectionLabel.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import BrandLogoGrid from "../../components/BrandLogoGrid.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function ProductsOverview() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [results, setResults] = useState(null); // null = not searching yet
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ brand: "", category: "", q: "" });
  const [searchParams] = useSearchParams();

  // pick up ?category=... or ?brand=... from links elsewhere on the site
  // (e.g. the header's catalog dropdown) on first load
  useEffect(() => {
    const category = searchParams.get("category") || "";
    const brand = searchParams.get("brand") || "";
    if (category || brand) {
      setFilters((f) => ({ ...f, category, brand }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.getBrands().then(setBrands).catch(() => setBrands([]));
    api.getCategories().then(setCategories).catch(() => setCategories([]));
    api.getFeaturedProducts().then(setFeatured).catch(() => setFeatured([]));
  }, []);

  const hasActiveFilters = filters.brand || filters.category || filters.q;

  useEffect(() => {
    if (!hasActiveFilters) {
      setResults(null);
      return;
    }
    setLoading(true);
    api
      .getProducts(filters)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [filters.brand, filters.category, filters.q]);

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{t("products.heroMeta")}</span>
          <h1>{t("products.heroTitle")}</h1>
          <p className="hero__sub">{t("products.heroSub")}</p>

          <div className="catalog-search">
            <input
              type="text"
              placeholder={t("products.searchPlaceholder")}
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
            <select
              value={filters.brand}
              onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
            >
              <option value="">{t("products.allBrands")}</option>
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">{t("products.allCategories")}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn"
                onClick={() => setFilters({ brand: "", category: "", q: "" })}
              >
                {t("products.reset")}
              </button>
            )}
          </div>
        </div>
      </section>

      {hasActiveFilters ? (
        <section className="section">
          <div className="container">
            <SectionLabel eyebrow={t("products.finderEyebrow")} title={t("products.resultsTitle")} />
            {loading && <p className="empty-state">{t("products.loadingProducts")}</p>}
            {!loading && results?.length === 0 && (
              <p className="empty-state">{t("products.emptyState")}</p>
            )}
            {!loading && results?.length > 0 && (
              <div className="product-grid">
                {results.map((p) => (
                  <ProductCard product={p} key={p.id} />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="section">
              <div className="container">
                <div className="section-head-row">
                  <SectionLabel eyebrow={t("products.featuredEyebrow")} title={t("products.featuredTitle")} />
                </div>
                <div className="product-grid">
                  {featured.map((p) => (
                    <ProductCard product={p} key={p.id} />
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="section">
            <div className="container">
              <SectionLabel eyebrow={t("products.brandsEyebrow")} title={t("products.browseByBrand")} />
              <BrandLogoGrid brands={brands} getHref={(b) => `/products/${b.slug}`} />
            </div>
          </section>

          <section className="section">
            <div className="container">
              <SectionLabel eyebrow={t("products.categoriesEyebrow")} title={t("products.browseByCategory")} />
              <div className="category-grid">
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    className="category-cell"
                    onClick={() => setFilters((f) => ({ ...f, category: c.slug }))}
                  >
                    <span>{c.name}</span>
                    <span className="category-cell__arrow">→</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </>
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
