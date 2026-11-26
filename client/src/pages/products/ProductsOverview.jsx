import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import SectionLabel from "../../components/SectionLabel.jsx";
import LatestProductsCarousel from "../../components/LatestProductsCarousel.jsx";
import BrandLogoGrid from "../../components/BrandLogoGrid.jsx";
import HeroSlideshow from "../../components/HeroSlideshow.jsx";
import Reveal from "../../components/Reveal.jsx";
import AvailabilityBadge from "../../components/AvailabilityBadge.jsx";
import Pagination, { PRODUCTS_PER_PAGE } from "../../components/Pagination.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import useSyncedQuery from "../../hooks/useSyncedQuery.js";
import { normalizeQuery } from "../../utils/productFilterUrl.js";
import { productHref } from "../../utils/productAvailability.js";

// id of the product finder section: brand logos link here (/products?brand=…#products-finder)
const FINDER_ID = "products-finder";
const STATUSES = ["available", "discontinued"];

// "discontinued" also covers discontinued products that have a replacement
const matchesStatus = (p, status) =>
  !status || (status === "available") === (p.availability_status === "available");

export default function ProductsOverview() {
  const { t, lang } = useLanguage();
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [pageContent, setPageContent] = useState(null);
  // rotating "Try: …" hint inside the empty search box
  const [hintIndex, setHintIndex] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const finderRef = useRef(null);
  const pageChanged = useRef(false);
  const location = useLocation();

  // The finder's filters live in the URL (/products?brand=…&category=…&status=…&q=…&page=…),
  // so a refresh, copied link or Back/Forward reproduces the same table.
  const [searchParams, setSearchParams] = useSearchParams();
  const brandParam = searchParams.get("brand") || "";
  const categoryParam = searchParams.get("category") || "";
  const statusParam = searchParams.get("status") || "";
  const urlQuery = normalizeQuery(searchParams.get("q"));
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

  const searchExamples = t("products.searchExamples");
  const showHint = !queryDraft && !searchFocused && Array.isArray(searchExamples) && searchExamples.length > 0;
  useEffect(() => {
    if (!showHint || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = setInterval(() => setHintIndex((i) => i + 1), 2800);
    return () => clearInterval(timer);
  }, [showHint]);

  // unknown ?brand= / ?category= / ?status= are ignored rather than treated as "no results"
  const brand = !brands.length || brands.some((b) => b.slug === brandParam) ? brandParam : "";
  const category = !categories.length || categories.some((c) => c.slug === categoryParam) ? categoryParam : "";
  const status = STATUSES.includes(statusParam) ? statusParam : "";
  const hasActiveFilters = Boolean(brand || category || status || urlQuery);

  // Slideshow images; falls back to the legacy single image if the list is empty.
  const heroBgImages = Array.isArray(pageContent?.hero_bg_images) && pageContent.hero_bg_images.length
    ? pageContent.hero_bg_images
    : pageContent?.hero_bg_image
      ? [pageContent.hero_bg_image]
      : [];
  const hasHeroBg = heroBgImages.length > 0;

  // brand / category / keywords are filtered by the server (a category includes its
  // subcategories); status is filtered here
  useEffect(() => {
    // Ignore a response that arrives after the filters have changed again, so a
    // slow earlier request can't overwrite the results of the current search.
    let cancelled = false;
    setLoading(true);
    api
      .getProducts({ brand, category, q: urlQuery })
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
  }, [brand, category, urlQuery]);

  // (a filter change drops ?page= from the URL, so it always starts on page 1)
  const rows = (results || []).filter((p) => matchesStatus(p, status));
  const totalPages = Math.max(1, Math.ceil(rows.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const goToPage = (n) => {
    pageChanged.current = true;
    updateParams({ page: n > 1 ? String(n) : "" });
  };
  useEffect(() => {
    if (!pageChanged.current) return;
    pageChanged.current = false;
    const el = finderRef.current;
    if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 110), behavior: "smooth" });
  }, [currentPage]);

  return (
    <>
      <section className={`hero hero--compact hero--products hero--parallax ${hasHeroBg ? "hero--has-bg" : ""}`}>
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
        </div>
      </section>

      <LatestProductsCarousel />

      <section className="section products-brands">
        <Reveal className="container">
          <SectionLabel eyebrow={pc("brands_eyebrow", t("products.brandsEyebrow"))} title={t("products.browseByBrand")} />
          {/* picking a brand filters the finder table below and scrolls down to it */}
          <BrandLogoGrid brands={brands} getHref={(b) => `/products?brand=${b.slug}#${FINDER_ID}`} />
        </Reveal>
      </section>

      <section className="section products-finder" id={FINDER_ID} ref={finderRef}>
        <div className="container">
          <SectionLabel eyebrow={t("products.finderEyebrow")} title={t("products.finderTitle")} />

          {/* labelled filters in one row, like a job board */}
          <div className="products-finder__filters">
            <label className="products-finder__field products-finder__field--search">
              <span className="products-finder__label">{t("products.colSearch")} :</span>
              <span className={`catalog-search__field${showHint ? " has-hint" : ""}`}>
                <svg className="catalog-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="m15.5 15.5 5 5" />
                </svg>
                <input
                  type="text"
                  placeholder={t("products.searchPlaceholder")}
                  value={queryDraft}
                  onChange={(e) => setQueryDraft(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                {showHint && (
                  <span className="catalog-search__hint" aria-hidden="true">
                    {t("products.searchTry")}{" "}
                    <span className="catalog-search__hint-word" key={hintIndex}>
                      {searchExamples[hintIndex % searchExamples.length]}
                    </span>
                  </span>
                )}
              </span>
            </label>
            <label className="products-finder__field">
              <span className="products-finder__label">{t("products.colBrand")} :</span>
              <select value={brand} onChange={(e) => updateParams({ brand: e.target.value, page: "" })}>
                <option value="">{t("products.allBrands")}</option>
                {brands.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="products-finder__field">
              <span className="products-finder__label">{t("products.colCategory")} :</span>
              <select value={category} onChange={(e) => updateParams({ category: e.target.value, page: "" })}>
                <option value="">{t("products.allCategories")}</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="products-finder__field">
              <span className="products-finder__label">{t("products.colStatus")} :</span>
              <select value={status} onChange={(e) => updateParams({ status: e.target.value, page: "" })}>
                <option value="">{t("products.allStatuses")}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`products.availability.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            {hasActiveFilters && (
              <button type="button" className="btn products-finder__reset" onClick={() => setSearchParams({})}>
                {t("products.reset")}
              </button>
            )}
          </div>

          {loading && !results && <p className="empty-state">{t("products.loadingProducts")}</p>}
          {results && rows.length === 0 && !loading && <p className="empty-state">{t("products.emptyState")}</p>}
          {rows.length > 0 && (
            <div className={`products-finder__scroll${loading ? " is-loading" : ""}`}>
              <table className="products-finder__table">
                <thead>
                  <tr>
                    <th scope="col">{t("products.colName")}</th>
                    <th scope="col">{t("products.colBrand")}</th>
                    <th scope="col">{t("products.colCategory")}</th>
                    <th scope="col">{t("products.colStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.has_page ? (
                          <Link to={productHref(p)} className="products-finder__name">
                            {p.name}
                          </Link>
                        ) : (
                          <span className="products-finder__name">{p.name}</span>
                        )}
                        {p.item_no && p.item_no !== p.name && <small>{p.item_no}</small>}
                      </td>
                      <td>{p.brand}</td>
                      <td>{p.category}</td>
                      <td>
                        <AvailabilityBadge status={p.availability_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rows.length > 0 && <Pagination page={currentPage} totalPages={totalPages} onChange={goToPage} />}
        </div>
      </section>

      <section className="cta-band products-cta">
        <div className="products-cta__light" aria-hidden="true" />
        <Reveal className="container cta-band__wrap">
          <h2>{pc("cta_title", t("products.ctaTitle"))}</h2>
          <Link to="/contacts" className="btn btn-primary">
            {t("common.contactUs")} <span className="btn-arrow">→</span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
