import { useState } from "react";

/**
 * Monochrome line icons keyed by category slug. Used when a category has
 * no uploaded image (categories.image_url). All icons share one 48x48
 * viewBox and stroke style so the grid stays visually consistent.
 */
const ICONS = {
  "plc-hmi": (
    <>
      <rect x="6" y="8" width="36" height="26" rx="2" />
      <rect x="11" y="13" width="26" height="16" rx="1" />
      <path d="M17 38h14M24 34v4M15 21h6M15 25h10M28 21h5" />
    </>
  ),
  inverter: (
    <>
      <rect x="9" y="5" width="30" height="38" rx="2" />
      <rect x="14" y="10" width="20" height="9" rx="1" />
      <path d="M14 30c3-6 5-6 7 0s4 6 7 0 3-3 5-1" />
      <path d="M16 39h16" />
    </>
  ),
  "servo-motion": (
    <>
      <rect x="4" y="16" width="14" height="16" rx="1" />
      <rect x="18" y="12" width="18" height="24" rx="2" />
      <path d="M36 24h8M22 18v12M27 18v12M32 18v12" />
    </>
  ),
  "industrial-robot": (
    <>
      <path d="M8 42h20M12 42v-6h12v6" />
      <path d="M18 36V22l14-12" />
      <circle cx="18" cy="22" r="3" />
      <circle cx="32" cy="10" r="3" />
      <path d="M34 11l7 4-3 5" />
    </>
  ),
  sensors: (
    <>
      <rect x="6" y="18" width="22" height="12" rx="2" />
      <path d="M28 21h5v6h-5M12 18v-5M12 30v5" />
      <path d="M37 18c3 3 3 9 0 12M41 14c5 6 5 14 0 20" />
    </>
  ),
  safety: (
    <>
      <path d="M24 5l15 6v11c0 10-6 17-15 21C15 39 9 32 9 22V11z" />
      <path d="M17 24l5 5 9-10" />
    </>
  ),
  "io-industrial-pc": (
    <>
      <rect x="5" y="7" width="26" height="20" rx="2" />
      <path d="M12 33h12M18 27v6" />
      <rect x="34" y="12" width="10" height="28" rx="1.5" />
      <path d="M37 18h4M37 23h4M38 35h2" />
    </>
  ),
  "electrical-components": (
    <>
      <rect x="13" y="5" width="22" height="38" rx="2" />
      <rect x="19" y="11" width="10" height="10" rx="1" />
      <path d="M24 13v6M18 30h12M18 35h12" />
      <path d="M5 12h8M5 36h8M35 12h8M35 36h8" />
    </>
  ),
  enclosures: (
    <>
      <rect x="9" y="4" width="30" height="40" rx="2" />
      <rect x="14" y="9" width="20" height="30" rx="1" />
      <path d="M31 22v6M11 12v2M11 32v2" />
    </>
  ),
};

function GenericIcon() {
  return (
    <>
      <rect x="8" y="8" width="32" height="32" rx="3" />
      <path d="M16 20h16M16 28h16" />
    </>
  );
}

function CategoryIcon({ category }) {
  const [broken, setBroken] = useState(false);

  if (category.image_url && !broken) {
    return (
      <img
        className="category-tile__img"
        src={category.image_url}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <svg
      className="category-tile__icon"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[category.slug] || <GenericIcon />}
    </svg>
  );
}

/**
 * Bordered tile grid for top-level categories.
 *
 * `categories`  items from api.getCategories(): { slug, name, image_url }
 * `onSelect`    called with the category (reuses the page's existing
 *               filter logic — no duplicate routing/category data here)
 *
 * Tiles render in the API's sort_order. The "enclosures" tile — or a
 * lone last tile that would otherwise leave an orphan in a 4-col row —
 * spans the full grid width with icon and label side by side.
 */
export default function CategoryTileGrid({ categories, onSelect }) {
  const count = categories.length;

  return (
    <div className="category-tiles">
      {categories.map((c, i) => {
        const wide = c.slug === "enclosures" || (i === count - 1 && count % 4 === 1);
        return (
          <button
            type="button"
            key={c.slug}
            className={`category-tile${wide ? " category-tile--wide" : ""}`}
            onClick={() => onSelect(c)}
          >
            <CategoryIcon category={c} />
            <span className="category-tile__name">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
