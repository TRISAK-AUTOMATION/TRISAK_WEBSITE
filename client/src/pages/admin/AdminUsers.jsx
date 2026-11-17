import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import AdminModal, { ConfirmModal, useToast } from "../../components/AdminModal.jsx";

/**
 * Admin > การตั้งค่า > ผู้ใช้งาน (superadmin only): the people who can sign
 * in to the admin. Add / edit (name, email, role, active), set a new
 * password, delete. The server keeps at least one active superadmin and
 * stops you from locking yourself out.
 */

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", hint: "แก้ไขเนื้อหา สินค้า และดูคำขอติดต่อได้ทั้งหมด" },
  { value: "superadmin", label: "Superadmin", hint: "ทำได้ทุกอย่าง และจัดการผู้ใช้งานได้" },
];

const emptyForm = () => ({ username: "", displayName: "", email: "", role: "admin", isActive: true, password: "" });

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
    : "ยังไม่เคยเข้าสู่ระบบ";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | user row
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { toast, showToast } = useToast();

  const load = () =>
    api
      .adminGetUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    api.adminMe().then(setMe).catch(() => {});
  }, []);

  const openNew = () => {
    setForm(emptyForm());
    setFormError("");
    setEditing("new");
  };
  const openEdit = (u) => {
    setForm({
      username: u.username,
      displayName: u.display_name || "",
      email: u.email || "",
      role: u.role,
      isActive: u.is_active,
      password: "",
    });
    setFormError("");
    setEditing(u);
  };
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const isNew = editing === "new";
  const isSelf = editing && editing !== "new" && editing.id === me?.id;

  const save = async () => {
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        displayName: form.displayName,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
      };
      if (form.password) payload.password = form.password;
      if (isNew) {
        await api.adminCreateUser({ ...payload, username: form.username, password: form.password });
        showToast(`เพิ่มผู้ใช้ "${form.username.trim().toLowerCase()}" แล้ว`);
      } else {
        await api.adminUpdateUser(editing.id, payload);
        showToast(form.password ? "บันทึกและตั้งรหัสผ่านใหม่แล้ว" : "บันทึกแล้ว");
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.adminDeleteUser(deleteTarget.id);
      showToast(`ลบผู้ใช้ "${deleteTarget.username}" แล้ว`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "การตั้งค่า" }, { label: "ผู้ใช้งาน" }]} />
      {toast}

      <div className="admin-list-toolbar users-admin__toolbar">
        <div>
          <h1 className="users-admin__title">ผู้ใช้งานหลังบ้าน</h1>
          <p className="users-admin__lede">
            ทุกคนมีชื่อผู้ใช้และรหัสผ่านของตัวเอง การแก้ไขทุกครั้งจะบันทึกชื่อผู้แก้ไว้ในหน้าแดชบอร์ด
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          + เพิ่มผู้ใช้
        </button>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-list-table-wrap">
        <table className="admin-list-table users-admin__table">
          <thead>
            <tr>
              <th>ผู้ใช้</th>
              <th>สิทธิ์</th>
              <th>สถานะ</th>
              <th>เข้าสู่ระบบล่าสุด</th>
              <th aria-label="จัดการ" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="empty-state">
                  กำลังโหลด…
                </td>
              </tr>
            )}
            {!loading &&
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="users-admin__who">
                      <span className="users-admin__avatar" aria-hidden="true">
                        {(u.display_name || u.username).charAt(0).toUpperCase()}
                      </span>
                      <span>
                        <strong>
                          {u.display_name || u.username}
                          {u.id === me?.id && <span className="users-admin__you">คุณ</span>}
                        </strong>
                        <span className="users-admin__meta">
                          {u.username}
                          {u.email && ` · ${u.email}`}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`users-admin__role users-admin__role--${u.role}`}>
                      {u.role === "superadmin" ? "Superadmin" : "Admin"}
                    </span>
                  </td>
                  <td>
                    <span className={`users-admin__status${u.is_active ? " is-active" : ""}`}>
                      {u.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td className="admin-list-table__date">{formatDate(u.last_login_at)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="admin-icon-btn admin-icon-btn--edit" title="แก้ไข" onClick={() => openEdit(u)}>
                        ✎
                      </button>
                      {u.id !== me?.id && (
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--delete"
                          title="ลบ"
                          onClick={() => {
                            setDeleteError("");
                            setDeleteTarget(u);
                          }}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <AdminModal
          title={isNew ? "เพิ่มผู้ใช้" : `แก้ไขผู้ใช้ "${editing.username}"`}
          onClose={() => setEditing(null)}
          busy={saving}
          error={formError}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)} disabled={saving}>
                ยกเลิก
              </button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </>
          }
        >
          <div className="users-admin__form">
            <label className="contact-form__field">
              <span>ชื่อผู้ใช้ (ใช้เข้าสู่ระบบ)</span>
              <input
                value={form.username}
                disabled={!isNew}
                autoComplete="off"
                placeholder="เช่น somchai"
                onChange={(e) => set("username", e.target.value)}
              />
              {isNew && <small className="users-admin__hint">a-z, 0-9, จุด, ขีด หรือขีดล่าง 3–60 ตัวอักษร · เปลี่ยนภายหลังไม่ได้</small>}
            </label>
            <label className="contact-form__field">
              <span>ชื่อที่แสดง</span>
              <input value={form.displayName} placeholder="เช่น สมชาย (ฝ่ายการตลาด)" onChange={(e) => set("displayName", e.target.value)} />
            </label>
            <label className="contact-form__field">
              <span>อีเมล (ไม่บังคับ — ใช้เข้าสู่ระบบแทนชื่อผู้ใช้ได้)</span>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </label>

            <fieldset className="users-admin__roles" disabled={isSelf}>
              <legend>สิทธิ์</legend>
              {ROLE_OPTIONS.map((r) => (
                <label key={r.value} className={`users-admin__role-opt${form.role === r.value ? " is-on" : ""}`}>
                  <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => set("role", r.value)} />
                  <span>
                    <strong>{r.label}</strong>
                    <small>{r.hint}</small>
                  </span>
                </label>
              ))}
              {isSelf && <small className="users-admin__hint">เปลี่ยนสิทธิ์ของตัวเองไม่ได้</small>}
            </fieldset>

            {!isNew && (
              <label className="users-admin__toggle">
                <input type="checkbox" checked={form.isActive} disabled={isSelf} onChange={(e) => set("isActive", e.target.checked)} />
                <span>เปิดใช้งานบัญชีนี้ (ปิด = เข้าสู่ระบบไม่ได้ และออกจากระบบทันที)</span>
              </label>
            )}

            <label className="contact-form__field">
              <span>{isNew ? "รหัสผ่าน" : "ตั้งรหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)"}</span>
              <input type="password" autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} />
              <small className="users-admin__hint">อย่างน้อย 8 ตัวอักษร · แจ้งรหัสผ่านให้เจ้าของบัญชี และให้เขาเปลี่ยนเองที่ “บัญชีของฉัน”</small>
            </label>
          </div>
        </AdminModal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="ลบผู้ใช้นี้?"
          message="ผู้ใช้นี้จะเข้าสู่ระบบไม่ได้อีก และถูกออกจากระบบทันที ถ้าแค่พักการใช้งาน ใช้การปิดใช้งานแทนได้"
          detail={deleteTarget.display_name || deleteTarget.username}
          confirmLabel="ลบ"
          busy={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
