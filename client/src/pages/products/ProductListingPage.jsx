import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import FilterableProductListing from "../../components/FilterableProductListing.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { buildListingUrl } from "../../utils/productFilterUrl.js";

// Per-category cap on the unfiltered listing (override with ?limit=, 1–24).
const DEFAULT_PER_CATEGORY = 4;
const MAX_PER_CATEGORY = 24;

function resolveLimit(raw) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 1) return DEFAULT_PER_CATEGORY;
  return Math.min(n, MAX_PER_CATEGORY);
}

/**
 * The product listing, for every one of these URLs:
 *
 *   /products/latest                                   everything, newest first
 *   /products/:brand                                   one brand (no category preselected)
 *   /products/:brand/:category                         brand + category (and its subcategories)
 *   /products/:brand/:category/cat/<id>/<id>…          brand + subcategory
 *   …any of them with ?category= / ?brand= / ?q= / ?page=
 *
 * They are all the same page on purpose: one route element for all of them
 * means React keeps it mounted as the filters move between those URL shapes, so
 * ticking a checkbox only changes the address and the results — no reload, no
 * refetch, no flash. The filter state itself lives in the URL and is read by
 * FilterableProductListing; this component only renders the hero, whose title
 * and breadcrumb follow the live selection.
 */
export default function ProductListingPage() {
  const { t } = useLanguage();
  const { brandSlug } = useParams();
  const [searchParams] = useSearchParams();
  const limit = resolveLimit(searchParams.get("limit"));
  const [selection, setSelection] = useState(null); // live filter state reported by the listing

  // No brand, category or search in the URL → the plain "latest products" listing.
  const unfiltered = !brandSlug && !["brand", "category", "q"].some((key) => searchParams.get(key));

  const nodes = selection ? selection.nodes : [];
  const selBrands = selection ? selection.brands : [];
  // exactly one brand → that brand; none/several → don't name a single brand
  const activeBrand = selBrands.length === 1 ? selBrands[0] : null;
  // exactly one selected category/subcategory → name it; otherwise use the
  // brand title so the heading never misrepresents the results
  const single = nodes.length === 1 ? nodes[0] : null;
  const title = single
    ? single[single.length - 1].name
    : activeBrand
      ? t("products.brandPageTitle").replace("{brand}", activeBrand.name)
      : t("nav.products");

  const trail = unfiltered
    ? [
        { label: t("nav.home"), to: "/" },
        { label: t("nav.products"), to: "/products" },
        { label: t("products.latestPageTitle") },
      ]
    : [
        { label: t("nav.home"), to: "/" },
        { label: t("nav.products"), to: "/products" },
        ...(activeBrand
          ? [{ label: activeBrand.name, to: single ? buildListingUrl({ brands: [activeBrand.slug] }) : undefined }]
          : []),
        ...(single
          ? single.map((c, i) => ({
              label: c.name,
              to:
                i === single.length - 1
                  ? undefined
                  : buildListingUrl({ brands: activeBrand ? [activeBrand.slug] : [], chains: [single.slice(0, i + 1)] }),
            }))
          : []),
      ];

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <Breadcrumb items={trail} />
          {unfiltered ? (
            <>
              <span className="hero__meta">{t("products.heroMeta")}</span>
              <h1>{t("products.latestPageTitle")}</h1>
              <p className="hero__sub">{t("products.latestPageSub")}</p>
            </>
          ) : (
            <>
              {activeBrand && <span className="hero__meta">{activeBrand.name}</span>}
              <h1>{selection ? title : "…"}</h1>
            </>
          )}
        </div>
      </section>

      <section className="section product-listing-section">
        <div className="container">
          <FilterableProductListing perCategoryLimit={limit} onSelectionChange={setSelection} />
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
