import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <div className="site-footer__brand-mark">TRISAK GROUP</div>
            <p className="site-footer__tagline">{t("footer.tagline")}</p>
          </div>

          <div>
            <div className="site-footer__heading">{t("footer.quickLinks")}</div>
            <nav className="site-footer__links">
              <Link to="/">{t("nav.home")}</Link>
              <Link to="/history">{t("nav.history")}</Link>
              <Link to="/products">{t("nav.products")}</Link>
              <Link to="/automation-solution">{t("nav.automationSolution")}</Link>
              <Link to="/contacts">{t("nav.contacts")}</Link>
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
