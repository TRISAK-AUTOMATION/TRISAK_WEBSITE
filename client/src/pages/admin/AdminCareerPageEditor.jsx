import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import { AdminEditLayout, AdminLanguageSelect } from "../../components/AdminEditSidebar.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";

function emptyForm() {
  return {
    apply_steps: [],
    hr_name_en: "",
    hr_name_th: "",
    hr_phone: "",
    hr_email: "",
    hr_line_id: "",
  };
}

export default function AdminCareerPageEditor() {
  const [form, setForm] = useState(emptyForm);
  const [lang, setLang] = useState("th");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .adminGetCareerPageContent()
      .then((d) => {
        if (d) {
          setForm((f) => ({
            ...f,
            ...d,
            apply_steps: Array.isArray(d.apply_steps) ? d.apply_steps : [],
          }));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const change = (updater) => {
    setSuccess(false);
    setForm(updater);
  };

  // ---- How to Apply steps ----
  const steps = form.apply_steps;
  const setSteps = (next) => change((f) => ({ ...f, apply_steps: next }));
  const updateStep = (i, val) =>
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, [lang]: val } : s)));
  const addStep = () => setSteps([...steps, { en: "", th: "" }]);
  const removeStep = (i) => setSteps(steps.filter((_, idx) => idx !== i));
  const moveStep = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  };

  // ---- HR contact ----
  const hrNameField = `hr_name_${lang}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await api.adminUpdateCareerPageContent(form);
      setForm((f) => ({
        ...f,
        ...updated,
        apply_steps: Array.isArray(updated?.apply_steps) ? updated.apply_steps : f.apply_steps,
      }));
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

  const otherLang = lang === "th" ? "en" : "th";

  return (
    <form onSubmit={handleSubmit}>
      <AdminBreadcrumb items={[{ label: "ร่วมงานกับเรา (Career)" }]} />

      <div className="admin-edit-tabbar admin-edit-tabbar--actions-only">
        <div className="admin-edit-tabbar__actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            💾 {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
      {success && <SuccessModal onClose={() => setSuccess(false)} />}

      <div className="admin-edit-notice">
        🔔 กำลังแก้ไขวิธีการสมัครและข้อมูลติดต่อในเวอร์ชัน{" "}
        <strong>{lang === "th" ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> — เลือกภาษาจากเมนูด้านข้างเพื่อแก้อีกภาษา
        โทรศัพท์ อีเมล และ Line ID ใช้ร่วมกันทั้งสองภาษา ข้อมูลส่วนนี้แสดงใต้ Welfare and Benefits ของทุกตำแหน่งงาน
      </div>

      <AdminEditLayout sidebar={<AdminLanguageSelect value={lang} onChange={setLang} />}>
        <div className="admin-form">
          <div className="admin-form__section panel">
            <h3>วิธีการสมัคร (How to Apply)</h3>
            <p className="career-admin__hint">
              เพิ่ม ลบ หรือเรียงลำดับหัวข้อย่อยได้ หัวข้อที่เว้นว่างทั้งสองภาษาจะถูกลบเมื่อบันทึก
            </p>

            {steps.length === 0 && <p className="career-admin__empty">ยังไม่มีหัวข้อ — กด “เพิ่มหัวข้อ” ด้านล่าง</p>}

            <ol className="career-admin__steps">
              {steps.map((step, i) => (
                <li key={i} className="career-admin__step">
                  <span className="career-admin__step-no">{i + 1}</span>
                  <label className="contact-form__field career-admin__step-field">
                    <textarea
                      rows={2}
                      aria-label={`หัวข้อที่ ${i + 1}`}
                      value={step[lang] || ""}
                      placeholder={step[otherLang] ? `(${otherLang.toUpperCase()}) ${step[otherLang]}` : ""}
                      onChange={(e) => updateStep(i, e.target.value)}
                    />
                  </label>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="btn pillar-admin__arrow"
                      disabled={i === 0}
                      onClick={() => moveStep(i, -1)}
                      aria-label={`เลื่อนหัวข้อที่ ${i + 1} ขึ้น`}
                      title="เลื่อนขึ้น"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn pillar-admin__arrow"
                      disabled={i === steps.length - 1}
                      onClick={() => moveStep(i, 1)}
                      aria-label={`เลื่อนหัวข้อที่ ${i + 1} ลง`}
                      title="เลื่อนลง"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn pillar-admin__delete"
                      onClick={() => removeStep(i)}
                      aria-label={`ลบหัวข้อที่ ${i + 1}`}
                    >
                      ลบ
                    </button>
                  </div>
                </li>
              ))}
            </ol>

            <button type="button" className="btn" onClick={addStep} style={{ marginTop: 16 }}>
              + เพิ่มหัวข้อ
            </button>
          </div>

          <div className="admin-form__section panel">
            <h3>ติดต่อ (Contact)</h3>
            <label className="contact-form__field">
              <span>ฝ่ายบุคคล — ชื่อผู้ติดต่อ</span>
              <input
                value={form[hrNameField] || ""}
                onChange={(e) => change((f) => ({ ...f, [hrNameField]: e.target.value }))}
              />
            </label>
            <div className="admin-form__row" style={{ marginTop: 20 }}>
              <label className="contact-form__field">
                <span>โทรศัพท์</span>
                <input
                  type="tel"
                  value={form.hr_phone || ""}
                  onChange={(e) => change((f) => ({ ...f, hr_phone: e.target.value }))}
                />
              </label>
              <label className="contact-form__field">
                <span>อีเมล</span>
                <input
                  type="email"
                  value={form.hr_email || ""}
                  onChange={(e) => change((f) => ({ ...f, hr_email: e.target.value }))}
                />
              </label>
            </div>
            <label className="contact-form__field" style={{ marginTop: 20 }}>
              <span>Line ID</span>
              <input
                value={form.hr_line_id || ""}
                onChange={(e) => change((f) => ({ ...f, hr_line_id: e.target.value }))}
              />
            </label>
          </div>
        </div>
      </AdminEditLayout>
    </form>
  );
}
