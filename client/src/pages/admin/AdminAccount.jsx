import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import { useToast } from "../../components/AdminModal.jsx";

/** Admin > บัญชีของฉัน: who is signed in, and changing your own password. */
export default function AdminAccount() {
  const [me, setMe] = useState(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast } = useToast();

  useEffect(() => {
    api.adminMe().then(setMe).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (next.length < 8) return setError("รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร");
    if (next !== confirm) return setError("ยืนยันรหัสผ่านใหม่ไม่ตรงกัน");
    setSaving(true);
    try {
      await api.adminChangePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      showToast("เปลี่ยนรหัสผ่านแล้ว อุปกรณ์อื่นที่เข้าสู่ระบบอยู่จะถูกออกจากระบบ");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "บัญชีของฉัน" }]} />
      {toast}
      <div className="account-admin">
        <section className="panel account-admin__card">
          <h2>บัญชีของฉัน</h2>
          {me ? (
            <dl className="account-admin__facts">
              <div>
                <dt>ชื่อที่แสดง</dt>
                <dd>{me.display_name || "—"}</dd>
              </div>
              <div>
                <dt>ชื่อผู้ใช้</dt>
                <dd>{me.username}</dd>
              </div>
              <div>
                <dt>อีเมล</dt>
                <dd>{me.email || "—"}</dd>
              </div>
              <div>
                <dt>สิทธิ์</dt>
                <dd>{me.role === "superadmin" ? "Superadmin" : "Admin"}</dd>
              </div>
            </dl>
          ) : (
            <p className="empty-state">กำลังโหลด…</p>
          )}
          <p className="users-admin__hint">ชื่อที่แสดง อีเมล และสิทธิ์ เปลี่ยนได้โดย Superadmin ที่เมนู การตั้งค่า &gt; ผู้ใช้งาน</p>
        </section>

        <form className="panel account-admin__card" onSubmit={submit}>
          <h2>เปลี่ยนรหัสผ่าน</h2>
          <label className="contact-form__field">
            <span>รหัสผ่านปัจจุบัน</span>
            <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </label>
          <label className="contact-form__field">
            <span>รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</span>
            <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </label>
          <label className="contact-form__field">
            <span>ยืนยันรหัสผ่านใหม่</span>
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
          {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving || !current || !next}>
            {saving ? "กำลังบันทึก…" : "เปลี่ยนรหัสผ่าน"}
          </button>
        </form>
      </div>
    </>
  );
}
