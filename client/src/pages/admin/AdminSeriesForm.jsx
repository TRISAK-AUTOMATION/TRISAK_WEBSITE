import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// limits match the server (GUIDE_FIELDS in server/src/controllers/adminController.js)
const MAX_KEY_SPECS = 8;
const MAX_HIGHLIGHTS = 12;
const MAX_GROUPS = 12;
const MAX_ROWS = 60;

const asList = (v) => (Array.isArray(v) ? v : []);
const emptyKeySpec = () => ({ value: "", label_en: "", label_th: "" });
const emptyHighlight = () => ({ image: "", title_en: "", title_th: "", body_en: "", body_th: "" });
const emptyRow = () => ({ label_en: "", label_th: "", value: "" });
const emptyGroup = () => ({ title_en: "", title_th: "", rows: [emptyRow()] });

/** Move item i by `step` (-1 up, +1 down) in a copy of the list. */
function move(list, i, step) {
  const j = i + step;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** ↑ ↓ ✕ buttons for one item of a repeatable list. */
function RowTools({ index, count, onMove, onRemove, label }) {
  return (
    <div className="guide-edit__tools">
      <button type="button" className="btn" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`เลื่อน${label}ขึ้น`}>
        ↑
      </button>
      <button type="button" className="btn" onClick={() => onMove(index, 1)} disabled={index === count - 1} aria-label={`เลื่อน${label}ลง`}>
        ↓
      </button>
      <button type="button" className="btn guide-edit__remove" onClick={() => onRemove(index)} aria-label={`ลบ${label}`}>
        ลบ
      </button>
    </div>
  );
}

/** Catalog link: upload a PDF (stored like any upload) or paste a URL. */
function CatalogField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("รองรับเฉพาะไฟล์ PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกิน 10 MB");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const { url } = await api.adminUploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="guide-edit__catalog">
      <label className="contact-form__field">
        <span>ลิงก์แคตตาล็อก (PDF หรือ URL)</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/… หรือ https://…" />
      </label>
      <div className="guide-edit__catalog-actions">
        <label className={`btn ${uploading ? "is-uploading" : ""}`}>
          {uploading ? "กำลังอัปโหลด…" : "อัปโหลด PDF"}
          <input type="file" accept="application/pdf" onChange={handleFile} hidden disabled={uploading} />
        </label>
        {value && (
          <>
            <a className="btn" href={value} target="_blank" rel="noreferrer">
              เปิดดู
            </a>
            <button type="button" className="btn" onClick={() => onChange("")}>
              ลบลิงก์
            </button>
          </>
        )}
      </div>
      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
    </div>
  );
}

const TABS = [
  ["data", "ข้อมูล"],
  ["keyspecs", "ตัวเลขเด่น"],
  ["highlights", "จุดเด่น"],
  ["specs", "สเปค"],
  ["upload", "อัพโหลด"],
];

