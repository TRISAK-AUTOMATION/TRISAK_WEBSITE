import { useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Filter model + rules for Admin > Products.
// Everything is derived from fields the admin products API already returns:
//   availability_status, brand_id, category_id, image_url,
//   replacement_product_id, has_datasheet
// Nothing is recalculated: status uses the stored availability_status, and
// "Product Data" reuses the two data-quality rules the dashboard already
// reports (missing image / missing Datasheet) — see dashboardController.js.
// ---------------------------------------------------------------------------

export const EMPTY_FILTERS = {
  status: "all", // all | available | unavailable | discontinued
  brandId: "", // "" = all brands
  categoryId: "", // "" = all categories (a parent also covers its subcategories)
  image: "all", // all | has | missing
  replacement: "all", // all | has | none
  data: "all", // all | complete | incomplete
};

export function countActiveFilters(f) {
  return [
    f.status !== "all",
    f.brandId !== "",
    f.categoryId !== "",
    f.image !== "all",
    f.replacement !== "all",
    f.data !== "all",
  ].filter(Boolean).length;
}

const hasImage = (p) => Boolean(p.image_url);
const isComplete = (p) => hasImage(p) && Boolean(p.has_datasheet);

// categoryIds: Set of the selected category id + all of its descendants
export function matchesFilters(p, f, categoryIds) {
  if (f.status !== "all" && p.availability_status !== f.status) return false;
  if (f.brandId !== "" && p.brand_id !== Number(f.brandId)) return false;
  if (f.categoryId !== "" && !(categoryIds && categoryIds.has(p.category_id))) return false;
  if (f.image === "has" && !hasImage(p)) return false;
  if (f.image === "missing" && hasImage(p)) return false;
  if (f.replacement === "has" && !p.replacement_product_id) return false;
  if (f.replacement === "none" && p.replacement_product_id) return false;
  if (f.data === "complete" && !isComplete(p)) return false;
  if (f.data === "incomplete" && isComplete(p)) return false;
  return true;
}

// Selected category + every descendant (subcategories nest to any depth).
export function categoryScope(categories, categoryId) {
  if (categoryId === "") return null;
  const ids = new Set([Number(categoryId)]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      if (c.parent_id != null && ids.has(c.parent_id) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return ids;
}

// Depth-ordered category list so subcategories show indented under parents.
function flattenCategories(categories) {
  const byParent = new Map();
  for (const c of categories) {
    const key = c.parent_id ?? "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  }
  const out = [];
  const seen = new Set();
  const walk = (key, depth) => {
    for (const c of byParent.get(key) || []) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push({ ...c, depth });
      walk(c.id, depth + 1);
    }
  };
  walk("root", 0);
  // orphans (parent missing) still get listed
  for (const c of categories) if (!seen.has(c.id)) out.push({ ...c, depth: 0 });
  return out;
}

const STATUS_OPTIONS = [
  ["all", "All"],
  ["available", "Available"],
  ["unavailable", "Unavailable"],
  ["discontinued", "Discontinued"],
];
const IMAGE_OPTIONS = [
  ["all", "All"],
  ["has", "Has Image"],
  ["missing", "Missing Image"],
];
const REPLACEMENT_OPTIONS = [
  ["all", "All"],
  ["has", "Has Replacement Model"],
  ["none", "No Replacement Model"],
];
const DATA_OPTIONS = [
  ["all", "All"],
  ["complete", "Complete"],
  ["incomplete", "Incomplete"],
];

export function describeFilters(f, brands, categories) {
  const chips = [];
  if (f.status !== "all") chips.push(`Status: ${STATUS_OPTIONS.find((o) => o[0] === f.status)?.[1]}`);
  if (f.brandId !== "") chips.push(`Brand: ${brands.find((b) => b.id === Number(f.brandId))?.name ?? f.brandId}`);
  if (f.categoryId !== "")
    chips.push(`Category: ${categories.find((c) => c.id === Number(f.categoryId))?.name ?? f.categoryId}`);
  if (f.image !== "all") chips.push(IMAGE_OPTIONS.find((o) => o[0] === f.image)?.[1]);
  if (f.replacement !== "all") chips.push(REPLACEMENT_OPTIONS.find((o) => o[0] === f.replacement)?.[1]);
  if (f.data !== "all") chips.push(`Data: ${DATA_OPTIONS.find((o) => o[0] === f.data)?.[1]}`);
  return chips;
}

function Select({ label, value, onChange, options, wide }) {
  return (
    <label className={`admin-filter__field${wide ? " admin-filter__field--wide" : ""}`}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Filter button + dropdown panel. `applied` is the filter set currently in
 * effect; the panel edits a draft copy that only takes effect on
 * "Apply Filters". Closed by default; closes on outside click, Escape,
 * clicking the button again, and after Apply.
 */
export default function AdminProductFilter({ applied, brands, categories, onApply, onReset }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(applied);
  const wrapRef = useRef(null);
  const activeCount = countActiveFilters(applied);

  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));

  // Re-sync the draft with what is really applied each time the panel opens,
  // so unapplied selections are discarded when the panel is dismissed.
  const toggle = () => {
    if (!open) setDraft(applied);
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const brandOptions = useMemo(
    () => [["", "All brands"], ...brands.map((b) => [String(b.id), b.name])],
    [brands]
  );
  const categoryOptions = useMemo(
    () => [
      ["", "All categories"],
      ...flattenCategories(categories).map((c) => [
        String(c.id),
        `${"\u00A0\u00A0".repeat(c.depth)}${c.depth ? "↳ " : ""}${c.name}`,
      ]),
    ],
    [categories]
  );

  return (
    <div className="admin-filter" ref={wrapRef}>
      <button
        type="button"
        className={`btn admin-filter__toggle${activeCount ? " admin-filter__toggle--active" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        Filter
        {activeCount > 0 && <span className="admin-filter__count">{activeCount}</span>}
      </button>

      {open && (
        <div className="admin-filter__panel" role="dialog" aria-label="Filter products">
          <div className="admin-filter__grid">
            <Select label="Product Status" value={draft.status} onChange={set("status")} options={STATUS_OPTIONS} />
            <Select label="Image Status" value={draft.image} onChange={set("image")} options={IMAGE_OPTIONS} />
            <Select label="Brand" value={draft.brandId} onChange={set("brandId")} options={brandOptions} />
            <Select
              label="Category / Subcategory"
              value={draft.categoryId}
              onChange={set("categoryId")}
              options={categoryOptions}
            />
            <Select
              label="Replacement Model"
              value={draft.replacement}
              onChange={set("replacement")}
              options={REPLACEMENT_OPTIONS}
            />
            <Select label="Product Data" value={draft.data} onChange={set("data")} options={DATA_OPTIONS} />
          </div>
          <div className="admin-filter__footer">
            <button
              type="button"
              className="btn"
              onClick={() => {
                setDraft(EMPTY_FILTERS);
                onReset();
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onApply(draft);
                setOpen(false);
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
