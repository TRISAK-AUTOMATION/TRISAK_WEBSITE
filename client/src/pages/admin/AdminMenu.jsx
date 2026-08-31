import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";

const GROUPS = [
  { key: "header", label: "Header" },
  { key: "footer", label: "Footer" },
];

function emptyItemForm() {
  return { label_en: "", label_th: "", url: "", is_active: true };
}

export default function AdminMenu() {
  const [group, setGroup] = useState("header");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null); // null = form hidden, "new" = adding, or an item id
  const [form, setForm] = useState(emptyItemForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const load = (loc) => {
    setLoading(true);
    api
      .adminGetMenuItems(loc)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(group);
    setEditingId(null);
  }, [group]);

  const openAdd = () => {
    setForm(emptyItemForm());
    setFormError("");
    setEditingId("new");
  };

  const openEdit = (item) => {
    setForm({
      label_en: item.label_en,
      label_th: item.label_th,
      url: item.url,
      is_active: item.is_active,
    });
    setFormError("");
    setEditingId(item.id);
  };

  const closeForm = () => setEditingId(null);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.label_en.trim() || !form.label_th.trim() || !form.url.trim()) {
      setFormError("กรุณากรอกชื่อเมนูทั้งสองภาษา และ URL");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editingId === "new") {
        const nextSortOrder =
          items.reduce((max, it) => Math.max(max, it.sort_order ?? 0), -1) + 1;
        await api.adminCreateMenuItem({
          location: group,
          labelEn: form.label_en.trim(),
          labelTh: form.label_th.trim(),
          url: form.url.trim(),
          isActive: form.is_active,
          sortOrder: nextSortOrder,
        });
      } else {
        const current = items.find((it) => it.id === editingId);
        await api.adminUpdateMenuItem(editingId, {
          labelEn: form.label_en.trim(),
          labelTh: form.label_th.trim(),
          url: form.url.trim(),
          isActive: form.is_active,
          sortOrder: current?.sort_order ?? 0,
        });
      }
      setEditingId(null);
      load(group);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`ลบเมนู "${item.label_th}"?`)) return;
    try {
      await api.adminDeleteMenuItem(item.id);
      if (editingId === item.id) setEditingId(null);
      load(group);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await api.adminToggleMenuItemStatus(item.id, !item.is_active);
      load(group);
    } catch (err) {
      alert(err.message);
    }
  };

  // ---- drag and drop reorder ----

  const handleDragStart = (item) => setDragId(item.id);
  const handleDragOver = (e, item) => {
    e.preventDefault();
    if (item.id !== dragOverId) setDragOverId(item.id);
  };
  const handleDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };
  const handleDrop = async (e, targetItem) => {
    e.preventDefault();
    setDragOverId(null);
    if (dragId == null || dragId === targetItem.id) {
      setDragId(null);
      return;
    }
    const fromIndex = items.findIndex((it) => it.id === dragId);
    const toIndex = items.findIndex((it) => it.id === targetItem.id);
    if (fromIndex === -1 || toIndex === -1) {
      setDragId(null);
      return;
    }
    const reordered = [...items];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setItems(reordered); // optimistic
    setDragId(null);
    try {
      await api.adminReorderMenuItems(
        group,
        reordered.map((it) => it.id)
      );
    } catch (err) {
      setError(err.message);
      load(group); // roll back to server state on failure
    }
  };

  return (
    <div>
      <AdminBreadcrumb items={[{ label: "เมนู" }]} />

      <div className="admin-edit-tabbar">
        <div className="admin-edit-tabs">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              className={`admin-edit-tab ${group === g.key ? "is-active" : ""}`}
              onClick={() => setGroup(g.key)}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="admin-edit-tabbar__actions">
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            + เพิ่มเมนู
          </button>
        </div>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      {editingId !== null && (
        <form className="admin-form__section panel menu-item-form" onSubmit={handleFormSubmit}>
          <h3>{editingId === "new" ? "เพิ่มเมนูใหม่" : "แก้ไขเมนู"}</h3>
          {formError && (
            <p className="contact-form__status contact-form__status--error">{formError}</p>
          )}
          <div className="admin-form__row">
            <label className="contact-form__field">
              <span>ชื่อเมนู (ไทย)</span>
              <input
                value={form.label_th}
                onChange={(e) => setForm((f) => ({ ...f, label_th: e.target.value }))}
              />
            </label>
            <label className="contact-form__field">
              <span>ชื่อเมนู (English)</span>
              <input
                value={form.label_en}
                onChange={(e) => setForm((f) => ({ ...f, label_en: e.target.value }))}
              />
            </label>
          </div>
          <label className="contact-form__field" style={{ marginTop: 20 }}>
            <span>URL / ลิงก์ (เช่น /products หรือ https://example.com)</span>
            <input
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="/products"
            />
          </label>
          <label className="menu-item-form__checkbox" style={{ marginTop: 16 }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            <span>เปิดใช้งาน (แสดงบนเว็บไซต์)</span>
          </label>
          <div className="admin-form__submit-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            <button type="button" className="admin-btn-cancel" onClick={closeForm}>
              ยกเลิก
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="empty-state">กำลังโหลด…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">ยังไม่มีเมนูในกลุ่มนี้ — เพิ่มรายการแรกได้เลย</p>
      ) : (
        <div className="menu-list">
          {items.map((item) => (
            <div
              key={item.id}
              className={`menu-item-row ${!item.is_active ? "is-inactive" : ""} ${
                dragOverId === item.id ? "is-drag-over" : ""
              } ${dragId === item.id ? "is-dragging" : ""}`}
              draggable
              onDragStart={() => handleDragStart(item)}
              onDragOver={(e) => handleDragOver(e, item)}
              onDrop={(e) => handleDrop(e, item)}
              onDragEnd={handleDragEnd}
            >
              <span className="menu-item-row__handle" title="ลากเพื่อจัดเรียงลำดับ">
                ⠿
              </span>
              <button
                type="button"
                className={`admin-status-dot ${item.is_active ? "is-active" : ""}`}
                onClick={() => handleToggleStatus(item)}
                title={item.is_active ? "กำลังแสดงผล — คลิกเพื่อซ่อน" : "ซ่อนอยู่ — คลิกเพื่อแสดง"}
              >
                ✓
              </button>
              <div className="menu-item-row__main">
                <div className="menu-item-row__label">
                  {item.label_th}
                  <span className="menu-item-row__label-en">/ {item.label_en}</span>
                </div>
                <div className="menu-item-row__url">{item.url}</div>
              </div>
              <div className="admin-row-actions">
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn--edit"
                  title="แก้ไข"
                  onClick={() => openEdit(item)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn--delete"
                  title="ลบ"
                  onClick={() => handleDelete(item)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
