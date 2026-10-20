import ImageUploadField from "../../components/ImageUploadField.jsx";
import { HISTORY_ADMIN_BASE, HistoryFormShell, useHistoryItemForm } from "../../components/HistoryAdmin.jsx";
import { descendantIds, flattenOrg, siblingsOf } from "../../utils/orgTree.js";

const LIST_PATH = `${HISTORY_ADMIN_BASE}/organization`;

const emptyForm = {
  nameEn: "",
  nameTh: "",
  personEn: "",
  personTh: "",
  parentId: "", // "" = top level
  imageUrl: "",
  isActive: true,
};

const rowToForm = (r) => ({
  nameEn: r.name_en || "",
  nameTh: r.name_th || "",
  personEn: r.person_en || "",
  personTh: r.person_th || "",
  parentId: r.parent_id == null ? "" : String(r.parent_id),
  imageUrl: r.image_url || "",
  isActive: r.is_active ?? true,
});

function validate(f) {
  if (!f.nameEn.trim()) return { message: "Please enter the position or department name (English).", lang: "en" };
  return null;
}

// The order arrows move a node among the nodes that share its (saved) parent.
function getPosition(row, all) {
  const sibs = siblingsOf(row, all);
  return { index: sibs.findIndex((s) => s.id === row.id), total: sibs.length };
}

/** Add / Edit one organization-chart node. */
export default function AdminHistoryOrgForm() {
  const ctl = useHistoryItemForm({
    section: "organization",
    listPath: LIST_PATH,
    noun: "organization node",
    emptyForm,
    rowToForm,
    validate,
    getPosition,
  });
  const { form, set, lang, allRows, id, isEdit } = ctl;

  // Parent choices: every node except this one and the nodes below it
  // (a node can't report to itself or to its own sub-nodes).
  const blocked = isEdit ? descendantIds(allRows, Number(id)) : new Set();
  const parentOptions = flattenOrg(allRows).filter((n) => n.id !== Number(id) && !blocked.has(n.id));

  const missingTh = !form.nameTh.trim();

  return (
    <HistoryFormShell
      ctl={ctl}
      tabLabel="โครงสร้างองค์กร (Organization)"
      itemLabel="Organization Node"
      listPath={LIST_PATH}
      statusText="Active (shown in the organization chart)"
      missingTh={missingTh}
      orderHint="Order applies among nodes with the same parent. Moving a node to a new parent places it last there."
    >
      <div className="admin-form__section panel">
        {lang === "th" ? (
          <>
            <h3>Thai (ไทย)</h3>
            <label className="contact-form__field">
              <span>Position / Department Name (TH)</span>
              <input value={form.nameTh} onChange={(e) => set("nameTh")(e.target.value)} maxLength={150} placeholder="เช่น ฝ่ายจำหน่ายสินค้า" />
            </label>
            <label className="contact-form__field" style={{ marginTop: 16 }}>
              <span>Person's Name (TH) — optional</span>
              <input value={form.personTh} onChange={(e) => set("personTh")(e.target.value)} maxLength={150} />
            </label>
          </>
        ) : (
          <>
            <h3>English</h3>
            <label className="contact-form__field">
              <span>
                Position / Department Name (EN)<span className="admin-required">*</span>
              </span>
              <input value={form.nameEn} onChange={(e) => set("nameEn")(e.target.value)} maxLength={150} placeholder="e.g. Products Distribution" />
            </label>
            <label className="contact-form__field" style={{ marginTop: 16 }}>
              <span>Person's Name (EN) — optional</span>
              <input value={form.personEn} onChange={(e) => set("personEn")(e.target.value)} maxLength={150} />
            </label>
          </>
        )}
      </div>

      <div className="admin-form__section panel">
        <h3>Reporting Relationship</h3>
        <label className="contact-form__field">
          <span>Parent Position (reports to)</span>
          <select value={form.parentId} onChange={(e) => set("parentId")(e.target.value)}>
            <option value="">— None (top level) —</option>
            {parentOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {`${"— ".repeat(n._depth)}${n.name_en}`}
                {n.is_active ? "" : " (disabled)"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-form__section panel">
        <h3>Profile Image (optional)</h3>
        <label className="contact-form__field">
          <span>Current image preview / Upload / Replace / Remove</span>
          <ImageUploadField value={form.imageUrl} onChange={set("imageUrl")} />
        </label>
      </div>
    </HistoryFormShell>
  );
}
