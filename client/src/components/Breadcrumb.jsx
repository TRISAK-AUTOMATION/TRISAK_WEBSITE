import { Link } from "react-router-dom";

/** items: [{ label, to }] — the last item renders as plain text (current page) */
export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="breadcrumb__item">
            {isLast || !item.to ? (
              <span className="breadcrumb__current">{item.label}</span>
            ) : (
              <Link to={item.to}>{item.label}</Link>
            )}
            {!isLast && <span className="breadcrumb__sep">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
