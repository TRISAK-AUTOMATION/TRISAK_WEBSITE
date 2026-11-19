import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useSiteSettings } from "../contexts/SiteSettingsContext.jsx";
import { useMenu } from "../contexts/MenuContext.jsx";
import MenuLink from "./MenuLink.jsx";
import { prefetchHistory } from "../api/historyData.js";

// Pointer, keyboard focus or a touch reaching a menu link to /history starts
// loading that page's data and opening photo before the click lands.
const PREFETCH = { "/history": prefetchHistory };
function prefetchFromEvent(e) {
  const href = e.target.closest?.("a")?.getAttribute("href");
  PREFETCH[href]?.();
}
const prefetchProps = {
  onPointerOver: prefetchFromEvent,
  onFocus: prefetchFromEvent,
  onTouchStart: prefetchFromEvent,
};

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

// The Products menu item opens a small dropdown: the full catalog and the
// series guide (matched by URL, so it works with the admin-managed menu).
const PRODUCTS_URL = "/products";
const SERIES_URL = "/products/series";

function ProductsDropdown({ label, t }) {
  const { pathname } = useLocation();
  const [closed, setClosed] = useState(false); // shut right after a pick, until the pointer leaves
  const inSeries = pathname === SERIES_URL || pathname.startsWith(`${SERIES_URL}/`);
  const inCatalog = !inSeries && (pathname === PRODUCTS_URL || pathname.startsWith(`${PRODUCTS_URL}/`));
  const pick = (e) => {
    setClosed(true);
    e.currentTarget.blur();
  };
  const items = [
    { to: PRODUCTS_URL, title: t("nav.productsAll"), hint: t("nav.productsAllHint"), active: inCatalog },
    { to: SERIES_URL, title: t("nav.productSeries"), hint: t("nav.productSeriesHint"), active: inSeries },
  ];
  return (
    <div className={`nav-drop${closed ? " is-closed" : ""}`} onPointerLeave={() => setClosed(false)}>
      <NavLink
        to={PRODUCTS_URL}
        className={({ isActive }) => `site-header__link nav-drop__trigger${isActive ? " is-active" : ""}`}
        aria-haspopup="true"
        onClick={pick}
      >
        {label}
        <svg className="nav-drop__chevron" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </NavLink>
      <div className="nav-drop__panel">
        <ul className="nav-drop__list">
          {items.map((it) => (
            <li key={it.to}>
              <Link
                to={it.to}
                className={`nav-drop__item${it.active ? " is-active" : ""}`}
                aria-current={it.active ? "page" : undefined}
                onClick={pick}
              >
                <span className="nav-drop__title">{it.title}</span>
                <span className="nav-drop__hint">{it.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { lang, toggleLang, t } = useLanguage();
  const siteSettings = useSiteSettings();
  const headerLogo = siteSettings?.header_logo_url;
  const menu = useMenu();
  const navItems = menu?.header ?? FALLBACK_NAV_ITEMS;
  const headerRef = useRef(null);

  // Publish the header's real rendered height as --header-height so the page
  // offset and the Home hero (100vh − header) track it if it ever changes.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const root = document.documentElement;
    const publish = () => root.style.setProperty("--header-height", `${el.offsetHeight}px`);
    publish();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={headerRef} className={`site-header ${scrolled || open ? "is-scrolled" : ""}`}>
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

        <nav className="site-header__nav site-header__nav--desktop" aria-label="Main" {...prefetchProps}>
          {navItems.map((item) =>
            item.url === PRODUCTS_URL ? (
              <ProductsDropdown key={item.id} label={lang === "en" ? item.label_en : item.label_th} t={t} />
            ) : (
              <MenuLink
                key={item.id}
                url={item.url}
                end={item.url === "/"}
                className="site-header__link"
                activeClassName="is-active"
              >
                {lang === "en" ? item.label_en : item.label_th}
              </MenuLink>
            )
          )}
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
        {...prefetchProps}
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
        )).flatMap((link, i) =>
          navItems[i].url === PRODUCTS_URL
            ? [
                link,
                <NavLink
                  key="products-series"
                  to={SERIES_URL}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `site-header__mobile-sublink${isActive ? " is-active" : ""}`}
                >
                  {t("nav.productSeries")}
                </NavLink>,
              ]
            : [link]
        )}

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
