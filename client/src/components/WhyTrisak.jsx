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
};

function Icon({ name }) {
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

export default function WhyTrisak({ title, lede, reasons, processTitle, steps }) {
  return (
    <section className="section why">
      <div className="why__bg" aria-hidden="true" style={{ backgroundImage: `url("${WHY_BG_IMAGE}")` }} />
      <div className="container why__grid">
        <div className="why__intro">
          <h2>{title}</h2>
          <p className="why__lede">{lede}</p>
          <ul className="why__reasons">
            {reasons.map((r) => (
              <li className="why__reason" key={r.title}>
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
          <ol className="why__steps">
            {steps.map((s) => (
              <li className="why__step" key={s.title}>
                <span className="why__ring">
                  <Icon name={s.icon} />
                </span>
                <div>
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
