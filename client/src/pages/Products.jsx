import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import SectionLabel from "../components/SectionLabel.jsx";
import ProductThumb from "../components/ProductThumb.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Products() {
  const { t } = useLanguage();

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getBrands(), api.getCategories(), api.getProducts()])
      .then(([b, c, p]) => {
        setBrands(b);
        setCategories(c);
        setFeatured(p.slice(0, 8));
      })
      .catch(() => {
        setBrands([]);
        setCategories([]);
        setFeatured([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!q) {
      setResults(null);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      api
        .getProducts({ q })
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{t("products.heroMeta")}</span>
          <h1>{t("products.heroTitle")}</h1>
          <p className="hero__sub">{t("products.heroSub")}</p>

          <div className="product-finder product-finder--hero">
            <input
              type="text"
              placeholder={t("catalog.searchPlaceholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {q && (
            <div className="search-results-panel">
              {searching && <p className="empty-state">{t("catalog.loading")}</p>}
              {!searching && results?.length === 0 && (
                <p className="empty-state">{t("catalog.noResults")}</p>
              )}
              {!searching && results?.length > 0 && (
                <div className="search-results-list">
                  {results.slice(0, 6).map((p) => (
                    <Link to={`/products/item/${p.slug}`} className="search-result-row" key={p.id}>
                      <ProductThumb label={p.model || p.name} isNew={p.is_new} size="sm" />
                      <span>
                        <strong>{p.model || p.name}</strong>
                        <span className="search-result-row__meta">
                          {p.brand}
                          {p.series ? ` — ${p.series}` : ""}
                        </span>
                      </span>
                      <span className="search-result-row__arrow">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Featured products */}
      <section className="section">
        <div className="container">
          <SectionLabel index="01" eyebrow={t("catalog.featuredProducts")} title={t("catalog.featuredProducts")} />
          {loading && <p className="empty-state">{t("catalog.loading")}</p>}
          {!loading && featured.length === 0 && <p className="empty-state">{t("catalog.noResults")}</p>}
          {!loading && featured.length > 0 && (
            <div className="product-grid">
              {featured.map((p) => (
                <Link to={`/products/item/${p.slug}`} className="grid-cell product-card" key={p.id}>
                  <ProductThumb label={p.model || p.name} isNew={p.is_new} />
                  <span className="product-card__brand">
                    {p.brand}
                    {p.series ? ` — ${p.series}` : ""}
                  </span>
                  <h3>{p.name}</h3>
                  {p.model && <span className="product-card__model">{p.model}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Brands */}
      <section className="section">
        <div className="container">
          <SectionLabel index="02" eyebrow={t("products.brandsEyebrow")} title={t("catalog.browseByBrand")} />
          <div className="brand-strip">
            {brands.map((b) => (
              <Link className="brand-strip__name" key={b.slug} to={`/products/brand/${b.slug}`}>
                {b.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <SectionLabel index="03" eyebrow={t("products.categoriesEyebrow")} title={t("catalog.browseByCategory")} />
          <div className="category-grid">
            {categories.map((c) => (
              <Link key={c.slug} className="category-cell" to={`/products/category/${c.slug}`}>
                <span>{c.name}</span>
                <span className="category-cell__arrow">→</span>
              </Link>
            ))}
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
