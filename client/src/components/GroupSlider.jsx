import { useCallback, useEffect, useRef, useState } from "react";
import Chevron from "./Chevron.jsx";

// How far (px) a mouse/touch drag has to travel before it counts as
// "go to the next/previous slide" when released.
const DRAG_THRESHOLD = 80;

/** Circular offset of slide `i` from the active one: 0 = center,
 *  -1 = left, +1 = right (for 3 slides every slide is one of those). */
function relativeOffset(i, active, n) {
  let diff = (((i - active) % n) + n) % n;
  if (diff > n / 2) diff -= n;
  return diff;
}

/** Two-line "TRISAK / GROUP" heading of the TRISAK GROUP section
 *  (Montserrat black italic; GROUP in the brand blue). */
export function GroupWordmark() {
  return (
    <span className="group-wordmark" aria-label="TRISAK GROUP">
      <span className="group-wordmark__top" aria-hidden="true">TRISAK</span>
      <span className="group-wordmark__bottom" aria-hidden="true">GROUP</span>
    </span>
  );
}

/**
 * TRISAK GROUP carousel: one large center slide with the previous/next
 * slides peeking out behind it on the left and right. Each slide has the
 * company logo top-left, the text left-aligned, and a certificate image
 * on the right. Navigate with the arrows, the dots, clicking a side
 * slide, the arrow keys, or by pressing and dragging (mouse or touch).
 *
 * slides: [{ logo, logoHeight, title, body, certificate, certificateAlt }]
 */
export default function GroupSlider({ slides, certificatePlaceholder = "Certificate", ariaLabel = "TRISAK GROUP" }) {
  const n = slides.length;
  const [active, setActive] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(null);
  const moved = useRef(false);

  useEffect(() => {
    setActive((i) => (n === 0 ? 0 : ((i % n) + n) % n));
  }, [n]);

  const goTo = useCallback((i) => setActive(((i % n) + n) % n), [n]);

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
    setDragX(0);
  };
  const onPointerMove = (e) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 5) moved.current = true;
    setDragX(dx);
  };
  const endDrag = () => {
    if (startX.current === null) return;
    startX.current = null;
    if (dragX < -DRAG_THRESHOLD) goTo(active + 1);
    else if (dragX > DRAG_THRESHOLD) goTo(active - 1);
    setDragging(false);
    setDragX(0);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") goTo(active - 1);
    else if (e.key === "ArrowRight") goTo(active + 1);
  };

  if (n === 0) return null;

  return (
    <div className="group-slider">
      <div
        className={`group-slider__viewport${dragging ? " is-dragging" : ""}`}
        style={{ "--gs-drag": `${dragX}px` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onKeyDown={onKeyDown}
        onDragStart={(e) => e.preventDefault()}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
      >
        {slides.map((s, i) => {
          const offset = relativeOffset(i, active, n);
          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 1;
          const pos = isActive ? "center" : offset < 0 ? "left" : offset > 0 ? "right" : "hidden";
          return (
            <article
              key={i}
              className={`group-slide group-slide--${isVisible ? pos : "hidden"}`}
              style={{ "--gs-offset": offset }}
              aria-hidden={!isActive}
              onClick={!isActive && isVisible ? () => !moved.current && goTo(i) : undefined}
            >
              <div className="group-slide__text">
                {s.logo ? (
                  <img
                    className="group-slide__logo"
                    src={s.logo}
                    alt={s.title}
                    style={{ height: s.logoHeight }}
                    draggable="false"
                  />
                ) : null}
                <span className="group-slide__index">
                  {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
              <figure className="group-slide__cert">
                {s.certificate ? (
                  <img src={s.certificate} alt={s.certificateAlt || s.title} draggable="false" loading="lazy" />
                ) : (
                  <div className="group-slide__cert-placeholder">{certificatePlaceholder}</div>
                )}
              </figure>
            </article>
          );
        })}
      </div>

      <div className="industries-slider__nav">
        <button type="button" className="industries-slider__arrow" onClick={() => goTo(active - 1)} aria-label="Previous">
          <Chevron dir="left" />
        </button>
        <div className="industries-slider__dots">
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              className={`industries-slider__dot ${i === active ? "is-active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={s.title}
              aria-current={i === active}
            />
          ))}
        </div>
        <button type="button" className="industries-slider__arrow" onClick={() => goTo(active + 1)} aria-label="Next">
          <Chevron dir="right" />
        </button>
      </div>
    </div>
  );
}
