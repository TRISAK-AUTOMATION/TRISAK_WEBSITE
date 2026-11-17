import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Built-in photos for "Our Experience" when none are uploaded in Admin > History.
export const EXP_PHOTOS_DEFAULT = [
  "/images/solutions/robotics.webp",
  "/images/solutions/smart-factory.webp",
  "/images/solutions/hmi-plc.webp",
];


/**
 * The photos for the banner: the uploaded list (about_content.exp_images, a
 * JSON array), else the older single photo (exp_image), else the defaults.
 */
export function expPhotos(about) {
  let list = about?.exp_images;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      list = [];
    }
  }
  const urls = Array.isArray(list) ? list.filter((u) => typeof u === "string" && u.trim()) : [];
  if (urls.length) return urls;
  return about?.exp_image ? [about.exp_image] : EXP_PHOTOS_DEFAULT;
}

/**
 * One frame that slides left / right through the photos: arrows, swipe, or
 * the segmented progress bar. Plays on its own (each segment fills, then
 * the next photo slides in) and pauses while hovered or focused. A HUD
 * layer (corner brackets, grid, a scan line on every change) gives it the
 * technical feel. Clicking the photo opens it full screen.
 */
export default function ExpGallery({ photos, labels }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(null); // index shown in the lightbox, or null
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const count = photos.length;
  const multi = count > 1;
  const alt = (i) => labels.alt.replace("{n}", i + 1);
  const go = (step) => setIndex((i) => (i + step + count) % count);
  const pad = (n) => String(n).padStart(2, "0");

  // the list can shrink while editing in Admin
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  return (
    <div
      className={`exp-gallery${paused || open !== null ? " is-paused" : ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
      onKeyDown={(e) => {
        if (!multi) return;
        if (e.key === "ArrowRight") go(1);
        else if (e.key === "ArrowLeft") go(-1);
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
        if (multi && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="exp-gallery__viewport">
        <div className="exp-gallery__track" style={{ transform: `translateX(${-index * 100}%)` }}>
          {photos.map((src, i) => (
            <button
              type="button"
              key={`${src}-${i}`}
              className={`exp-gallery__slide${i === index ? " is-active" : ""}`}
              onClick={() => setOpen(i)}
              aria-label={`${alt(i)} · ${labels.enlarge}`}
              aria-hidden={i === index ? undefined : "true"}
              tabIndex={i === index ? 0 : -1}
            >
              <img src={src} alt="" loading={i === 0 ? "eager" : "lazy"} decoding="async" />
            </button>
          ))}
        </div>

        {/* HUD: grid, corner brackets, a scan line replayed on every change */}
        <div className="exp-gallery__hud" aria-hidden="true">
          <span className="exp-gallery__grid" />
          <span className="exp-gallery__scan" key={`scan-${index}`} />
          <span className="exp-gallery__corner exp-gallery__corner--tl" />
          <span className="exp-gallery__corner exp-gallery__corner--tr" />
          <span className="exp-gallery__corner exp-gallery__corner--bl" />
          <span className="exp-gallery__corner exp-gallery__corner--br" />
          <span className="exp-gallery__tag">
            <i className="exp-gallery__pulse" />
            {multi ? `${pad(index + 1)} / ${pad(count)}` : "TRISAK"}
          </span>
        </div>

        {multi && (
          <div className="exp-gallery__controls">
            <button type="button" className="exp-gallery__arrow" onClick={() => go(-1)} aria-label={labels.prev}>
              <Chevron dir="left" />
            </button>
            <button type="button" className="exp-gallery__arrow" onClick={() => go(1)} aria-label={labels.next}>
              <Chevron dir="right" />
            </button>
          </div>
        )}
      </div>

      {multi && (
        <div className="exp-gallery__progress">
          {photos.map((src, i) => (
            <button
              type="button"
              key={`${src}-${i}`}
              className={`exp-gallery__seg${i === index ? " is-active" : ""}${i < index ? " is-done" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={alt(i)}
              aria-current={i === index ? "true" : undefined}
            >
              <span
                className="exp-gallery__seg-fill"
                onAnimationEnd={i === index ? () => go(1) : undefined}
              />
            </button>
          ))}
        </div>
      )}

      {open !== null && (
        <Lightbox photos={photos} start={open} labels={labels} alt={alt} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

function Lightbox({ photos, start, labels, alt, onClose }) {
  const [index, setIndex] = useState(start);
  const closeRef = useRef(null);
  const touchX = useRef(null);
  const count = photos.length;
  const go = useCallback((step) => setIndex((i) => (i + step + count) % count), [count]);

  useEffect(() => {
    const returnTo = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      returnTo?.focus?.();
    };
  }, [go, onClose]);

  return createPortal(
    <div
      className="exp-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt(index)}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
        if (count > 1 && Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <button ref={closeRef} type="button" className="exp-lightbox__close" onClick={onClose} aria-label={labels.close}>
        ×
      </button>
      <figure className="exp-lightbox__stage" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img key={index} src={photos[index]} alt={alt(index)} />
        {count > 1 && (
          <figcaption className="exp-lightbox__counter">
            {index + 1} / {count}
          </figcaption>
        )}
      </figure>
      {count > 1 && (
        <>
          <button type="button" className="exp-lightbox__nav exp-lightbox__nav--prev" onClick={() => go(-1)} aria-label={labels.prev}>
            ‹
          </button>
          <button type="button" className="exp-lightbox__nav exp-lightbox__nav--next" onClick={() => go(1)} aria-label={labels.next}>
            ›
          </button>
          <div className="exp-lightbox__thumbs">
            {photos.map((src, i) => (
              <button
                type="button"
                key={`${src}-${i}`}
                className={`exp-lightbox__thumb${i === index ? " is-active" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={alt(i)}
                aria-current={i === index ? "true" : undefined}
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}