export default function AdminSeriesForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [tab, setTab] = useState("data");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  // products-guide content (migration 056); tagline/description above are English
  const [taglineTh, setTaglineTh] = useState("");
  const [descriptionTh, setDescriptionTh] = useState("");
  const [applicationsEn, setApplicationsEn] = useState("");
  const [applicationsTh, setApplicationsTh] = useState("");
  const [keySpecs, setKeySpecs] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [specGroups, setSpecGroups] = useState([]);
  const [catalogUrl, setCatalogUrl] = useState("");
  const [isLegacy, setIsLegacy] = useState(false);
  const [replacedById, setReplacedById] = useState("");

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allSeries, setAllSeries] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.adminGetBrands().then(setBrands).catch(() => {});
    api.adminGetCategories().then(setCategories).catch(() => {});
    api.adminGetSeriesList().then(setAllSeries).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api
      .adminGetSeries(id)
      .then((s) => {
        setName(s.name);
        setSlug(s.slug);
        setTagline(s.tagline || "");
        setDescription(s.description || "");
        setImageUrl(s.image_url || "");
        setBrandId(String(s.brand_id));
        setCategoryId(String(s.category_id));
        setIsNew(s.is_new);
        setIsActive(s.is_active);
        // Preserve the series' existing position among its siblings
        // (same brand + category) — otherwise saving an unrelated edit
        // would silently reset it and undo any reordering done from
        // the series list.
        setSortOrder(s.sort_order ?? 0);
        setTaglineTh(s.tagline_th || "");
        setDescriptionTh(s.description_th || "");
        setApplicationsEn(s.applications_en || "");
        setApplicationsTh(s.applications_th || "");
        setKeySpecs(asList(s.key_specs).map((k) => ({ ...emptyKeySpec(), ...k })));
        setHighlights(asList(s.highlights).map((h) => ({ ...emptyHighlight(), ...h })));
        setSpecGroups(
          asList(s.spec_groups).map((g) => ({
            ...emptyGroup(),
            ...g,
            rows: asList(g.rows).map((r) => ({ ...emptyRow(), ...r })),
          }))
        );
        setCatalogUrl(s.catalog_url || "");
        setIsLegacy(Boolean(s.is_legacy));
        setReplacedById(s.replaced_by_id ? String(s.replaced_by_id) : "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // ---- list editing helpers ----
  const setKeySpec = (i, key, value) => setKeySpecs((list) => list.map((k, j) => (j === i ? { ...k, [key]: value } : k)));
  const setHighlight = (i, key, value) =>
    setHighlights((list) => list.map((h, j) => (j === i ? { ...h, [key]: value } : h)));
  const setGroup = (i, key, value) => setSpecGroups((list) => list.map((g, j) => (j === i ? { ...g, [key]: value } : g)));
  const setGroupRows = (i, update) =>
    setSpecGroups((list) => list.map((g, j) => (j === i ? { ...g, rows: update(g.rows) } : g)));
  const setRow = (gi, ri, key, value) =>
    setGroupRows(gi, (rows) => rows.map((r, j) => (j === ri ? { ...r, [key]: value } : r)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const newBrandId = Number(brandId);
      const newCategoryId = Number(categoryId);
      // New series: append to the end of its sibling group (same brand
      // + category) instead of defaulting to 0, which would jump it in
      // front of every existing sibling.
      const nextSortOrder = isEdit
        ? sortOrder
        : allSeries
            .filter((s) => s.brand_id === newBrandId && s.category_id === newCategoryId)
            .reduce((max, s) => Math.max(max, s.sort_order ?? 0), -1) + 1;
      const payload = {
        name,
        slug,
        tagline,
        description,
        imageUrl: imageUrl || null,
        brandId: newBrandId,
        categoryId: newCategoryId,
        isNew,
        isActive,
        sortOrder: nextSortOrder,
        // guide content — always sent so the server stores exactly what's on screen
        taglineTh,
        descriptionTh,
        applicationsEn,
        applicationsTh,
        keySpecs,
        highlights,
        specGroups,
        catalogUrl,
        isLegacy,
        replacedById: isLegacy && replacedById ? Number(replacedById) : null,
      };
      if (isEdit) {
        await api.adminUpdateSeries(id, payload);
      } else {
        await api.adminCreateSeries(payload);
      }
      navigate("/admin/series");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="empty-state">กำลังโหลด…</p>;
  }

  const otherSeries = allSeries.filter((s) => String(s.id) !== String(id));

  return (
    <form onSubmit={handleSubmit}>
      <AdminBreadcrumb
        items={[
          { label: "ซีรีย์", to: "/admin/series" },
          { label: isEdit ? "แก้ไข" : "เพิ่ม" },
        ]}
      />

      <div className="admin-edit-tabbar">
        <div className="admin-edit-tabs">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`admin-edit-tab ${tab === key ? "is-active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="admin-edit-tabbar__actions">
          <button
            type="button"
            className="btn admin-btn-cancel"
            onClick={() => navigate("/admin/series")}
          >
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            💾 {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-edit-layout">
        <div className="admin-edit-main panel">
          {tab === "data" && (
            <>
              <div className="admin-edit-notice">
                🔔 ข้อความแต่ละช่องมีทั้งภาษาอังกฤษ (EN) และภาษาไทย (TH) — ช่องภาษาไทยที่เว้นว่าง หน้าเว็บจะแสดงภาษาอังกฤษแทน
              </div>
              <label className="contact-form__field">
                <span>
                  ชื่อ<span className="admin-required">*</span>
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                />
              </label>
              <label className="contact-form__field" style={{ marginTop: 20 }}>
                <span>Slug</span>
                <input
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                />
              </label>

              <div className="guide-edit__pair">
                <label className="contact-form__field">
                  <span>คำโปรย (Tagline) — EN</span>
                  <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
                </label>
                <label className="contact-form__field">
                  <span>คำโปรย (Tagline) — TH</span>
                  <input value={taglineTh} onChange={(e) => setTaglineTh(e.target.value)} />
                </label>
              </div>
              <div className="guide-edit__pair">
                <label className="contact-form__field">
                  <span>รายละเอียด — EN</span>
                  <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
                <label className="contact-form__field">
                  <span>รายละเอียด — TH</span>
                  <textarea rows={5} value={descriptionTh} onChange={(e) => setDescriptionTh(e.target.value)} />
                </label>
              </div>
              <div className="guide-edit__pair">
                <label className="contact-form__field">
                  <span>การใช้งานที่เหมาะ — EN (บรรทัดละ 1 รายการ)</span>
                  <textarea rows={4} value={applicationsEn} onChange={(e) => setApplicationsEn(e.target.value)} />
                </label>
                <label className="contact-form__field">
                  <span>การใช้งานที่เหมาะ — TH (บรรทัดละ 1 รายการ)</span>
                  <textarea rows={4} value={applicationsTh} onChange={(e) => setApplicationsTh(e.target.value)} />
                </label>
              </div>
              <label className="admin-form__checkbox" style={{ marginTop: 20 }}>
                <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
                <span>เป็นสินค้าใหม่ (NEW)</span>
              </label>
            </>
          )}

          {tab === "keyspecs" && (
            <>
              <div className="admin-edit-notice">
                ตัวเลขหรือจุดเด่นสั้นๆ ที่แสดงเป็นแถบใต้หัวหน้า Series (สูงสุด {MAX_KEY_SPECS} รายการ) — 3 รายการแรกแสดงบนการ์ดในหน้ารวมด้วย
              </div>
              {keySpecs.length === 0 && <p className="guide-edit__empty">ยังไม่มีตัวเลขเด่น</p>}
              {keySpecs.map((k, i) => (
                <div className="guide-edit__item" key={i}>
                  <div className="guide-edit__item-head">
                    <strong>#{i + 1}</strong>
                    <RowTools
                      index={i}
                      count={keySpecs.length}
                      label="รายการ"
                      onMove={(a, step) => setKeySpecs((l) => move(l, a, step))}
                      onRemove={(a) => setKeySpecs((l) => l.filter((_, j) => j !== a))}
                    />
                  </div>
                  <div className="guide-edit__triple">
                    <label className="contact-form__field">
                      <span>ค่า / ตัวเลข</span>
                      <input value={k.value} onChange={(e) => setKeySpec(i, "value", e.target.value)} placeholder="เช่น 2,560 หรือ EtherCAT" />
                    </label>
                    <label className="contact-form__field">
                      <span>คำอธิบาย — EN</span>
                      <input value={k.label_en} onChange={(e) => setKeySpec(i, "label_en", e.target.value)} />
                    </label>
                    <label className="contact-form__field">
                      <span>คำอธิบาย — TH</span>
                      <input value={k.label_th} onChange={(e) => setKeySpec(i, "label_th", e.target.value)} />
                    </label>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn guide-edit__add"
                disabled={keySpecs.length >= MAX_KEY_SPECS}
                onClick={() => setKeySpecs((l) => [...l, emptyKeySpec()])}
              >
                + เพิ่มตัวเลขเด่น
              </button>
            </>
          )}

          {tab === "highlights" && (
            <>
              <div className="admin-edit-notice">
                จุดเด่นพร้อมภาพประกอบ แสดงเป็นบล็อกรูปสลับข้อความ (สูงสุด {MAX_HIGHLIGHTS} บล็อก) — ไม่ใส่รูปก็ได้
              </div>
              {highlights.length === 0 && <p className="guide-edit__empty">ยังไม่มีจุดเด่น</p>}
              {highlights.map((h, i) => (
                <div className="guide-edit__item" key={i}>
                  <div className="guide-edit__item-head">
                    <strong>จุดเด่น #{i + 1}</strong>
                    <RowTools
                      index={i}
                      count={highlights.length}
                      label="จุดเด่น"
                      onMove={(a, step) => setHighlights((l) => move(l, a, step))}
                      onRemove={(a) => setHighlights((l) => l.filter((_, j) => j !== a))}
                    />
                  </div>
                  <div className="guide-edit__highlight">
                    <div className="guide-edit__highlight-image">
                      <span className="admin-edit-sidebar__label">รูปประกอบ</span>
                      <ImageUploadField value={h.image} onChange={(url) => setHighlight(i, "image", url || "")} />
                    </div>
                    <div>
                      <div className="guide-edit__pair guide-edit__pair--tight">
                        <label className="contact-form__field">
                          <span>หัวข้อ — EN</span>
                          <input value={h.title_en} onChange={(e) => setHighlight(i, "title_en", e.target.value)} />
                        </label>
                        <label className="contact-form__field">
                          <span>หัวข้อ — TH</span>
                          <input value={h.title_th} onChange={(e) => setHighlight(i, "title_th", e.target.value)} />
                        </label>
                      </div>
                      <div className="guide-edit__pair guide-edit__pair--tight">
                        <label className="contact-form__field">
                          <span>ข้อความ — EN</span>
                          <textarea rows={4} value={h.body_en} onChange={(e) => setHighlight(i, "body_en", e.target.value)} />
                        </label>
                        <label className="contact-form__field">
                          <span>ข้อความ — TH</span>
                          <textarea rows={4} value={h.body_th} onChange={(e) => setHighlight(i, "body_th", e.target.value)} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn guide-edit__add"
                disabled={highlights.length >= MAX_HIGHLIGHTS}
                onClick={() => setHighlights((l) => [...l, emptyHighlight()])}
              >
                + เพิ่มจุดเด่น
              </button>
            </>
          )}

          {tab === "specs" && (
            <>
              <div className="admin-edit-notice">
                ตารางสเปค แบ่งเป็นกลุ่ม เช่น ทั่วไป / การสื่อสาร / I/O — แถวที่ไม่มีค่าจะไม่ถูกบันทึก
              </div>
              {specGroups.length === 0 && <p className="guide-edit__empty">ยังไม่มีตารางสเปค</p>}
              {specGroups.map((g, gi) => (
                <div className="guide-edit__item" key={gi}>
                  <div className="guide-edit__item-head">
                    <strong>กลุ่ม #{gi + 1}</strong>
                    <RowTools
                      index={gi}
                      count={specGroups.length}
                      label="กลุ่ม"
                      onMove={(a, step) => setSpecGroups((l) => move(l, a, step))}
                      onRemove={(a) => setSpecGroups((l) => l.filter((_, j) => j !== a))}
                    />
                  </div>
                  <div className="guide-edit__pair guide-edit__pair--tight">
                    <label className="contact-form__field">
                      <span>ชื่อกลุ่ม — EN</span>
                      <input value={g.title_en} onChange={(e) => setGroup(gi, "title_en", e.target.value)} />
                    </label>
                    <label className="contact-form__field">
                      <span>ชื่อกลุ่ม — TH</span>
                      <input value={g.title_th} onChange={(e) => setGroup(gi, "title_th", e.target.value)} />
                    </label>
                  </div>
                  <table className="guide-edit__rows">
                    <thead>
                      <tr>
                        <th>หัวข้อ — EN</th>
                        <th>หัวข้อ — TH</th>
                        <th>ค่า</th>
                        <th aria-label="จัดการ" />
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r, ri) => (
                        <tr key={ri}>
                          <td>
                            <input value={r.label_en} onChange={(e) => setRow(gi, ri, "label_en", e.target.value)} aria-label="หัวข้อ EN" />
                          </td>
                          <td>
                            <input value={r.label_th} onChange={(e) => setRow(gi, ri, "label_th", e.target.value)} aria-label="หัวข้อ TH" />
                          </td>
                          <td>
                            <input value={r.value} onChange={(e) => setRow(gi, ri, "value", e.target.value)} aria-label="ค่า" />
                          </td>
                          <td>
                            <RowTools
                              index={ri}
                              count={g.rows.length}
                              label="แถว"
                              onMove={(a, step) => setGroupRows(gi, (rows) => move(rows, a, step))}
                              onRemove={(a) => setGroupRows(gi, (rows) => rows.filter((_, j) => j !== a))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    type="button"
                    className="btn guide-edit__add guide-edit__add--small"
                    disabled={g.rows.length >= MAX_ROWS}
                    onClick={() => setGroupRows(gi, (rows) => [...rows, emptyRow()])}
                  >
                    + เพิ่มแถว
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn guide-edit__add"
                disabled={specGroups.length >= MAX_GROUPS}
                onClick={() => setSpecGroups((l) => [...l, emptyGroup()])}
              >
                + เพิ่มกลุ่มสเปค
              </button>
            </>
          )}

          {tab === "upload" && (
            <>
              <div className="admin-edit-notice">รูปภาพหลักของซีรีย์ (แสดงที่ส่วนหัวและบนการ์ด)</div>
              <ImageUploadField value={imageUrl} onChange={setImageUrl} />
              <div className="admin-edit-notice" style={{ marginTop: 28 }}>
                แคตตาล็อกสำหรับปุ่ม "ดาวน์โหลดแคตตาล็อก"
              </div>
              <CatalogField value={catalogUrl} onChange={setCatalogUrl} />
            </>
          )}
        </div>

        <aside className="admin-edit-sidebar">
          <div className="panel admin-edit-sidebar__section">
            <span className="admin-edit-sidebar__label">แบรนด์</span>
            <select required value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              <option value="">กรุณาเลือก แบรนด์</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="panel admin-edit-sidebar__section">
            <span className="admin-edit-sidebar__label">หมวดหมู่</span>
            <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">กรุณาเลือก หมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <small className="guide-edit__hint">ซีรีย์จะแสดงในหน้า Products ใต้ประเภทสินค้า (หมวดหมู่ชั้นบนสุด) ของหมวดนี้</small>
          </div>

          <div className="panel admin-edit-sidebar__section">
            <span className="admin-edit-sidebar__label">สถานะ</span>
            <label className="admin-toggle">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="admin-toggle__track">
                <span className="admin-toggle__thumb" />
              </span>
              การแสดงผล
            </label>
          </div>

          <div className="panel admin-edit-sidebar__section">
            <span className="admin-edit-sidebar__label">รุ่นเดิม (Legacy)</span>
            <label className="admin-toggle">
              <input type="checkbox" checked={isLegacy} onChange={(e) => setIsLegacy(e.target.checked)} />
              <span className="admin-toggle__track">
                <span className="admin-toggle__thumb" />
              </span>
              เป็นรุ่นเดิม (ยังให้บริการ)
            </label>
            {isLegacy && (
              <label className="contact-form__field" style={{ marginTop: 14 }}>
                <span>รุ่นทดแทน</span>
                <select value={replacedById} onChange={(e) => setReplacedById(e.target.value)}>
                  <option value="">— ไม่ระบุ —</option>
                  {otherSeries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.brand_name})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
