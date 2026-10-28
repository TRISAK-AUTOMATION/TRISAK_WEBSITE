import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import { availabilityLabel } from "../../utils/productAvailability.js";

const ACTION_LABELS = {
  add: { text: "เพิ่มใหม่", className: "admin-import-badge--add" },
  update: { text: "อัปเดต", className: "admin-import-badge--update" },
  error: { text: "ข้อผิดพลาด", className: "admin-import-badge--error" },
};

const STATUS_ORDER = ["available", "unavailable", "discontinued", "replacement_available"];

// Preview columns, in the same order as the Excel export / import template.
// `availability` columns only show when the file carries In Stock / Item Status.
const PREVIEW_COLUMNS = [
  { key: "Slug" },
  { key: "Name" },
  { key: "In Stock", availability: true },
  { key: "Brand" },
  { key: "Category" },
  { key: "Series" },
  { key: "Model" },
  { key: "Short Description", long: true },
  { key: "Description", long: true },
  { key: "Features", long: true },
  { key: "Specifications", long: true },
  { key: "Item Status", availability: true },
];

const LONG_CELL_STYLE = { maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

export default function AdminProductImport() {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [preview, setPreview] = useState(null); // { summary, rows }
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState("");
  const [result, setResult] = useState(null); // { added, updated, skipped, errors }
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    setUploadError("");
    setDownloadingTemplate(true);
    try {
      await api.adminDownloadProductImportTemplate();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const reset = () => {
    setFileName("");
    setPreview(null);
    setUploadError("");
    setCommitError("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploadError("");
    setResult(null);
    setUploading(true);
    try {
      const data = await api.adminPreviewProductImport(file);
      setPreview(data);
    } catch (err) {
      setPreview(null);
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    const importableRows = preview.rows.filter((r) => r.action !== "error");
    if (!importableRows.length) return;
    setCommitting(true);
    setCommitError("");
    try {
      const summary = await api.adminCommitProductImport(importableRows);
      setResult(summary);
      setPreview(null);
    } catch (err) {
      setCommitError(err.message);
    } finally {
      setCommitting(false);
    }
  };

  const handleCancelPreview = () => {
    reset();
  };

  const importableCount = preview ? preview.summary.toAdd + preview.summary.toUpdate : 0;

  return (
    <>
      <AdminBreadcrumb
        items={[{ label: "รายการ", to: "/admin/products" }, { label: "นำเข้าจาก Excel" }]}
      />

      <div className="admin-edit-notice" style={{ marginBottom: 20 }}>
        📄 อัปโหลดไฟล์ Excel (.xlsx) เพื่อเพิ่ม/อัปเดตสินค้าหลายรายการพร้อมกัน — ระบบจะตรวจสอบข้อมูลและแสดงตัวอย่างก่อนบันทึกจริง
        ระบุ Slug (= ITEM NO) เดิมเพื่ออัปเดตสินค้าที่มีอยู่ หรือค่าใหม่เพื่อสร้างสินค้าใหม่ — ใช้ ITEM NO ตามที่ระบุในไฟล์ทุกตัวอักษร (ตัวอักษร ตัวเลข และเครื่องหมาย - เท่านั้น) ไม่สร้างหรือแก้ไขจากชื่อสินค้า
        <br />
        <strong>รูปภาพสินค้าไม่ได้จัดการผ่านไฟล์นี้</strong> — เพิ่ม/แก้ไขรูปภาพได้จากหน้าแก้ไขสินค้าแต่ละรายการหลังนำเข้าแล้ว
        <br />
        <strong>สถานะสินค้า (ไม่บังคับ):</strong> หากไฟล์มีคอลัมน์ In Stock และ Item Status ระบบจะคำนวณสถานะให้อัตโนมัติ —
        Item Status = Discontinued → Discontinued (สำคัญที่สุด ไม่สนใจจำนวนสต็อก), Active + In Stock &gt; 0 = Available, Active + In Stock = 0 = Unavailable
        สถานะ Replacement Available และสินค้าทดแทนจัดการด้วยมือเท่านั้น และจะไม่ถูกเปลี่ยนจากการนำเข้า
      </div>

      {!preview && !result && (
        <div className="admin-form__section panel">
          <h3>1. เลือกไฟล์ Excel</h3>
          <p className="admin-list-table__submeta" style={{ marginBottom: 16 }}>
            คอลัมน์ที่ต้องมี: Name, Slug, Brand, Category, Series, Model, Short Description, Description,
            Features, Specifications (คอลัมน์ไม่บังคับ: In Stock, Item Status — ต่อท้ายคอลัมน์ Specifications) — แนะนำให้เริ่มจากไฟล์ที่ Export ออกมาแล้วแก้ไขต่อ
            (Features/Specifications แต่ละรายการคั่นด้วย " | ", Specifications แต่ละช่องใช้รูปแบบ "ป้ายชื่อ: ค่า")
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label className={`btn btn-primary ${uploading ? "is-uploading" : ""}`}>
              {uploading ? "กำลังตรวจสอบไฟล์…" : "📤 เลือกไฟล์ .xlsx"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={uploading}
                hidden
              />
            </label>
            <button type="button" className="btn" onClick={handleDownloadTemplate} disabled={downloadingTemplate}>
              {downloadingTemplate ? "กำลังสร้างเทมเพลต…" : "⬇ ดาวน์โหลดเทมเพลต"}
            </button>
            {fileName && <span className="admin-list-table__muted">{fileName}</span>}
          </div>
          {uploadError && <p className="contact-form__status contact-form__status--error">{uploadError}</p>}
        </div>
      )}

      {preview && (
        <>
          <div className="admin-form__section panel">
            <h3>2. ตรวจสอบก่อนนำเข้า</h3>
            <div className="admin-import-summary">
              <div className="admin-import-summary__stat admin-import-summary__stat--add">
                <strong>{preview.summary.toAdd}</strong>
                <span>เพิ่มใหม่</span>
              </div>
              <div className="admin-import-summary__stat admin-import-summary__stat--update">
                <strong>{preview.summary.toUpdate}</strong>
                <span>อัปเดต</span>
              </div>
              <div className="admin-import-summary__stat admin-import-summary__stat--error">
                <strong>{preview.summary.toError}</strong>
                <span>ข้อผิดพลาด (จะถูกข้าม)</span>
              </div>
              <div className="admin-import-summary__stat">
                <strong>{preview.summary.total}</strong>
                <span>ทั้งหมด</span>
              </div>
            </div>

            <p className="admin-list-table__submeta" style={{ marginTop: 12 }}>
              ใช้คอลัมน์ <strong>{preview.slugSource === "ITEM NO" ? "ITEM NO" : "Slug"}</strong> เป็น Slug ของสินค้า
            </p>
            {preview.duplicateItemNos?.length > 0 && (
              <div className="admin-edit-notice" style={{ marginTop: 12 }}>
                ⚠️ พบ ITEM NO ซ้ำกันในไฟล์ — แถวที่ซ้ำ (ยกเว้นแถวแรก) จะถูกข้าม:
                <ul style={{ margin: "6px 0 0 18px" }}>
                  {preview.duplicateItemNos.map((d) => (
                    <li key={d.itemNo}>
                      <strong>{d.itemNo}</strong> — แถว {d.rows.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {preview.statusSummary &&
              (preview.statusSummary.columnsPresent ? (
                <>
                  <h4 style={{ margin: "24px 0 8px" }}>สถานะสินค้าหลังนำเข้า (ทั้งแคตตาล็อก)</h4>
                  <div className="admin-import-summary">
                    {STATUS_ORDER.map((st) => (
                      <div key={st} className="admin-import-summary__stat">
                        <strong>{preview.statusSummary.resulting[st]}</strong>
                        <span>{availabilityLabel(st)}</span>
                      </div>
                    ))}
                    <div className="admin-import-summary__stat admin-import-summary__stat--update">
                      <strong>{preview.statusSummary.statusChanges}</strong>
                      <span>สถานะที่จะเปลี่ยน</span>
                    </div>
                    <div className="admin-import-summary__stat admin-import-summary__stat--error">
                      <strong>{preview.statusSummary.needsReview}</strong>
                      <span>ต้องตรวจสอบ (In Stock / Item Status)</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="admin-list-table__submeta" style={{ marginTop: 16 }}>
                  ไม่พบคอลัมน์ In Stock / Item Status — สถานะสินค้าทั้งหมดจะไม่ถูกเปลี่ยน
                </p>
              ))}

            {commitError && <p className="contact-form__status contact-form__status--error">{commitError}</p>}

            <div className="admin-list-table-wrap" style={{ marginTop: 20 }}>
              <table className="admin-list-table">
                <thead>
                  <tr>
                    <th>แถว</th>
                    <th>สถานะ</th>
                    {PREVIEW_COLUMNS.filter((c) => !c.availability || preview.statusSummary?.columnsPresent).map((c) => (
                      <th key={c.key}>{c.key}</th>
                    ))}
                    {preview.statusSummary?.columnsPresent && <th>สถานะสินค้า</th>}
                    <th>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => {
                    const badge = ACTION_LABELS[r.action];
                    return (
                      <tr key={r.rowNumber} className={r.action === "error" ? "admin-import-row--error" : ""}>
                        <td>{r.rowNumber}</td>
                        <td>
                          <span className={`admin-import-badge ${badge.className}`}>{badge.text}</span>
                        </td>
                        {PREVIEW_COLUMNS.filter((c) => !c.availability || preview.statusSummary?.columnsPresent).map((c) => {
                          const value = r.raw[c.key];
                          return (
                            <td
                              key={c.key}
                              className={c.key === "Slug" || c.key === "Name" ? "" : "admin-list-table__muted"}
                              style={c.long ? LONG_CELL_STYLE : undefined}
                              title={c.long && value ? value : undefined}
                            >
                              {value || <span className="admin-list-table__muted">—</span>}
                            </td>
                          );
                        })}
                        {preview.statusSummary?.columnsPresent && (
                          <td>
                            {r.availability?.next ? (
                              <>
                                {r.availability.current && r.availability.changed
                                  ? `${availabilityLabel(r.availability.current)} → `
                                  : ""}
                                {availabilityLabel(r.availability.next)}
                              </>
                            ) : r.availability?.needsReview ? (
                              <span className="admin-import-issue admin-import-issue--error">ต้องตรวจสอบ</span>
                            ) : (
                              "—"
                            )}
                          </td>
                        )}
                        <td>
                          {r.errors.map((e, i) => (
                            <p key={`e${i}`} className="admin-import-issue admin-import-issue--error">
                              ⚠ {e}
                            </p>
                          ))}
                          {r.warnings.map((w, i) => (
                            <p key={`w${i}`} className="admin-import-issue admin-import-issue--warning">
                              ℹ {w}
                            </p>
                          ))}
                          {!r.errors.length && !r.warnings.length && (
                            <span className="admin-list-table__muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-form__submit-row">
              <button type="button" className="btn admin-btn-cancel" onClick={handleCancelPreview}>
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={committing || importableCount === 0}
                onClick={handleConfirmImport}
              >
                {committing
                  ? "กำลังนำเข้า…"
                  : `✅ ยืนยันนำเข้า (${importableCount} รายการ)`}
              </button>
            </div>
          </div>
        </>
      )}

      {result && (
        <div className="admin-form__section panel">
          <h3>นำเข้าสำเร็จ</h3>
          <div className="admin-import-summary">
            <div className="admin-import-summary__stat admin-import-summary__stat--add">
              <strong>{result.added}</strong>
              <span>เพิ่มใหม่</span>
            </div>
            <div className="admin-import-summary__stat admin-import-summary__stat--update">
              <strong>{result.updated}</strong>
              <span>อัปเดตแล้ว</span>
            </div>
            <div className="admin-import-summary__stat admin-import-summary__stat--error">
              <strong>{result.skipped}</strong>
              <span>ข้าม</span>
            </div>
            {typeof result.statusUpdated === "number" && (
              <div className="admin-import-summary__stat">
                <strong>{result.statusUpdated}</strong>
                <span>อัปเดตสถานะสินค้า</span>
              </div>
            )}
          </div>

          {result.reviewed?.length > 0 && (
            <div className="admin-list-table-wrap" style={{ marginTop: 20 }}>
              <h4 style={{ margin: "0 0 8px" }}>นำเข้าแล้ว แต่ต้องตรวจสอบข้อมูลสถานะ (สถานะเดิมไม่ถูกเปลี่ยน)</h4>
              <table className="admin-list-table">
                <thead>
                  <tr>
                    <th>แถว</th>
                    <th>Slug</th>
                    <th>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {result.reviewed.map((e) => (
                    <tr key={e.rowNumber}>
                      <td>{e.rowNumber}</td>
                      <td>{e.slug || "—"}</td>
                      <td>
                        {e.messages.map((msg, i) => (
                          <p key={i} className="admin-import-issue admin-import-issue--warning">
                            ℹ {msg}
                          </p>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="admin-list-table-wrap" style={{ marginTop: 20 }}>
              <table className="admin-list-table">
                <thead>
                  <tr>
                    <th>แถว</th>
                    <th>Slug</th>
                    <th>ข้อผิดพลาด</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e) => (
                    <tr key={e.rowNumber} className="admin-import-row--error">
                      <td>{e.rowNumber}</td>
                      <td>{e.slug || "—"}</td>
                      <td>
                        {e.errors.map((msg, i) => (
                          <p key={i} className="admin-import-issue admin-import-issue--error">
                            ⚠ {msg}
                          </p>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-form__submit-row">
            <button type="button" className="btn" onClick={reset}>
              นำเข้าไฟล์อื่น
            </button>
            <Link to="/admin/products" className="btn btn-primary">
              ไปที่รายการสินค้า
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
