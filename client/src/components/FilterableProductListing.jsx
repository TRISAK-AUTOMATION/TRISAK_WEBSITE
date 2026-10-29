import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import ProductCard from "./ProductCard.jsx";
import ProductFilterSidebar from "./ProductFilterSidebar.jsx";
import Pagination, { PRODUCTS_PER_PAGE } from "./Pagination.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { categoryLevelHref } from "../utils/categoryBreadcrumb.js";

// Builds the category hierarchy from the flat list, keeping only active
// categories that are reachable from a root and that have products
// (directly or through a descendant).
function buildTree(rows, products) {
  const direct = new Set(products.map((p) => p.category_id));
  const kids = new Map();
  for (const r of rows) {
    const key = r.parent_id ?? null;
    if (!kids.has(key)) kids.set(key, []);
    kids.get(key).push(r);
  }
  const byId = new Map();
  const parentOf = new Map();
  const grow = (row, parent) => {
    const children = (kids.get(row.id) || []).map((c) => grow(c, row.id)).filter(Boolean);
    if (!direct.has(row.id) && children.length === 0) return null;
    const node = { id: row.id, name: row.name, slug: row.slug, children };
    byId.set(node.id, node);
    parentOf.set(node.id, parent);
    return node;
  };
  const roots = (kids.get(null) || []).map((r) => grow(r, null)).filter(Boolean);
  return { roots, byId, parentOf };
}

function subtreeIds(node, out = []) {
  out.push(node.id);
  node.children.forEach((c) => subtreeIds(c, out));
  return out;
}

