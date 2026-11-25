import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";
import HeroBgMedia from "../../components/HeroBgMedia.jsx";
import SectionLabel from "../../components/SectionLabel.jsx";
import ContactIcon from "../../components/contactIcons.jsx";
import { Icon } from "../../components/WhyTrisak.jsx";
import IconPicker from "../../components/IconPicker.jsx";
import { translations } from "../../i18n/translations.js";
import { builtInSolutionDetail } from "../../utils/solutionDetail.js";
import {
  InlineInput,
  ListEditor,
  ManagedNote,
  SOLUTION_ADMIN_PATH,
  notifySolutionsChanged,
  rowToBlockForm,
  toPayload,
} from "./AdminAutomationSolution.jsx";

/**
 * Admin > Automation Solution > (one solution) — laid out like that
 * solution's public page (pages/SolutionPage.jsx, /automation-solution/:slug)
 * and edited in place: name, tagline, background, services and benefits.
 * The page content is stored in solutions.detail; a solution without it
 * starts from the built-in text, counted as saved.
 */

const emptyDetail = () => ({ image: "", tagline_en: "", tagline_th: "", services: [], benefits: [] });
const emptyService = () => ({ icon: "check", title_en: "", title_th: "", items_en: [], items_th: [] });
const emptyBenefit = () => ({ icon: "check", text_en: "", text_th: "", desc_en: "", desc_th: "" });

/** ↑ ↓ × for one service / benefit. */
function RowTools({ index, count, label, onMove, onRemove }) {
  return (
    <span className="sol-admin__row-tools">
      <button type="button" className="contact-admin__remove" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`เลื่อน${label}ขึ้น`} title="เลื่อนขึ้น">
        ↑
      </button>
      <button type="button" className="contact-admin__remove" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`เลื่อน${label}ลง`} title="เลื่อนลง">
        ↓
      </button>
      <button type="button" className="contact-admin__remove" onClick={onRemove} aria-label={`ลบ${label}`} title="ลบ">
        ×
      </button>
    </span>
  );
}

