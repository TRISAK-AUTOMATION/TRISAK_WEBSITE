import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";
import HeroBgMedia from "../../components/HeroBgMedia.jsx";
import ContactForm from "../../components/ContactForm.jsx";
import ContactIcon from "../../components/contactIcons.jsx";
import { translations } from "../../i18n/translations.js";
import { DEFAULT_LINE_ID, DEFAULT_MAP_LINKS, defaultLineQr, toMapEmbedSrc } from "../Contacts.jsx";

/**
 * Admin > ติดต่อเรา — laid out like the public Contacts page
 * (pages/Contacts.jsx), the same way Admin > History and Admin > Home mirror
 * theirs. Every text is edited in place; empty fields fall back to the
 * built-in text (shown faded), and blocks that are empty stay hidden on the
 * public page. The quote form and the brand logos are preview only.
 */

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

const AUTHORIZED_BRANDS = ["omron", "yaskawa", "nitto"];

// vendor_docs / faq are stored as JSON text.
function parseList(text) {
  try {
    const v = JSON.parse(text || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
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

/** Text box that takes the look of the element it sits in (font, colour, size). */
function InlineInput({ multiline = false, rows = 2, ...props }) {
  return multiline ? (
    <textarea className="home-admin__input" rows={rows} {...props} />
  ) : (
    <input className="home-admin__input" {...props} />
  );
}

/** Bar above a part of the page that is preview only or edited elsewhere. */
function ManagedNote({ children }) {
  return <div className="home-admin__managed-note contact-admin__note">🔒 {children}</div>;
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
    <span className="contact-admin__pdf">
      {value && (
        <a href={value} target="_blank" rel="noopener noreferrer">
          ดูไฟล์
        </a>
      )}
      <label className="btn contact-admin__small-btn" style={{ cursor: busy ? "wait" : "pointer" }}>
        {busy ? "กำลังอัปโหลด…" : value ? "เปลี่ยน PDF" : "อัปโหลด PDF"}
        <input type="file" accept="application/pdf" hidden onChange={pick} disabled={busy} />
      </label>
      {error && <span className="contact-form__status contact-form__status--error">{error}</span>}
    </span>
  );
}

/** A channel row with its value(s) edited in place. */
function EditRow({ icon, label, children, hint }) {
  return (
    <li>
      <div className="contact-channel contact-admin__channel">
        <span className="contact-channel__icon">
          <ContactIcon name={icon} />
        </span>
        <span className="contact-channel__text">
          <span className="contact-channel__label">{label}</span>
          <span className="contact-channel__value contact-admin__values">{children}</span>
          {hint && <span className="contact-admin__hint">{hint}</span>}
        </span>
      </div>
    </li>
  );
}

export default function AdminContactsPageEditor() {
  const [form, setForm] = useState(emptyForm);
  const [savedForm, setSavedForm] = useState(null);
  const [lang, setLang] = useState("th");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    api
      .adminGetContactsPageContent()
      .then((d) => {
        const next = { ...emptyForm(), ...(d || {}) };
        setForm(next);
        setSavedForm(next);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    api
      .getBrands()
      .then((rows) => setBrands(Array.isArray(rows) ? rows : []))
      .catch(() => setBrands([]));
  }, []);

  const t = translations[lang]?.contacts || translations.en.contacts;

  const value = (base) => form[`${base}_${lang}`] || "";
  const update = (base, val) => {
    setSuccess(false);
    setForm((f) => ({ ...f, [`${base}_${lang}`]: val }));
  };
  const bind = (base, placeholder, label) => ({
    value: value(base),
    placeholder,
    "aria-label": label,
    onChange: (e) => update(base, e.target.value),
  });
  const plainValue = (f) => form[f] || "";
  const updatePlain = (f, val) => {
    setSuccess(false);
    setForm((s) => ({ ...s, [f]: val }));
  };
  const bindPlain = (f, placeholder, label) => ({
    value: plainValue(f),
    placeholder,
    "aria-label": label,
    onChange: (e) => updatePlain(f, e.target.value),
  });

  const listValue = (f) => parseList(form[f]);
  const setList = (f, list) => updatePlain(f, JSON.stringify(list));
  const updateListItem = (f, i, patch) => setList(f, listValue(f).map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeListItem = (f, i) => setList(f, listValue(f).filter((_, idx) => idx !== i));

  const hasChanges = savedForm && JSON.stringify(form) !== JSON.stringify(savedForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await api.adminUpdateContactsPageContent(form);
      const next = { ...form, ...updated };
      setForm(next);
      setSavedForm(next);
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

  const lineId = plainValue("line_id") || DEFAULT_LINE_ID;
  const lineQr = plainValue("line_qr_image") || (lineId === DEFAULT_LINE_ID ? defaultLineQr : "");
  const authorized = brands.filter((b) =>
    AUTHORIZED_BRANDS.some((k) => (b.slug || "").toLowerCase().includes(k) || (b.name || "").toLowerCase().includes(k))
  );
  const docs = listValue("vendor_docs");
  const faq = listValue("faq");
  const locations = [
    { key: "head_office", label: t.headOffice, address: t.headOfficeAddress },
    { key: "warehouse", label: t.warehouse, address: t.warehouseAddress },
  ];

  return (
    // a <div>, not a <form>: the quote-form preview below is itself a <form>
    <div className="contact-admin">
      <AdminBreadcrumb items={[{ label: "ติดต่อเรา" }]} />

      <div className="admin-edit-tabbar admin-edit-tabbar--actions-only">
        <div className="admin-edit-tabbar__actions home-admin__toolbar">
          <label className="career-admin__lang">
            <span>ภาษา</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="th">🇹🇭 ภาษาไทย</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </label>
          <a className="btn" href="/contacts" target="_blank" rel="noopener noreferrer">
            ดูหน้าเว็บ ↗
          </a>
          <button type="button" className="btn btn-primary" disabled={saving || !hasChanges} onClick={handleSubmit}>
            💾 {saving ? "กำลังบันทึก…" : hasChanges ? "บันทึก" : "บันทึกแล้ว"}
          </button>
        </div>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
      {success && <SuccessModal onClose={() => setSuccess(false)} />}

      <div className="admin-edit-notice">
        🔔 กำลังแก้ไขเวอร์ชัน <strong>{lang === "th" ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> — หน้าด้านล่างแสดงเหมือนหน้าติดต่อเราจริง
        คลิกที่ข้อความเพื่อพิมพ์แก้ได้ทันที ช่องที่เว้นว่างจะใช้ข้อความเริ่มต้น (ตัวจาง) และส่วนที่ว่างจะไม่แสดงบนหน้าเว็บ
        เบอร์โทร อีเมล LINE เลขผู้เสียภาษี รูป และไฟล์ ใช้ร่วมกันทั้งสองภาษา
      </div>

      <div className="home-admin__page">
        {/* HERO */}
        <section className={`hero hero--compact hero--centered${form.hero_bg_image ? " hero--has-bg" : ""}`}>
          {form.hero_bg_image && (
            <>
              <HeroBgMedia src={form.hero_bg_image} />
              <div className="hero__bg-scrim" aria-hidden="true" />
            </>
          )}
          <div className="hero__grid-overlay" aria-hidden="true" />
          <div className="container hero__content">
            <span className="hero__meta">
              <InlineInput {...bind("hero_meta", t.heroMeta, "ข้อความเล็กเหนือหัวข้อ")} />
            </span>
            <h1>
              <InlineInput {...bind("hero_title", t.heroTitle, "หัวข้อหลัก")} />
            </h1>
            <p className="hero__sub">
              <InlineInput multiline rows={2} {...bind("hero_sub", t.heroSub, "คำอธิบายใต้หัวข้อ")} />
            </p>
          </div>
        </section>
        <div className="panel home-admin__hero-bg">
          <span className="admin-edit-sidebar__label">ภาพหรือวิดีโอพื้นหลัง Hero (ไม่บังคับ — ใช้ร่วมกันทั้งสองภาษา)</span>
          <ImageUploadField
            accept="image/*,video/mp4"
            maxSizeMB={10}
            value={form.hero_bg_image || ""}
            onChange={(url) => updatePlain("hero_bg_image", url)}
          />
        </div>

        {/* CHANNELS + QUOTE FORM */}
        <section className="contact-main">
          <div className="container contact-main__grid">
            <div className="contact-channels">
              <h2 className="contact-main__title">
                <InlineInput {...bind("info_title", t.infoTitle, "หัวข้อช่องทางติดต่อ")} />
              </h2>
              <p className="contact-main__lede">{t.infoLede}</p>

              <ul className="contact-channels__list">
                <EditRow icon="phone" label={t.phoneLabel} hint="เบอร์สำนักงานใหญ่ — ใช้กับปุ่มโทรใน Hero ด้วย">
                  <InlineInput {...bindPlain("head_office_phone", "เช่น 02-274-0081", "เบอร์ฝ่ายขาย")} />
                </EditRow>
                <EditRow icon="support" label={t.supportLabel} hint="ว่างทั้งสองช่อง = ไม่แสดงแถวนี้">
                  <InlineInput {...bindPlain("support_phone", "เบอร์ฝ่ายซัพพอร์ต", "เบอร์ฝ่ายซัพพอร์ต")} />
                  <InlineInput {...bindPlain("support_email", "อีเมลฝ่ายซัพพอร์ต", "อีเมลฝ่ายซัพพอร์ต")} />
                </EditRow>
                <EditRow icon="receipt" label={t.accountingLabel} hint="ว่างทั้งสองช่อง = ไม่แสดงแถวนี้">
                  <InlineInput {...bindPlain("accounting_phone", "เบอร์ฝ่ายบัญชี", "เบอร์ฝ่ายบัญชี")} />
                  <InlineInput {...bindPlain("accounting_email", "อีเมลฝ่ายบัญชี", "อีเมลฝ่ายบัญชี")} />
                </EditRow>
                <EditRow icon="mail" label={t.emailLabel}>
                  <InlineInput {...bindPlain("head_office_email", "เช่น contact@trisak.co.th", "อีเมลหลัก")} />
                </EditRow>
                <EditRow icon="chat" label="LINE" hint="เว้นว่าง = @trisak พร้อม QR ที่ติดมากับเว็บ">
                  <InlineInput {...bindPlain("line_id", DEFAULT_LINE_ID, "LINE ID")} />
                  <InlineInput {...bindPlain("line_url", "ลิงก์ LINE (ไม่บังคับ) เช่น https://lin.ee/…", "ลิงก์ LINE")} />
                </EditRow>
                <EditRow icon="clock" label={t.hoursLabel} hint="ว่าง = ไม่แสดงแถวนี้ · ขึ้นบรรทัดใหม่ได้">
                  <InlineInput multiline rows={2} {...bind("office_hours", "เช่น จ.–ศ. 08:30–17:30", "เวลาทำการ")} />
                </EditRow>
              </ul>

              <div className="contact-qr contact-admin__qr">
                {lineQr ? (
                  <img src={lineQr} alt="" width="96" height="96" />
                ) : (
                  <span className="contact-admin__qr-empty">ไม่มี QR</span>
                )}
                <span className="contact-qr__text">
                  <strong>{t.qrTitle}</strong>
                  <span className="contact-admin__hint">
                    {plainValue("line_qr_image") ? "ใช้ QR ที่อัปโหลด" : lineQr ? "ใช้ QR เริ่มต้นของ @trisak" : "อัปโหลด QR ของ LINE ID นี้เพื่อแสดงการ์ด"}
                  </span>
                </span>
              </div>
              <div className="panel contact-admin__upload">
                <span className="admin-edit-sidebar__label">QR code LINE (ไม่บังคับ)</span>
                <ImageUploadField
                  accept="image/jpeg,image/png,image/webp"
                  maxSizeMB={5}
                  value={plainValue("line_qr_image")}
                  onChange={(url) => updatePlain("line_qr_image", url)}
                />
              </div>

              {authorized.length > 0 && (
                <div className="contact-trust">
                  <p className="contact-trust__head">
                    <ContactIcon name="badge" size={18} />
                    {t.authorizedTitle}
                  </p>
                  <ul className="contact-trust__logos">
                    {authorized.map((b) => (
                      <li key={b.slug || b.name}>
                        {b.logo_url ? <img src={b.logo_url} alt={b.name} /> : <span>{b.name}</span>}
                      </li>
                    ))}
                  </ul>
                  <p className="contact-trust__sub">{t.authorizedSub}</p>
                </div>
              )}
              <ManagedNote>โลโก้ตัวแทนจำหน่ายดึงจากเมนู แบรนด์ (Brands)</ManagedNote>
            </div>

            <div>
              <ManagedNote>ฟอร์มขอใบเสนอราคาเป็นส่วนคงที่ — แสดงเพื่อดูหน้าตาเท่านั้น (ส่งข้อความจากที่นี่ไม่ได้)</ManagedNote>
              <div className="contact-form-card contact-admin__preview" inert="">
                <h2 className="contact-form-card__title">{t.formTitle}</h2>
                <p className="contact-form-card__sub">{t.formSub}</p>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* PROCUREMENT */}
        <section className="section contact-procure">
          <div className="container contact-procure__grid">
            <div>
              <h2 className="contact-procure__title">{t.procureTitle}</h2>
              <p className="contact-procure__lede">{t.procureSub}</p>
              <p className="contact-admin__hint contact-admin__hint--block">
                ส่วนนี้จะแสดงบนหน้าเว็บเมื่อมีชื่อนิติบุคคล เลขผู้เสียภาษี หรือเอกสารที่อัปโหลดไฟล์แล้วอย่างน้อยหนึ่งรายการ
              </p>
            </div>
            <div className="contact-procure__body">
              <dl className="contact-procure__facts">
                <div>
                  <dt>{t.companyNameLabel}</dt>
                  <dd>
                    <InlineInput {...bind("company_name", "ชื่อนิติบุคคลที่จดทะเบียน", "ชื่อนิติบุคคล")} />
                  </dd>
                </div>
                <div>
                  <dt>{t.taxIdLabel}</dt>
                  <dd>
                    <InlineInput {...bindPlain("tax_id", "เลข 13 หลัก", "เลขประจำตัวผู้เสียภาษี")} />
                  </dd>
                </div>
              </dl>
              <ul className="contact-procure__docs">
                {docs.map((doc, i) => (
                  <li key={i}>
                    <div className="contact-admin__doc">
                      <span className="contact-procure__doc-icon">
                        <ContactIcon name="doc" />
                      </span>
                      <span className="contact-procure__doc-name">
                        <InlineInput
                          value={doc[`label_${lang}`] || ""}
                          placeholder="ชื่อเอกสาร เช่น หนังสือรับรองบริษัท"
                          aria-label="ชื่อเอกสาร"
                          onChange={(e) => updateListItem("vendor_docs", i, { [`label_${lang}`]: e.target.value })}
                        />
                      </span>
                      <PdfUploadButton value={doc.url} onChange={(url) => updateListItem("vendor_docs", i, { url })} />
                      <button
                        type="button"
                        className="contact-admin__remove"
                        onClick={() => removeListItem("vendor_docs", i)}
                        aria-label="ลบเอกสารนี้"
                        title="ลบ"
                      >
                        <ContactIcon name="x" size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn contact-admin__add"
                onClick={() => setList("vendor_docs", [...docs, { label_en: "", label_th: "", url: "" }])}
              >
                + เพิ่มเอกสาร
              </button>
            </div>
          </div>
        </section>

        {/* LOCATIONS */}
        <section className="section contact-locations">
          <div className="container">
            <h2 className="contact-locations__title">
              <InlineInput {...bind("map_title", t.mapTitle, "หัวข้อส่วนที่ตั้ง")} />
            </h2>
            <div className="contact-locations__grid">
              {locations.map((loc) => {
                const photo = plainValue(`${loc.key}_photo`);
                const address = value(`${loc.key}_address`) || loc.address;
                const src = toMapEmbedSrc(plainValue(`${loc.key}_map`) || address, lang);
                return (
                  <article className="location-card" key={loc.key}>
                    <div className="location-card__media">
                      {photo ? (
                        <img src={photo} alt="" />
                      ) : (
                        src && <iframe src={src} title={loc.label} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                      )}
                    </div>
                    <div className="contact-admin__media-tools">
                      <label className="contact-form__field">
                        <span>ตำแหน่งบนแผนที่ (โค้ด Embed / ลิงก์ Google Maps / พิกัด / ชื่อสถานที่ — ว่าง = ใช้ที่อยู่)</span>
                        <textarea
                          rows={2}
                          value={plainValue(`${loc.key}_map`)}
                          onChange={(e) => updatePlain(`${loc.key}_map`, e.target.value)}
                        />
                      </label>
                      <span className="admin-edit-sidebar__label">รูปอาคาร (ไม่บังคับ — มีรูปแล้วหน้าเว็บจะให้สลับ รูป / แผนที่)</span>
                      <ImageUploadField
                        accept="image/jpeg,image/png,image/webp"
                        maxSizeMB={10}
                        value={photo}
                        onChange={(url) => updatePlain(`${loc.key}_photo`, url)}
                      />
                    </div>
                    <div className="location-card__body">
                      <h3 className="location-card__name">
                        <InlineInput {...bind(`${loc.key}_label`, loc.label, "ชื่อสถานที่")} />
                      </h3>
                      <address className="location-card__address">
                        <InlineInput multiline rows={2} {...bind(`${loc.key}_address`, loc.address, "ที่อยู่")} />
                      </address>
                      <div className="location-card__links contact-admin__loc-links">
                        <span>
                          <ContactIcon name="phone" size={16} />
                          <InlineInput {...bindPlain(`${loc.key}_phone`, "เบอร์โทร", "เบอร์โทร")} />
                        </span>
                        <span>
                          <ContactIcon name="mail" size={16} />
                          <InlineInput {...bindPlain(`${loc.key}_email`, "อีเมล", "อีเมล")} />
                        </span>
                      </div>
                      <div className="location-card__directions contact-admin__directions">
                        {t.openInMaps}
                        <ContactIcon name="external" size={16} />
                        <InlineInput
                          {...bindPlain(`${loc.key}_map_link`, DEFAULT_MAP_LINKS[loc.key], "ลิงก์ปุ่มดูเส้นทาง")}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section contact-faq">
          <div className="container contact-faq__grid">
            <div>
              <h2 className="contact-faq__title">{t.faqTitle}</h2>
              <p className="contact-admin__hint contact-admin__hint--block">
                แสดงบนหน้าเว็บเมื่อมีอย่างน้อยหนึ่งข้อที่มีทั้งคำถามและคำตอบ (แยกตามภาษาที่เลือกอยู่)
              </p>
            </div>
            <div>
              <div className="contact-faq__list">
                {faq.map((item, i) => (
                  <div className="contact-faq__item contact-admin__faq" key={i}>
                    <div className="contact-admin__faq-q">
                      <InlineInput
                        value={item[`q_${lang}`] || ""}
                        placeholder={`คำถามข้อ ${i + 1}`}
                        aria-label={`คำถามข้อ ${i + 1}`}
                        onChange={(e) => updateListItem("faq", i, { [`q_${lang}`]: e.target.value })}
                      />
                      <button
                        type="button"
                        className="contact-admin__remove"
                        onClick={() => removeListItem("faq", i)}
                        aria-label={`ลบคำถามข้อ ${i + 1}`}
                        title="ลบ"
                      >
                        <ContactIcon name="x" size={18} />
                      </button>
                    </div>
                    <p>
                      <InlineInput
                        multiline
                        rows={3}
                        value={item[`a_${lang}`] || ""}
                        placeholder="คำตอบ"
                        aria-label={`คำตอบข้อ ${i + 1}`}
                        onChange={(e) => updateListItem("faq", i, { [`a_${lang}`]: e.target.value })}
                      />
                    </p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn contact-admin__add"
                onClick={() => setList("faq", [...faq, { q_en: "", q_th: "", a_en: "", a_th: "" }])}
              >
                + เพิ่มคำถาม
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="admin-form__submit-row">
        <button type="button" className="btn btn-primary" disabled={saving || !hasChanges} onClick={handleSubmit}>
          {saving ? "กำลังบันทึก…" : hasChanges ? "บันทึก" : "บันทึกแล้ว"}
        </button>
      </div>
    </div>
  );
}
