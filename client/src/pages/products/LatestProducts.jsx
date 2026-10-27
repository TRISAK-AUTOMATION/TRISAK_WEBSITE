import { Link, useSearchParams } from "react-router-dom";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import FilterableProductListing from "../../components/FilterableProductListing.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

// Products shown per category section before a "View all" link appears.
// Override per visit with /products/latest?limit=6 (clamped to 1–24).
const DEFAULT_PER_CATEGORY = 4;
const MAX_PER_CATEGORY = 24;

function resolveLimit(raw) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 1) return DEFAULT_PER_CATEGORY;
  return Math.min(n, MAX_PER_CATEGORY);
}

export default function LatestProducts() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const limit = resolveLimit(searchParams.get("limit"));

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <Breadcrumb
            items={[
              { label: t("nav.home"), to: "/" },
              { label: t("nav.products"), to: "/products" },
              { label: t("products.latestPageTitle") },
            ]}
          />
          <span className="hero__meta">{t("products.heroMeta")}</span>
          <h1>{t("products.latestPageTitle")}</h1>
          <p className="hero__sub">{t("products.latestPageSub")}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <FilterableProductListing perCategoryLimit={limit} />
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
