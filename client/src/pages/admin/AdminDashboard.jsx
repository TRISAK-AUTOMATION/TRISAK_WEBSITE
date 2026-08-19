import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";

const CARDS = [
  { label: "แบรนด์", key: "brands", to: "/admin/brands", fetch: (a) => a.adminGetBrands() },
  { label: "หมวดหมู่", key: "categories", to: "/admin/categories", fetch: (a) => a.adminGetCategories() },
  { label: "ซีรีย์", key: "series", to: "/admin/series", fetch: (a) => a.adminGetSeriesList() },
  { label: "สินค้าทั้งหมด", key: "products", to: "/admin/products", fetch: (a) => a.adminGetProducts() },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    CARDS.forEach((card) => {
      card
        .fetch(api)
        .then((rows) => setCounts((c) => ({ ...c, [card.key]: rows.length })))
        .catch(() => {});
    });
  }, []);

  return (
    <>
      <h1 style={{ fontSize: "1.8rem", marginBottom: 28 }}>แดชบอร์ด</h1>
      <div className="admin-dashboard-grid">
        {CARDS.map((card) => (
          <Link to={card.to} className="admin-dashboard-card panel" key={card.key}>
            <span className="admin-dashboard-card__count">
              {counts[card.key] ?? "—"}
            </span>
            <span className="admin-dashboard-card__label">{card.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
