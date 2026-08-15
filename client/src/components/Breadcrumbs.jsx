import { Link } from "react-router-dom";

/**
 * items: [{ label, to }] — the last item is rendered as plain text (current page).
 */
export default function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span className="breadcrumbs__item" key={`${item.label}-${i}`}>
            {isLast || !item.to ? (
              <span className="breadcrumbs__current">{item.label}</span>
            ) : (
              <Link to={item.to} className="breadcrumbs__link">
                {item.label}
              </Link>
            )}
            {!isLast && <span className="breadcrumbs__sep">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
