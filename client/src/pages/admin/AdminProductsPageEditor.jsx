import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";

const FIELD_SUFFIXES = [
  "hero_meta",
  "hero_title",
  "hero_sub",
  "brands_eyebrow",
  "categories_eyebrow",
  "cta_title",
];

function emptyForm() {
  const form = {};
  for (const base of FIELD_SUFFIXES) {
    form[`${base}_en`] = "";
    form[`${base}_th`] = "";
  }
  return form;
}

export default function AdminProductsPageEditor() {
  const [form, setForm] = useState(emptyForm);
  const [lang, setLang] = useState("th");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .adminGetProductsPageContent()
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
      const updated = await api.adminUpdateProductsPageContent(form);
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
      <AdminBreadcrumb items={[{ label: "สินค้า (หน้าเว็บไซต์)" }]} />

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
        🔔 กำลังแก้ไขข้อความหน้าสินค้า (/products) ในเวอร์ชัน{" "}
        <strong>{lang === "th" ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> — สลับแท็บด้านบนเพื่อแก้อีกภาษา
        รายการสินค้า/แบรนด์/หมวดหมู่บนหน้านี้ดึงจากข้อมูลจริงและไม่ได้แก้ที่นี่ (ไปที่เมนู "สินค้า" ในแถบด้านซ้าย)
      </div>

      <div className="admin-form">
        <div className="admin-form__section panel">
          <h3>Hero</h3>
          <label className="contact-form__field">
            <span>ข้อความเล็กเหนือหัวข้อ (Meta)</span>
            <input value={value("hero_meta")} onChange={(e) => update("hero_meta", e.target.value)} />
          </label>
          <label className="contact-form__field" style={{ marginTop: 20 }}>
            <span>หัวข้อหลัก</span>
            <input value={value("hero_title")} onChange={(e) => update("hero_title", e.target.value)} />
          </label>
          <label className="contact-form__field" style={{ marginTop: 20 }}>
            <span>คำอธิบายใต้หัวข้อ</span>
            <textarea rows={3} value={value("hero_sub")} onChange={(e) => update("hero_sub", e.target.value)} />
          </label>
        </div>

        <div className="admin-form__section panel">
          <h3>หัวข้อส่วนต่างๆ</h3>
          <div className="admin-form__row">
            <label className="contact-form__field">
              <span>Eyebrow ส่วน "เลือกตามแบรนด์"</span>
              <input
                value={value("brands_eyebrow")}
                onChange={(e) => update("brands_eyebrow", e.target.value)}
              />
            </label>
            <label className="contact-form__field">
              <span>Eyebrow ส่วน "เลือกตามหมวดหมู่"</span>
              <input
                value={value("categories_eyebrow")}
                onChange={(e) => update("categories_eyebrow", e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="admin-form__section panel">
          <h3>CTA ท้ายหน้า</h3>
          <label className="contact-form__field">
            <span>หัวข้อ</span>
            <input value={value("cta_title")} onChange={(e) => update("cta_title", e.target.value)} />
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
