import { HISTORY_ADMIN_BASE, HistoryFormShell, useHistoryItemForm } from "../../components/HistoryAdmin.jsx";

const LIST_PATH = `${HISTORY_ADMIN_BASE}/statistics`;

const emptyForm = { labelEn: "", labelTh: "", value: "", unitEn: "", unitTh: "", isActive: true };

const rowToForm = (r) => ({
  labelEn: r.label_en || "",
  labelTh: r.label_th || "",
  value: r.value || "",
  unitEn: r.unit_en || "",
  unitTh: r.unit_th || "",
  isActive: r.is_active ?? true,
});

function validate(f) {
  if (!f.labelEn.trim()) return { message: "Please enter the statistic label (English).", lang: "en" };
  if (!f.value.trim()) return { message: "Please enter the statistic value, e.g. 30+." };
  return null;
}

/** Add / Edit one statistic. */
export default function AdminHistoryStatForm() {
  const ctl = useHistoryItemForm({
    section: "statistics",
    listPath: LIST_PATH,
    noun: "statistic",
    emptyForm,
    rowToForm,
    validate,
  });
  const { form, set, lang } = ctl;

  const missingTh = !form.labelTh.trim();

  return (
    <HistoryFormShell
      ctl={ctl}
      tabLabel="สถิติ (Statistics)"
      itemLabel="Statistic"
      listPath={LIST_PATH}
      statusText="Active (shown on the History page)"
      missingTh={missingTh}
    >
      <div className="admin-form__section panel">
        {lang === "th" ? (
          <>
            <h3>Thai (ไทย)</h3>
            <label className="contact-form__field">
              <span>Label (TH)</span>
              <input value={form.labelTh} onChange={(e) => set("labelTh")(e.target.value)} maxLength={150} placeholder="เช่น ปีแห่งประสบการณ์" />
            </label>
            <label className="contact-form__field" style={{ marginTop: 16 }}>
              <span>Unit / Suffix (TH) — optional</span>
              <input value={form.unitTh} onChange={(e) => set("unitTh")(e.target.value)} maxLength={30} placeholder="เช่น ปี" />
            </label>
          </>
        ) : (
          <>
            <h3>English</h3>
            <label className="contact-form__field">
              <span>
                Label (EN)<span className="admin-required">*</span>
              </span>
              <input value={form.labelEn} onChange={(e) => set("labelEn")(e.target.value)} maxLength={150} placeholder="e.g. Years of Experience" />
            </label>
            <label className="contact-form__field" style={{ marginTop: 16 }}>
              <span>Unit / Suffix (EN) — optional</span>
              <input value={form.unitEn} onChange={(e) => set("unitEn")(e.target.value)} maxLength={30} placeholder="e.g. years" />
            </label>
          </>
        )}
      </div>

      <div className="admin-form__section panel">
        <h3>Value</h3>
        <label className="contact-form__field">
          <span>
            Statistic Value<span className="admin-required">*</span>
          </span>
          <input value={form.value} onChange={(e) => set("value")(e.target.value)} maxLength={50} placeholder="e.g. 30+, 500+ or 20" />
        </label>
        <p className="admin-form__hint" style={{ marginTop: 8 }}>
          Same for both languages. A unit/suffix is shown right after the value, in the language being viewed.
        </p>
      </div>
    </HistoryFormShell>
  );
}
