/**
 * Helpers for the History page's organization chart in the Admin.
 * Rows are the flat `history_org_nodes` records (parent_id, sort_order, …),
 * already sorted by sort_order from the API.
 */

/** Depth-first flatten, parents before their children, siblings in display order. */
export function flattenOrg(rows) {
  const kids = new Map();
  for (const r of rows) {
    const key = r.parent_id ?? null;
    if (!kids.has(key)) kids.set(key, []);
    kids.get(key).push(r);
  }
  const out = [];
  const walk = (parentId, depth, parentName, ancestorInactive) => {
    for (const r of kids.get(parentId) || []) {
      out.push({ ...r, _depth: depth, _parentName: parentName, _hiddenByAncestor: ancestorInactive });
      walk(r.id, depth + 1, r.name_en, ancestorInactive || !r.is_active);
    }
  };
  walk(null, 0, "", false);
  return out;
}

/** ids of every node below `id` (not including `id`). */
export function descendantIds(rows, id) {
  const found = new Set();
  const stack = [id];
  while (stack.length) {
    const current = stack.pop();
    for (const r of rows) {
      if (r.parent_id === current && !found.has(r.id)) {
        found.add(r.id);
        stack.push(r.id);
      }
    }
  }
  return found;
}

/** Nodes sharing `row`'s parent, in display order — the group the up/down arrows move within. */
export function siblingsOf(row, rows) {
  return rows.filter((r) => (r.parent_id ?? null) === (row.parent_id ?? null));
}
