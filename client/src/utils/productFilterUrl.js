// URL <-> product-filter state.
//
// The URL is the single source of truth for the product listing's shareable
// state. Two directions live here, kept side by side so they cannot drift:
//
//   parseListingUrl()  route params + query string  ->  raw filter state
//   buildListingUrl()  filter state                 ->  the canonical URL
//
// URL shapes (all of them render the same listing page):
//
//   /products/latest                                  nothing selected
//   /products/omron                                   brand only (no category selected)
//   /products/omron/sensors-identification            brand + category (and everything below it)
//   /products/omron/sensors-identification/cat/12/45  brand + subcategory (existing id-chain format)
//   /products/omron?category=plc-hmi,sensors-identification
//                                                     one brand, several categories
//   /products/latest?category=sensors-identification  category without a brand
//   /products/latest?brand=omron,abb&category=...     several brands
//
// Anything the path cannot express goes in the query string:
//   brand     comma-separated brand slugs
//   category  comma-separated category slugs (slugs are unique across all depths)
//   q         search keywords
//   page      page number (omitted for page 1)
// Any other parameter (e.g. ?limit=) is carried through untouched.

// Where an unfiltered listing lives (also where "Clear all" goes). It is an
// existing route, so no URL that worked before stops working.
export const LISTING_BASE_PATH = "/products/latest";

// Passed as router `state` on filter navigations so ScrollToTop leaves the
// scroll position alone instead of jumping to the top on every checkbox click.
export const KEEP_SCROLL_STATE = { keepScroll: true };

const OWNED_PARAMS = ["brand", "category", "q", "page"];

/** Trim and collapse whitespace so equivalent searches share one URL. */
export function normalizeQuery(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function splitList(raw) {
  return [...new Set(String(raw ?? "").split(",").map((s) => s.trim()).filter(Boolean))];
}

/**
 * @param params  react-router params: { brandSlug, categorySlug, "*": "12/45" }
 * @param search  location.search
 * @returns {{
 *   pathBrand: string|null,
 *   pathCategory: {slug:string}|{id:number}|{invalid:true}|null,
 *   brandSlugs: string[],
 *   categoryRefs: Array<{slug:string}|{id:number}>,
 *   q: string, page: number, extra: Array<[string,string]>
 * }}
 */
export function parseListingUrl(params = {}, search = "") {
  const sp = new URLSearchParams(search);
  const { brandSlug, categorySlug } = params;
  const splat = params["*"];

  // "/cat/12/45" -> the last id is the selected (sub)category
  let pathCategory = null;
  const idChain = String(splat ?? "").split("/").filter(Boolean);
  if (idChain.length) {
    pathCategory = idChain.every((s) => /^\d+$/.test(s))
      ? { id: Number(idChain[idChain.length - 1]) }
      : { invalid: true };
  } else if (categorySlug) {
    pathCategory = { slug: categorySlug };
  }

  const categoryRefs = [];
  if (pathCategory && !pathCategory.invalid) categoryRefs.push(pathCategory);
  for (const slug of splitList(sp.get("category"))) categoryRefs.push({ slug });

  const page = Number.parseInt(sp.get("page"), 10);

  return {
    pathBrand: brandSlug || null,
    pathCategory,
    brandSlugs: splitList([brandSlug, sp.get("brand")].filter(Boolean).join(",")),
    categoryRefs,
    q: normalizeQuery(sp.get("q")),
    page: Number.isInteger(page) && page > 1 ? page : 1,
    extra: [...sp.entries()].filter(([key]) => !OWNED_PARAMS.includes(key)),
  };
}

/**
 * @param brands  selected brand slugs, in a stable order
 * @param chains  outermost selected categories, each a root -> node chain of
 *                { id, slug } (only the root's slug and the later ids are used
 *                for the path form; the last slug is used for the query form)
 * @param q       search keywords
 * @param page    1-based page number
 * @param extra   other query parameters to preserve, as [key, value] pairs
 */
export function buildListingUrl({ brands = [], chains = [], q = "", page = 1, extra = [] } = {}) {
  const enc = encodeURIComponent;
  const singleBrand = brands.length === 1 ? brands[0] : null;
  // One brand + one category is exactly what /products/:brand/:category(/cat/...) expresses.
  const pathChain = singleBrand && chains.length === 1 ? chains[0] : null;

  let path = LISTING_BASE_PATH;
  if (singleBrand) path = `/products/${enc(singleBrand)}`;
  if (pathChain) {
    path += `/${enc(pathChain[0].slug)}`;
    if (pathChain.length > 1) path += `/cat/${pathChain.slice(1).map((c) => c.id).join("/")}`;
  }

  const query = [];
  if (brands.length > 1) query.push(`brand=${brands.map(enc).join(",")}`);
  if (chains.length && !pathChain) {
    query.push(`category=${chains.map((c) => enc(c[c.length - 1].slug)).join(",")}`);
  }
  const keywords = normalizeQuery(q);
  if (keywords) query.push(`q=${enc(keywords).replace(/%20/g, "+")}`);
  if (page > 1) query.push(`page=${page}`);
  for (const [key, value] of extra) query.push(`${enc(key)}=${enc(value)}`);

  return query.length ? `${path}?${query.join("&")}` : path;
}
