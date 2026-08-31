import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useSiteSettings } from "../contexts/SiteSettingsContext.jsx";
import { useMenu } from "../contexts/MenuContext.jsx";
import MenuLink from "./MenuLink.jsx";

// Used only until the admin-managed menu has loaded (or if it ever
// fails to load), so the header never renders with no navigation at
// all. Matches the default items seeded into menu_items.
const FALLBACK_NAV_ITEMS = [
  { id: "home", label_en: "Home", label_th: "หน้าแรก", url: "/" },
  { id: "history", label_en: "History", label_th: "ประวัติบริษัท", url: "/history" },
  { id: "products", label_en: "Products", label_th: "สินค้า", url: "/products" },
  {
    id: "automationSolution",
    label_en: "Automation Solution",
    label_th: "โซลูชันระบบอัตโนมัติ",
    url: "/automation-solution",
  },
  { id: "contacts", label_en: "Contacts", label_th: "ติดต่อเรา", url: "/contacts" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { lang, toggleLang, t } = useLanguage();
  const siteSettings = useSiteSettings();
  const headerLogo = siteSettings?.header_logo_url;
  const menu = useMenu();
  const navItems = menu?.header ?? FALLBACK_NAV_ITEMS;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container site-header__inner">
        <NavLink to="/" className="site-header__logo" onClick={() => setOpen(false)}>
          {headerLogo ? (
            <img className="site-header__logo-image" src={headerLogo} alt="TRISAK GROUP" />
          ) : (
            <>
              <span className="site-header__logo-mark">T</span>
              <span className="site-header__logo-text">
                TRISAK<span className="site-header__logo-sub">GROUP</span>
              </span>
            </>
          )}
        </NavLink>

        <nav className="site-header__nav site-header__nav--desktop" aria-label="Main">
          {navItems.map((item) => (
            <MenuLink
              key={item.id}
              url={item.url}
              end={item.url === "/"}
              className="site-header__link"
              activeClassName="is-active"
            >
              {lang === "en" ? item.label_en : item.label_th}
            </MenuLink>
          ))}
        </nav>

        <div className="site-header__actions">
          <button
            type="button"
            className="lang-toggle"
            onClick={toggleLang}
            aria-label="Switch language"
          >
            <span className={lang === "en" ? "is-active" : ""}>EN</span>
            <span className="lang-toggle__sep">/</span>
            <span className={lang === "th" ? "is-active" : ""}>TH</span>
          </button>

          <NavLink to="/contacts" className="btn btn-primary site-header__cta">
            {t("nav.contactUs")}
          </NavLink>
        </div>

        <button
          className={`site-header__burger ${open ? "is-open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav
        className={`site-header__nav--mobile ${open ? "is-open" : ""}`}
        aria-label="Mobile"
      >
        {navItems.map((item) => (
          <MenuLink
            key={item.id}
            url={item.url}
            end={item.url === "/"}
            onClick={() => setOpen(false)}
            className="site-header__mobile-link"
            activeClassName="is-active"
          >
            {lang === "en" ? item.label_en : item.label_th}
          </MenuLink>
        ))}

        <button
          type="button"
          className="lang-toggle lang-toggle--mobile"
          onClick={toggleLang}
          aria-label="Switch language"
        >
          <span className={lang === "en" ? "is-active" : ""}>EN</span>
          <span className="lang-toggle__sep">/</span>
          <span className={lang === "th" ? "is-active" : ""}>TH</span>
        </button>

        <NavLink to="/contacts" className="btn btn-primary" onClick={() => setOpen(false)}>
          {t("nav.contactUs")}
        </NavLink>
      </nav>
    </header>
  );
}
