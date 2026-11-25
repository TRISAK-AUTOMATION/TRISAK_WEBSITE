import { Outlet, NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { SOLUTION_ADMIN_PATH, SOLUTIONS_CHANGED_EVENT } from "../pages/admin/AdminAutomationSolution.jsx";

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
      { label: "ประวัติบริษัท (History)", to: "/admin/history" },
      { label: "สินค้า (Products)", to: "/admin/products-page" },
      { label: "ติดต่อเรา (Contact Us)", to: "/admin/contact" },
      { label: "ลูกค้าของเรา (Our Customers)", to: "/admin/customers" },
      { label: "สไลด์อุตสาหกรรม (Industries Slider)", to: "/admin/industries" },
      { label: "Footer", to: "/admin/footer" },
      { label: "ป๊อปอัพ (Pop-up)", to: "/admin/popups" },
    ],
  },
  {
    key: "automation-solution",
    label: "โซลูชันระบบอัตโนมัติ (Automation Solution)",
    icon: "🤖",
    // one link per solution is appended at runtime (see solutionLinks)
    children: [{ label: "ภาพรวมทั้งหมด (Overview)", to: SOLUTION_ADMIN_PATH, end: true }],
  },
  {
    key: "menu",
    label: "เมนู",
    icon: "🧭",
    to: "/admin/menu",
  },
  {
    key: "contact-requests",
    label: "คำขอติดต่อ (Contact Requests)",
    icon: "📩",
    to: "/admin/contact-requests",
  },
  {
    key: "career",
    label: "ตำแหน่งงาน (Career)",
    icon: "💼",
    children: [
      { label: "จัดการตำแหน่งงาน", to: "/admin/career", end: true },
      { label: "คำขอสมัครงาน", to: "/admin/career/applications" },
    ],
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
    children: [
      { label: "เว็บไซต์", to: "/admin/settings/website" },
      { label: "ผู้ใช้งาน", to: "/admin/settings/users", superadminOnly: true },
    ],
  },
];

const ROLE_LABELS = { superadmin: "Superadmin", admin: "Admin" };

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // the signed-in account (name in the top bar, superadmin-only menu items)
  const [me, setMe] = useState(null);

  // each solution gets its own sidebar link to its edit page
  const [solutionLinks, setSolutionLinks] = useState([]);

  useEffect(() => {
    api.adminMe().then(setMe).catch(() => setMe(null));
  }, []);

  // reloaded whenever the editor saves, deletes or reorders a solution
  useEffect(() => {
    const load = () =>
      api
        .adminGetSolutions()
        .then((rows) =>
          setSolutionLinks(
            (rows || []).map((r) => ({
              label: r.name_th || r.name || `Solution #${r.id}`,
              to: `${SOLUTION_ADMIN_PATH}/${r.id}`,
            }))
          )
        )
        .catch(() => setSolutionLinks([]));
    load();
    window.addEventListener(SOLUTIONS_CHANGED_EVENT, load);
    return () => window.removeEventListener(SOLUTIONS_CHANGED_EVENT, load);
  }, []);

  // close the user menu when navigating
  useEffect(() => setUserMenuOpen(false), [location.pathname]);

  const isSuperadmin = me?.role === "superadmin";
  const sections = NAV_SECTIONS.map((s) => {
    if (!s.children) return s;
    const children = s.children.filter((c) => !c.superadminOnly || isSuperadmin);
    return { ...s, children: s.key === "automation-solution" ? [...children, ...solutionLinks] : children };
  });
  const displayName = me ? me.display_name || me.username : "…";

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
          {sections.map((section) =>
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
                        end={child.end}
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
              <span className="admin-user-menu__avatar">{displayName.charAt(0).toUpperCase()}</span>
              <span className="admin-user-menu__who">
                <span className="admin-user-menu__name">{displayName}</span>
                {me && <span className="admin-user-menu__role">{ROLE_LABELS[me.role] || me.role}</span>}
              </span>
              <span className={`admin-user-menu__chevron ${userMenuOpen ? "is-open" : ""}`}>▾</span>
            </button>
            {userMenuOpen && (
              <div className="admin-user-menu__panel">
                <Link to="/admin/account">บัญชีของฉัน / เปลี่ยนรหัสผ่าน</Link>
                {isSuperadmin && <Link to="/admin/settings/users">จัดการผู้ใช้งาน</Link>}
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
