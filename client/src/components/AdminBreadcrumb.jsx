import { Link } from "react-router-dom";

/** items: [{ label, to }] — the last item renders as plain text (current page) */
export default function AdminBreadcrumb({ items }) {
  const all = [{ label: "หน้าหลัก", to: "/admin" }, ...items];
  return (
    <nav className="admin-breadcrumb" aria-label="Breadcrumb">
      {all.map((item, i) => {
        const isLast = i === all.length - 1;
        return (
          <span key={i} className="admin-breadcrumb__item">
            {isLast || !item.to ? (
              <span className="admin-breadcrumb__current">{item.label}</span>
            ) : (
              <Link to={item.to}>{item.label}</Link>
            )}
            {!isLast && <span className="admin-breadcrumb__sep">›</span>}
          </span>
        );
      })}
    </nav>
  );
}
