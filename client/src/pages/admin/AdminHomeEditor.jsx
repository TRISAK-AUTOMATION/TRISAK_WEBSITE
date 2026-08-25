import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";

const FIELD_SUFFIXES = [
  "hero_meta",
  "hero_title_line1",
  "hero_title_line2",
  "hero_sub",
  "strength1_title",
  "strength1_body",
  "strength2_title",
  "strength2_body",
  "strength3_title",
  "strength3_body",
  "cta_title_line1",
  "cta_title_line2",
];

function emptyForm() {
  const form = {};
  for (const base of FIELD_SUFFIXES) {
    form[`${base}_en`] = "";
    form[`${base}_th`] = "";
  }
  return form;
}

export default function AdminHomeEditor() {
  const [form, setForm] = useState(emptyForm);
  const [lang, setLang] = useState("th"); // which language's fields are shown for editing
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .getHomeContent()
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
      const updated = await api.adminUpdateHomeContent(form);
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
      <AdminBreadcrumb items={[{ label: "หน้าแรก" }]} />

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
      {success && (
        <p className="contact-form__status contact-form__status--ok">บันทึกสำเร็จ</p>
      )}

      <div className="admin-edit-notice">
        🔔 กำลังแก้ไขข้อความหน้าแรกในเวอร์ชัน <strong>{lang === "th" ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong>{" "}
        — สลับแท็บด้านบนเพื่อแก้อีกภาษา ระบบจะบันทึกทั้งสองภาษาพร้อมกันตอนกด "บันทึก"
      </div>

      <div className="admin-form">
        <div className="admin-form__section panel">
          <h3>Hero</h3>
          <label className="contact-form__field">
            <span>ข้อความเล็กเหนือหัวข้อ (Meta)</span>
            <input value={value("hero_meta")} onChange={(e) => update("hero_meta", e.target.value)} />
          </label>
          <div className="admin-form__row" style={{ marginTop: 20 }}>
            <label className="contact-form__field">
              <span>หัวข้อ บรรทัดที่ 1</span>
              <input
                value={value("hero_title_line1")}
                onChange={(e) => update("hero_title_line1", e.target.value)}
              />
            </label>
            <label className="contact-form__field">
              <span>หัวข้อ บรรทัดที่ 2</span>
              <input
                value={value("hero_title_line2")}
                onChange={(e) => update("hero_title_line2", e.target.value)}
              />
            </label>
          </div>
          <label className="contact-form__field" style={{ marginTop: 20 }}>
            <span>คำอธิบายใต้หัวข้อ</span>
            <textarea rows={3} value={value("hero_sub")} onChange={(e) => update("hero_sub", e.target.value)} />
          </label>
        </div>

        {[1, 2, 3].map((n) => (
          <div className="admin-form__section panel" key={n}>
            <h3>จุดแข็งข้อที่ {n}</h3>
            <label className="contact-form__field">
              <span>หัวข้อ</span>
              <input
                value={value(`strength${n}_title`)}
                onChange={(e) => update(`strength${n}_title`, e.target.value)}
              />
            </label>
            <label className="contact-form__field" style={{ marginTop: 20 }}>
              <span>รายละเอียด</span>
              <textarea
                rows={2}
                value={value(`strength${n}_body`)}
                onChange={(e) => update(`strength${n}_body`, e.target.value)}
              />
            </label>
          </div>
        ))}

        <div className="admin-form__section panel">
          <h3>CTA ท้ายหน้า</h3>
          <div className="admin-form__row">
            <label className="contact-form__field">
              <span>หัวข้อ บรรทัดที่ 1</span>
              <input
                value={value("cta_title_line1")}
                onChange={(e) => update("cta_title_line1", e.target.value)}
              />
            </label>
            <label className="contact-form__field">
              <span>หัวข้อ บรรทัดที่ 2</span>
              <input
                value={value("cta_title_line2")}
                onChange={(e) => update("cta_title_line2", e.target.value)}
              />
            </label>
          </div>
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
