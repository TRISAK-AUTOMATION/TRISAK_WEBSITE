import { useEffect, useRef } from "react";

/**
 * History page: "Why TRISAK Group" — the reasons to choose TRISAK on the
 * left, the six-step way of working (consulting → technical support) as a
 * connected chain on the right. Copy comes from translations (history.why*).
 */

// 24×24 line icons in currentColor, same drawing style as featureIcons.jsx.
const ICONS = {
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
      <circle cx="12" cy="12" r="6.5" />
    </>
  ),
  handshake: (
    <>
      <path d="M2.5 8.5 6 6l4 2.5M21.5 8.5 18 6l-4.5 2-4 3.2a1.6 1.6 0 0 0 2.1 2.4l2.4-1.8" />
      <path d="M2.5 8.5v6.5l3 .5 5.5 4.2a1.5 1.5 0 0 0 2-2.2M21.5 8.5v6.5l-3 1-2.8-2.5M13 19l1.2.8a1.5 1.5 0 0 0 2-2.2M15.5 17.5l.5.4a1.5 1.5 0 0 0 2-2.2" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M17.5 14.5c2.2.3 3.7 1.9 4 4.5" />
    </>
  ),
  headset: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
      <path d="M19 19c0 1.7-1.6 2.5-4 2.5h-2" />
    </>
  ),
  consult: (
    <>
      <rect x="3" y="3.5" width="18" height="11" rx="1.5" />
      <path d="M7 11V9M10.5 11V7M14 11V8.5M17.5 11V6.5" />
      <circle cx="7" cy="18.5" r="1.8" />
      <circle cx="17" cy="18.5" r="1.8" />
      <path d="M12 14.5v6" />
    </>
  ),
  design: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M8 20h8M12 17v3" />
      <path d="M7 13.5 10 8l2.5 4 2-2.5 2.5 4" />
    </>
  ),
  box: (
    <>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9M7.8 5.3l8.4 4.5" />
    </>
  ),
  wrench: <path d="M14.7 6.3a4 4 0 0 0 5 5L11 20a2.1 2.1 0 0 1-3-3l8.7-8.7a4 4 0 0 0-2-2z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.7 2.7L16.5 9.5" />
    </>
  ),
  // ── extra set for the editable Automation Solution process steps ──
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="16.5" rx="1.5" />
      <path d="M9 4.5V3.5h6v1M8.5 10h7M8.5 13.5h7M8.5 17h4.5" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 15.5h6M9 19h3.5" />
    </>
  ),
  chip: (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
      <path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21" />
    </>
  ),
  robot: (
    <>
      <rect x="4.5" y="8" width="15" height="11" rx="2" />
      <path d="M12 8V4.5M9.5 21v-2M14.5 21v-2M2.5 12.5v3M21.5 12.5v3" />
      <circle cx="12" cy="3.8" r="1" />
      <circle cx="9" cy="12.5" r="1.2" />
      <circle cx="15" cy="12.5" r="1.2" />
      <path d="M9.5 16h5" />
    </>
  ),
  factory: (
    <>
      <path d="M3 21V10l5 3V10l5 3V10l5 3V4h3v17z" />
      <path d="M7 17h2M12 17h2M17 17h1.5" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 3.5v17h17" />
      <path d="m7 15 4-4.5 3 3 5.5-6.5" />
      <path d="M16 7h3.5v3.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6z" />
      <path d="m8.8 12.2 2.3 2.3 4.2-4.6" />
    </>
  ),
  truck: (
    <>
      <path d="M2.5 6h11v10h-11zM13.5 9.5h4l3 3.5v3h-7" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  bolt: <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z" />,
  bulb: (
    <>
      <path d="M9 17.5h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V17.5h5.2v-1.7c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  rocket: (
    <>
      <path d="M14.5 4.5c2.6-1.3 5.2-1.6 6-1 .6.8.3 3.4-1 6L13 16l-5-5z" />
      <path d="M8 11 4.5 10.5 7.5 7.5h4M13 16l.5 3.5 3-3v-4" />
      <path d="M6.5 16c-1.5.5-2.5 2-3 4.5 2.5-.5 4-1.5 4.5-3" />
      <circle cx="16" cy="8" r="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4M7.5 14h2M11 14h2M14.5 14h2M7.5 17h2M11 17h2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.3-1.5 7.7 5-2.5 5 2.5-1.5-7.7" />
      <path d="m10 9 1.5 1.5L14.5 7.5" />
    </>
  ),
  leaf: (
    <>
      <path d="M20.5 3.5C11 3.5 4.5 8 4.5 15c0 1.7.5 3.4 1.3 5 8.2-.3 14.7-5 14.7-16.5z" />
      <path d="M4 21c3-5 7-8.5 12-11" />
    </>
  ),
  graduation: (
    <>
      <path d="M2.5 9 12 4.5 21.5 9 12 13.5z" />
      <path d="M6.5 11v5c1.5 1.5 3.4 2.3 5.5 2.3s4-.8 5.5-2.3v-5M21.5 9v5.5" />
    </>
  ),
};

