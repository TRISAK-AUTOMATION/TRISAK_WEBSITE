import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import FilterableProductListing from "../../components/FilterableProductListing.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { categoryLevelHref } from "../../utils/categoryBreadcrumb.js";

export default function CategoryPage() {
  const params = useParams();
  const { brandSlug, categorySlug } = params;
  // "/products/:brand/:categorySlug/cat/*" — splat is a "/"-joined chain
  // of subcategory ids, e.g. "12/45". Empty/undefined at the top level.
  const splat = params["*"] || "";
  const idChain = splat.split("/").filter(Boolean).map(Number);
  const { t } = useLanguage();

  const [brand, setBrand] = useState(null);
  const [category, setCategory] = useState(null); // current node
  const [crumb, setCrumb] = useState([]); // [{id,name,slug}, ...] root..current
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    async function run() {
      try {
        const b = await api.getBrand(brandSlug);
        if (cancelled) return;

        let currentId;
        if (idChain.length > 0) {
          currentId = idChain[idChain.length - 1];
        } else {
          const topCat = await api.getCategory(categorySlug);
          currentId = topCat.id;
        }

        const [cat, crumbChain] = await Promise.all([
          api.getCategoryById(currentId),
          api.getCategoryBreadcrumb(currentId),
        ]);
        if (cancelled) return;

        setBrand(b);
        setCategory(cat);
        setCrumb(crumbChain);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandSlug, categorySlug, splat]);

  if (notFound) return <Navigate to={`/products/${brandSlug}`} replace />;

  const crumbHref = (i) => categoryLevelHref(brandSlug, crumb, i);

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <Breadcrumb
            items={[
              { label: t("nav.home"), to: "/" },
              { label: t("nav.products"), to: "/products" },
              { label: brand?.name || brandSlug, to: `/products/${brandSlug}` },
              ...crumb.map((c, i) => ({
                label: c.name,
                to: i === crumb.length - 1 ? undefined : crumbHref(i),
              })),
            ]}
          />
          <span className="hero__meta">{brand?.name}</span>
          <h1>{category?.name || "…"}</h1>
        </div>
      </section>

      <section className="section product-listing-section">
        <div className="container">
          {loading && <p className="empty-state">{t("products.loadingProducts")}</p>}
          {!loading && category && (
            <FilterableProductListing
              key={`${brandSlug}/${category.id}`}
              initialBrandSlug={brandSlug}
              initialCategoryId={category.id}
            />
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
