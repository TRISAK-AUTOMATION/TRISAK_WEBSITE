import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";

const FIELD_SUFFIXES = [
  "hero_meta",
  "hero_title",
  "hero_sub",
  "intro_eyebrow",
  "intro_title",
  "intro_lede",
  "intro_body",
];

function emptyForm() {
  const form = {};
  for (const base of FIELD_SUFFIXES) {
    form[`${base}_en`] = "";
    form[`${base}_th`] = "";
  }
  return form;
}

export default function AdminAboutEditor() {
  const [form, setForm] = useState(emptyForm);
  const [lang, setLang] = useState("th");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .adminGetAboutContent()
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
      const updated = await api.adminUpdateAboutContent(form);
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
      <AdminBreadcrumb items={[{ label: "ประวัติบริษัท (History)" }]} />

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
      {success && <SuccessModal onClose={() => setSuccess(false)} />}

      <div className="admin-edit-notice">
        🔔 กำลังแก้ไขข้อความหน้าประวัติบริษัท (History) ในเวอร์ชัน{" "}
        <strong>{lang === "th" ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> — สลับแท็บด้านบนเพื่อแก้อีกภาษา
        ระบบจะบันทึกทั้งสองภาษาพร้อมกันตอนกด "บันทึก" ส่วนไทม์ไลน์ / สถิติ / โครงสร้างองค์กรของหน้านี้ยังไม่รองรับการแก้ไขในระบบนี้
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
          <h3>บทนำ (Introduction)</h3>
          <div className="admin-form__row">
            <label className="contact-form__field">
              <span>ข้อความเล็กเหนือหัวข้อ (Eyebrow)</span>
              <input
                value={value("intro_eyebrow")}
                onChange={(e) => update("intro_eyebrow", e.target.value)}
              />
            </label>
            <label className="contact-form__field">
              <span>หัวข้อ</span>
              <input value={value("intro_title")} onChange={(e) => update("intro_title", e.target.value)} />
            </label>
          </div>
          <label className="contact-form__field" style={{ marginTop: 20 }}>
            <span>ข้อความเกริ่นนำ (Lede)</span>
            <textarea rows={2} value={value("intro_lede")} onChange={(e) => update("intro_lede", e.target.value)} />
          </label>
          <label className="contact-form__field" style={{ marginTop: 20 }}>
            <span>เนื้อหาย่อหน้าหลัก</span>
            <textarea rows={4} value={value("intro_body")} onChange={(e) => update("intro_body", e.target.value)} />
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
