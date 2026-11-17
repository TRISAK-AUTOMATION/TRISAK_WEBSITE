import { useEffect, useRef, useState } from "react";

// The pinned, scroll-driven version runs only on a large screen where motion
// is welcome; elsewhere the same content is a plain vertical story.
const PIN_QUERY = "(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)";

// Scroll length of each phase, in sticky-viewport heights.
const HERO_LEN = 1.6; // photo zooms in, then the first year comes through
const CHAPTER_LEN = 0.9; // one company / year

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * History opening as one scroll story, in the site's light palette:
 *   1. company photo full screen, title on a white fade;
 *   2. scrolling zooms into the photo while it brightens to white and the
 *      first year arrives;
 *   3. each timeline entry is a chapter: the year rolls to the next one
 *      (odometer), its text fades in on the left, its photo as a card on
 *      the right. The page continues normally after the last chapter.
 */
export default function HistoryStory({ photo, eyebrow, title, lede, entries, labels }) {
  const outerRef = useRef(null);
  const stickyRef = useRef(null);
  const geo = useRef({ h: 0 });
  const [mode, setMode] = useState("flow");
  const [chapter, setChapter] = useState(0);
  const count = entries.length;

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia(PIN_QUERY);
    const update = () => setMode(mq.matches ? "pinned" : "flow");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (mode !== "pinned" || !count) return undefined;
    const outer = outerRef.current;
    const sticky = stickyRef.current;
    let frame = 0;

    const render = () => {
      frame = 0;
      const { h } = geo.current;
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const scrolled = Math.max(0, top - outer.getBoundingClientRect().top);
      const hp = clamp01(scrolled / (HERO_LEN * h));
      const into = (scrolled - HERO_LEN * h) / (CHAPTER_LEN * h);
      sticky.style.setProperty("--hp", hp.toFixed(4));
      sticky.classList.toggle("is-chapters", hp > 0.95);
      setChapter(Math.min(count - 1, Math.max(0, Math.floor(into))));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const measure = () => {
      geo.current.h = sticky.offsetHeight;
      outer.style.height = `${geo.current.h * (1 + HERO_LEN + count * CHAPTER_LEN)}px`;
      schedule();
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
      outer.style.height = "";
    };
  }, [mode, count]);

  const goTo = (i) => {
    const sticky = stickyRef.current;
    const top = parseFloat(getComputedStyle(sticky).top) || 0;
    const outerTop = outerRef.current.getBoundingClientRect().top + window.scrollY;
    const at = (HERO_LEN + (i + 0.05) * CHAPTER_LEN) * geo.current.h;
    window.scrollTo({ top: outerTop - top + at, behavior: "smooth" });
  };

  const numeric = count > 0 && entries.every((m) => /^\d{4}$/.test(String(m.year).trim()));
  const current = entries[Math.min(chapter, count - 1)];

  // flow until the timeline has loaded, too
  if (mode === "flow" || !count) {
    return (
      <section className="story story--flow" aria-label={title}>
        <div className="story__flow-hero">
          <img className="story__flow-photo" src={photo} alt="" />
        </div>
        <div className="container story__flow-intro">
          {eyebrow && <span className="story__eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {lede && <p>{lede}</p>}
        </div>
        <ol className="container story__flow-list">
          {entries.map((m) => (
            <li key={m.id} className="story__flow-item">
              <span className="story__flow-year">{m.year}</span>
              <ChapterText m={m} />
              {m.image && <img className="story__flow-image" src={m.image} alt="" loading="lazy" />}
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="story story--pinned" ref={outerRef} aria-label={title}>
      <div className="story__sticky" ref={stickyRef}>
        {/* 1. the company photo, zoomed by scroll, brightening to white */}
        <div className="story__photo" aria-hidden="true">
          <img src={photo} alt="" />
        </div>
        <div className="story__veil" aria-hidden="true" />

        <div className="container story__hero-text">
          {eyebrow && <span className="story__eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {lede && <p>{lede}</p>}
        </div>
        <span className="story__cue" aria-hidden="true">
          {labels.scroll}
          <i />
        </span>

        {/* 2–3. year + text on the left, the chapter photo on the right */}
        <div className="container story__stage">
          <div className="story__copy">
            <div className="story__year" aria-live="polite" aria-label={current?.year}>
              {numeric ? <Odometer value={String(current.year).trim()} /> : <span>{current?.year}</span>}
            </div>
            <div className="story__chapters">
              {entries.map((m, i) => (
                <div
                  key={m.id}
                  className={`story__chapter${i === chapter ? " is-active" : ""}`}
                  aria-hidden={i === chapter ? undefined : "true"}
                >
                  <span className="story__index">
                    {String(i + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                  </span>
                  <ChapterText m={m} />
                </div>
              ))}
            </div>
            <nav className="story__years" aria-label={labels.chapters}>
              {entries.map((m, i) => (
                <button
                  type="button"
                  key={m.id}
                  className={`story__years-item${i === chapter ? " is-active" : ""}`}
                  onClick={() => goTo(i)}
                  aria-current={i === chapter ? "step" : undefined}
                >
                  {m.year}
                </button>
              ))}
            </nav>
          </div>

          <div className="story__media" aria-hidden="true">
            {entries.map((m, i) => (
              <figure key={m.id} className={`story__shot${i === chapter ? " is-active" : ""}`}>
                {m.image ? (
                  <img src={m.image} alt="" loading="lazy" />
                ) : (
                  <span className="story__shot-plate">
                    {m.logo ? <img src={m.logo} alt="" /> : <b>TRISAK</b>}
                  </span>
                )}
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChapterText({ m }) {
  return (
    <>
      {m.logo && <img className="story__logo" src={m.logo} alt={m.brand || ""} />}
      <h2 className="story__title">{m.title}</h2>
      {m.body && <p className="story__body">{m.body}</p>}
    </>
  );
}

/** Each digit is a 0–9 strip that rolls to its value; later digits roll first. */
function Odometer({ value }) {
  return (
    <span className="odo" aria-hidden="true">
      {[...value].map((d, i) => (
        <span className="odo__col" key={i}>
          <span
            className="odo__strip"
            style={{ transform: `translateY(${-Number(d) * 10}%)`, transitionDelay: `${(value.length - 1 - i) * 60}ms` }}
          >
            {"0123456789".split("").map((n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}
