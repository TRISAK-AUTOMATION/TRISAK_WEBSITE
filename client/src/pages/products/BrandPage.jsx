import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import FilterableProductListing from "../../components/FilterableProductListing.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { categoryLevelHref } from "../../utils/categoryBreadcrumb.js";

// Same per-category cap as /products/latest (override with ?limit=, 1–24).
const DEFAULT_PER_CATEGORY = 4;
const MAX_PER_CATEGORY = 24;

function resolveLimit(raw) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 1) return DEFAULT_PER_CATEGORY;
  return Math.min(n, MAX_PER_CATEGORY);
}

/**
 * Brand landing page ("Browse by Brand" → e.g. OMRON).
 *
 * Renders the brand's products with the exact same category-grouped listing
 * used by /products/latest (FilterableProductListing: section heading per
 * category, thin divider between sections, shared product cards/grid), just
 * pre-filtered to this brand. Category headings and "View all" links go to
 * the existing /products/:brand/:category URLs.
 */
export default function BrandPage() {
  const { brandSlug } = useParams();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const limit = resolveLimit(searchParams.get("limit"));

  const [brand, setBrand] = useState(null);
  const [selection, setSelection] = useState(null); // live filter state from the listing
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBrand(null);
    setSelection(null);
    setNotFound(false);
    api
      .getBrand(brandSlug)
      .then((b) => {
        if (!cancelled) setBrand(b);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [brandSlug]);

  if (notFound) return <Navigate to="/products" replace />;

  // Hero title + breadcrumb follow the live filters (same rules as CategoryPage);
  // until the listing reports its selection, fall back to the route's brand.
  const nodes = selection ? selection.nodes : [];
  const selBrands = selection ? selection.brands : brand ? [{ slug: brand.slug, name: brand.name }] : [];
  const activeBrand = selBrands.length === 1 ? selBrands[0] : null;
  const single = nodes.length === 1 ? nodes[0] : null;
  // Heading stays on the brand ("OMRON Products") while the brand is the active
  // filter, even as categories are ticked; the breadcrumb below shows the drill-down.
  const title = activeBrand
    ? t("products.brandPageTitle").replace("{brand}", activeBrand.name)
    : single
      ? single[single.length - 1].name
      : t("nav.products");

  const trail = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.products"), to: "/products" },
    ...(activeBrand ? [{ label: activeBrand.name, to: single ? `/products/${activeBrand.slug}` : undefined }] : []),
    ...(single
      ? single.map((c, i) => ({
          label: c.name,
          to: i === single.length - 1 ? undefined : categoryLevelHref(activeBrand?.slug || brandSlug, single, i),
        }))
      : []),
  ];

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <Breadcrumb items={trail} />
          {activeBrand && <span className="hero__meta">{activeBrand.name}</span>}
          <h1>{brand ? title : "…"}</h1>
        </div>
      </section>

      <section className="section product-listing-section">
        <div className="container">
          {brand && (
            <FilterableProductListing
              key={brandSlug}
              initialBrandSlug={brandSlug}
              perCategoryLimit={limit}
              onSelectionChange={setSelection}
            />
          )}
          {!brand && <p className="empty-state">{t("products.loadingProducts")}</p>}
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
