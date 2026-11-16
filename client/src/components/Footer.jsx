import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useSiteSettings } from "../contexts/SiteSettingsContext.jsx";
import { useMenu } from "../contexts/MenuContext.jsx";
import MenuLink from "./MenuLink.jsx";
import ContactIcon from "./contactIcons.jsx";
import { api } from "../api/client.js";
import { DEFAULT_LINE_ID, DEFAULT_MAP_LINKS, lineHref, telHref } from "../utils/contactDefaults.js";

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

/** One location column: the place name as heading, then address / phone / email rows with icons. */
function FooterLocation({ title, address, phone, email, mapLink, directionsLabel }) {
  return (
    <div className="site-footer__col">
      <div className="site-footer__heading">{title}</div>
      <ul className="site-footer__contact">
        {address && (
          <li>
            <ContactIcon name="pin" size={16} />
            <span>
              {address}
              {mapLink && (
                <a className="site-footer__directions" href={mapLink} target="_blank" rel="noopener noreferrer">
                  {directionsLabel}
                  <ContactIcon name="external" size={13} />
                </a>
              )}
            </span>
          </li>
        )}
        {phone && (
          <li>
            <ContactIcon name="phone" size={16} />
            <a href={telHref(phone)}>{phone}</a>
          </li>
        )}
        {email && (
          <li>
            <ContactIcon name="mail" size={16} />
            <a href={`mailto:${email}`}>{email}</a>
          </li>
        )}
      </ul>
    </div>
  );
}

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

  const lineId = ccPlain("line_id", DEFAULT_LINE_ID);
  const lineUrl = ccPlain("line_url", "") || (lineId ? lineHref(lineId) : "");
  const officeHours = cc("office_hours", "");

  return (
    <footer className="site-footer">
      <div className="site-footer__decor" aria-hidden="true" />
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            {footerLogo ? (
              <img className="site-footer__logo-image" src={footerLogo} alt="TRISAK GROUP" />
            ) : (
              <div className="site-footer__brand-mark">TRISAK GROUP</div>
            )}
            <p className="site-footer__tagline">{fc("tagline", t("footer.tagline"))}</p>

            <div className="site-footer__actions">
              <Link to="/contacts#quote" className="site-footer__btn site-footer__btn--light">
                {t("footer.requestQuote")}
                <span aria-hidden="true">→</span>
              </Link>
              {lineUrl && (
                <a className="site-footer__btn site-footer__btn--line" href={lineUrl} target="_blank" rel="noopener noreferrer">
                  <ContactIcon name="chat" size={16} />
                  LINE {lineId}
                </a>
              )}
            </div>

            {officeHours && (
              <p className="site-footer__hours">
                <ContactIcon name="clock" size={15} />
                <span>{officeHours}</span>
              </p>
            )}
          </div>

          <div className="site-footer__col">
            <div className="site-footer__heading">{t("footer.quickLinks")}</div>
            <nav className="site-footer__links">
              {footerItems.map((item) => (
                <MenuLink key={item.id} url={item.url}>
                  {lang === "en" ? item.label_en : item.label_th}
                </MenuLink>
              ))}
            </nav>
          </div>

          <FooterLocation
            title={cc("head_office_label", t("footer.headOffice"))}
            address={cc("head_office_address", t("footer.headOfficeAddress"))}
            phone={ccPlain("head_office_phone", "")}
            email={ccPlain("head_office_email", "")}
            mapLink={ccPlain("head_office_map_link", DEFAULT_MAP_LINKS.head_office)}
            directionsLabel={t("footer.directions")}
          />

          <FooterLocation
            title={cc("warehouse_label", t("footer.warehouse"))}
            address={cc("warehouse_address", t("footer.warehouseAddress"))}
            phone={ccPlain("warehouse_phone", "")}
            email={ccPlain("warehouse_email", "")}
            mapLink={ccPlain("warehouse_map_link", DEFAULT_MAP_LINKS.warehouse)}
            directionsLabel={t("footer.directions")}
          />
        </div>

        <div className="site-footer__bottom">
          <span>
            &copy; {year} {fc("rights", t("footer.rights"))}
          </span>
          <span className="site-footer__authorized">{fc("authorized_line", t("footer.authorizedLine"))}</span>
        </div>
      </div>
    </footer>
  );
}
