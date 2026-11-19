import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { api } from "../../api/client.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

/**
 * Old catalog URLs (a series, a product or a sub-category under
 * /products/:brand/:category/...) → their place in the products guide:
 * the product's series, else its product type, else the guide itself.
 */
export default function LegacyProductRedirect() {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const [to, setTo] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .resolveGuidePath(pathname)
      .then((r) => alive && setTo(r?.to && r.to !== pathname ? r.to : "/products"))
      .catch(() => alive && setTo("/products"));
    return () => {
      alive = false;
    };
  }, [pathname]);

  if (to) return <Navigate to={to} replace />;
  return (
    <section className="section guide-series guide-series--empty">
      <div className="container">
        <p className="empty-state">
          {t("guide.loading")} <Link to="/products">{t("guide.backToGuide")}</Link>
        </p>
      </div>
    </section>
  );
}