/** Keys of every built-in icon, in the order the admin icon picker lists them. */
export const ICON_NAMES = Object.keys(ICONS);

// A step icon may also be an uploaded image (site path or http(s) URL).
export const isIconUrl = (name) => typeof name === "string" && (/^\/(?![/\\])/.test(name) || /^https?:\/\//i.test(name));

// Also used by the Automation Solution page's process steps.
export function Icon({ name }) {
  if (isIconUrl(name)) {
    // Uploaded icons are drawn as a mask in currentColor, so they take the
    // same navy / white-on-hover colour as the built-in line icons.
    const url = `url("${name.replace(/["\\]/g, "")}")`;
    return <span className="why__icon why__icon--custom" style={{ WebkitMaskImage: url, maskImage: url }} aria-hidden="true" />;
  }
  return (
    <svg
      className="why__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name] || ICONS.check}
    </svg>
  );
}

export const WHY_BG_IMAGE = "/images/solutions/smart-factory.webp";

/** Parses a JSON list column (why_reasons / why_steps); bad or empty -> []. */
export function parseIconList(text) {
  try {
    const list = JSON.parse(text || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * The admin-edited reasons/steps ([{icon,title_en,title_th,body_en,body_th}])
 * as {icon,title,body} for one language — each text falls back to the other
 * language. With nothing saved, the built-in list is used.
 */
export function localizeIconList(text, lang, fallback) {
  const list = parseIconList(text);
  if (!list.length) return fallback;
  const other = lang === "th" ? "en" : "th";
  return list.map((item) => ({
    icon: item.icon,
    title: item[`title_${lang}`] || item[`title_${other}`] || "",
    body: item[`body_${lang}`] || item[`body_${other}`] || "",
  }));
}

/**
 * Lights the process steps one by one as they pass the reading line (62% down
 * the viewport): the connector grows into the step, then its ring fills.
 * Without JS or with reduced motion every step simply shows lit.
 */
function useStepLighting(listRef, count) {
  useEffect(() => {
    const list = listRef.current;
    if (!list || !count) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    list.classList.add("is-live");
    let frame = 0;
    const render = () => {
      frame = 0;
      const line = window.innerHeight * 0.62;
      let current = -1;
      [...list.children].forEach((li, i) => {
        const ring = li.querySelector(".why__ring");
        const r = (ring || li).getBoundingClientRect();
        const lit = r.top + r.height / 2 < line;
        li.classList.toggle("is-lit", lit);
        if (lit) current = i;
      });
      [...list.children].forEach((li, i) => li.classList.toggle("is-current", i === current));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      list.classList.remove("is-live");
    };
  }, [listRef, count]);
}

export default function WhyTrisak({ title, lede, reasons, processTitle, steps, bgImage }) {
  const bg = (bgImage || WHY_BG_IMAGE).replace(/["\\]/g, "");
  const stepsRef = useRef(null);
  useStepLighting(stepsRef, steps.length);
  return (
    <section className="section why">
      <div className="why__bg" aria-hidden="true" style={{ backgroundImage: `url("${bg}")` }} />
      <div className="container why__grid">
        <div className="why__intro">
          <h2>{title}</h2>
          <p className="why__lede">{lede}</p>
          <ul className="why__reasons">
            {reasons.map((r, i) => (
              <li className="why__reason" key={i}>
                <span className="why__disc">
                  <Icon name={r.icon} />
                </span>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="why__process">
          <h3 className="why__process-title">{processTitle}</h3>
          <ol className="why__steps" ref={stepsRef}>
            {steps.map((s, i) => (
              <li className="why__step" key={i}>
                <span className="why__ring">
                  <Icon name={s.icon} />
                </span>
                <div>
                  <span className="why__step-no">{String(i + 1).padStart(2, "0")}</span>
                  <h4>{s.title}</h4>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
