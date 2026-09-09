import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";

const FIELD_SUFFIXES = ["tagline", "rights", "authorized_line"];

function emptyForm() {
  const form = {};
  for (const base of FIELD_SUFFIXES) {
    form[`${base}_en`] = "";
    form[`${base}_th`] = "";
  }
  return form;
}

export default function AdminFooterEditor() {
  const [form, setForm] = useState(emptyForm);
  const [lang, setLang] = useState("th");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .adminGetFooterContent()
      .then((d) => {
        if (d) setForm((f) => ({ ...f, ...d }));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const field = (base) => `${base}_${lang}`;
  const value = (base) => form[field(base)] || "";
  const update = (base, val) => {
    setSuccess(false);
    setForm((f) => ({ ...f, [field(base)]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await api.adminUpdateFooterContent(form);
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
      <AdminBreadcrumb items={[{ label: "Footer" }]} />

      <div className="admin-edit-tabbar">
        <div className="admin-edit-tabs">
          <button
            type="button"
            className={`admin-edit-tab ${lang === "th" ? "is-active" : ""}`}
            onClick={() => setLang("th")}
          >
            🇹🇭 ภาษาไทย
          </button>
          <button
            type="button"
            className={`admin-edit-tab ${lang === "en" ? "is-active" : ""}`}
            onClick={() => setLang("en")}
          >
            🇬🇧 English
          </button>
        </div>
        <div className="admin-edit-tabbar__actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            💾 {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
      {success && <p className="contact-form__status contact-form__status--ok">บันทึกสำเร็จ</p>}

      <div className="admin-edit-notice">
        🔔 กำลังแก้ไขข้อความ Footer ในเวอร์ชัน <strong>{lang === "th" ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> —
        สลับแท็บด้านบนเพื่อแก้อีกภาษา ส่วนที่อยู่/เบอร์โทร/อีเมลของสำนักงานใหญ่และคลังสินค้าใน Footer
        ใช้ข้อมูลชุดเดียวกับหน้า{" "}
        <Link to="/admin/contact" style={{ color: "inherit", textDecoration: "underline" }}>
          "ติดต่อเรา"
        </Link>{" "}
        — แก้ที่นั่นแล้วจะอัพเดตทั้งสองจุดพร้อมกัน ลิงก์ด่วนใน Footer ใช้ข้อมูลชุดเดียวกับเมนู "เมนู" ในแถบด้านซ้าย
      </div>

      <div className="admin-form">
        <div className="admin-form__section panel">
          <h3>แท็กไลน์ใต้โลโก้</h3>
          <label className="contact-form__field">
            <span>ข้อความ</span>
            <textarea rows={2} value={value("tagline")} onChange={(e) => update("tagline", e.target.value)} />
          </label>
        </div>

        <div className="admin-form__section panel">
          <h3>บรรทัดล่างสุดของ Footer</h3>
          <label className="contact-form__field">
            <span>ข้อความลิขสิทธิ์ (แสดงต่อจากปี ค.ศ. ปัจจุบัน)</span>
            <input value={value("rights")} onChange={(e) => update("rights", e.target.value)} />
          </label>
          <label className="contact-form__field" style={{ marginTop: 20 }}>
            <span>ข้อความรับรอง/ตัวแทนจำหน่าย</span>
            <input
              value={value("authorized_line")}
              onChange={(e) => update("authorized_line", e.target.value)}
            />
          </label>
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
