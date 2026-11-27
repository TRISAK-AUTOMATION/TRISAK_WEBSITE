import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useSiteSettings } from "../contexts/SiteSettingsContext.jsx";
import { useMenu } from "../contexts/MenuContext.jsx";
import MenuLink from "./MenuLink.jsx";
import { prefetchHistory } from "../api/historyData.js";
import { cachedGuide, loadGuide, typeHref, typeName } from "../utils/guide.js";

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

// Menu items with a small dropdown (matched by URL, so they work with the
// admin-managed menu). An item is active when its path is the longest one
// matching the current page, e.g. /products/series/x → "Product series".
const PRODUCTS_URL = "/products";
const SERIES_URL = "/products/series";
const SOLUTIONS_URL = "/automation-solution";

// types: the products guide's main categories, listed beside "Product series"
function dropdownItems(url, t, types = [], lang = "en") {
  if (url === PRODUCTS_URL)
    return [
      { to: PRODUCTS_URL, title: t("nav.productsAll"), hint: t("nav.productsAllHint") },
      {
        to: SERIES_URL,
        title: t("nav.productSeries"),
        hint: t("nav.productSeriesHint"),
        children: types.map((tp) => ({ to: typeHref(tp.slug), title: typeName(tp, lang) })),
      },
    ];
  if (url === SOLUTIONS_URL)
    return [
      { to: SOLUTIONS_URL, title: t("automationSolution.heroTitle") },
      ...t("automationSolution.solutions").map((s) => {
        const to = `${SOLUTIONS_URL}/${s.slug}`;
        // "Our services" of that solution page, each jumping to its own unit
        const services = t("automationSolution.details")?.[s.slug]?.services || [];
        return { to, title: s.name, children: services.map((svc, i) => ({ to: `${to}#svc-${i}`, title: svc.title })) };
      }),
    ];
  return null;
}

const matches = (pathname, to) => pathname === to || pathname.startsWith(`${to}/`);

function NavDropdown({ label, to, items }) {
  const { pathname } = useLocation();
  const [closed, setClosed] = useState(false); // shut right after a pick, until the pointer leaves
  const activeTo = items
    .map((it) => it.to)
    .filter((p) => matches(pathname, p))
    .sort((a, b) => b.length - a.length)[0];
  const pick = (e) => {
    setClosed(true);
    e.currentTarget.blur();
  };
  return (
    <div className={`nav-drop${closed ? " is-closed" : ""}`} onPointerLeave={() => setClosed(false)}>
      <NavLink
        to={to}
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
          {items.map((it) => {
            const sub = it.children?.length > 0;
            return (
              <li key={it.to} className={sub ? "nav-drop__has-sub" : undefined}>
                <Link
                  to={it.to}
                  className={`nav-drop__item${it.to === activeTo ? " is-active" : ""}`}
                  aria-current={it.to === activeTo ? "page" : undefined}
                  aria-haspopup={sub ? "true" : undefined}
                  onClick={pick}
                >
                  <span className="nav-drop__title">{it.title}</span>
                  {it.hint && <span className="nav-drop__hint">{it.hint}</span>}
                  {sub && (
                    <svg className="nav-drop__sub-chevron" viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M4.5 3 7.5 6 4.5 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </Link>
                {sub && (
                  <div className="nav-drop__sub">
                    <ul className="nav-drop__list">
                      {it.children.map((c) => (
                        <li key={c.to}>
                          <Link to={c.to} className="nav-drop__item" onClick={pick}>
                            <span className="nav-drop__title nav-drop__title--sub">{c.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
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
  const [guideTypes, setGuideTypes] = useState(() => cachedGuide()?.types || []);

  // main product categories for the Products › Product series submenu
  useEffect(() => {
    let alive = true;
    loadGuide()
      .then((g) => alive && setGuideTypes(g.types || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

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
            dropdownItems(item.url, t, guideTypes, lang) ? (
              <NavDropdown
                key={item.id}
                to={item.url}
                label={lang === "en" ? item.label_en : item.label_th}
                items={dropdownItems(item.url, t, guideTypes, lang)}
              />
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
        )).flatMap((link, i) => [
          link,
          // the dropdown's own items, minus the one the parent link already is
          ...(dropdownItems(navItems[i].url, t, guideTypes, lang) || [])
            .filter((it) => it.to !== navItems[i].url)
            .map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `site-header__mobile-sublink${isActive ? " is-active" : ""}`}
              >
                {it.title}
              </NavLink>
            )),
        ])}

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