export default function AdminSolutionPage() {
  const { id } = useParams();
  const [lang, setLang] = useState("th");
  const [rows, setRows] = useState([]); // every solution, for the tab row
  const [slug, setSlug] = useState("");
  const [form, setForm] = useState(null);
  const [savedForm, setSavedForm] = useState("");
  const [detail, setDetail] = useState(emptyDetail);
  const [savedDetail, setSavedDetail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pickerFor, setPickerFor] = useState(null); // "service-2" / "benefit-0" whose icon picker is open

  useEffect(() => {
    let alive = true; // the sidebar can switch solution before the last load finishes
    setLoading(true);
    setError("");
    setPickerFor(null);
    api
      .adminGetSolutions()
      .then((list) => {
        if (!alive) return;
        setRows(list || []);
        const row = (list || []).find((r) => String(r.id) === id);
        if (!row) return setForm(null);
        const f = rowToBlockForm(row);
        setForm(f);
        setSavedForm(JSON.stringify(f));
        setSlug(row.slug);
        // built-in text (or an empty page) counts as saved: it is what the site already shows
        const d = { ...emptyDetail(), ...(row.detail || builtInSolutionDetail(row.slug) || {}) };
        setDetail(d);
        setSavedDetail(JSON.stringify(d));
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const t = translations[lang]?.automationSolution || translations.en.automationSolution;
  const th = lang === "th";
  const other = th ? "en" : "th";

  if (loading) return <p className="empty-state">กำลังโหลด…</p>;
  if (!form) {
    return (
      <div className="sol-admin">
        <AdminBreadcrumb items={[{ label: "โซลูชันระบบอัตโนมัติ (Automation Solution)", to: SOLUTION_ADMIN_PATH }, { label: "ไม่พบ Solution" }]} />
        {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
        <p className="empty-state">
          ไม่พบ Solution นี้ — อาจถูกลบไปแล้ว <Link to={SOLUTION_ADMIN_PATH}>กลับไปหน้ารวม</Link>
        </p>
      </div>
    );
  }

  const formDirty = JSON.stringify(form) !== savedForm;
  const detailDirty = JSON.stringify(detail) !== savedDetail;
  const hasChanges = formDirty || detailDirty;
  const displayName = (th && form.nameTh) || form.name || form.nameTh;

  // ── edits ──
  const setD = (patch) => {
    setSuccess(false);
    setDetail((d) => ({ ...d, ...patch }));
  };
  const editRow = (key, i, patch) => setD({ [key]: detail[key].map((x, idx) => (idx === i ? { ...x, ...patch } : x)) });
  const moveRow = (key, i, dir) => {
    const next = [...detail[key]];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setD({ [key]: next });
  };
  const removeRow = (key, i) => setD({ [key]: detail[key].filter((_, idx) => idx !== i) });
  // `${field}_${lang}` with the other language as the faded placeholder
  const bind = (obj, field, label, onPatch) => ({
    value: obj[`${field}_${lang}`] || "",
    placeholder: obj[`${field}_${other}`] || label,
    "aria-label": label,
    onChange: (e) => onPatch({ [`${field}_${lang}`]: e.target.value }),
  });

  const iconButton = (key, value, label, onPick, className = "") => (
    <span className="sol-admin__icon-slot">
      <button
        type="button"
        className={`sol-admin__icon-btn ${className}`}
        data-icon-trigger=""
        title="คลิกเพื่อเปลี่ยนไอคอน"
        aria-label={`เปลี่ยนไอคอน${label}`}
        aria-expanded={pickerFor === key}
        onClick={() => setPickerFor(pickerFor === key ? null : key)}
      >
        <Icon name={value || "check"} />
      </button>
      {pickerFor === key && <IconPicker value={value || "check"} align="start" onChange={onPick} onClose={() => setPickerFor(null)} />}
    </span>
  );

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("ยังไม่มีชื่อภาษาอังกฤษ (จำเป็น) — สลับเป็น English แล้วกรอกชื่อก่อนบันทึก");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      if (formDirty) {
        const row = await api.adminUpdateSolution(id, toPayload(form));
        const f = rowToBlockForm(row);
        setForm(f);
        setSavedForm(JSON.stringify(f));
      }
      if (detailDirty) {
        // the server trims and drops empty items: show what was stored
        const row = await api.adminUpdateSolutionDetail(id, detail);
        const d = { ...emptyDetail(), ...row.detail };
        setDetail(d);
        setSavedDetail(JSON.stringify(d));
      }
      notifySolutionsChanged();
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sol-admin">
      <AdminBreadcrumb
        items={[{ label: "โซลูชันระบบอัตโนมัติ (Automation Solution)", to: SOLUTION_ADMIN_PATH }, { label: displayName || "Solution" }]}
      />

      <div className="admin-edit-tabbar admin-edit-tabbar--actions-only">
        <div className="admin-edit-tabbar__actions home-admin__toolbar">
          <label className="career-admin__lang">
            <span>ภาษา</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="th">🇹🇭 ภาษาไทย</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </label>
          <a className="btn" href={`/automation-solution/${slug}`} target="_blank" rel="noopener noreferrer">
            ดูหน้าเว็บ ↗
          </a>
          <button type="button" className="btn btn-primary" disabled={saving || !hasChanges} onClick={handleSave}>
            💾 {saving ? "กำลังบันทึก…" : hasChanges ? "บันทึก" : "บันทึกแล้ว"}
          </button>
        </div>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
      {success && <SuccessModal onClose={() => setSuccess(false)} />}

      <div className="admin-edit-notice">
        🔔 กำลังแก้ไขเวอร์ชัน <strong>{th ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> — หน้าด้านล่างแสดงเหมือนหน้า{" "}
        <code>/automation-solution/{slug}</code> จริง คลิกที่ข้อความเพื่อพิมพ์แก้ได้ทันที ช่องที่เว้นว่างจะใช้ข้อความอีกภาษา (ตัวจาง)
        ภาพพื้นหลังและไอคอนใช้ร่วมกันทั้งสองภาษา — รูปภาพ ลิงก์ และลำดับของ Solution แก้ได้ที่{" "}
        <Link to={SOLUTION_ADMIN_PATH}>หน้ารวม</Link>
      </div>

      <div className="home-admin__page">
        {/* HERO */}
        <section className={`hero hero--compact hero--centered${detail.image ? " hero--has-bg" : ""}`}>
          {detail.image && (
            <>
              <HeroBgMedia src={detail.image} />
              <div className="hero__bg-scrim" aria-hidden="true" />
            </>
          )}
          <div className="hero__grid-overlay" aria-hidden="true" />
          <div className="container hero__content">
            <span className="hero__meta">{t.heroTitle}</span>
            <h1>
              <InlineInput
                value={th ? form.nameTh : form.name}
                placeholder={(th && form.name) || (th ? "ชื่อ Solution (ภาษาไทย)" : "Solution name (required)")}
                aria-label="ชื่อ Solution"
                onChange={(e) => {
                  setSuccess(false);
                  setForm((f) => ({ ...f, [th ? "nameTh" : "name"]: e.target.value }));
                }}
              />
            </h1>
            <p className="hero__sub">
              <InlineInput
                multiline
                rows={2}
                {...bind(detail, "tagline", (th ? form.summaryTh : form.summary) || form.summary || "คำโปรยใต้ชื่อ", setD)}
              />
            </p>
          </div>
        </section>
        {!th && !form.name.trim() && <p className="contact-admin__hint sol-admin__required">* จำเป็นต้องมีชื่อภาษาอังกฤษ</p>}
        <div className="panel home-admin__hero-bg">
          <span className="admin-edit-sidebar__label">ภาพหรือวิดีโอพื้นหลัง (ไม่บังคับ — ใช้ร่วมกันทั้งสองภาษา)</span>
          <ImageUploadField accept="image/*,video/mp4" maxSizeMB={10} value={detail.image} onChange={(url) => setD({ image: url })} />
        </div>

        {/* TABS — every solution; switches the editor like the public tabs switch the page */}
        <nav className="sol-nav sol-nav--static" aria-label="Solution ทั้งหมด">
          <div className="container sol-nav__inner">
            {rows.map((r) => (
              <Link
                key={r.id}
                to={`${SOLUTION_ADMIN_PATH}/${r.id}`}
                className={`sol-nav__chip${String(r.id) === id ? " is-active" : ""}`}
                aria-current={String(r.id) === id ? "page" : undefined}
              >
                {(th && r.name_th) || r.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* SERVICES */}
        <section className="section sol-scope">
          <div className="container sol-scope__grid">
            <aside className="sol-panel">
              <p className="sol-panel__title">{t.detailServices}</p>
              <ol className="sol-panel__list">
                {detail.services.map((svc, i) => (
                  <li key={i}>
                    <span className={`sol-panel__row${i === 0 ? " is-on" : ""}`}>
                      <span className="sol-panel__lamp" aria-hidden="true" />
                      {svc[`title_${lang}`] || svc[`title_${other}`] || "บริการใหม่"}
                    </span>
                  </li>
                ))}
              </ol>
              <span className="btn btn-primary sol-panel__cta sol-admin__fake-btn" title="ปุ่มนี้พาไปฟอร์มขอใบเสนอราคาโดยอัตโนมัติ">
                {t.discuss}
              </span>
            </aside>

            <div className="sol-scope__body">
              {detail.services.map((svc, i) => (
                <article className="sol-svc" key={i}>
                  <header className="sol-svc__head">
                    {iconButton(`service-${i}`, svc.icon, `บริการที่ ${i + 1}`, (icon) => editRow("services", i, { icon }), "sol-svc__icon")}
                    <h3>
                      <InlineInput {...bind(svc, "title", `ชื่อบริการที่ ${i + 1}`, (p) => editRow("services", i, p))} />
                    </h3>
                    <RowTools
                      index={i}
                      count={detail.services.length}
                      label="บริการ"
                      onMove={(dir) => moveRow("services", i, dir)}
                      onRemove={() => removeRow("services", i)}
                    />
                  </header>
                  <ListEditor
                    ulClassName="sol-svc__list sol-svc__list--2col"
                    items={svc[`items_${lang}`]}
                    fallback={th ? svc.items_en : []}
                    addLabel="เพิ่มรายการ"
                    renderBullet={() => (
                      <span className="sol-svc__tick" aria-hidden="true">
                        <ContactIcon name="check" size={14} />
                      </span>
                    )}
                    onChange={(list) => editRow("services", i, { [`items_${lang}`]: list })}
                  />
                </article>
              ))}
              {!detail.services.length && <p className="sol-admin__empty">ยังไม่มีบริการ — หน้าเว็บจะไม่แสดงส่วนนี้</p>}
              <button type="button" className="btn sol-admin__add" onClick={() => setD({ services: [...detail.services, emptyService()] })}>
                + เพิ่มบริการ
              </button>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="section sol-gains">
          <div className="container">
            <SectionLabel title={t.detailBenefits} />
            <ul className="sol-gains__list">
              {detail.benefits.map((b, i) => (
                <li key={i}>
                  {iconButton(`benefit-${i}`, b.icon, `ประโยชน์ที่ ${i + 1}`, (icon) => editRow("benefits", i, { icon }))}
                  <span className="sol-gains__text">
                    <InlineInput multiline rows={1} {...bind(b, "text", `ประโยชน์ที่ ${i + 1}`, (p) => editRow("benefits", i, p))} />
                    <small>
                      <InlineInput multiline rows={1} {...bind(b, "desc", "คำอธิบายเพิ่มเติม (ไม่บังคับ)", (p) => editRow("benefits", i, p))} />
                    </small>
                  </span>
                  <RowTools
                    index={i}
                    count={detail.benefits.length}
                    label="ประโยชน์"
                    onMove={(dir) => moveRow("benefits", i, dir)}
                    onRemove={() => removeRow("benefits", i)}
                  />
                </li>
              ))}
            </ul>
            <button type="button" className="btn sol-admin__add" onClick={() => setD({ benefits: [...detail.benefits, emptyBenefit()] })}>
              + เพิ่มประโยชน์
            </button>
          </div>
        </section>

        {/* CTA — preview only */}
        <ManagedNote>แถบปิดท้ายหน้า — แสดงตัวอย่างเท่านั้น</ManagedNote>
        <section className="cta-band history-cta" inert="">
          <div className="container cta-band__wrap">
            <h2>{t.ctaTitle}</h2>
            <p className="history-cta__sub">{t.ctaSub}</p>
            <div className="history-cta__actions">
              <span className="btn btn-primary">
                {t.discuss} <span className="btn-arrow">→</span>
              </span>
              <span className="btn">{t.heroTitle}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
