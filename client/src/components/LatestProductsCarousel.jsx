import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import SectionLabel from "./SectionLabel.jsx";
import ProductCard from "./ProductCard.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const AUTOPLAY_MS = 3000;
const SLIDE_MS = 600;
const FETCH_LIMIT = 12;
const VIEW_MORE_HREF = "/products/latest";

// Cards per view: 4 desktop, 2 tablet, 1 mobile (breakpoints match the
// existing .product-grid rules in components.css).
function usePerView() {
  const get = () => {
    if (typeof window === "undefined") return 4;
    if (window.matchMedia("(max-width: 600px)").matches) return 1;
    if (window.matchMedia("(max-width: 900px)").matches) return 2;
    return 4;
  };
  const [perView, setPerView] = useState(get);
  useEffect(() => {
    const queries = [window.matchMedia("(max-width: 600px)"), window.matchMedia("(max-width: 900px)")];
    const update = () => setPerView(get());
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, []);
  return perView;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(q.matches);
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return reduced;
}

export default function LatestProductsCarousel() {
  const { t } = useLanguage();
  const perView = usePerView();
  const reducedMotion = usePrefersReducedMotion();

  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [attempt, setAttempt] = useState(0);

  // `pos` is the logical index of the first visible card. It may step to -1
  // or n (onto a clone) so the loop never jumps; once the slide finishes we
  // silently snap back onto the equivalent real card.
  const [pos, setPos] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const posRef = useRef(0);
  const lockRef = useRef(false);
  const snapTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    api
      .getProducts({ sort: "newest", limit: FETCH_LIMIT })
      .then((rows) => {
        if (cancelled) return;
        setProducts(Array.isArray(rows) ? rows : []);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const n = products.length;
  const canSlide = n > perView;

  // Reset position when the layout or data changes.
  useEffect(() => {
    setAnimate(false);
    posRef.current = 0;
    setPos(0);
    lockRef.current = false;
  }, [perView, n]);

  useEffect(() => () => clearTimeout(snapTimer.current), []);

  const go = useCallback(
    (dir) => {
      if (!canSlide || lockRef.current) return;
      if (reducedMotion) {
        posRef.current = (posRef.current + dir + n) % n;
        setAnimate(false);
        setPos(posRef.current);
        return;
      }
      lockRef.current = true;
      posRef.current += dir;
      setAnimate(true);
      setPos(posRef.current);
      clearTimeout(snapTimer.current);
      snapTimer.current = setTimeout(() => {
        // Landed on a clone? Snap (no transition) to the matching real card.
        const real = ((posRef.current % n) + n) % n;
        if (real !== posRef.current) {
          posRef.current = real;
          setAnimate(false);
          setPos(real);
        }
        lockRef.current = false;
      }, SLIDE_MS + 30);
    },
    [canSlide, n, reducedMotion]
  );

  // Re-enable the transition on the frame after a silent snap.
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(id);
  }, [animate, pos]);

  // Autoplay: one card every 3s. Restarts after any move (incl. arrows),
  // stops on hover, with reduced motion, or when there is nothing to slide.
  useEffect(() => {
    if (!canSlide || paused || reducedMotion || status !== "ready") return undefined;
    const id = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [pos, canSlide, paused, reducedMotion, status, go]);

  // Clones on both ends: last `perView` before, first `perView` after.
  const track = canSlide
    ? [
        ...products.slice(-perView).map((p) => ({ p, key: `h-${p.id}` })),
        ...products.map((p) => ({ p, key: `m-${p.id}` })),
        ...products.slice(0, perView).map((p) => ({ p, key: `t-${p.id}` })),
      ]
    : products.map((p) => ({ p, key: `m-${p.id}` }));
  const offset = canSlide ? pos + perView : 0;

  return (
    <section className="section latest-products">
      <div className="container">
        <div className="section-head-row latest-products__head">
          <SectionLabel title={t("products.latestTitle")} lede={t("products.latestSubtitle")} />
          <Link to={VIEW_MORE_HREF} className="btn btn-primary">
            {t("products.viewMore")} <span className="btn-arrow">→</span>
          </Link>
        </div>

        {status === "loading" && (
          <p className="empty-state" role="status">
            {t("products.loadingProducts")}
          </p>
        )}

        {status === "error" && (
          <div className="empty-state" role="alert">
            <p>{t("products.latestError")}</p>
            <button type="button" className="btn" onClick={() => setAttempt((a) => a + 1)}>
              {t("products.latestRetry")}
            </button>
          </div>
        )}

        {status === "ready" && n === 0 && <p className="empty-state">{t("products.latestEmpty")}</p>}

        {status === "ready" && n > 0 && (
          <div
            className="latest-carousel"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {canSlide && (
              <button
                type="button"
                className="latest-carousel__arrow latest-carousel__arrow--prev"
                aria-label={t("products.latestPrev")}
                onClick={() => go(-1)}
              >
                ‹
              </button>
            )}
            <div className="latest-carousel__viewport">
              <div
                className="latest-carousel__track"
                style={{
                  transform: `translateX(-${(offset * 100) / perView}%)`,
                  transition: animate && !reducedMotion ? `transform ${SLIDE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)` : "none",
                }}
              >
                {track.map(({ p, key }) => {
                  const isClone = key[0] !== "m";
                  return (
                    <div
                      className="latest-carousel__slide"
                      key={key}
                      style={{ flexBasis: `${100 / perView}%` }}
                      aria-hidden={isClone || undefined}
                    >
                      <ProductCard product={p} variant="split" />
                    </div>
                  );
                })}
              </div>
            </div>
            {canSlide && (
              <button
                type="button"
                className="latest-carousel__arrow latest-carousel__arrow--next"
                aria-label={t("products.latestNext")}
                onClick={() => go(1)}
              >
                ›
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
