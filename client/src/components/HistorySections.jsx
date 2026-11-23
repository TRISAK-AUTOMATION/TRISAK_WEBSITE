import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal.jsx";
import ExpGallery from "./ExpGallery.jsx";

/** Counts up to `to` the first time it scrolls into view (instant with reduced motion). */
function CountUp({ to, duration = 1400 }) {
  const ref = useRef(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!el || still || !("IntersectionObserver" in window)) return undefined;
    setValue(0);
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { rootMargin: "0px 0px -15% 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return <span ref={ref}>{value}</span>;
}

/**
 * "Today": closes the scroll story — years in automation as one large
 * number, the intro paragraph, and the key statistics in a single row.
 */
// `renderStat` lets Admin > History swap a statistic's label + number for edit boxes.
export function TodaySection({ eyebrow, years, yearsLabel, body, stats, unitSep, renderStat }) {
  return (
    <section className="today">
      <Reveal className="container today__inner">
        <div className="today__lead">
          <span className="story__eyebrow">{eyebrow}</span>
          {years ? (
            <p className="today__years">
              <span className="today__num">
                <CountUp to={years} />
              </span>
              <span className="today__unit">{yearsLabel}</span>
            </p>
          ) : null}
        </div>
        <div className="today__copy">
          <p className="today__body">{body}</p>
          {stats.length > 0 && (
            <dl className="today__stats" style={{ "--n": stats.length }}>
              {stats.map((s) => (
                <div key={s.id}>
                  {renderStat ? (
                    renderStat(s)
                  ) : (
                    <>
                      <dt>{s.label}</dt>
                      <dd>
                        {s.num}
                        {s.unit ? unitSep(s.unit) + s.unit : ""}
                      </dd>
                    </>
                  )}
                </div>
              ))}
            </dl>
          )}
        </div>
      </Reveal>
    </section>
  );
}

/** "Our work": heading + lede, then the photo slider full width (no HUD). */
export function WorkSection({ eyebrow, title, lede, photos, galleryLabels }) {
  return (
    <section className="work">
      <Reveal className="container">
        <div className="work__head">
          <div>
            <span className="story__eyebrow">{eyebrow}</span>
            <h2 className="work__title">{title}</h2>
          </div>
          {lede && <p className="work__lede">{lede}</p>}
        </div>
        <ExpGallery photos={photos} labels={galleryLabels} plain />
      </Reveal>
    </section>
  );
}

/** Partners + call to action as one closing band. */
export function ClosingSection({ eyebrow, title, sub, logos, contactLabel, productsLabel }) {
  return (
    <section className="closing">
      <Reveal className="container closing__inner">
        <span className="story__eyebrow">{eyebrow}</span>
        <h2 className="closing__title">{title}</h2>
        <p className="closing__sub">{sub}</p>
        <div className="closing__logos">{logos}</div>
        <div className="closing__actions">
          <Link to="/contacts" className="btn btn-primary">
            {contactLabel} <span className="btn-arrow">→</span>
          </Link>
          <Link to="/products" className="btn">
            {productsLabel}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
