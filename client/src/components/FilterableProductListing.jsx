import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import ProductCard from "./ProductCard.jsx";
import ProductFilterSidebar from "./ProductFilterSidebar.jsx";
import Pagination, { PRODUCTS_PER_PAGE } from "./Pagination.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { categoryLevelHref } from "../utils/categoryBreadcrumb.js";
import { KEEP_SCROLL_STATE, buildListingUrl, normalizeQuery, parseListingUrl } from "../utils/productFilterUrl.js";
import {
  buildTree,
  chainOf,
  chainsOf,
  selectionFromCategories,
  selectionKey,
  subtreeIds,
} from "../utils/productFilterTree.js";
import useSyncedQuery from "../hooks/useSyncedQuery.js";

const EMPTY_SET = new Set();

/**
 * Product listing with the filter sidebar.
 *
 * The URL is the single source of truth for the shareable filter state — the
 * selected brands and categories, the search keywords and the page. Nothing of
 * that is kept in component state: it is derived from the route on every render
 * (see utils/productFilterUrl.js for the URL shapes), and every sidebar
 * interaction just navigates to the matching URL. That is what makes refresh,
 * copied links and Back/Forward reproduce exactly the same checkboxes and
 * results. Products are fetched once and filtered in the browser, so changing a
 * filter never reloads the page or refetches anything.
 *
 * Must be rendered by one of the product listing routes (it reads the route params).
 */
