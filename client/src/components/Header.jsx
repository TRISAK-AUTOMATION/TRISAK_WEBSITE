import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const NAV_ITEMS = [
  { key: "home", to: "/" },
  { key: "history", to: "/history" },
  { key: "products", to: "/products" },
  { key: "automationSolution", to: "/automation-solution" },
  { key: "contacts", to: "/contacts" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { lang, toggleLang, t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container site-header__inner">
        <NavLink to="/" className="site-header__logo" onClick={() => setOpen(false)}>
          <span className="site-header__logo-mark">T</span>
          <span className="site-header__logo-text">
            TRISAK<span className="site-header__logo-sub">GROUP</span>
          </span>
        </NavLink>

        <nav className="site-header__nav site-header__nav--desktop" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `site-header__link ${isActive ? "is-active" : ""}`
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
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
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `site-header__mobile-link ${isActive ? "is-active" : ""}`
            }
          >
            {t(`nav.${item.key}`)}
          </NavLink>
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
