// Category-tree helpers behind the product filter sidebar.
//
// Two views of the same data are kept:
//   - the *sidebar tree* (roots / byId / parentOf): only categories that have
//     products, directly or through a descendant (what the sidebar shows);
//   - the *full index* (full): every active category reachable from a root, so
//     a URL that points at a category with no products yet still resolves
//     (it shows an empty result instead of being mistaken for "no category").

// Builds both views from the flat category list returned by the API.
export function buildTree(rows, products) {
  const direct = new Set(products.map((p) => p.category_id));
  const kids = new Map();
  for (const r of rows) {
    const key = r.parent_id ?? null;
    if (!kids.has(key)) kids.set(key, []);
    kids.get(key).push(r);
  }

  const full = { byId: new Map(), bySlug: new Map(), order: new Map(), kids };
  const byId = new Map();
  const parentOf = new Map();
  let position = 0;

  const grow = (row, parent) => {
    const entry = { id: row.id, name: row.name, slug: row.slug, parentId: parent };
    full.byId.set(row.id, entry);
    full.bySlug.set(row.slug, entry);
    full.order.set(row.id, position++); // pre-order = sidebar order

    const children = (kids.get(row.id) || []).map((c) => grow(c, row.id)).filter(Boolean);
    if (!direct.has(row.id) && children.length === 0) return null;
    const node = { id: row.id, name: row.name, slug: row.slug, children };
    byId.set(node.id, node);
    parentOf.set(node.id, parent);
    return node;
  };
  const roots = (kids.get(null) || []).map((r) => grow(r, null)).filter(Boolean);
  return { roots, byId, parentOf, full };
}

export function subtreeIds(node, out = []) {
  out.push(node.id);
  node.children.forEach((c) => subtreeIds(c, out));
  return out;
}

function fullSubtreeIds(full, id, out = []) {
  out.push(id);
  for (const child of full.kids.get(id) || []) fullSubtreeIds(full, child.id, out);
  return out;
}

/**
 * Turns category references from the URL (index entries from `tree.full`) into
 * the set of selected category ids: each reference plus everything beneath it,
 * and nothing else. A URL means exactly the category it names — in particular,
 * /…/cat/21 never pulls in 21's parent (and the parent's own products), even
 * when 21 is its only child. (Every selection the checkboxes can produce is
 * exactly such a union, so URL and clicks always agree.)
 */
export function selectionFromCategories(tree, entries) {
  const selected = new Set();
  for (const entry of entries) {
    const node = tree.byId.get(entry.id);
    (node ? subtreeIds(node) : fullSubtreeIds(tree.full, entry.id)).forEach((id) => selected.add(id));
  }
  return selected;
}

/** root -> node chain of { id, name, slug } for a category id. */
export function chainOf(tree, id) {
  const chain = [];
  for (let cur = id; cur != null; cur = tree.full.byId.get(cur)?.parentId) {
    const entry = tree.full.byId.get(cur);
    if (!entry) break;
    chain.unshift({ id: entry.id, name: entry.name, slug: entry.slug });
  }
  return chain;
}

/** The outermost selected categories (those whose parent isn't selected), as chains, in sidebar order. */
export function chainsOf(tree, selected) {
  return [...selected]
    .filter((id) => tree.full.byId.has(id) && !selected.has(tree.full.byId.get(id).parentId))
    .sort((a, b) => tree.full.order.get(a) - tree.full.order.get(b))
    .map((id) => chainOf(tree, id));
}

/** Compact identity of a selection, to tell "selection changed" from "only the search/page changed". */
export function selectionKey(selectedCats, selectedBrands) {
  return `${[...selectedCats].sort((a, b) => a - b).join(",")}|${[...selectedBrands].sort().join(",")}`;
}
