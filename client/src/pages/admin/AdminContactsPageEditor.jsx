import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import { AdminEditLayout, AdminLanguageSelect } from "../../components/AdminEditSidebar.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
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
  "office_hours",
  "company_name",
];

const PLAIN_FIELDS = [
  "head_office_phone",
  "head_office_email",
  "warehouse_phone",
  "warehouse_email",
  "head_office_map",
  "head_office_map_link",
  "warehouse_map",
  "warehouse_map_link",
  "line_id",
  "line_url",
  "line_qr_image",
  "support_phone",
  "support_email",
  "accounting_phone",
  "accounting_email",
  "tax_id",
  "vendor_docs",
  "faq",
  "head_office_photo",
  "warehouse_photo",
];

// vendor_docs / faq are stored as JSON text.
function parseList(text) {
  try {
    const v = JSON.parse(text || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Uploads one PDF through the admin upload endpoint and reports its URL. */
function PdfUploadButton({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") return setError("ต้องเป็นไฟล์ PDF");
    if (file.size > 10 * 1024 * 1024) return setError("ไฟล์ต้องไม่เกิน 10 MB");
    setBusy(true);
    setError("");
    try {
      const { url } = await api.adminUploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };
  return (
    <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      {value && (
        <a href={value} target="_blank" rel="noopener noreferrer">
          ดูไฟล์ปัจจุบัน
        </a>
      )}
      <label className="btn" style={{ cursor: busy ? "wait" : "pointer" }}>
        {busy ? "กำลังอัปโหลด…" : value ? "เปลี่ยนไฟล์ PDF" : "อัปโหลด PDF"}
        <input type="file" accept="application/pdf" hidden onChange={pick} disabled={busy} />
      </label>
      {error && <span className="contact-form__status contact-form__status--error">{error}</span>}
    </span>
  );
}

function emptyForm() {
  const form = { hero_bg_image: "" };
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

  const listValue = (f) => parseList(form[f]);
  const setList = (f, list) => updatePlain(f, JSON.stringify(list));
  const updateListItem = (f, i, patch) => setList(f, listValue(f).map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeListItem = (f, i) => setList(f, listValue(f).filter((_, idx) => idx !== i));
  const imageField = (f) => (
    <ImageUploadField
      accept="image/jpeg,image/png,image/webp"
      maxSizeMB={10}
      value={form[f] || ""}
      onChange={(url) => updatePlain(f, url)}
    />
  );

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
        🔔 กำลังแก้ไขข้อความหน้าติดต่อเราในเวอร์ชัน{" "}
        <strong>{lang === "th" ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> — เลือกภาษาจากเมนูด้านข้างเพื่อแก้อีกภาษา
        เบอร์โทรและอีเมลใช้ร่วมกันทั้งสองภาษา
      </div>

      <AdminEditLayout sidebar={<AdminLanguageSelect value={lang} onChange={setLang} />}>
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
            <label className="contact-form__field" style={{ marginTop: 20 }}>
              <span>Hero background image (Contacts page only — optional)</span>
              <ImageUploadField
                accept="image/*,video/mp4"
                maxSizeMB={10}
                value={form.hero_bg_image}
                onChange={(url) => {
                  setSuccess(false);
                  setForm((f) => ({ ...f, hero_bg_image: url }));
                }}
              />
            </label>
          </div>

          <div className="admin-form__section panel">
            <h3>ช่องทางติดต่อ</h3>
            <label className="contact-form__field">
              <span>หัวข้อ</span>
              <input value={value("info_title")} onChange={(e) => update("info_title", e.target.value)} />
            </label>
            <p className="admin-form__hint" style={{ marginTop: 20 }}>
              เบอร์โทรและอีเมลในรายการนี้ใช้ของสำนักงานใหญ่ด้านล่าง — ช่อง LINE และเวลาทำการจะแสดงบนหน้าเว็บเมื่อกรอกข้อมูลเท่านั้น
            </p>
            <div className="admin-form__row" style={{ marginTop: 20 }}>
              <label className="contact-form__field">
                <span>LINE ID (เว้นว่าง = @trisak พร้อม QR ที่ติดมากับเว็บ)</span>
                <input value={plainValue("line_id")} onChange={(e) => updatePlain("line_id", e.target.value)} />
              </label>
              <label className="contact-form__field">
                <span>ลิงก์ LINE (ไม่บังคับ)</span>
                <input
                  value={plainValue("line_url")}
                  placeholder="https://lin.ee/…"
                  onChange={(e) => updatePlain("line_url", e.target.value)}
                />
              </label>
            </div>
            <label className="contact-form__field" style={{ marginTop: 20 }}>
              <span>เวลาทำการ (ขึ้นบรรทัดใหม่ได้)</span>
              <textarea
                rows={2}
                value={value("office_hours")}
                placeholder="จ.–ศ. 08:30–17:30"
                onChange={(e) => update("office_hours", e.target.value)}
              />
            </label>
            <label className="contact-form__field" style={{ marginTop: 20 }}>
              <span>QR code LINE (ไม่บังคับ)</span>
              {imageField("line_qr_image")}
            </label>
            <div className="admin-form__row" style={{ marginTop: 20 }}>
              <label className="contact-form__field">
                <span>เบอร์ฝ่ายซัพพอร์ตเทคนิค</span>
                <input value={plainValue("support_phone")} onChange={(e) => updatePlain("support_phone", e.target.value)} />
              </label>
              <label className="contact-form__field">
                <span>อีเมลฝ่ายซัพพอร์ตเทคนิค</span>
                <input value={plainValue("support_email")} onChange={(e) => updatePlain("support_email", e.target.value)} />
              </label>
            </div>
            <div className="admin-form__row" style={{ marginTop: 20 }}>
              <label className="contact-form__field">
                <span>เบอร์ฝ่ายบัญชี</span>
                <input
                  value={plainValue("accounting_phone")}
                  onChange={(e) => updatePlain("accounting_phone", e.target.value)}
                />
              </label>
              <label className="contact-form__field">
                <span>อีเมลฝ่ายบัญชี</span>
                <input
                  value={plainValue("accounting_email")}
                  onChange={(e) => updatePlain("accounting_email", e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="admin-form__section panel">
            <h3>สำหรับฝ่ายจัดซื้อ (ข้อมูลนิติบุคคล / เอกสารลงทะเบียนผู้ขาย)</h3>
            <p className="admin-form__hint">
              ส่วนนี้จะแสดงบนหน้าเว็บเมื่อกรอกชื่อนิติบุคคล เลขผู้เสียภาษี หรือเพิ่มเอกสารที่มีไฟล์อย่างน้อยหนึ่งรายการ
            </p>
            <div className="admin-form__row" style={{ marginTop: 20 }}>
              <label className="contact-form__field">
                <span>ชื่อนิติบุคคลที่จดทะเบียน</span>
                <input value={value("company_name")} onChange={(e) => update("company_name", e.target.value)} />
              </label>
              <label className="contact-form__field">
                <span>เลขประจำตัวผู้เสียภาษี</span>
                <input value={plainValue("tax_id")} onChange={(e) => updatePlain("tax_id", e.target.value)} />
              </label>
            </div>
            <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
              {listValue("vendor_docs").map((doc, i) => (
                <div className="admin-form__list-row" key={i} style={{ flexWrap: "wrap" }}>
                  <input
                    placeholder="ชื่อเอกสาร เช่น หนังสือรับรองบริษัท"
                    value={doc[`label_${lang}`] || ""}
                    onChange={(e) => updateListItem("vendor_docs", i, { [`label_${lang}`]: e.target.value })}
                  />
                  <PdfUploadButton value={doc.url} onChange={(url) => updateListItem("vendor_docs", i, { url })} />
                  <button type="button" className="btn" onClick={() => removeListItem("vendor_docs", i)}>
                    ลบ
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn"
                style={{ justifySelf: "start" }}
                onClick={() => setList("vendor_docs", [...listValue("vendor_docs"), { label_en: "", label_th: "", url: "" }])}
              >
                + เพิ่มเอกสาร
              </button>
            </div>
          </div>

          <div className="admin-form__section panel">
            <h3>คำถามที่พบบ่อย (FAQ)</h3>
            <p className="admin-form__hint">แสดงท้ายหน้าเมื่อมีอย่างน้อยหนึ่งข้อ — คำถาม/คำตอบแยกตามภาษาที่เลือกอยู่</p>
            <div style={{ marginTop: 20, display: "grid", gap: 20 }}>
              {listValue("faq").map((item, i) => (
                <div key={i} style={{ display: "grid", gap: 10 }}>
                  <label className="contact-form__field">
                    <span>คำถามข้อ {i + 1}</span>
                    <input
                      value={item[`q_${lang}`] || ""}
                      onChange={(e) => updateListItem("faq", i, { [`q_${lang}`]: e.target.value })}
                    />
                  </label>
                  <label className="contact-form__field">
                    <span>คำตอบ</span>
                    <textarea
                      rows={3}
                      value={item[`a_${lang}`] || ""}
                      onChange={(e) => updateListItem("faq", i, { [`a_${lang}`]: e.target.value })}
                    />
                  </label>
                  <button type="button" className="btn" style={{ justifySelf: "start" }} onClick={() => removeListItem("faq", i)}>
                    ลบคำถามนี้
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn"
                style={{ justifySelf: "start" }}
                onClick={() => setList("faq", [...listValue("faq"), { q_en: "", q_th: "", a_en: "", a_th: "" }])}
              >
                + เพิ่มคำถาม
              </button>
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
            <label className="contact-form__field" style={{ marginTop: 20 }}>
              <span>รูปอาคาร (ไม่บังคับ — แสดงคู่กับแผนที่)</span>
              {imageField("head_office_photo")}
            </label>
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
            <label className="contact-form__field" style={{ marginTop: 20 }}>
              <span>รูปอาคาร (ไม่บังคับ — แสดงคู่กับแผนที่)</span>
              {imageField("warehouse_photo")}
            </label>
          </div>

          <div className="admin-form__section panel">
            <h3>หัวข้อส่วนแผนที่</h3>
            <label className="contact-form__field">
              <span>หัวข้อ</span>
              <input value={value("map_title")} onChange={(e) => update("map_title", e.target.value)} />
            </label>
            <p className="admin-form__hint" style={{ marginTop: 20 }}>
              ตำแหน่งบนแผนที่: วางโค้ด/ลิงก์จาก Google Maps → แชร์ → <b>ฝังแผนที่ (Embed a map)</b>,
              หรือพิกัด "13.7563,100.5018", หรือชื่อสถานที่/ที่อยู่ — เว้นว่างไว้จะใช้ที่อยู่ด้านบน
            </p>
            {[
              ["head_office", "สำนักงานใหญ่"],
              ["warehouse", "คลังสินค้า"],
            ].map(([key, label]) => (
              <div className="admin-form__row" style={{ marginTop: 20 }} key={key}>
                <label className="contact-form__field">
                  <span>แผนที่{label} (Embed / พิกัด / ที่อยู่)</span>
                  <textarea
                    rows={2}
                    value={plainValue(`${key}_map`)}
                    onChange={(e) => updatePlain(`${key}_map`, e.target.value)}
                  />
                </label>
                <label className="contact-form__field">
                  <span>ลิงก์ "เปิดใน Google Maps" ({label})</span>
                  <input
                    value={plainValue(`${key}_map_link`)}
                    placeholder="https://maps.app.goo.gl/…"
                    onChange={(e) => updatePlain(`${key}_map_link`, e.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="admin-form__submit-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        </div>
      </AdminEditLayout>
    </form>
  );
}
