import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import SectionLabel from "../../components/SectionLabel.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import LatestProductsCarousel from "../../components/LatestProductsCarousel.jsx";
import BrandLogoGrid from "../../components/BrandLogoGrid.jsx";
import CategoryTileGrid from "../../components/CategoryTileGrid.jsx";
import HeroSlideshow from "../../components/HeroSlideshow.jsx";
import Pagination, { PRODUCTS_PER_PAGE } from "../../components/Pagination.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import useSyncedQuery from "../../hooks/useSyncedQuery.js";
import { buildListingUrl, normalizeQuery } from "../../utils/productFilterUrl.js";

export default function ProductsOverview() {
  const { t, lang } = useLanguage();
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState(null); // null = not searching yet
  const [loading, setLoading] = useState(false);
  const [pageContent, setPageContent] = useState(null);
  const resultsRef = useRef(null);
  const pageChanged = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  // The search box and brand select live in the URL (/products?brand=…&q=…&page=…),
  // so a refresh, copied link or Back/Forward reproduces the same results.
  // Picking a category is different: it leaves this page for the product URL
  // (/products/:brand/:category), where the full filter sidebar takes over.
  const [searchParams, setSearchParams] = useSearchParams();
  const brandParam = searchParams.get("brand") || "";
  const urlQuery = normalizeQuery(searchParams.get("q"));
  const legacyCategory = searchParams.get("category") || ""; // old links: /products?category=…
  const urlPage = Number.parseInt(searchParams.get("page"), 10);
  const requestedPage = Number.isInteger(urlPage) && urlPage > 1 ? urlPage : 1;

  const updateParams = (patch, options) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    }, options);

  // typing writes ?q= after a short pause (replacing the entry, so Back skips the keystrokes)
  const [queryDraft, setQueryDraft] = useSyncedQuery(
    urlQuery,
    (q) => updateParams({ q, page: "" }, { replace: true }),
    location.key
  );

  useEffect(() => {
    api.getBrands().then(setBrands).catch(() => setBrands([]));
    api.getCategories().then(setCategories).catch(() => setCategories([]));
    api
      .getProductsPageContent()
      .then(setPageContent)
      .catch(() => setPageContent(null));
  }, []);

  // Reads `${field}_${lang}` from the admin-editable
  // products_page_content row, falling back to the built-in
  // translation if the DB row isn't loaded yet (or unedited).
  const pc = (field, fallback) => {
    if (!pageContent) return fallback;
    const value = pageContent[`${field}_${lang}`];
    return value || fallback;
  };

  // an unknown ?brand= is ignored rather than treated as "no results"
  const brand = !brands.length || brands.some((b) => b.slug === brandParam) ? brandParam : "";
  const filters = { brand, q: urlQuery };
  const hasActiveFilters = Boolean(brand || urlQuery);

  // Category → its product URL, carrying the brand picked here (if any) and the
  // search keywords: e.g. OMRON + "Sensors & Identification" → /products/omron/sensors-identification
  const openCategory = (category) =>
    navigate(buildListingUrl({ brands: brand ? [brand] : [], chains: [[{ id: category.id, slug: category.slug }]], q: urlQuery }));
  // Slideshow images; falls back to the legacy single image if the list is empty.
  const heroBgImages = Array.isArray(pageContent?.hero_bg_images) && pageContent.hero_bg_images.length
    ? pageContent.hero_bg_images
    : pageContent?.hero_bg_image
      ? [pageContent.hero_bg_image]
      : [];
  const hasHeroBg = heroBgImages.length > 0;

  useEffect(() => {
    if (!hasActiveFilters) {
      setResults(null);
      return;
    }
    // Ignore a response that arrives after the filters have changed again, so a
    // slow earlier request can't overwrite the results of the current search.
    let cancelled = false;
    setLoading(true);
    api
      .getProducts(filters)
      .then((rows) => {
        if (!cancelled) setResults(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.brand, filters.q]);

  // (a new search / brand drops ?page= from the URL, so it always starts on page 1)
  const totalPages = Math.max(1, Math.ceil((results?.length || 0) / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageResults = (results || []).slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const goToPage = (n) => {
    pageChanged.current = true;
    updateParams({ page: n > 1 ? String(n) : "" });
  };
  useEffect(() => {
    if (!pageChanged.current) return;
    pageChanged.current = false;
    const el = resultsRef.current;
    if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 110), behavior: "smooth" });
  }, [currentPage]);

  // old links such as /products?category=plc (e.g. from the menu) → the product URL
  if (legacyCategory) {
    return (
      <Navigate
        to={buildListingUrl({ brands: brandParam ? [brandParam] : [], chains: [[{ slug: legacyCategory }]], q: urlQuery })}
        replace
      />
    );
  }

  return (
    <>
      <section className={`hero hero--compact ${hasHeroBg ? "hero--has-bg" : ""}`}>
        {hasHeroBg && (
          <>
            <HeroSlideshow images={heroBgImages} />
            <div className="hero__bg-scrim" aria-hidden="true" />
          </>
        )}
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{pc("hero_meta", t("products.heroMeta"))}</span>
          <h1>{pc("hero_title", t("products.heroTitle"))}</h1>
          <p className="hero__sub">{pc("hero_sub", t("products.heroSub"))}</p>

          <div className="catalog-search">
            <input
              type="text"
              placeholder={t("products.searchPlaceholder")}
              value={queryDraft}
              onChange={(e) => setQueryDraft(e.target.value)}
            />
            <select
              value={filters.brand}
              onChange={(e) => updateParams({ brand: e.target.value, page: "" })}
            >
              <option value="">{t("products.allBrands")}</option>
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value=""
              onChange={(e) => {
                const category = categories.find((c) => c.slug === e.target.value);
                if (category) openCategory(category);
              }}
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
                onClick={() => setSearchParams({})}
              >
                {t("products.reset")}
              </button>
            )}
          </div>
        </div>
      </section>

      {hasActiveFilters ? (
        <section className="section" ref={resultsRef}>
          <div className="container">
            <SectionLabel eyebrow={t("products.finderEyebrow")} title={t("products.resultsTitle")} />
            {loading && <p className="empty-state">{t("products.loadingProducts")}</p>}
            {!loading && results?.length === 0 && (
              <p className="empty-state">{t("products.emptyState")}</p>
            )}
            {!loading && results?.length > 0 && (
              <div className="product-grid">
                {pageResults.map((p) => (
                  <ProductCard product={p} key={p.id} />
                ))}
              </div>
            )}
            {!loading && results?.length > 0 && (
              <Pagination page={currentPage} totalPages={totalPages} onChange={goToPage} />
            )}
          </div>
        </section>
      ) : (
        <>
          <LatestProductsCarousel />

          <section className="section">
            <div className="container">
              <SectionLabel eyebrow={pc("brands_eyebrow", t("products.brandsEyebrow"))} title={t("products.browseByBrand")} />
              <BrandLogoGrid brands={brands} getHref={(b) => `/products/${b.slug}`} />
            </div>
          </section>

          <section className="section">
            <div className="container">
              <SectionLabel eyebrow={pc("categories_eyebrow", t("products.categoriesEyebrow"))} title={t("products.browseByCategory")} />
              <CategoryTileGrid
                categories={categories}
                onSelect={openCategory}
              />
            </div>
          </section>
        </>
      )}

      <section className="cta-band">
        <div className="container cta-band__wrap">
          <h2>{pc("cta_title", t("products.ctaTitle"))}</h2>
          <Link to="/contacts" className="btn btn-primary">
            {t("common.contactUs")} <span className="btn-arrow">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
