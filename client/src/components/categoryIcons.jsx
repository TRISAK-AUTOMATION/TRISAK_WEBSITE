/**
 * Shared category icon library. Icons are chosen per category in the
 * admin (categories.icon_key) — nothing here maps categories to icons.
 */
const ICON_PATHS = {
  "plc-hmi": (
    <>
      <rect x="6" y="8" width="36" height="26" rx="2" />
      <rect x="11" y="13" width="26" height="16" rx="1" />
      <path d="M17 38h14M24 34v4M15 21h6M15 25h10M28 21h5" />
    </>
  ),
  inverter: (
    <>
      <rect x="9" y="5" width="30" height="38" rx="2" />
      <rect x="14" y="10" width="20" height="9" rx="1" />
      <path d="M14 30c3-6 5-6 7 0s4 6 7 0 3-3 5-1" />
      <path d="M16 39h16" />
    </>
  ),
  "servo-motion": (
    <>
      <rect x="4" y="16" width="14" height="16" rx="1" />
      <rect x="18" y="12" width="18" height="24" rx="2" />
      <path d="M36 24h8M22 18v12M27 18v12M32 18v12" />
    </>
  ),
  "industrial-robot": (
    <>
      <path d="M8 42h20M12 42v-6h12v6" />
      <path d="M18 36V22l14-12" />
      <circle cx="18" cy="22" r="3" />
      <circle cx="32" cy="10" r="3" />
      <path d="M34 11l7 4-3 5" />
    </>
  ),
  sensors: (
    <>
      <rect x="6" y="18" width="22" height="12" rx="2" />
      <path d="M28 21h5v6h-5M12 18v-5M12 30v5" />
      <path d="M37 18c3 3 3 9 0 12M41 14c5 6 5 14 0 20" />
    </>
  ),
  safety: (
    <>
      <path d="M24 5l15 6v11c0 10-6 17-15 21C15 39 9 32 9 22V11z" />
      <path d="M17 24l5 5 9-10" />
    </>
  ),
  "io-industrial-pc": (
    <>
      <rect x="5" y="7" width="26" height="20" rx="2" />
      <path d="M12 33h12M18 27v6" />
      <rect x="34" y="12" width="10" height="28" rx="1.5" />
      <path d="M37 18h4M37 23h4M38 35h2" />
    </>
  ),
  "electrical-components": (
    <>
      <rect x="13" y="5" width="22" height="38" rx="2" />
      <rect x="19" y="11" width="10" height="10" rx="1" />
      <path d="M24 13v6M18 30h12M18 35h12" />
      <path d="M5 12h8M5 36h8M35 12h8M35 36h8" />
    </>
  ),
  enclosures: (
    <>
      <rect x="9" y="4" width="30" height="40" rx="2" />
      <rect x="14" y="9" width="20" height="30" rx="1" />
      <path d="M31 22v6M11 12v2M11 32v2" />
    </>
  ),
  gear: (
    <>
      <circle cx="24" cy="24" r="6" />
      <path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4" />
      <circle cx="24" cy="24" r="14" />
    </>
  ),
  cpu: (
    <>
      <rect x="12" y="12" width="24" height="24" rx="2" />
      <rect x="19" y="19" width="10" height="10" />
      <path d="M18 12V6M24 12V6M30 12V6M18 42v-6M24 42v-6M30 42v-6M12 18H6M12 24H6M12 30H6M42 18h-6M42 24h-6M42 30h-6" />
    </>
  ),
  bolt: (
    <>
      <path d="M27 4L10 27h12l-3 17 19-24H26z" />
    </>
  ),
  network: (
    <>
      <rect x="18" y="5" width="12" height="9" rx="1" />
      <rect x="5" y="34" width="12" height="9" rx="1" />
      <rect x="31" y="34" width="12" height="9" rx="1" />
      <path d="M24 14v10M11 34v-10h26v10" />
    </>
  ),
  tools: (
    <>
      <path d="M30 6a9 9 0 0 0-8 12L7 33a4 4 0 0 0 6 6l15-15a9 9 0 0 0 12-8l-6 5-5-2-2-5z" />
    </>
  ),
};

// Human-readable names shown in the admin icon picker.
export const CATEGORY_ICON_OPTIONS = [
  { key: "plc-hmi", label: "PLC / HMI" },
  { key: "inverter", label: "Inverter" },
  { key: "servo-motion", label: "Servo / Motion" },
  { key: "industrial-robot", label: "Robot" },
  { key: "sensors", label: "Sensor" },
  { key: "safety", label: "Safety" },
  { key: "io-industrial-pc", label: "I/O & PC" },
  { key: "electrical-components", label: "Electrical" },
  { key: "enclosures", label: "Enclosure" },
  { key: "gear", label: "Gear" },
  { key: "cpu", label: "CPU" },
  { key: "bolt", label: "Power" },
  { key: "network", label: "Network" },
  { key: "tools", label: "Tools" },
];

export const isKnownCategoryIcon = (key) => Boolean(key && ICON_PATHS[key]);

/** Monochrome line icon. Unknown / empty keys render a neutral placeholder. */
export default function CategoryLineIcon({ iconKey, className = "category-tile__icon" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[iconKey] || (
        <>
          <rect x="8" y="8" width="32" height="32" rx="3" />
          <path d="M16 20h16M16 28h16" />
        </>
      )}
    </svg>
  );
}
