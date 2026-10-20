import { useState } from "react";
import CategoryLineIcon, { isKnownCategoryIcon } from "./categoryIcons.jsx";

function CategoryIcon({ category }) {
  const [broken, setBroken] = useState(false);

  // Priority: icon chosen in admin (icon_key) → uploaded image → neutral placeholder.
  if (isKnownCategoryIcon(category.icon_key)) {
    return <CategoryLineIcon iconKey={category.icon_key} />;
  }

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

  return <CategoryLineIcon iconKey={null} />;
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