export default function FilterableProductListing({
  initialBrandSlug = null,
  initialCategoryId = null,
  perCategoryLimit = null, // applied only while no filter is active
  onSelectionChange = null, // ({ nodes, brands }) — lets the page title follow the filters
}) {
  const { t } = useLanguage();
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState(null);

  const [query, setQuery] = useState("");
  const [selectedCats, setSelectedCats] = useState(() => new Set());
  const [selectedBrands, setSelectedBrands] = useState(() => new Set());
  const [expanded, setExpanded] = useState(() => new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const [page, setPage] = useState(1);
  const mainRef = useRef(null);
  const pageChanged = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    Promise.all([api.getProducts({ sort: "newest" }), api.getCategoryTree(), api.getBrands()])
      .then(([products, rows, brandRows]) => {
        if (cancelled) return;
        const prods = Array.isArray(products) ? products : [];
        const tree = buildTree(Array.isArray(rows) ? rows : [], prods);
        const used = new Set(prods.map((p) => p.brand_slug));
        const brands = (Array.isArray(brandRows) ? brandRows : []).filter((b) => used.has(b.slug));

        // Preselect the page's own brand / category (if any) and open the
        // branches that lead to it.
        const startCats = new Set();
        const startOpen = new Set();
        const startNode = initialCategoryId != null ? tree.byId.get(Number(initialCategoryId)) : null;
        if (startNode) {
          subtreeIds(startNode).forEach((id) => startCats.add(id));
          if (startNode.children.length) startOpen.add(startNode.id);
          for (let p = tree.parentOf.get(startNode.id); p != null; p = tree.parentOf.get(p)) startOpen.add(p);
        }
        setSelectedCats(startCats);
        setExpanded(startOpen);
        setSelectedBrands(new Set(initialBrandSlug && used.has(initialBrandSlug) ? [initialBrandSlug] : []));
        setData({ products: prods, brands, ...tree });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  // checked = whole subtree selected; partial = only some of it
  const subtreeState = useCallback(
    (node) => {
      const ids = subtreeIds(node);
      const n = ids.filter((id) => selectedCats.has(id)).length;
      return { checked: n === ids.length, partial: n > 0 && n < ids.length };
    },
    [selectedCats]
  );

  const toggleCat = (node) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
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
      return next;
    });
  };

  const toggleExpand = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleBrand = (slug) =>
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const clearAll = () => {
    setQuery("");
    setSelectedCats(new Set());
    setSelectedBrands(new Set());
  };

  // Report the current selection upward: the outermost fully-selected
  // categories (each as a root→node chain) and the selected brands.
  useEffect(() => {
    if (!onSelectionChange || !data) return;
    const nodes = [];
    for (const id of selectedCats) {
      const parent = data.parentOf.get(id);
      if (parent != null && selectedCats.has(parent)) continue; // covered by its parent
      const chain = [];
      for (let cur = id; cur != null; cur = data.parentOf.get(cur)) {
        const n = data.byId.get(cur);
        if (!n) break;
        chain.unshift({ id: n.id, name: n.name, slug: n.slug });
      }
      if (chain.length) nodes.push(chain);
    }
    const brands = data.brands.filter((b) => selectedBrands.has(b.slug)).map((b) => ({ slug: b.slug, name: b.name }));
    onSelectionChange({ nodes, brands });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedCats, selectedBrands]);

  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtersActive = tokens.length > 0 || selectedCats.size > 0 || selectedBrands.size > 0;
  const activeCount = (tokens.length ? 1 : 0) + selectedCats.size + selectedBrands.size;

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.products.filter((p) => {
      if (selectedCats.size && !selectedCats.has(p.category_id)) return false;
      if (selectedBrands.size && !selectedBrands.has(p.brand_slug)) return false;
      if (tokens.length) {
        const hay = [p.name, p.model, p.item_no, p.slug, p.short_description, p.category, p.brand].filter(Boolean).join(" ").toLowerCase();
        if (!tokens.every((tk) => hay.includes(tk))) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedCats, selectedBrands, query]);

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
      const chain = [];
      for (let id = g.categoryId; id != null; id = data.parentOf.get(id)) {
        const n = data.byId.get(id);
        if (!n) break;
        chain.unshift({ id: n.id, name: n.name, slug: n.slug });
      }
      return {
        ...g,
        heading: nameCount[g.name] > 1 && g.brandName ? `${g.name} · ${g.brandName}` : g.name,
        href: chain.length ? categoryLevelHref(g.brandSlug, chain, chain.length - 1) : `/products/${g.brandSlug}`,
      };
    });
  }, [filtered, data]);

  // Per-category cap only applies while no filter is active.
  const limit = !filtersActive && perCategoryLimit ? perCategoryLimit : null;

  // Back to page 1 whenever search / brand / category filters change.
  useEffect(() => {
    setPage(1);
  }, [query, selectedCats, selectedBrands]);

  // Pagination runs over the whole filtered list, not per category: flatten the
  // category groups in display order, take one slice of PRODUCTS_PER_PAGE, then
  // regroup that slice so headings and dividers still show. Each product falls
  // in exactly one slice, so nothing is duplicated or dropped across pages.
  const paged = useMemo(() => {
    const flat = [];
    for (const g of groups) {
      const items = limit ? g.items.slice(0, limit) : g.items;
      for (const p of items) flat.push({ g, p });
    }
    const totalPages = Math.max(1, Math.ceil(flat.length / PRODUCTS_PER_PAGE));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * PRODUCTS_PER_PAGE;
    const sections = [];
    for (const { g, p } of flat.slice(start, start + PRODUCTS_PER_PAGE)) {
      const last = sections[sections.length - 1];
      if (last && last.g === g) last.items.push(p);
      else sections.push({ g, items: [p] });
    }
    return { sections, totalPages, current };
  }, [groups, limit, page]);

  const goToPage = (n) => {
    pageChanged.current = true;
    setPage(n);
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

  const showHeadings = !(filtersActive && groups.length === 1);

  return (
    <div className="category-layout">
      <ProductFilterSidebar
        query={query}
        onQuery={setQuery}
        roots={data.roots}
        selectedCats={selectedCats}
        expanded={expanded}
        onToggleCat={toggleCat}
        onToggleExpand={toggleExpand}
        subtreeState={subtreeState}
        brands={data.brands}
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
