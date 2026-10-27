import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { categoryLevelHref } from "../../utils/categoryBreadcrumb.js";

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

  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [hrefs, setHrefs] = useState({}); // group key -> category listing URL
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    api
      .getProducts({ sort: "newest" })
      .then((rows) => {
        if (cancelled) return;
        setProducts(Array.isArray(rows) ? rows : []);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Products arrive newest-first; grouping in arrival order keeps every
  // section newest-first and orders sections by their newest product.
  // A category listing is brand-scoped, so groups are brand + category.
  const groups = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const key = `${p.brand_slug}/${p.category_slug}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: p.category,
          categorySlug: p.category_slug,
          brandSlug: p.brand_slug,
          brandName: p.brand,
          items: [],
        });
      }
      map.get(key).items.push(p);
    }
    const list = [...map.values()];
    const nameCount = {};
    for (const g of list) nameCount[g.name] = (nameCount[g.name] || 0) + 1;
    // Same category name under several brands → tell the sections apart.
    return list.map((g) => ({
      ...g,
      heading: nameCount[g.name] > 1 && g.brandName ? `${g.name} · ${g.brandName}` : g.name,
    }));
  }, [products]);

  // Resolve each category's real listing URL (handles nested subcategories)
  // with the existing category + breadcrumb endpoints.
  useEffect(() => {
    if (groups.length === 0) return;
    let cancelled = false;
    Promise.allSettled(
      groups.map(async (g) => {
        const cat = await api.getCategory(g.categorySlug);
        const crumb = await api.getCategoryBreadcrumb(cat.id);
        return [g.key, categoryLevelHref(g.brandSlug, crumb, crumb.length - 1)];
      })
    ).then((results) => {
      if (cancelled) return;
      const next = {};
      for (const r of results) if (r.status === "fulfilled") next[r.value[0]] = r.value[1];
      setHrefs(next);
    });
    return () => {
      cancelled = true;
    };
  }, [groups]);

  const hrefFor = (g) => hrefs[g.key] || `/products/${g.brandSlug}/${g.categorySlug}`;

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
          {status === "loading" && <p className="empty-state">{t("products.loadingProducts")}</p>}

          {status === "error" && (
            <p className="empty-state">
              {t("products.latestError")}{" "}
              <button type="button" className="btn" onClick={() => setAttempt((n) => n + 1)}>
                {t("products.latestRetry")}
              </button>
            </p>
          )}

          {status === "ready" && groups.length === 0 && (
            <p className="empty-state">{t("products.noProductsFound")}</p>
          )}

          {status === "ready" &&
            groups.map((g) => {
              const shown = g.items.slice(0, limit);
              const more = g.items.length > shown.length;
              return (
                <section key={g.key} className="latest-group">
                  <div className="latest-group__head">
                    <h2 className="latest-group__title">
                      <Link to={hrefFor(g)}>{g.heading}</Link>
                    </h2>
                    {more && (
                      <Link to={hrefFor(g)} className="latest-group__all">
                        {t("products.viewAll")} ({g.items.length}) →
                      </Link>
                    )}
                  </div>
                  <div className="product-tile-grid product-tile-grid--four">
                    {shown.map((p) => (
                      <ProductCard key={p.id} product={p} variant="plain" />
                    ))}
                  </div>
                </section>
              );
            })}
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
