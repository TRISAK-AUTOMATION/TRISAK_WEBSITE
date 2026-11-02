import { NavLink } from "react-router-dom";
import AdminBreadcrumb from "./AdminBreadcrumb.jsx";

/**
 * Shared pieces for the Home page's admin editors (/admin/home).
 * Same structure as the History editors (components/HistoryAdmin.jsx):
 * a tab strip inside the existing "Home" menu item, with the language
 * selector and Save button on the right-hand side of the tab bar.
 */

export const HOME_ADMIN_BASE = "/admin/home";
export const HOME_AUTOMATION_PATH = `${HOME_ADMIN_BASE}/automation-solutions`;

const TABS = [
  { to: HOME_ADMIN_BASE, label: "ข้อความหน้า (Content)", end: true },
  { to: HOME_AUTOMATION_PATH, label: "โซลูชันระบบอัตโนมัติ (Automation Solutions)" },
];

/** Tab strip linking the Home editors. */
export function AdminHomeTabs() {
  return (
    <nav className="admin-edit-tabs" aria-label="Home sections">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => `admin-edit-tab ${isActive ? "is-active" : ""}`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Language dropdown for the tab bar (🇹🇭 ภาษาไทย / 🇬🇧 English).
 * Same options and values ("th" | "en") as AdminLanguageSelect in the sidebar.
 */
export function TabbarLanguageSelect({ value, onChange }) {
  return (
    <label className="admin-tabbar-lang">
      <span className="admin-edit-sidebar__label">ภาษา</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="ภาษา">
        <option value="th">🇹🇭 ภาษาไทย</option>
        <option value="en">🇬🇧 English</option>
      </select>
    </label>
  );
}

/**
 * Breadcrumb + tab bar shown at the top of every Home admin page.
 * `actions` renders on the right of the tab bar (language select, Save button…).
 */
export function HomePageHeader({ crumbs = [], actions = null }) {
  const trail = crumbs.length
    ? [{ label: "หน้าแรก (Home)", to: HOME_ADMIN_BASE }, ...crumbs]
    : [{ label: "หน้าแรก (Home)" }];
  return (
    <>
      <AdminBreadcrumb items={trail} />
      <div className="admin-edit-tabbar">
        <AdminHomeTabs />
        {actions && <div className="admin-edit-tabbar__actions">{actions}</div>}
      </div>
    </>
  );
}
