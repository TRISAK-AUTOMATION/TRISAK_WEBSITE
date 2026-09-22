import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";

const BILINGUAL_SUFFIXES = [
  "hero_meta",
  "hero_title",
  "hero_sub",
  "info_eyebrow",
  "info_title",
  "head_office_label",
  "head_office_address",
  "warehouse_label",
  "warehouse_address",
  "map_eyebrow",
  "map_title",
];

const PLAIN_FIELDS = ["head_office_phone", "head_office_email", "warehouse_phone", "warehouse_email"];

function emptyForm() {
  const form = {};
  for (const base of BILINGUAL_SUFFIXES) {
    form[`${base}_en`] = "";
    form[`${base}_th`] = "";
  }
  for (const f of PLAIN_FIELDS) form[f] = "";
  return form;
}

export default function AdminContactsPageEditor() {
  const [form, setForm] = useState(emptyForm);
  const [lang, setLang] = useState("th");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .adminGetContactsPageContent()
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
  const plainValue = (f) => form[f] || "";
  const updatePlain = (f, val) => {
    setSuccess(false);
    setForm((formState) => ({ ...formState, [f]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await api.adminUpdateContactsPageContent(form);
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
      <AdminBreadcrumb items={[{ label: "ติดต่อเรา" }]} />

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
        🔔 กำลังแก้ไขข้อความหน้าติดต่อเราในเวอร์ชัน{" "}
        <strong>{lang === "th" ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> — สลับแท็บด้านบนเพื่อแก้อีกภาษา
        เบอร์โทรและอีเมลใช้ร่วมกันทั้งสองภาษา
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
          <h3>หัวข้อส่วนข้อมูลติดต่อ</h3>
          <div className="admin-form__row">
            <label className="contact-form__field">
              <span>Eyebrow</span>
              <input value={value("info_eyebrow")} onChange={(e) => update("info_eyebrow", e.target.value)} />
            </label>
            <label className="contact-form__field">
              <span>หัวข้อ</span>
              <input value={value("info_title")} onChange={(e) => update("info_title", e.target.value)} />
            </label>
          </div>
        </div>

        <div className="admin-form__section panel">
          <h3>สำนักงานใหญ่ (Head Office)</h3>
          <label className="contact-form__field">
            <span>ชื่อป้ายกำกับ</span>
            <input
              value={value("head_office_label")}
              onChange={(e) => update("head_office_label", e.target.value)}
            />
          </label>
          <label className="contact-form__field" style={{ marginTop: 20 }}>
            <span>ที่อยู่ (ขึ้นบรรทัดใหม่ได้)</span>
            <textarea
              rows={2}
              value={value("head_office_address")}
              onChange={(e) => update("head_office_address", e.target.value)}
            />
          </label>
          <div className="admin-form__row" style={{ marginTop: 20 }}>
            <label className="contact-form__field">
              <span>เบอร์โทร</span>
              <input
                value={plainValue("head_office_phone")}
                onChange={(e) => updatePlain("head_office_phone", e.target.value)}
              />
            </label>
            <label className="contact-form__field">
              <span>อีเมล</span>
              <input
                value={plainValue("head_office_email")}
                onChange={(e) => updatePlain("head_office_email", e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="admin-form__section panel">
          <h3>คลังสินค้า (Warehouse)</h3>
          <label className="contact-form__field">
            <span>ชื่อป้ายกำกับ</span>
            <input
              value={value("warehouse_label")}
              onChange={(e) => update("warehouse_label", e.target.value)}
            />
          </label>
          <label className="contact-form__field" style={{ marginTop: 20 }}>
            <span>ที่อยู่ (ขึ้นบรรทัดใหม่ได้)</span>
            <textarea
              rows={2}
              value={value("warehouse_address")}
              onChange={(e) => update("warehouse_address", e.target.value)}
            />
          </label>
          <div className="admin-form__row" style={{ marginTop: 20 }}>
            <label className="contact-form__field">
              <span>เบอร์โทร</span>
              <input
                value={plainValue("warehouse_phone")}
                onChange={(e) => updatePlain("warehouse_phone", e.target.value)}
              />
            </label>
            <label className="contact-form__field">
              <span>อีเมล</span>
              <input
                value={plainValue("warehouse_email")}
                onChange={(e) => updatePlain("warehouse_email", e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="admin-form__section panel">
          <h3>หัวข้อส่วนแผนที่</h3>
          <div className="admin-form__row">
            <label className="contact-form__field">
              <span>Eyebrow</span>
              <input value={value("map_eyebrow")} onChange={(e) => update("map_eyebrow", e.target.value)} />
            </label>
            <label className="contact-form__field">
              <span>หัวข้อ</span>
              <input value={value("map_title")} onChange={(e) => update("map_title", e.target.value)} />
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