export default function FilterableProductListing({
  perCategoryLimit = null, // applied only while no filter is active
  onSelectionChange = null, // ({ nodes, brands }) — lets the page title follow the filters
}) {
  const { t } = useLanguage();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set()); // sidebar branches that are open (UI only)
  const [panelOpen, setPanelOpen] = useState(false);
  const mainRef = useRef(null);
  const pageChanged = useRef(false);
  const ownSelection = useRef(null); // selection produced by our own navigation (see reveal effect)

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    Promise.all([api.getProducts({ sort: "newest" }), api.getCategoryTree(), api.getBrands()])
      .then(([products, rows, brandRows]) => {
        if (cancelled) return;
        const prods = Array.isArray(products) ? products : [];
        const tree = buildTree(Array.isArray(rows) ? rows : [], prods);
        const allBrands = Array.isArray(brandRows) ? brandRows : [];
        setData({
          products: prods,
          allBrands,
          brandBySlug: new Map(allBrands.map((b) => [b.slug, b])),
          usedBrands: new Set(prods.map((p) => p.brand_slug)),
          ...tree,
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // ---- URL -> selection --------------------------------------------------
  const splat = params["*"];
  const urlState = useMemo(
    () => parseListingUrl(params, location.search),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.brandSlug, params.categorySlug, splat, location.search]
  );
  const currentUrl = location.pathname + location.search;

  // What the URL means once the brand/category data is known. A brand or
  // category in the path that doesn't exist redirects, as the old pages did.
  const resolved = useMemo(() => {
    if (!data) return null;
    const { pathBrand, pathCategory, brandSlugs, categoryRefs } = urlState;
    if (pathBrand && !data.brandBySlug.has(pathBrand)) return { redirect: "/products" };

    const entries = [];
    let pathMissing = Boolean(pathCategory?.invalid);
    for (const ref of categoryRefs) {
      const entry = ref.id != null ? data.full.byId.get(ref.id) : data.full.bySlug.get(ref.slug);
      if (!entry) {
        if (ref === pathCategory) pathMissing = true;
        continue; // unknown ?category= values are dropped (and the URL tidied)
      }
      if (!entries.includes(entry)) entries.push(entry);
    }
    if (pathMissing) return { redirect: `/products/${encodeURIComponent(pathBrand)}` };

    return {
      cats: selectionFromCategories(data, entries),
      brands: new Set(brandSlugs.filter((s) => data.brandBySlug.has(s))),
    };
  }, [data, urlState]);

  const ready = Boolean(data && resolved && !resolved.redirect);
  const selectedCats = ready ? resolved.cats : EMPTY_SET;
  const selectedBrands = ready ? resolved.brands : EMPTY_SET;
  const selKey = selectionKey(selectedCats, selectedBrands);
  const selChains = useMemo(() => (ready ? chainsOf(data, selectedCats) : []), [ready, data, selectedCats]);

  // Brand checkboxes: brands that have products, plus any brand the URL selected.
  const sidebarBrands = useMemo(
    () => (data ? data.allBrands.filter((b) => data.usedBrands.has(b.slug) || selectedBrands.has(b.slug)) : []),
    [data, selectedBrands]
  );
  const orderedBrands = (set) => (data ? data.allBrands.filter((b) => set.has(b.slug)).map((b) => b.slug) : []);

  // ---- selection -> URL --------------------------------------------------
  // Every filter change goes through here. Pagination is not carried over, so a
  // changed filter always lands on page 1.
  // Returns whether it navigated (false when the URL would not change).
  const go = ({ brands, cats, q, page = 1 }, { replace = false } = {}) => {
    const url = buildListingUrl({ brands, chains: chainsOf(data, cats), q, page, extra: urlState.extra });
    if (url === currentUrl) return false;
    ownSelection.current = selectionKey(cats, brands);
    navigate(url, { replace, state: KEEP_SCROLL_STATE });
    return true;
  };

  const toggleCat = (node) => {
    const next = new Set(selectedCats);
    const ids = subtreeIds(node);
    const allOn = ids.every((id) => next.has(id));
    ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
    // keep ancestors in step: selected only when every child is fully selected
    for (let p = data.parentOf.get(node.id); p != null; p = data.parentOf.get(p)) {
      const parent = data.byId.get(p);
      const full = parent.children.every((c) => subtreeIds(c).every((id) => next.has(id)));
      if (full) next.add(p);
      else next.delete(p);
    }
    go({ brands: orderedBrands(selectedBrands), cats: next, q: draftQuery() });
  };

  const toggleBrand = (slug) => {
    const next = new Set(selectedBrands);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    go({ brands: orderedBrands(next), cats: selectedCats, q: draftQuery() });
  };

  const clearAll = () => go({ brands: [], cats: EMPTY_SET, q: "" });

  const toggleExpand = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Search box: typing is written to the URL after a short pause, replacing the
  // current history entry so Back doesn't step through every keystroke.
  const [draft, setDraft] = useSyncedQuery(
    urlState.q,
    (q) => go({ brands: orderedBrands(selectedBrands), cats: selectedCats, q }, { replace: true }),
    location.key
  );
  // Text typed but not yet written to the URL travels with the next filter change.
  const draftQuery = () => normalizeQuery(draft);

  // When a selection arrives from outside the sidebar (opened/refreshed link,
  // Back/Forward), open the branches that lead to it so the checked boxes are
  // visible. Clicks inside the sidebar skip this, so they never move things around.
  useEffect(() => {
    if (!ready || ownSelection.current === selKey) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const chain of selChains) {
        chain.slice(0, -1).forEach((c) => next.add(c.id));
        const last = chain[chain.length - 1];
        if (data.byId.get(last.id)?.children.length) next.add(last.id);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selKey]);

  // Report the current selection upward: the outermost fully-selected
  // categories (each as a root→node chain) and the selected brands.
  useEffect(() => {
    if (!onSelectionChange || !ready) return;
    const brands = data.allBrands.filter((b) => selectedBrands.has(b.slug)).map((b) => ({ slug: b.slug, name: b.name }));
    onSelectionChange({ nodes: selChains, brands });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selKey]);

  // ---- results -----------------------------------------------------------
  const tokens = urlState.q.toLowerCase().split(/\s+/).filter(Boolean);
  const filtersActive = tokens.length > 0 || selectedCats.size > 0 || selectedBrands.size > 0;
  const activeCount = (tokens.length ? 1 : 0) + selectedCats.size + selectedBrands.size;

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.products.filter((p) => {
      if (selectedCats.size && !selectedCats.has(p.category_id)) return false;
      if (selectedBrands.size && !selectedBrands.has(p.brand_slug)) return false;
      if (tokens.length) {
        const hay = [p.name, p.model, p.item_no, p.slug, p.short_description, p.category, p.series, p.brand].filter(Boolean).join(" ").toLowerCase();
        if (!tokens.every((tk) => hay.includes(tk))) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedCats, selectedBrands, urlState.q]);

  // Products are newest-first, so grouping in arrival order keeps each
  // section newest-first and orders sections by their newest product.
  const groups = useMemo(() => {
    if (!data) return [];
    const map = new Map();
    for (const p of filtered) {
      const key = `${p.brand_slug}/${p.category_id}`;
      if (!map.has(key)) map.set(key, { key, name: p.category, brandSlug: p.brand_slug, brandName: p.brand, categoryId: p.category_id, items: [] });
      map.get(key).items.push(p);
    }
    const list = [...map.values()];
    const nameCount = {};
    for (const g of list) nameCount[g.name] = (nameCount[g.name] || 0) + 1;
    return list.map((g) => {
      const chain = chainOf(data, g.categoryId);
      return {
        ...g,
        heading: nameCount[g.name] > 1 && g.brandName ? `${g.name} · ${g.brandName}` : g.name,
        href: chain.length ? categoryLevelHref(g.brandSlug, chain, chain.length - 1) : `/products/${g.brandSlug}`,
      };
    });
  }, [filtered, data]);

  // Per-category cap only applies while no filter is active.
  const limit = !filtersActive && perCategoryLimit ? perCategoryLimit : null;

  // Pagination runs over the whole filtered list, not per category: flatten the
  // category groups in display order, take one slice of PRODUCTS_PER_PAGE, then
  // regroup that slice so headings and dividers still show. Each product falls
  // in exactly one slice, so nothing is duplicated or dropped across pages.
  // The page number comes from the URL (?page=), and any filter change drops it.
  const paged = useMemo(() => {
    const flat = [];
    for (const g of groups) {
      const items = limit ? g.items.slice(0, limit) : g.items;
      for (const p of items) flat.push({ g, p });
    }
    const totalPages = Math.max(1, Math.ceil(flat.length / PRODUCTS_PER_PAGE));
    const current = Math.min(urlState.page, totalPages);
    const start = (current - 1) * PRODUCTS_PER_PAGE;
    const sections = [];
    for (const { g, p } of flat.slice(start, start + PRODUCTS_PER_PAGE)) {
      const last = sections[sections.length - 1];
      if (last && last.g === g) last.items.push(p);
      else sections.push({ g, items: [p] });
    }
    return { sections, totalPages, current };
  }, [groups, limit, urlState.page]);

  const goToPage = (n) => {
    pageChanged.current = true;
    go({ brands: orderedBrands(selectedBrands), cats: selectedCats, q: draftQuery(), page: n });
  };

  // After the user changes page, bring the top of the list back into view.
  useEffect(() => {
    if (!pageChanged.current) return;
    pageChanged.current = false;
    const el = mainRef.current;
    if (el) {
      window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 110), behavior: "smooth" });
    }
  }, [paged.current]);

  // Tidy the address bar: a URL that means the same thing as the selection but
  // is spelled differently (/products/omron?category=x, unknown slugs, page=1,
  // an out-of-range page, reordered lists…) is rewritten in place to its
  // canonical form, so there is exactly one URL per filter state.
  const canonicalUrl = useMemo(
    () =>
      ready
        ? buildListingUrl({
            brands: orderedBrands(selectedBrands),
            chains: selChains,
            q: urlState.q,
            page: paged.current,
            extra: urlState.extra,
          })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, selKey, urlState, paged.current]
  );
  useEffect(() => {
    if (canonicalUrl && canonicalUrl !== currentUrl) {
      navigate(canonicalUrl, { replace: true, state: KEEP_SCROLL_STATE });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonicalUrl, currentUrl]);

  if (status === "loading") return <p className="empty-state">{t("products.loadingProducts")}</p>;
  if (status === "error") {
    return (
      <p className="empty-state">
        {t("products.latestError")}{" "}
        <button type="button" className="btn" onClick={() => setAttempt((n) => n + 1)}>
          {t("products.latestRetry")}
        </button>
      </p>
    );
  }
  if (resolved?.redirect) return <Navigate to={resolved.redirect} replace />;

  const showHeadings = !(filtersActive && groups.length === 1);

  return (
    <div className="category-layout">
      <ProductFilterSidebar
        query={draft}
        onQuery={setDraft}
        roots={data.roots}
        selectedCats={selectedCats}
        expanded={expanded}
        onToggleCat={toggleCat}
        onToggleExpand={toggleExpand}
        subtreeState={(node) => {
          const ids = subtreeIds(node);
          const n = ids.filter((id) => selectedCats.has(id)).length;
          return { checked: n === ids.length, partial: n > 0 && n < ids.length };
        }}
        brands={sidebarBrands}
        selectedBrands={selectedBrands}
        onToggleBrand={toggleBrand}
        onClear={clearAll}
        activeCount={activeCount}
        open={panelOpen}
        onToggleOpen={() => setPanelOpen((o) => !o)}
      />

      <div className="category-main" ref={mainRef}>
        {groups.length === 0 && <p className="empty-state">{t("products.noProductsFound")}</p>}

        {paged.sections.map(({ g, items }, i) => {
          const more = limit != null && g.items.length > limit;
          return (
            <section key={`${g.key}-${i}`} className="latest-group">
              {showHeadings && (
                <div className="latest-group__head">
                  <h2 className="latest-group__title">
                    <Link to={g.href}>{g.heading}</Link>
                  </h2>
                  {more && (
                    <Link to={g.href} className="latest-group__all">
                      {t("products.viewAll")} ({g.items.length}) →
                    </Link>
                  )}
                </div>
              )}
              <div className="product-tile-grid">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} variant="plain" />
                ))}
              </div>
            </section>
          );
        })}

        <Pagination page={paged.current} totalPages={paged.totalPages} onChange={goToPage} />
      </div>
    </div>
  );
}
