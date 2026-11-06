import { useLanguage } from "../i18n/LanguageContext.jsx";
import { availabilityLabel } from "../utils/productAvailability.js";

// Clear status label for every product (Available, Discontinued,
// Replacement Available).
export default function AvailabilityBadge({ status }) {
  const { t } = useLanguage();
  const value = availabilityLabel(status) ? status : "available";
  const label = t(`products.availability.${value}`);
  return (
    <span className={`availability-badge availability-badge--${value.replace(/_/g, "-")}`}>
      {label && !label.startsWith("products.") ? label : availabilityLabel(value)}
    </span>
  );
}
