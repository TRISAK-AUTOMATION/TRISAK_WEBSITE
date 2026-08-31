import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Displays brands as logo tiles in a 3-column x 2-row grid (6 visible
 * at once). If there are more than 6 brands, the grid scrolls
 * horizontally in pages of 6 — via trackpad/touch, or the arrow
 * buttons, which only appear once there's actually more to see.
 *
 * `brands` items need { slug, name, logo_url }. `getHref(brand)`
 * returns the link target for a tile.
 */
export default function BrandLogoGrid({ brands, getHref }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const onResize = () => updateScrollState();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [brands]);

  const scrollByPage = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

  if (!brands.length) return null;

  return (
    <div className="brand-logo-scroll">
      <button
        type="button"
        className={`brand-logo-scroll__arrow brand-logo-scroll__arrow--left ${
          canScrollLeft ? "is-visible" : ""
        }`}
        onClick={() => scrollByPage(-1)}
        aria-label="Scroll left"
        tabIndex={canScrollLeft ? 0 : -1}
      >
        ‹
      </button>

      <div className="brand-logo-grid" ref={scrollRef} onScroll={updateScrollState}>
        {brands.map((b) => (
          <Link to={getHref(b)} className="brand-logo-cell" key={b.slug} title={b.name}>
            {b.logo_url ? (
              <img className="brand-logo-cell__image" src={b.logo_url} alt={b.name} />
            ) : (
              <span className="brand-logo-cell__name">{b.name}</span>
            )}
          </Link>
        ))}
      </div>

      <button
        type="button"
        className={`brand-logo-scroll__arrow brand-logo-scroll__arrow--right ${
          canScrollRight ? "is-visible" : ""
        }`}
        onClick={() => scrollByPage(1)}
        aria-label="Scroll right"
        tabIndex={canScrollRight ? 0 : -1}
      >
        ›
      </button>
    </div>
  );
}
