import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { api } from "../../api/client.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

/**
 * The Brand page itself has no distinct content to show — it forwards
 * straight into the brand's first category, which renders the
 * sidebar + series-cards layout (CategoryPage.jsx). This matches "Browse
 * by Brand" landing directly in a browsable category view rather than an
 * intermediate empty page.
 */
export default function BrandPage() {
  const { brandSlug } = useParams();
  const { t } = useLanguage();
  const [redirectTo, setRedirectTo] = useState(null);
  const [empty, setEmpty] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setRedirectTo(null);
    setEmpty(false);
    setNotFound(false);
    Promise.all([api.getBrand(brandSlug), api.getCategoriesForBrand(brandSlug)])
      .then(([, categories]) => {
        if (categories.length > 0) {
          setRedirectTo(`/products/${brandSlug}/${categories[0].slug}`);
        } else {
          setEmpty(true);
        }
      })
      .catch(() => setNotFound(true));
  }, [brandSlug]);

  if (notFound) return <Navigate to="/products" replace />;
  if (redirectTo) return <Navigate to={redirectTo} replace />;

  return (
    <section className="section" style={{ paddingTop: 160 }}>
      <div className="container">
        <p className="empty-state">
          {empty ? t("products.emptyState") : t("products.loadingProducts")}
        </p>
      </div>
    </section>
  );
}
