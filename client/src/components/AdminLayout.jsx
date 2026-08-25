import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../api/client.js";

const NAV_SECTIONS = [
  {
    key: "dashboard",
    label: "แดชบอร์ด",
    icon: "📊",
    to: "/admin",
    end: true,
  },
  {
    key: "home",
    label: "หน้าแรก",
    icon: "🏠",
    to: "/admin/home",
  },
  {
    key: "product",
    label: "สินค้า",
    icon: "🛒",
    children: [
      { label: "แบรนด์", to: "/admin/brands" },
      { label: "หมวดหมู่", to: "/admin/categories" },
      { label: "ซีรีย์", to: "/admin/series" },
      { label: "รายการ", to: "/admin/products" },
    ],
  },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isSectionActive = (section) =>
    section.children?.some((c) => location.pathname.startsWith(c.to));

  const handleLogout = async () => {
    await api.adminLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__brand-mark">T</span>
          <span className="admin-sidebar__brand-text">TRISAK Admin</span>
        </div>

        <nav className="admin-sidebar__nav">
          {NAV_SECTIONS.map((section) =>
            section.children ? (
              <div
                className={`admin-nav-group ${isSectionActive(section) ? "is-open" : ""}`}
                key={section.key}
              >
                <div className="admin-nav-group__label">
                  <span className="admin-nav-group__icon">{section.icon}</span>
                  {section.label}
                </div>
                <div className="admin-nav-group__children">
                  {section.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className={({ isActive }) =>
                        `admin-nav-link admin-nav-link--child ${isActive ? "is-active" : ""}`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink
                key={section.key}
                to={section.to}
                end={section.end}
                className={({ isActive }) => `admin-nav-link ${isActive ? "is-active" : ""}`}
              >
                <span className="admin-nav-group__icon">{section.icon}</span>
                {section.label}
              </NavLink>
            )
          )}
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__spacer" />
          <div className="admin-user-menu">
            <button
              className="admin-user-menu__trigger"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <span className="admin-user-menu__avatar">S</span>
              Superadmin
              <span className={`admin-user-menu__chevron ${userMenuOpen ? "is-open" : ""}`}>▾</span>
            </button>
            {userMenuOpen && (
              <div className="admin-user-menu__panel">
                <button onClick={handleLogout}>ออกจากระบบ</button>
              </div>
            )}
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
