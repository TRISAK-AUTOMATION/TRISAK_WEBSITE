/**
 * Shared icon library for the Automation Solutions cards' feature icons —
 * same idea as categoryIcons.jsx: the admin picks an icon per feature and the
 * choice is stored as a short key (or, for a custom icon, an uploaded image's
 * URL). Nothing here maps a particular card to a particular icon.
 *
 * Every icon is a 24×24 line drawing in currentColor, so they all share one
 * stroke weight and take their colour from CSS (resting grey → blue on hover).
 * An uploaded icon is drawn as a mask in currentColor too, so it follows the
 * same colours (use a single-colour image with a transparent background).
 */
const ICON_PATHS = {
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  chip: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx=".8" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7.5 16v-3M12 16V9M16.5 16v-5" />
    </>
  ),
  "servo-drive": (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <rect x="9.5" y="5.5" width="5" height="4" rx=".6" />
      <path d="M10 13h4M10 16h4" />
    </>
  ),
  "servo-motor": (
    <>
      <rect x="4" y="7" width="11" height="10" rx="2" />
      <path d="M15 12h5M7.5 7V5M11.5 7V5" />
    </>
  ),
  motion: <path d="M3 12h4l2.5-6 4 12 2.5-6h5" />,
  "robot-arm": (
    <>
      <path d="M4 20h7M7.5 20v-6l6-5" />
      <circle cx="13.5" cy="9" r="1.5" />
      <path d="M14.6 7.9 18 4.5M18 4.5l2 .5M18 4.5l.5 2" />
    </>
  ),
  cobot: (
    <>
      <path d="M4 20h7M7.5 20v-6a4 4 0 0 1 4-4h2" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M17 12.5V15" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
    </>
  ),
  cloud: <path d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 9.5 4.25 4.25 0 0 1 17 18H7z" />,
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
    </>
  ),
  "network-nodes": (
    <>
      <circle cx="12" cy="6" r="2.5" />
      <circle cx="6" cy="17" r="2.5" />
      <circle cx="18" cy="17" r="2.5" />
      <path d="M10.7 8.2 7.3 14.8M13.3 8.2l3.4 6.6M8.5 17h7" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 17a8 8 0 1 1 16 0" />
      <path d="M12 17l4-5" />
      <circle cx="12" cy="17" r="1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  bolt: <path d="M13 3 5 13h6l-1 8 8-10h-6z" />,
  wifi: (
    <>
      <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  sensor: (
    <>
      <rect x="3" y="9" width="10" height="6" rx="1.5" />
      <path d="M13 10.5h3v3h-3M17.5 9a4 4 0 0 1 0 6M20 7a7 7 0 0 1 0 10" />
    </>
  ),
  wrench: <path d="M14.7 6.3a4 4 0 0 0 5 5L11 20a2.1 2.1 0 0 1-3-3l8.7-8.7a4 4 0 0 0-2-2z" />,
};

// Names shown in the admin icon picker, in display order.
export const FEATURE_ICON_OPTIONS = [
  { key: "monitor", label: "HMI / Screen" },
  { key: "chip", label: "PLC / Chip" },
  { key: "dashboard", label: "SCADA / Dashboard" },
  { key: "servo-drive", label: "Servo Drive" },
  { key: "servo-motor", label: "Servo Motor" },
  { key: "motion", label: "Motion" },
  { key: "robot-arm", label: "Robot Arm" },
  { key: "cobot", label: "Cobot" },
  { key: "gear", label: "Gear" },
  { key: "cloud", label: "Cloud / IoT" },
  { key: "database", label: "Data" },
  { key: "network-nodes", label: "Network" },
  { key: "gauge", label: "Gauge" },
  { key: "shield", label: "Safety" },
  { key: "bolt", label: "Power" },
  { key: "wifi", label: "Wireless" },
  { key: "sensor", label: "Sensor" },
  { key: "wrench", label: "Service" },
];

export const isKnownFeatureIcon = (key) => Boolean(key && ICON_PATHS[key]);

/** An uploaded icon is stored as its URL (same-site path or http(s)). */
export const isFeatureIconUrl = (value) => /^(https?:\/\/|\/)/i.test(value || "");

/**
 * Renders one feature icon. `icon` is a library key, an uploaded image URL, or
 * empty / unknown (neutral placeholder, so a bad value never breaks a card).
 */
export default function FeatureIcon({ icon, className = "feature-icon" }) {
  if (isFeatureIconUrl(icon)) {
    return (
      <span
        className={`${className} ${className}--image`}
        style={{ WebkitMaskImage: `url("${icon}")`, maskImage: `url("${icon}")` }}
        aria-hidden="true"
      />
    );
  }
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[icon] || (
        <>
          <rect x="5" y="5" width="14" height="14" rx="3" />
          <path d="M9 12h6" />
        </>
      )}
    </svg>
  );
}
