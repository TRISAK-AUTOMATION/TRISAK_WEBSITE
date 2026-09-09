import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useSiteSettings } from "../contexts/SiteSettingsContext.jsx";
import { useMenu } from "../contexts/MenuContext.jsx";
import MenuLink from "./MenuLink.jsx";
import { api } from "../api/client.js";

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

  const [footerContent, setFooterContent] = useState(null);
  // Reuses the same admin-edited data as the Contact Us page, so
  // editing an address/phone/email in one place updates both.
  const [contactsContent, setContactsContent] = useState(null);

  useEffect(() => {
    api.getFooterContent().then(setFooterContent).catch(() => setFooterContent(null));
    api.getContactsPageContent().then(setContactsContent).catch(() => setContactsContent(null));
  }, []);

  const fc = (field, fallback) => {
    if (!footerContent) return fallback;
    const value = footerContent[`${field}_${lang}`];
    return value || fallback;
  };
  const cc = (field, fallback) => {
    if (!contactsContent) return fallback;
    const value = contactsContent[`${field}_${lang}`];
    return value || fallback;
  };
  const ccPlain = (field, fallback) => (contactsContent && contactsContent[field]) || fallback;

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
            <p className="site-footer__tagline">{fc("tagline", t("footer.tagline"))}</p>
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
              <strong>{cc("head_office_label", t("footer.headOffice"))}</strong>
              {cc("head_office_address", t("footer.headOfficeAddress"))}
              <br />
              {ccPlain("head_office_phone", "+66 (0)2 000 0000")}
              <br />
              {ccPlain("head_office_email", "contact@trisakgroup.com")}
            </p>
          </div>

          <div>
            <div className="site-footer__heading">{t("footer.warehouse")}</div>
            <p className="site-footer__detail">
              <strong>{cc("warehouse_label", t("footer.distributionCenter"))}</strong>
              {cc("warehouse_address", t("footer.warehouseAddress"))}
              <br />
              {ccPlain("warehouse_phone", "+66 (0)2 111 1111")}
              <br />
              {ccPlain("warehouse_email", "warehouse@trisakgroup.com")}
            </p>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>
            &copy; {year} {fc("rights", t("footer.rights"))}
          </span>
          <span>{fc("authorized_line", t("footer.authorizedLine"))}</span>
        </div>
      </div>
    </footer>
  );
}
