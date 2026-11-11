import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
// Composed into a single translate3d() (see IndustrySlide) so the browser
// promotes each slide to its own GPU layer and animates position with a
// compositor-only transform, never triggering layout.
function slotOffsetExpr(offset) {
  if (offset === 0) return "0px";
  const k = Math.abs(offset);
  const magnitude = `(var(--ind-center-w) / 2 + var(--ind-gap) + var(--ind-side-w) / 2 + ${k - 1} * (var(--ind-side-w) + var(--ind-gap)))`;
  return `calc(${offset > 0 ? "" : "-1 * "}${magnitude})`;
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

// Memoized so navigating only re-renders the slide(s) whose own offset
// actually changed — not every slide on every activeIndex change.
const IndustrySlide = memo(function IndustrySlide({ industry, index, offset, onSelect, exploreLabel, lang }) {
  // Thai falls back to the English field whenever the Thai one is blank —
  // never an empty slide just because a translation hasn't been filled in.
  const displayName = (lang === "th" && industry.nameTh?.trim()) || industry.name;
  const displayDescription = (lang === "th" && industry.descriptionTh?.trim()) || industry.description;
  const isActive = offset === 0;
  // Every slide stays mounted at all times — including ones several steps
  // away — so nothing ever pops in/out of existence. Only `transform` and
  // `opacity` change, which the browser can animate on the compositor
  // without recomputing layout, so it stays smooth even for a fast,
  // multi-step jump (e.g. a distant pagination-dot click) or rapid
  // repeated clicks (a CSS transition retargets smoothly from wherever
  // it currently is, so overlapping navigation never glitches).
  const isVisible = Math.abs(offset) <= 2;
  const style = {
    // --ind-drag: live drag distance set on the viewport, so slides follow the pointer
    transform: `translate3d(calc(${slotOffsetExpr(offset)} + var(--ind-drag, 0px)), -50%, 0)`,
    opacity: isActive ? 1 : isVisible ? 0.85 : 0,
    zIndex: 10 - Math.abs(offset),
  };

  const handleSelect = !isActive && isVisible ? () => onSelect(index) : undefined;

  return (
    <div
      className={`industry-slide ${isActive ? "industry-slide--active" : "industry-slide--side"}`}
      style={style}
      aria-hidden={!isVisible}
      onClick={handleSelect}
      role={handleSelect ? "button" : undefined}
      tabIndex={handleSelect ? 0 : -1}
      onKeyDown={
        handleSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelect();
              }
            }
          : undefined
      }
    >
      {industry.imageUrl && (
        <img src={industry.imageUrl} alt="" className="industry-slide__bg" loading="lazy" draggable={false} />
      )}
      <div className="industry-slide__overlay" style={{ backgroundColor: industry.overlayColor }} />

      {/* Both orientations stay mounted. The side title is horizontal text
          rotated -90°, so when its slide becomes active it swings flat (and
          the big title swings in from vertical) — a real rotation, which
          writing-mode can't animate. */}
      <div className={`industry-slide__content ${isActive ? "is-active" : "is-inactive"}`}>
        {industry.number && <span className="industry-slide__number">{industry.number}</span>}
        <h3 className="industry-slide__name">{displayName}</h3>
        <Bullets text={displayDescription} />
        <Link to={industry.exploreLink || "/products"} className="industry-slide__explore" tabIndex={isActive ? 0 : -1} draggable={false}>
          {exploreLabel} <span className="btn-arrow">→</span>
        </Link>
      </div>
      <div className={`industry-slide__vertical ${isActive ? "is-inactive" : "is-active"}`} aria-hidden={isActive}>
        {industry.number && <span className="industry-slide__vnumber">{industry.number}</span>}
        <span className="industry-slide__vname">{displayName}</span>
      </div>
    </div>
  );
});

/**
 * Center-focused industries carousel: one large active slide, two narrow
 * slides on each side. Clicking a side slide, the arrows, the pagination
 * dots, and swiping (mobile/tablet) all move the active slide; navigation
 * loops infinitely in both directions.
 */
export default function IndustriesSlider({ industries, exploreLabel = "Explore More", lang = "en" }) {
  const n = industries.length;
  const [activeIndex, setActiveIndex] = useState(0);
  // Pointer drag state (mouse, touch and pen alike). `moved` lets the click
  // that ends a drag be swallowed, so dragging never selects a slide or
  // follows the Explore link.
  const drag = useRef({ startX: null, dx: 0, moved: false });
  const [dragging, setDragging] = useState(false);
  const lastWheel = useRef(0);
  const viewportRef = useRef(null);
  // Written straight to the viewport's style (not React state) so following
  // the pointer doesn't re-render every slide on each pointermove.
  const setDragOffset = (px) => viewportRef.current?.style.setProperty("--ind-drag", `${px}px`);

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

  const SWIPE_THRESHOLD = 60;
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { startX: e.clientX, dx: 0, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (d.startX === null) return;
    d.dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(d.dx) > 6) {
      d.moved = true;
      setDragging(true);
    }
    if (d.moved) setDragOffset(d.dx);
  };
  const endDrag = () => {
    const d = drag.current;
    if (d.startX === null) return;
    if (d.dx > SWIPE_THRESHOLD) prev();
    else if (d.dx < -SWIPE_THRESHOLD) next();
    d.startX = null;
    setDragging(false);
  };
  // Clear the drag offset in the same commit that turns transitions back on
  // (is-dragging removed), so slides glide from where they were dropped into
  // their new slots instead of snapping back first.
  useLayoutEffect(() => {
    if (!dragging) setDragOffset(0);
  }, [dragging]);
  const onClickCapture = (e) => {
    if (!drag.current.moved) return;
    drag.current.moved = false;
    e.preventDefault();
    e.stopPropagation();
  };
  // Horizontal wheel / trackpad swipe; vertical wheel is left to scroll the page.
  const onWheel = (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 20) return;
    const now = Date.now();
    if (now - lastWheel.current < 600) return; // one slide per gesture
    lastWheel.current = now;
    if (e.deltaX > 0) next();
    else prev();
  };

  const slides = useMemo(
    () => industries.map((ind, i) => ({ ind, index: i, offset: n ? relativeOffset(i, activeIndex, n) : 0 })),
    [industries, activeIndex, n]
  );

  if (n === 0) return null;

  return (
    <div className="industries-slider">
      <div
        ref={viewportRef}
        className={`industries-slider__viewport${dragging ? " is-dragging" : ""}`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onWheel={onWheel}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Industries we serve"
      >
        {slides.map(({ ind, index, offset }) => (
          <IndustrySlide
            key={ind.id}
            industry={ind}
            index={index}
            offset={offset}
            onSelect={goTo}
            exploreLabel={exploreLabel}
            lang={lang}
          />
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

// Builds slide data for the one case where the database has nothing at
// all (API failure, or a truly empty industries table) — pulls names from
// both languages' translation lists so the fallback still switches
// correctly with the language toggle, same as real data would.
export function buildFallbackIndustries(namesEn, namesTh = []) {
  return namesEn.map((name, i) => ({
    id: `fallback-${i}`,
    number: String(i + 1).padStart(2, "0"),
    name,
    nameTh: namesTh[i] || "",
    imageUrl: "",
    overlayColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    description: "",
    descriptionTh: "",
    exploreLink: "/products",
  }));
}
