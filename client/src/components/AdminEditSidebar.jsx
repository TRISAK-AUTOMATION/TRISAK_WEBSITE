/**
 * Shared language + status controls for Admin Edit pages.
 * Same markup/classes the Brand, Category and Series forms already use
 * (panel + admin-edit-sidebar__section + admin-toggle), so every edit page
 * renders identically.
 */

/** Two-column edit layout: content on the left, language/status panels on the right. */
export function AdminEditLayout({ sidebar, children }) {
  return (
    <div className="admin-edit-layout">
      <div className="admin-edit-content">{children}</div>
      <aside className="admin-edit-sidebar">{sidebar}</aside>
    </div>
  );
}

/** Language dropdown: 🇹🇭 ภาษาไทย / 🇬🇧 English. `value` is "th" | "en". */
export function AdminLanguageSelect({ value, onChange, label = "ภาษา" }) {
  return (
    <div className="panel admin-edit-sidebar__section">
      <span className="admin-edit-sidebar__label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="th">🇹🇭 ภาษาไทย</option>
        <option value="en">🇬🇧 English</option>
      </select>
    </div>
  );
}

/** Status section with the shared toggle switch. */
export function AdminStatusToggle({ checked, onChange, label = "สถานะ", text = "การแสดงผล" }) {
  return (
    <div className="panel admin-edit-sidebar__section">
      <span className="admin-edit-sidebar__label">{label}</span>
      <label className="admin-toggle">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="admin-toggle__track">
          <span className="admin-toggle__thumb" />
        </span>
        {text}
      </label>
    </div>
  );
}
