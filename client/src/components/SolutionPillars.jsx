import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import hmiPlcImg from "../assets/solutions/hmi-plc.webp";
import driveMotionImg from "../assets/solutions/drive-motion.webp";
import roboticsImg from "../assets/solutions/robotics.webp";
import smartFactoryImg from "../assets/solutions/smart-factory.webp";

// Line icons (24×24, drawn with currentColor so CSS can tint them).
const icon = (children) =>
  function Icon() {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    );
  };

const HmiIcon = icon(<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>);
const PlcIcon = icon(<><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9.5" y="9.5" width="5" height="5" rx=".8" /><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></>);
const ScadaIcon = icon(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7.5 16v-3M12 16V9M16.5 16v-5" /></>);
const ServoDriveIcon = icon(<><rect x="7" y="3" width="10" height="18" rx="2" /><rect x="9.5" y="5.5" width="5" height="4" rx=".6" /><path d="M10 13h4M10 16h4" /></>);
const ServoMotorIcon = icon(<><rect x="4" y="7" width="11" height="10" rx="2" /><path d="M15 12h5M7.5 7V5M11.5 7V5" /></>);
const MotionIcon = icon(<path d="M3 12h4l2.5-6 4 12 2.5-6h5" />);
const RobotIcon = icon(<><path d="M4 20h7M7.5 20v-6l6-5" /><circle cx="13.5" cy="9" r="1.5" /><path d="M14.6 7.9 18 4.5M18 4.5l2 .5M18 4.5l.5 2" /></>);
const CobotIcon = icon(<><path d="M4 20h7M7.5 20v-6a4 4 0 0 1 4-4h2" /><circle cx="17" cy="10" r="2.5" /><path d="M17 12.5V15" /></>);
const GearIcon = icon(<><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="6.5" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" /></>);
const CloudIcon = icon(<path d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 9.5 4.25 4.25 0 0 1 17 18H7z" />);
const DatabaseIcon = icon(<><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" /></>);
const NodesIcon = icon(<><circle cx="12" cy="6" r="2.5" /><circle cx="6" cy="17" r="2.5" /><circle cx="18" cy="17" r="2.5" /><path d="M10.7 8.2 7.3 14.8M13.3 8.2l3.4 6.6M8.5 17h7" /></>);

// One entry per pillar, in the same order as home.pillars / home.pillarItems.
// To change a picture, drop a new file in src/assets/solutions and swap it here.
const PILLARS = [
  { image: hmiPlcImg, icons: [HmiIcon, PlcIcon, ScadaIcon] },
  { image: driveMotionImg, icons: [ServoDriveIcon, ServoMotorIcon, MotionIcon] },
  { image: roboticsImg, icons: [RobotIcon, CobotIcon, GearIcon] },
  { image: smartFactoryImg, icons: [CloudIcon, DatabaseIcon, NodesIcon] },
];

/**
 * The four Automation Solutions cards on the Home page (2 × 2 on desktop, one
 * column on mobile). Every card links to the existing Automation Solution page.
 */
export default function SolutionPillars() {
  const { t } = useLanguage();
  const titles = t("home.pillars");
  const items = t("home.pillarItems");

  return (
    <div className="pillar-grid">
      {PILLARS.map(({ image, icons }, i) => (
        <Link to="/automation-solution" className="pillar-card" key={i}>
          <div className="pillar-card__inner">
            <div className="pillar-card__body">
              <span className="pillar-card__num">0{i + 1}</span>
              <h3>{titles[i]}</h3>
              <p>{items[i].desc}</p>
              <ul className="pillar-card__features">
                {items[i].features.map((label, j) => {
                  const Icon = icons[j];
                  return (
                    <li key={label}>
                      <span className="pillar-card__icon">
                        <Icon />
                      </span>
                      <span className="pillar-card__label">{label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="pillar-card__media" aria-hidden="true">
              <img src={image} alt="" loading="lazy" decoding="async" width="740" height="446" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
