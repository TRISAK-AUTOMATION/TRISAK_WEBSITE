import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function ProductThumb({ label, isNew, size = "md" }) {
  const { t } = useLanguage();
  return (
    <div className={`product-thumb product-thumb--${size}`}>
      {isNew && <span className="product-thumb__badge">{t("common.newBadge")}</span>}
      <span className="product-thumb__label">{label}</span>
    </div>
  );
}
