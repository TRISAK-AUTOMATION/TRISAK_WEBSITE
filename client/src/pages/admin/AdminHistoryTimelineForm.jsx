import ImageUploadField from "../../components/ImageUploadField.jsx";
import { HISTORY_ADMIN_BASE, HistoryFormShell, useHistoryItemForm } from "../../components/HistoryAdmin.jsx";

const LIST_PATH = `${HISTORY_ADMIN_BASE}/timeline`;

const emptyForm = {
  yearEn: "",
  yearTh: "",
  titleEn: "",
  titleTh: "",
  descriptionEn: "",
  descriptionTh: "",
  imageUrl: "",
  isActive: true,
};

const rowToForm = (r) => ({
  yearEn: r.year_en || "",
  yearTh: r.year_th || "",
  titleEn: r.title_en || "",
  titleTh: r.title_th || "",
  descriptionEn: r.description_en || "",
  descriptionTh: r.description_th || "",
  imageUrl: r.image_url || "",
  isActive: r.is_active ?? true,
});

function validate(f) {
  if (!f.yearEn.trim()) return { message: "Please enter the year or date (English).", lang: "en" };
  if (!f.titleEn.trim()) return { message: "Please enter the event title (English).", lang: "en" };
  return null;
}

/** Add / Edit one timeline entry. */
export default function AdminHistoryTimelineForm() {
  const ctl = useHistoryItemForm({
    section: "timeline",
    listPath: LIST_PATH,
    noun: "timeline entry",
    emptyForm,
    rowToForm,
    validate,
  });
  const { form, set, lang } = ctl;

  const missingTh = !form.yearTh.trim() || !form.titleTh.trim() || !form.descriptionTh.trim();

  return (
    <HistoryFormShell
      ctl={ctl}
      tabLabel="ไทม์ไลน์ (Timeline)"
      itemLabel="Timeline Entry"
      listPath={LIST_PATH}
      statusText="Active (shown on the History page)"
      missingTh={missingTh}
    >
      <div className="admin-form__section panel">
        {lang === "th" ? (
          <>
            <h3>Thai (ไทย)</h3>
            <label className="contact-form__field">
              <span>Year / Date (TH)</span>
              <input value={form.yearTh} onChange={(e) => set("yearTh")(e.target.value)} maxLength={100} placeholder="เช่น 2539 หรือ ก่อตั้ง" />
            </label>
            <label className="contact-form__field" style={{ marginTop: 16 }}>
              <span>Event Title (TH)</span>
              <input value={form.titleTh} onChange={(e) => set("titleTh")(e.target.value)} maxLength={255} />
            </label>
            <label className="contact-form__field" style={{ marginTop: 16 }}>
              <span>Event Description (TH)</span>
              <textarea rows={5} value={form.descriptionTh} onChange={(e) => set("descriptionTh")(e.target.value)} maxLength={5000} />
            </label>
          </>
        ) : (
          <>
            <h3>English</h3>
            <label className="contact-form__field">
              <span>
                Year / Date (EN)<span className="admin-required">*</span>
              </span>
              <input value={form.yearEn} onChange={(e) => set("yearEn")(e.target.value)} maxLength={100} placeholder="e.g. 1996 or Founding" />
            </label>
            <label className="contact-form__field" style={{ marginTop: 16 }}>
              <span>
                Event Title (EN)<span className="admin-required">*</span>
              </span>
              <input value={form.titleEn} onChange={(e) => set("titleEn")(e.target.value)} maxLength={255} />
            </label>
            <label className="contact-form__field" style={{ marginTop: 16 }}>
              <span>Event Description (EN)</span>
              <textarea rows={5} value={form.descriptionEn} onChange={(e) => set("descriptionEn")(e.target.value)} maxLength={5000} />
            </label>
          </>
        )}
      </div>

      <div className="admin-form__section panel">
        <h3>Image (optional)</h3>
        <label className="contact-form__field">
          <span>Current image preview / Upload / Replace / Remove</span>
          <ImageUploadField value={form.imageUrl} onChange={set("imageUrl")} />
        </label>
      </div>
    </HistoryFormShell>
  );
}
