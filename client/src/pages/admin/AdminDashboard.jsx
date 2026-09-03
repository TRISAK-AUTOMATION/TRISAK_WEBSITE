import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";

const STATUS_LABELS = {
  new: "ใหม่",
  quoted: "เสนอราคาแล้ว",
  follow_up: "ติดตามผล",
  closed: "ปิดงาน",
};

const ACTIVITY_ICONS = {
  product_added: "🛒",
  product_edited: "✎",
  product_deleted: "🗑",
  brand_added: "🏷",
  brand_edited: "✎",
  brand_deleted: "🗑",
  category_added: "📂",
  category_edited: "✎",
  category_deleted: "🗑",
  series_added: "🧩",
  series_edited: "✎",
  series_deleted: "🗑",
  banner_updated: "🖼",
  datasheet_uploaded: "📄",
  settings_updated: "⚙️",
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString("th-TH", { dateStyle: "medium" });
}

const SUMMARY_CARDS = [
  { key: "products", label: "สินค้าทั้งหมด", icon: "🛒", to: "/admin/products" },
  { key: "categories", label: "หมวดหมู่", icon: "📂", to: "/admin/categories" },
  { key: "brands", label: "แบรนด์", icon: "🏷", to: "/admin/brands" },
  { key: "newLeads", label: "คำขอติดต่อใหม่", icon: "📩", to: "/admin/leads?status=new" },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminGetDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || {};
  const actionRequired = data?.actionRequired || [];
  const recentLeads = data?.recentLeads || [];
  const recentActivity = data?.recentActivity || [];
  const contentStatus = data?.contentStatus || [];
  const maxContentCount = Math.max(1, ...contentStatus.map((c) => c.count));

  return (
    <>
      <h1 style={{ fontSize: "1.8rem", marginBottom: 28 }}>แดชบอร์ด</h1>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      {/* 1 — summary */}
      <div className="admin-dashboard-grid">
        {SUMMARY_CARDS.map((card) => (
          <Link to={card.to} className="admin-dashboard-card panel" key={card.key}>
            <span className="admin-dashboard-card__icon">{card.icon}</span>
            <span className="admin-dashboard-card__count">
              {loading ? "—" : summary[card.key] ?? 0}
            </span>
            <span className="admin-dashboard-card__label">{card.label}</span>
          </Link>
        ))}
      </div>

      <div className="admin-dashboard-columns">
        <div className="admin-dashboard-columns__main">
          {/* 2 — action required */}
          <section className="dashboard-panel panel">
            <h2 className="dashboard-panel__title">ต้องดำเนินการ</h2>
            {!loading && actionRequired.length === 0 && (
              <p className="dashboard-empty">ไม่มีรายการที่ต้องดำเนินการตอนนี้ 🎉</p>
            )}
            {loading && <p className="dashboard-empty">กำลังโหลด…</p>}
            <ul className="dashboard-action-list">
              {actionRequired.map((item) => (
                <li key={item.key} className="dashboard-action-item">
                  <div className="dashboard-action-item__info">
                    <span className="dashboard-action-item__count">{item.count}</span>
                    <span className="dashboard-action-item__label">{item.label}</span>
                  </div>
                  <Link to={item.link} className="dashboard-view-link">
                    ดู →
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 3 — recent leads */}
          <section className="dashboard-panel panel">
            <div className="dashboard-panel__header">
              <h2 className="dashboard-panel__title">คำขอติดต่อล่าสุด</h2>
              <Link to="/admin/leads" className="dashboard-view-link">
                ดูทั้งหมด →
              </Link>
            </div>
            {!loading && recentLeads.length === 0 && (
              <p className="dashboard-empty">ยังไม่มีคำขอติดต่อ</p>
            )}
            {recentLeads.length > 0 && (
              <div className="admin-list-table-wrap">
                <table className="admin-list-table">
                  <thead>
                    <tr>
                      <th>บริษัท</th>
                      <th>สนใจ</th>
                      <th>สถานะ</th>
                      <th>วันที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          {lead.company || lead.name}
                          <div className="admin-list-table__submeta">{lead.email}</div>
                        </td>
                        <td className="admin-list-table__muted">{lead.interestLabel}</td>
                        <td>
                          <span className={`lead-status-badge lead-status-badge--${lead.status}`}>
                            {STATUS_LABELS[lead.status] || lead.status}
                          </span>
                        </td>
                        <td className="admin-list-table__date">{timeAgo(lead.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="admin-dashboard-columns__side">
          {/* 5 — content status */}
          <section className="dashboard-panel panel">
            <h2 className="dashboard-panel__title">สถานะเนื้อหา</h2>
            <ul className="dashboard-content-status">
              {contentStatus.map((item) => (
                <li key={item.label} className="dashboard-content-status__row">
                  <div className="dashboard-content-status__labels">
                    <span>{item.label}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="dashboard-progress-track">
                    <div
                      className="dashboard-progress-fill"
                      style={{ width: `${(item.count / maxContentCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 4 — recent activity */}
          <section className="dashboard-panel panel">
            <h2 className="dashboard-panel__title">กิจกรรมล่าสุด</h2>
            {!loading && recentActivity.length === 0 && (
              <p className="dashboard-empty">ยังไม่มีกิจกรรม</p>
            )}
            <ul className="dashboard-activity-feed">
              {recentActivity.map((a) => (
                <li key={a.id} className="dashboard-activity-item">
                  <span className="dashboard-activity-item__icon">
                    {ACTIVITY_ICONS[a.action_type] || "•"}
                  </span>
                  <div className="dashboard-activity-item__body">
                    <span className="dashboard-activity-item__desc">{a.description}</span>
                    <span className="dashboard-activity-item__time">{timeAgo(a.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
