import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";

function emptyForm() {
  return { header_logo_url: "", footer_logo_url: "", favicon_url: "" };
}

export default function AdminSiteSettings() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .getSiteSettings()
      .then((d) => {
        if (d) setForm((f) => ({ ...f, ...d }));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (field, url) => {
    setSuccess(false);
    setForm((f) => ({ ...f, [field]: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await api.adminUpdateSiteSettings(form);
      setForm((f) => ({ ...f, ...updated }));
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="empty-state">กำลังโหลด…</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <AdminBreadcrumb items={[{ label: "การตั้งค่า" }, { label: "เว็บไซต์" }]} />

      <div className="admin-edit-tabbar">
        <h2 style={{ margin: 0 }}>การตั้งค่าเว็บไซต์</h2>
        <div className="admin-edit-tabbar__actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            💾 {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
      {success && (
        <p className="contact-form__status contact-form__status--ok">บันทึกสำเร็จ</p>
      )}

      <div className="admin-form">
        <div className="admin-form__section panel">
          <h3>Header — โลโก้ส่วนหัว</h3>
          <p className="admin-form__hint">
            แสดงแทนที่โลโก้ตัวอักษร "TRISAK GROUP" ที่มุมซ้ายบนของทุกหน้า แนะนำไฟล์พื้นหลังโปร่งใส (PNG/SVG)
            แนวนอน สูงประมาณ 60–80px
          </p>
          <ImageUploadField
            value={form.header_logo_url}
            onChange={(url) => update("header_logo_url", url)}
          />
        </div>

        <div className="admin-form__section panel">
          <h3>Footer — โลโก้ท้ายหน้า</h3>
          <p className="admin-form__hint">
            แสดงแทนที่ข้อความ "TRISAK GROUP" ในส่วนท้ายของทุกหน้า แนะนำไฟล์พื้นหลังโปร่งใส (PNG/SVG)
          </p>
          <ImageUploadField
            value={form.footer_logo_url}
            onChange={(url) => update("footer_logo_url", url)}
          />
        </div>

        <div className="admin-form__section panel">
          <h3>Favicon — ไอคอนเว็บไซต์</h3>
          <p className="admin-form__hint">
            ไอคอนที่แสดงบนแท็บเบราว์เซอร์ แนะนำไฟล์สี่เหลี่ยมจัตุรัส (เช่น 512×512px) นามสกุล PNG, ICO หรือ SVG
          </p>
          <ImageUploadField
            value={form.favicon_url}
            onChange={(url) => update("favicon_url", url)}
          />
        </div>

        <div className="admin-form__submit-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </div>
    </form>
  );
}
