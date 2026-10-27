import { Fragment, useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { categoryLevelHref, categoryBreadcrumbItems } from "../../utils/categoryBreadcrumb.js";

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
  const [siblings, setSiblings] = useState([]); // same-level categories (sidebar)
  const [children, setChildren] = useState([]); // subcategories of current node
  const [products, setProducts] = useState([]);
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

        const [cat, crumbChain, kids] = await Promise.all([
          api.getCategoryById(currentId),
          api.getCategoryBreadcrumb(currentId),
          api.getCategoryChildren(currentId, brandSlug),
        ]);
        if (cancelled) return;

        const sibs = cat.parent_id
          ? await api.getCategoryChildren(cat.parent_id, brandSlug)
          : await api.getCategoriesForBrand(brandSlug);
        if (cancelled) return;

        // Products of the selected category. When it only groups
        // subcategories (no products of its own), include theirs too so the
        // grid is never empty just because products live one level down.
        let prods = await api.getProducts({ brand: brandSlug, categoryId: currentId });
        if (prods.length === 0 && kids.length > 0) {
          const groups = await Promise.all(
            kids.map((k) => api.getProducts({ brand: brandSlug, categoryId: k.id }))
          );
          const seen = new Set();
          prods = groups.flat().filter((p) => !seen.has(p.id) && seen.add(p.id));
        }
        if (cancelled) return;

        setBrand(b);
        setCategory(cat);
        setCrumb(crumbChain);
        setChildren(kids);
        setSiblings(sibs);
        setProducts(prods);
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

  const basePath = `/products/${brandSlug}/${categorySlug}`;
  const isTop = crumb.length <= 1;

  const childHref = (childId) => {
    const chain = [...crumb.slice(1).map((c) => c.id), childId];
    return `${basePath}/cat/${chain.join("/")}`;
  };
  const siblingHref = (sib) => {
    if (isTop) return `/products/${brandSlug}/${sib.slug}`;
    const chain = [...crumb.slice(1, -1).map((c) => c.id), sib.id];
    return `${basePath}/cat/${chain.join("/")}`;
  };
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

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container category-layout">
          <aside className="category-sidebar">
            <div className="category-sidebar__heading">{brand?.name}</div>
            <nav className="category-sidebar__tree">
              {crumb.slice(0, -1).map((c, i) => (
                <Link
                  key={c.id}
                  to={categoryLevelHref(brandSlug, crumb, i)}
                  className="category-sidebar__ancestor"
                  style={{ paddingLeft: 20 + i * 18 }}
                >
                  {c.name}
                </Link>
              ))}
              {siblings.map((s) => (
                <Fragment key={s.id}>
                  <Link
                    to={siblingHref(s)}
                    style={{ paddingLeft: 20 + Math.max(crumb.length - 1, 0) * 18 }}
                    className={`category-sidebar__item ${s.id === category?.id ? "is-active" : ""}`}
                  >
                    {s.name}
                  </Link>
                  {s.id === category?.id &&
                    children.map((child) => (
                      <Link
                        key={child.id}
                        to={childHref(child.id)}
                        style={{ paddingLeft: 20 + Math.max(crumb.length, 1) * 18 }}
                        className="category-sidebar__item category-sidebar__item--child"
                      >
                        {child.name}
                      </Link>
                    ))}
                </Fragment>
              ))}
            </nav>
          </aside>

          <div className="category-main">
            {loading && <p className="empty-state">{t("products.loadingProducts")}</p>}

            {!loading && products.length === 0 && (
              <p className="empty-state">{t("products.noProductsFound")}</p>
            )}

            {!loading && products.length > 0 && (
              <div className="product-tile-grid">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} variant="plain" />
                ))}
              </div>
            )}
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
