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
    key: "edit",
    label: "แก้ไข (Edit)",
    icon: "✎",
    children: [
      { label: "หน้าแรก (Home)", to: "/admin/home" },
      { label: "ประวัติบริษัท (History)", to: "/admin/about" },
      { label: "สินค้า (Products)", to: "/admin/products-page" },
      { label: "ติดต่อเรา (Contact Us)", to: "/admin/contact" },
      { label: "โซลูชันระบบอัตโนมัติ (Automation Solution)", to: "/admin/automation-solution" },
      { label: "ลูกค้าของเรา (Our Customers)", to: "/admin/customers" },
      { label: "Footer", to: "/admin/footer" },
      { label: "ป๊อปอัพ (Pop-up)", to: "/admin/popups" },
    ],
  },
  {
    key: "menu",
    label: "เมนู",
    icon: "🧭",
    to: "/admin/menu",
  },
  {
    key: "leads",
    label: "คำขอติดต่อ",
    icon: "📩",
    to: "/admin/leads",
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
  {
    key: "settings",
    label: "การตั้งค่า",
    icon: "⚙️",
    children: [{ label: "เว็บไซต์", to: "/admin/settings/website" }],
  },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isSectionActive = (section) =>
    section.children?.some((c) => location.pathname.startsWith(c.to));

  // Groups start expanded if the current page is one of their
  // children; otherwise collapsed. From then on the admin controls
  // it directly by clicking the group label.
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    NAV_SECTIONS.forEach((s) => {
      if (s.children) initial[s.key] = isSectionActive(s);
    });
    return initial;
  });
  const toggleGroup = (key) => setOpenGroups((g) => ({ ...g, [key]: !g[key] }));

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
                className={`admin-nav-group ${openGroups[section.key] ? "is-open" : ""}`}
                key={section.key}
              >
                <button
                  type="button"
                  className="admin-nav-group__label"
                  onClick={() => toggleGroup(section.key)}
                  aria-expanded={Boolean(openGroups[section.key])}
                >
                  <span className="admin-nav-group__icon">{section.icon}</span>
                  {section.label}
                  <span className="admin-nav-group__chevron">▾</span>
                </button>
                <div className="admin-nav-group__children">
                  {openGroups[section.key] &&
                    section.children.map((child) => (
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
