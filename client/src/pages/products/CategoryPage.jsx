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
  const [selection, setSelection] = useState(null); // live filter state from the listing
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelection(null); // new route → start from the route's own category
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

  // Hero title + breadcrumb follow the live filters. Until the listing has
  // reported its selection, fall back to the category this route points at.
  const nodes = selection ? selection.nodes : crumb.length ? [crumb] : [];
  const selBrands = selection ? selection.brands : brand ? [{ slug: brand.slug, name: brand.name }] : [];
  // exactly one brand → that brand; none/several → don't name a single brand
  const activeBrand = selBrands.length === 1 ? selBrands[0] : null;
  const linkBrandSlug = activeBrand?.slug || brandSlug;

  // exactly one selected category/subcategory → name it; otherwise use the
  // brand title so the heading never misrepresents the results
  const single = nodes.length === 1 ? nodes[0] : null;
  const title = single
    ? single[single.length - 1].name
    : activeBrand
      ? t("products.brandPageTitle").replace("{brand}", activeBrand.name)
      : t("nav.products");

  const trail = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.products"), to: "/products" },
    ...(activeBrand ? [{ label: activeBrand.name, to: `/products/${activeBrand.slug}` }] : []),
    ...(single
      ? single.map((c, i) => ({
          label: c.name,
          to: i === single.length - 1 ? undefined : categoryLevelHref(linkBrandSlug, single, i),
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
          <h1>{loading ? "…" : title}</h1>
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
              onSelectionChange={setSelection}
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
