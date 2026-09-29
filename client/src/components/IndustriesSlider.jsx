import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Colors cycled for the fallback slides (when the DB has no data yet, or
// for the Thai UI, since the database currently only stores English
// names — matches the limitation already documented on the old grid).
const FALLBACK_COLORS = ["#0f2f5f", "#7a1f1f", "#2f6b3a", "#5a3d0f", "#1c3f6f", "#0f5f5a", "#5f4a0f", "#3f2f5f"];

/** Shortest circular distance from `activeIndex` to `i`, e.g. for n=8 and
 *  activeIndex=0, item 7 has offset -1 (not +7) — it's one step to the left. */
function relativeOffset(i, activeIndex, n) {
  let diff = i - activeIndex;
  diff = ((diff % n) + n) % n; // normalize to [0, n)
  if (diff > n / 2) diff -= n; // fold the far half to negative
  return diff;
}

// Builds a CSS calc() expression for a slide's horizontal offset from
// center, in terms of CSS custom properties (--center-w/--side-w/--gap)
// rather than literal pixels — so it stays correct across the responsive
// breakpoints that redefine those variables, with no JS recalculation.
function slotTranslateX(offset) {
  if (offset === 0) return "translateX(0)";
  const k = Math.abs(offset);
  const magnitude = `(var(--ind-center-w) / 2 + var(--ind-gap) + var(--ind-side-w) / 2 + ${k - 1} * (var(--ind-side-w) + var(--ind-gap)))`;
  return `translateX(calc(${offset > 0 ? "" : "-1 * "}${magnitude}))`;
}

function Bullets({ text }) {
  const lines = (text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  return (
    <ul className="industry-slide__bullets">
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}

function IndustrySlide({ industry, offset, onSelect, exploreLabel }) {
  // Anything more than one step past the visible window is unmounted —
  // still one buffer slot beyond ±2 so an item entering/leaving the
  // visible five animates in/out instead of popping.
  if (Math.abs(offset) > 3) return null;

  const isActive = offset === 0;
  const isVisible = Math.abs(offset) <= 2;
  const style = {
    transform: `${slotTranslateX(offset)} translateY(-50%)`,
    opacity: isActive ? 1 : isVisible ? 0.85 : 0,
    zIndex: 10 - Math.abs(offset),
  };

  return (
    <div
      className={`industry-slide ${isActive ? "industry-slide--active" : "industry-slide--side"}`}
      style={style}
      aria-hidden={!isVisible}
      onClick={!isActive && isVisible ? () => onSelect(industry) : undefined}
      role={!isActive && isVisible ? "button" : undefined}
      tabIndex={!isActive && isVisible ? 0 : -1}
      onKeyDown={
        !isActive && isVisible
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(industry);
              }
            }
          : undefined
      }
    >
      {industry.imageUrl && <img src={industry.imageUrl} alt="" className="industry-slide__bg" />}
      <div className="industry-slide__overlay" style={{ backgroundColor: industry.overlayColor }} />

      {isActive ? (
        <div className="industry-slide__content">
          {industry.number && <span className="industry-slide__number">{industry.number}</span>}
          <h3 className="industry-slide__name">{industry.name}</h3>
          <Bullets text={industry.description} />
          <Link to={industry.exploreLink || "/products"} className="industry-slide__explore">
            {exploreLabel} <span className="btn-arrow">→</span>
          </Link>
        </div>
      ) : (
        <div className="industry-slide__vertical">
          {industry.number && <span className="industry-slide__vnumber">{industry.number}</span>}
          <span className="industry-slide__vname">{industry.name}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Center-focused industries carousel: one large active slide, two narrow
 * slides on each side. Clicking a side slide, the arrows, the pagination
 * dots, and swiping (mobile/tablet) all move the active slide; navigation
 * loops infinitely in both directions.
 */
export default function IndustriesSlider({ industries, exploreLabel = "Explore More" }) {
  const n = industries.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);

  // If the underlying list changes (e.g. language switch swaps in a
  // differently-sized fallback list), keep the index in range.
  useEffect(() => {
    setActiveIndex((i) => (n === 0 ? 0 : ((i % n) + n) % n));
  }, [n]);

  const goTo = useCallback((i) => setActiveIndex(((i % n) + n) % n), [n]);
  const prev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);
  const next = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowRight") next();
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    const SWIPE_THRESHOLD = 40;
    if (touchDeltaX.current > SWIPE_THRESHOLD) prev();
    else if (touchDeltaX.current < -SWIPE_THRESHOLD) next();
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const slides = useMemo(
    () => industries.map((ind, i) => ({ ind, offset: n ? relativeOffset(i, activeIndex, n) : 0 })),
    [industries, activeIndex, n]
  );

  if (n === 0) return null;

  return (
    <div className="industries-slider">
      <div
        className="industries-slider__viewport"
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Industries we serve"
      >
        {slides.map(({ ind, offset }) => (
          <IndustrySlide key={ind.id} industry={ind} offset={offset} onSelect={(i) => goTo(industries.indexOf(i))} exploreLabel={exploreLabel} />
        ))}
      </div>

      <div className="industries-slider__nav">
        <button type="button" className="industries-slider__arrow" onClick={prev} aria-label="Previous industry">
          ←
        </button>
        <div className="industries-slider__dots">
          {industries.map((ind, i) => (
            <button
              key={ind.id}
              type="button"
              className={`industries-slider__dot ${i === activeIndex ? "is-active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to ${ind.name}`}
              aria-current={i === activeIndex}
            />
          ))}
        </div>
        <button type="button" className="industries-slider__arrow" onClick={next} aria-label="Next industry">
          →
        </button>
      </div>
    </div>
  );
}

// Builds slide data for languages/states where the database has no rich
// content (Thai — the table only stores English text and images — or
// before the API has responded). Same limitation the old plain-text grid
// already had; this keeps that behavior but in the new slide shape.
export function buildFallbackIndustries(names) {
  return names.map((name, i) => ({
    id: `fallback-${i}`,
    number: String(i + 1).padStart(2, "0"),
    name,
    imageUrl: "",
    overlayColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    description: "",
    exploreLink: "/products",
  }));
}
