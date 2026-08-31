import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useSiteSettings } from "../contexts/SiteSettingsContext.jsx";
import { useMenu } from "../contexts/MenuContext.jsx";
import MenuLink from "./MenuLink.jsx";

// Used only until the admin-managed menu has loaded (or if it ever
// fails to load), so the footer never renders with no links at all.
// Matches the default items seeded into menu_items.
const FALLBACK_FOOTER_ITEMS = [
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

export default function Footer() {
  const { t, lang } = useLanguage();
  const siteSettings = useSiteSettings();
  const footerLogo = siteSettings?.footer_logo_url;
  const menu = useMenu();
  const footerItems = menu?.footer ?? FALLBACK_FOOTER_ITEMS;
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            {footerLogo ? (
              <img className="site-footer__logo-image" src={footerLogo} alt="TRISAK GROUP" />
            ) : (
              <div className="site-footer__brand-mark">TRISAK GROUP</div>
            )}
            <p className="site-footer__tagline">{t("footer.tagline")}</p>
          </div>

          <div>
            <div className="site-footer__heading">{t("footer.quickLinks")}</div>
            <nav className="site-footer__links">
              {footerItems.map((item) => (
                <MenuLink key={item.id} url={item.url}>
                  {lang === "en" ? item.label_en : item.label_th}
                </MenuLink>
              ))}
            </nav>
          </div>

          <div>
            <div className="site-footer__heading">{t("footer.contact")}</div>
            <p className="site-footer__detail">
              <strong>{t("footer.headOffice")}</strong>
              {t("footer.headOfficeAddress")}
              <br />
              +66 (0)2 000 0000
              <br />
              contact@trisakgroup.com
            </p>
          </div>

          <div>
            <div className="site-footer__heading">{t("footer.warehouse")}</div>
            <p className="site-footer__detail">
              <strong>{t("footer.distributionCenter")}</strong>
              {t("footer.warehouseAddress")}
              <br />
              +66 (0)2 111 1111
              <br />
              warehouse@trisakgroup.com
            </p>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>&copy; {year} {t("footer.rights")}</span>
          <span>{t("footer.authorizedLine")}</span>
        </div>
      </div>
    </footer>
  );
}
