import { useEffect, useRef, useState } from "react";

// The pinned, scroll-driven version runs only on a large screen where motion
// is welcome; elsewhere the same content is a plain vertical story.
const PIN_QUERY = "(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)";

// Scroll length of each phase, in sticky-viewport heights.
const HERO_LEN = 1.6; // photo zooms in, then the first year comes through
const CHAPTER_LEN = 0.5; // one company / year

// After the wheel / trackpad stops inside the timeline, the page eases to a
// year's resting point. A push past NUDGE (in chapters) from the current year
// moves to the next one in that direction, so one wheel step = one year; a
// smaller one settles back. At the first / last year, the same push outwards
// lets the page leave the timeline (back to the photo / on down the page).
const SETTLE_DELAY = 140; // ms of quiet before settling
const NUDGE = 0.12;

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
  // decided on the first render, so the entrance plays once, in the right layout
  const [mode, setMode] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.(PIN_QUERY).matches ? "pinned" : "flow"
  );
  const [chapter, setChapter] = useState(0);
  const count = entries.length;
  const ready = usePhotoReady(photo);

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
    let settleTimer = 0;
    let rest = null; // the year the timeline last settled on

    // where the timeline is, in chapters: 0 = first year's resting point
    const position = () => {
      const { h } = geo.current;
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const scrolled = Math.max(0, top - outer.getBoundingClientRect().top);
      return { x: (scrolled - HERO_LEN * h) / (CHAPTER_LEN * h) - 0.5, top };
    };
    const settle = () => {
      const { x, top } = position();
      // in the opening photo, or past the timeline: leave it alone
      if (x < -0.5 || x > count - 0.5) {
        rest = null;
        return;
      }
      if (rest === null) rest = Math.min(count - 1, Math.max(0, Math.round(x)));
      // a push outwards at either end leaves the timeline
      if ((rest === 0 && x < -NUDGE) || (rest === count - 1 && x > count - 1 + NUDGE)) {
        rest = null;
        return;
      }
      let target = rest;
      if (x > rest + NUDGE) target = Math.ceil(x - NUDGE);
      else if (x < rest - NUDGE) target = Math.floor(x + NUDGE);
      target = Math.min(count - 1, Math.max(0, target));
      rest = target;
      if (Math.abs(x - target) < 0.02) return;
      const { h } = geo.current;
      const outerTop = outer.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: outerTop - top + (HERO_LEN + (target + 0.5) * CHAPTER_LEN) * h, behavior: "smooth" });
    };
    const onScroll = () => {
      schedule();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, SETTLE_DELAY);
    };

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
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      outer.style.height = "";
    };
  }, [mode, count]);

  const goTo = (i) => {
    const sticky = stickyRef.current;
    const top = parseFloat(getComputedStyle(sticky).top) || 0;
    const outerTop = outerRef.current.getBoundingClientRect().top + window.scrollY;
    const at = (HERO_LEN + (i + 0.5) * CHAPTER_LEN) * geo.current.h; // the year's resting point
    window.scrollTo({ top: outerTop - top + at, behavior: "smooth" });
  };

  const numeric = count > 0 && entries.every((m) => /^\d{4}$/.test(String(m.year).trim()));
  const current = entries[Math.min(chapter, count - 1)];

  // Until the data and the opening photo are in, the layout is already in
  // place but the entrance is held (paused at its first frame), so the page
  // never animates a placeholder or an empty image.
  const waiting = ready ? "" : " is-waiting";

  // flow on small screens, and when the loaded timeline turns out empty
  if (mode === "flow" || (ready && !count)) {
    return (
      <section className="story story--flow" aria-label={title} aria-busy={!ready}>
        <div className={`story__flow-hero${waiting}`}>
          {photo && <img className="story__flow-photo" src={photo} alt="" fetchpriority="high" />}
        </div>
        <div className={`container story__flow-intro${waiting}`}>
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
    <section className="story story--pinned" ref={outerRef} aria-label={title} aria-busy={!ready}>
      <div className={`story__sticky${waiting}`} ref={stickyRef}>
        {/* 1. the company photo, zoomed by scroll, brightening to white */}
        <div className="story__photo" aria-hidden="true">
          {photo && <img src={photo} alt="" fetchpriority="high" />}
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
                  // the chapter photos (often large) wait for the opening
                  // photo, so they don't compete with it for bandwidth
                  ready && <img src={m.image} alt="" decoding="async" />
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

/**
 * True once `photo` (null while the page data loads) has downloaded and
 * decoded — or after 1.5 s, so a slow network never holds the page back.
 * Stays true afterwards: a later photo swap (fresh data replacing the
 * cached copy) just changes the image without replaying the entrance.
 */
function usePhotoReady(photo) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready || !photo) return undefined;
    let done = false;
    const show = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    const img = new Image();
    img.fetchPriority = "high";
    img.src = photo;
    if (typeof img.decode === "function") img.decode().then(show, show);
    else img.onload = img.onerror = show;
    const timer = setTimeout(show, 1500);
    return () => {
      done = true;
      clearTimeout(timer);
    };
  }, [photo, ready]);
  return ready;
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
