import { useEffect, useState } from "react";

const INTERVAL_MS = 3000;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Hero background slideshow. Stacks every image as an absolutely-positioned
 * layer and cross-fades between them (CSS opacity transition) every 3s,
 * looping forever. With one image it just shows it; with reduced motion
 * enabled it stays on the first image and never rotates.
 *
 * Renders only the background layers — the caller keeps its own scrim,
 * grid overlay and content, so layout/text/buttons are untouched.
 */
export default function HeroSlideshow({ images }) {
  const reducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const key = images.join("|");

  // New image list (e.g. content loaded/changed) → start from the first.
  useEffect(() => {
    setActive(0);
  }, [key]);

  useEffect(() => {
    if (reducedMotion || images.length < 2) return undefined;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reducedMotion]);

  return (
    <div className="hero__bg-slideshow" aria-hidden="true">
      {images.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className={`hero__bg-image hero__bg-slide${i === active ? " is-active" : ""}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  );
}
