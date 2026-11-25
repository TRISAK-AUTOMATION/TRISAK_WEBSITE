import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import { ConfirmModal } from "../../components/AdminModal.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import ImagePositionField from "../../components/ImagePositionField.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";
import HeroBgMedia from "../../components/HeroBgMedia.jsx";
import SectionLabel from "../../components/SectionLabel.jsx";
import ContactIcon from "../../components/contactIcons.jsx";
import IndustriesSlider from "../../components/IndustriesSlider.jsx";
import { Icon as StepIcon } from "../../components/WhyTrisak.jsx";
import IconPicker from "../../components/IconPicker.jsx";
import { translations } from "../../i18n/translations.js";
import { STEP_ICONS, parseProcessSteps } from "../AutomationSolution.jsx";

/**
 * Admin > Automation Solution — laid out like the public page
 * (pages/AutomationSolution.jsx), the same way Admin > Contact / History /
 * Home mirror theirs. Hero text and every Solution Block are edited in
 * place; one Save button stores the hero and every changed block.
 * Each solution's own page (/automation-solution/:slug) is edited in
 * AdminSolutionPage (/admin/automation-solution/:id).
 * The engineering process, industries and closing CTA are preview only.
 */

const HERO_SUFFIXES = ["hero_meta", "hero_title", "hero_sub", "process_title", "process_lede"];
const MAX_STEPS = 8;
const MIN_STEPS = 2;

// The built-in steps (both languages), used to start editing when the
// page has never had its own steps saved.
function builtInSteps() {
  const en = translations.en.automationSolution.process;
  const thSteps = translations.th.automationSolution.process;
  return en.map((step, i) => ({
    icon: STEP_ICONS[i] || "check",
    label_en: step.label,
    label_th: thSteps[i]?.label || "",
    desc_en: step.desc,
    desc_th: thSteps[i]?.desc || "",
  }));
}

function emptyHeroForm() {
  const form = { hero_bg_image: "", process_steps: "" };
  for (const base of HERO_SUFFIXES) {
    form[`${base}_en`] = "";
    form[`${base}_th`] = "";
  }
  return form;
}

function emptyBlockForm() {
  return {
    name: "", nameTh: "", summary: "", summaryTh: "",
    services: [], servicesTh: [], benefits: [], benefitsTh: [],
    imageUrl: "", imagePositionX: 50, imagePositionY: 50,
    relatedUrl: "", relatedLabel: "", relatedLabelTh: "", brochureUrl: "",
  };
}

export function rowToBlockForm(row) {
  return {
    name: row.name || "", nameTh: row.name_th || "", summary: row.summary || "", summaryTh: row.summary_th || "",
    services: row.services || [], servicesTh: row.services_th || [],
    benefits: row.benefits || [], benefitsTh: row.benefits_th || [],
    imageUrl: row.image_url || "", imagePositionX: row.image_position_x ?? 50, imagePositionY: row.image_position_y ?? 50,
    relatedUrl: row.related_url || "", relatedLabel: row.related_label || "", relatedLabelTh: row.related_label_th || "",
    brochureUrl: row.brochure_url || "",
  };
}

const cleanList = (list) => list.map((x) => x.trim()).filter(Boolean);

export function toPayload(f) {
  return {
    name: f.name.trim(), nameTh: f.nameTh.trim() || null, summary: f.summary.trim() || null, summaryTh: f.summaryTh.trim() || null,
    services: cleanList(f.services), servicesTh: cleanList(f.servicesTh),
    benefits: cleanList(f.benefits), benefitsTh: cleanList(f.benefitsTh),
    imageUrl: f.imageUrl || null,
    imagePositionX: f.imageUrl ? f.imagePositionX : 50, imagePositionY: f.imageUrl ? f.imagePositionY : 50,
    relatedUrl: f.relatedUrl.trim() || null, relatedLabel: f.relatedLabel.trim() || null,
    relatedLabelTh: f.relatedLabelTh.trim() || null, brochureUrl: f.brochureUrl || null,
  };
}

let nextKey = 1;
const makeBlock = (row) => {
  const form = row ? rowToBlockForm(row) : emptyBlockForm();
  return { key: `b${nextKey++}`, id: row ? row.id : null, form, saved: row ? JSON.stringify(form) : "" };
};
export const SOLUTION_ADMIN_PATH = "/admin/automation-solution";
// the admin sidebar lists one link per solution; tell it to reload after a change
export const SOLUTIONS_CHANGED_EVENT = "admin-solutions-changed";
export const notifySolutionsChanged = () => window.dispatchEvent(new Event(SOLUTIONS_CHANGED_EVENT));
const isDirty = (b) => JSON.stringify(b.form) !== b.saved;

/** Text box that takes the look of the element it sits in (font, colour, size). */
export function InlineInput({ multiline = false, rows = 2, ...props }) {
  return multiline ? (
    <textarea className="home-admin__input" rows={rows} {...props} />
  ) : (
    <input className="home-admin__input" {...props} />
  );
}

/** Bar above a part of the page that is preview only or edited elsewhere. */
export function ManagedNote({ children }) {
  return <div className="home-admin__managed-note contact-admin__note">🔒 {children}</div>;
}

/** Uploads one PDF brochure through the admin upload endpoint. */
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
      {value && !busy && (
        <button type="button" className="btn contact-admin__small-btn" onClick={() => onChange("")}>
          ลบไฟล์
        </button>
      )}
      {error && <span className="contact-form__status contact-form__status--error">{error}</span>}
    </span>
  );
}

/**
 * Bullet list edited in place. In Thai, an empty Thai list falls back to
 * the English items on the public page — those are shown faded, with a
 * one-click copy to start translating from.
 */
export function ListEditor({ items, fallback, onChange, renderBullet, addLabel, ulClassName }) {
  const usingFallback = !items.length && fallback.length > 0;
  return (
    <>
      <ul className={ulClassName}>
        {usingFallback
          ? fallback.map((item, i) => (
              <li key={i} className="sol-admin__fallback" style={{ "--i": i }}>
                {renderBullet?.()}
                {item}
              </li>
            ))
          : items.map((item, i) => (
              <li key={i} className="sol-admin__item" style={{ "--i": i }}>
                {renderBullet?.()}
                <InlineInput
                  multiline
                  rows={1}
                  value={item}
                  aria-label={`รายการที่ ${i + 1}`}
                  placeholder="พิมพ์รายการ"
                  onChange={(e) => onChange(items.map((x, idx) => (idx === i ? e.target.value : x)))}
                />
                <button
                  type="button"
                  className="contact-admin__remove"
                  aria-label={`ลบรายการที่ ${i + 1}`}
                  title="ลบรายการ"
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                >
                  ×
                </button>
              </li>
            ))}
      </ul>
      {usingFallback && <p className="contact-admin__hint">ยังไม่มีภาษาไทย — หน้าเว็บใช้รายการภาษาอังกฤษ (ตัวจาง) แทน</p>}
      <div className="sol-admin__list-actions">
        <button type="button" className="btn contact-admin__small-btn" onClick={() => onChange([...items, ""])}>
          + {addLabel}
        </button>
        {usingFallback && (
          <button type="button" className="btn contact-admin__small-btn" onClick={() => onChange([...fallback])}>
            คัดลอก EN มาแปล
          </button>
        )}
      </div>
    </>
  );
}

export default function AdminAutomationSolution() {
  const [lang, setLang] = useState("th");
  const [hero, setHero] = useState(emptyHeroForm);
  const [savedHero, setSavedHero] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [industries, setIndustries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pickerFor, setPickerFor] = useState(null); // index of the step whose icon picker is open
  const [positioning, setPositioning] = useState(null); // key of the block whose crop is being adjusted
  const [moving, setMoving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    Promise.all([
      api.adminGetAutomationSolutionContent().then((d) => {
        const next = { ...emptyHeroForm(), ...(d || {}) };
        // start from the built-in steps so they can be edited in place;
        // counted as saved, so this alone does not enable the Save button
        if (!parseProcessSteps(next.process_steps).length) next.process_steps = JSON.stringify(builtInSteps());
        setHero(next);
        setSavedHero(JSON.stringify(next));
      }),
      api.adminGetSolutions().then((rows) => setBlocks((rows || []).map(makeBlock))),
    ])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    api
      .getIndustries()
      .then((rows) => setIndustries(rows && rows.length ? rows : null))
      .catch(() => setIndustries(null));
  }, []);

  const t = translations[lang]?.automationSolution || translations.en.automationSolution;
  const common = translations[lang]?.common || translations.en.common;
  const exploreMore = translations[lang]?.exploreMore || translations.en.exploreMore;
  const th = lang === "th";

  // ── hero ──
  const heroBind = (base, placeholder, label) => ({
    value: hero[`${base}_${lang}`] || "",
    placeholder,
    "aria-label": label,
    onChange: (e) => {
      setSuccess(false);
      setHero((h) => ({ ...h, [`${base}_${lang}`]: e.target.value }));
    },
  });

  // ── engineering process steps (JSON text in hero.process_steps) ──
  const steps = parseProcessSteps(hero.process_steps);
  const setSteps = (list) => {
    setSuccess(false);
    setHero((h) => ({ ...h, process_steps: JSON.stringify(list) }));
  };
  const updateStep = (i, patch) => setSteps(steps.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const moveStep = (i, dir) => {
    const next = [...steps];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setSteps(next);
  };
  const otherLang = lang === "th" ? "en" : "th";

  // ── blocks ──
  const updateBlock = (key, patch) => {
    setSuccess(false);
    setBlocks((list) => list.map((b) => (b.key === key ? { ...b, form: { ...b.form, ...patch } } : b)));
  };
  // field name for the language being edited: name → nameTh in Thai
  const lf = (field) => (th ? `${field}Th` : field);

  const addBlock = () => {
    const b = makeBlock(null);
    setBlocks((list) => [...list, b]);
    requestAnimationFrame(() =>
      document.getElementById(`sol-admin-${b.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  const move = async (index, dir) => {
    const other = index + dir;
    const a = blocks[index];
    const b = blocks[other];
    if (!a || !b || !a.id || !b.id || moving) return;
    setMoving(true);
    setError("");
    try {
      await api.adminReorderSolution(a.id, dir < 0 ? "up" : "down");
      setBlocks((list) => {
        const next = [...list];
        [next[index], next[other]] = [next[other], next[index]];
        return next;
      });
      notifySolutionsChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setMoving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    if (!deleteTarget.id) {
      setBlocks((list) => list.filter((b) => b.key !== deleteTarget.key));
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await api.adminDeleteSolution(deleteTarget.id);
      setBlocks((list) => list.filter((b) => b.key !== deleteTarget.key));
      setDeleteTarget(null);
      notifySolutionsChanged();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const heroDirty = savedHero !== "" && JSON.stringify(hero) !== savedHero;
  const dirtyBlocks = blocks.filter(isDirty);
  const hasChanges = heroDirty || dirtyBlocks.length > 0;

  const handleSave = async () => {
    const missing = blocks.findIndex((b) => isDirty(b) && !b.form.name.trim());
    if (missing !== -1) {
      setError(`Solution #${missing + 1} ยังไม่มีชื่อภาษาอังกฤษ (จำเป็น) — สลับเป็น English แล้วกรอกชื่อก่อนบันทึก`);
      document.getElementById(`sol-admin-${blocks[missing].key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      if (heroDirty) {
        const updated = await api.adminUpdateAutomationSolutionContent(hero);
        const next = { ...hero, ...updated };
        setHero(next);
        setSavedHero(JSON.stringify(next));
      }
      // one at a time, in page order, so new blocks keep their position
      for (const b of blocks) {
        if (!isDirty(b)) continue;
        const row = b.id
          ? await api.adminUpdateSolution(b.id, toPayload(b.form))
          : await api.adminCreateSolution(toPayload(b.form));
        const form = rowToBlockForm(row);
        setBlocks((list) => list.map((x) => (x.key === b.key ? { ...x, id: row.id, form, saved: JSON.stringify(form) } : x)));
        notifySolutionsChanged();
      }
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

  const blockName = (b) => (th && b.form.nameTh) || b.form.name || b.form.nameTh || "Solution ใหม่";

  return (
    <div className="sol-admin">
      <AdminBreadcrumb items={[{ label: "โซลูชันระบบอัตโนมัติ (Automation Solution)" }]} />

      <div className="admin-edit-tabbar admin-edit-tabbar--actions-only">
        <div className="admin-edit-tabbar__actions home-admin__toolbar">
          <label className="career-admin__lang">
            <span>ภาษา</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="th">🇹🇭 ภาษาไทย</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </label>
          <a className="btn" href="/automation-solution" target="_blank" rel="noopener noreferrer">
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
        🔔 กำลังแก้ไขเวอร์ชัน <strong>{th ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> — หน้าด้านล่างแสดงเหมือนหน้า Automation Solution จริง
        คลิกที่ข้อความเพื่อพิมพ์แก้ได้ทันที ช่องที่เว้นว่างจะใช้ข้อความเริ่มต้นหรือข้อความภาษาอังกฤษ (ตัวจาง)
        รูปภาพ ลิงก์สินค้า และโบรชัวร์ ใช้ร่วมกันทั้งสองภาษา — กด “บันทึก” ครั้งเดียวเพื่อบันทึกทุกส่วนที่แก้
      </div>

      <div className="home-admin__page">
        {/* HERO */}
        <section className={`hero hero--compact hero--centered${hero.hero_bg_image ? " hero--has-bg" : ""}`}>
          {hero.hero_bg_image && (
            <>
              <HeroBgMedia src={hero.hero_bg_image} />
              <div className="hero__bg-scrim" aria-hidden="true" />
            </>
          )}
          <div className="hero__grid-overlay" aria-hidden="true" />
          <div className="container hero__content">
            <span className="hero__meta">
              <InlineInput {...heroBind("hero_meta", t.heroMeta, "ข้อความเล็กเหนือหัวข้อ")} />
            </span>
            <h1>
              <InlineInput {...heroBind("hero_title", t.heroTitle, "หัวข้อหลัก")} />
            </h1>
            <p className="hero__sub">
              <InlineInput multiline rows={2} {...heroBind("hero_sub", t.heroSub, "คำอธิบายใต้หัวข้อ")} />
            </p>
          </div>
        </section>
        <div className="panel home-admin__hero-bg">
          <span className="admin-edit-sidebar__label">ภาพหรือวิดีโอพื้นหลัง Hero (ไม่บังคับ — ใช้ร่วมกันทั้งสองภาษา)</span>
          <ImageUploadField
            accept="image/*,video/mp4"
            maxSizeMB={10}
            value={hero.hero_bg_image || ""}
            onChange={(url) => {
              setSuccess(false);
              setHero((h) => ({ ...h, hero_bg_image: url }));
            }}
          />
        </div>

        {/* JUMP NAV — follows the block names automatically */}
        {blocks.length > 0 && (
          <nav className="sol-nav sol-admin__nav" aria-label="ตัวอย่างแถบเมนูลัด">
            <div className="container sol-nav__inner">
              {blocks.map((b, i) => (
                <a
                  key={b.key}
                  href={`#sol-admin-${b.key}`}
                  className={`sol-nav__chip${i === 0 ? " is-active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`sol-admin-${b.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  {blockName(b)}
                </a>
              ))}
            </div>
          </nav>
        )}

        {/* SOLUTION BLOCKS */}
        <section className="section sol-list">
          <div className="container">
            {!blocks.length && (
              <p className="sol-admin__empty">
                ยังไม่มี Solution — หน้าเว็บจะแสดง Solution ตัวอย่างที่ติดมากับระบบ กด “+ เพิ่ม Solution” เพื่อสร้างของจริง
              </p>
            )}

            {blocks.map((b, i) => {
              const f = b.form;
              const dirty = isDirty(b);
              const name = th ? f.nameTh : f.name;
              const fallbackName = th ? f.name : "";
              const relatedLabelPlaceholder =
                (th && f.relatedLabel) || t.relatedProducts;
              return (
                <div className="sol-admin__block" key={b.key} id={`sol-admin-${b.key}`}>
                  <div className="sol-admin__bar">
                    <span className="sol-admin__order">#{i + 1}</span>
                    {!b.id && <span className="career-admin__badge career-admin__badge--new">ใหม่ · ยังไม่บันทึก</span>}
                    {b.id && dirty && <span className="career-admin__badge career-admin__badge--dirty">มีการแก้ไข</span>}
                    <span className="sol-admin__bar-spacer" />
                    {b.id && (
                      <Link className="btn contact-admin__small-btn" to={`${SOLUTION_ADMIN_PATH}/${b.id}`}>
                        ✎ แก้ไขหน้า Solution นี้
                      </Link>
                    )}
                    <button
                      type="button"
                      className="btn contact-admin__small-btn"
                      disabled={moving || i === 0 || !b.id || !blocks[i - 1]?.id}
                      onClick={() => move(i, -1)}
                      aria-label="เลื่อนขึ้น"
                      title="เลื่อนขึ้น"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn contact-admin__small-btn"
                      disabled={moving || i === blocks.length - 1 || !b.id || !blocks[i + 1]?.id}
                      onClick={() => move(i, 1)}
                      aria-label="เลื่อนลง"
                      title="เลื่อนลง"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn contact-admin__small-btn sol-admin__delete"
                      onClick={() => {
                        setDeleteError("");
                        setDeleteTarget(b);
                      }}
                    >
                      ลบ
                    </button>
                  </div>

                  <article className={`solution-block ${i % 2 ? "solution-block--flip" : ""}`}>
                    <div className="sol-admin__media">
                      {positioning === b.key && f.imageUrl ? (
                        <ImagePositionField
                          imageUrl={f.imageUrl}
                          positionX={f.imagePositionX}
                          positionY={f.imagePositionY}
                          onChange={({ x, y }) => updateBlock(b.key, { imagePositionX: x, imagePositionY: y })}
                        />
                      ) : (
                        <div className="solution-block__visual">
                          {f.imageUrl ? (
                            <img
                              src={f.imageUrl}
                              alt=""
                              className="solution-block__image"
                              style={{ objectPosition: `${f.imagePositionX}% ${f.imagePositionY}%` }}
                            />
                          ) : (
                            <span className="solution-block__glyph">{(name || fallbackName || "S").charAt(0)}</span>
                          )}
                        </div>
                      )}
                      <div className="panel sol-admin__media-tools">
                        <span className="admin-edit-sidebar__label">รูปภาพ (อัตราส่วน 4:3 — ใช้ร่วมกันทั้งสองภาษา)</span>
                        <ImageUploadField
                          value={f.imageUrl}
                          hidePreview
                          onChange={(url) => {
                            updateBlock(b.key, { imageUrl: url, imagePositionX: 50, imagePositionY: 50 });
                            if (!url) setPositioning(null);
                          }}
                        />
                        {f.imageUrl && (
                          <button
                            type="button"
                            className="btn contact-admin__small-btn"
                            onClick={() => setPositioning(positioning === b.key ? null : b.key)}
                          >
                            {positioning === b.key ? "✓ เสร็จสิ้นการจัดตำแหน่ง" : "✥ ลากจัดตำแหน่งภาพ"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="solution-block__content">
                      <h2>
                        <InlineInput
                          multiline
                          rows={1}
                          value={name}
                          placeholder={fallbackName || (th ? "ชื่อ Solution (ภาษาไทย)" : "Solution name (required)")}
                          aria-label="ชื่อ Solution"
                          onChange={(e) => updateBlock(b.key, { [lf("name")]: e.target.value })}
                        />
                      </h2>
                      {!th && !f.name.trim() && <p className="contact-admin__hint sol-admin__required">* จำเป็นต้องมีชื่อภาษาอังกฤษ</p>}
                      <div className="solution-block__summary">
                        <InlineInput
                          multiline
                          rows={3}
                          value={th ? f.summaryTh : f.summary}
                          placeholder={(th && f.summary) || "คำอธิบายสั้นๆ ของ Solution นี้"}
                          aria-label="คำอธิบาย"
                          onChange={(e) => updateBlock(b.key, { [lf("summary")]: e.target.value })}
                        />
                      </div>

                      <div className="solution-block__lists">
                        <div>
                          <h3 className="solution-block__list-title">{t.servicesLabel}</h3>
                          <ListEditor
                            ulClassName="solution-block__services"
                            items={th ? f.servicesTh : f.services}
                            fallback={th ? f.services : []}
                            addLabel="เพิ่มบริการ"
                            onChange={(list) => updateBlock(b.key, { [lf("services")]: list })}
                          />
                        </div>
                        <div className="solution-block__benefits">
                          <h3 className="solution-block__list-title">{t.benefitsLabel}</h3>
                          <ListEditor
                            items={th ? f.benefitsTh : f.benefits}
                            fallback={th ? f.benefits : []}
                            addLabel="เพิ่มประโยชน์"
                            renderBullet={() => (
                              <span className="solution-block__tick" aria-hidden="true">
                                <ContactIcon name="check" size={14} />
                              </span>
                            )}
                            onChange={(list) => updateBlock(b.key, { [lf("benefits")]: list })}
                          />
                        </div>
                      </div>

                      <div className="solution-block__actions">
                        <span className="btn btn-primary sol-admin__fake-btn" title="ปุ่มนี้พาไปฟอร์มขอใบเสนอราคาโดยอัตโนมัติ">
                          {t.discuss} <span className="btn-arrow">→</span>
                        </span>
                        {f.relatedUrl.trim() && (
                          <span className="solution-block__link sol-admin__link">
                            <InlineInput
                              value={th ? f.relatedLabelTh : f.relatedLabel}
                              placeholder={relatedLabelPlaceholder}
                              aria-label="ข้อความลิงก์สินค้าที่เกี่ยวข้อง"
                              onChange={(e) => updateBlock(b.key, { [lf("relatedLabel")]: e.target.value })}
                            />
                            <ContactIcon name="arrow" size={16} />
                          </span>
                        )}
                        {f.brochureUrl && (
                          <a href={f.brochureUrl} className="solution-block__link" target="_blank" rel="noopener noreferrer">
                            <ContactIcon name="download" size={16} />
                            {t.brochure}
                          </a>
                        )}
                      </div>

                      <div className="panel sol-admin__links">
                        <label>
                          <span className="admin-edit-sidebar__label">ลิงก์สินค้าที่เกี่ยวข้อง (ไม่บังคับ)</span>
                          <input
                            className="sol-admin__url"
                            value={f.relatedUrl}
                            maxLength={500}
                            placeholder="/products/omron หรือ https://…"
                            onChange={(e) => updateBlock(b.key, { relatedUrl: e.target.value })}
                          />
                        </label>
                        <div className="sol-admin__pdf-row">
                          <span className="admin-edit-sidebar__label">โบรชัวร์ PDF (ไม่บังคับ, ไม่เกิน 10 MB)</span>
                          <PdfUploadButton value={f.brochureUrl} onChange={(url) => updateBlock(b.key, { brochureUrl: url })} />
                        </div>
                        <p className="contact-admin__hint">
                          กรอกลิงก์แล้วปุ่มลิงก์จะโผล่ด้านบน คลิกที่ข้อความปุ่มเพื่อแก้ได้ — ว่าง = ไม่แสดงปุ่ม
                        </p>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}

            <button type="button" className="btn sol-admin__add" onClick={addBlock}>
              + เพิ่ม Solution
            </button>
          </div>
        </section>

        {/* PROCESS — edited in place */}
        <section className="section sol-process sol-admin__process">
          <div className="container">
            <div className="section-head">
              <h2>
                <InlineInput multiline rows={1} {...heroBind("process_title", t.processTitle, "หัวข้อขั้นตอนการทำงาน")} />
              </h2>
              <div className="lede">
                <InlineInput multiline rows={2} {...heroBind("process_lede", t.processLede, "คำอธิบายใต้หัวข้อ")} />
              </div>
            </div>
            <ol className="sol-steps" style={{ "--n": steps.length }}>
              {steps.map((step, i) => (
                <li className="sol-step" key={i} style={{ "--i": i }}>
                  <button
                    type="button"
                    className="sol-step__ring sol-admin__ring"
                    data-icon-trigger=""
                    title="คลิกเพื่อเปลี่ยนไอคอน"
                    aria-label={`เปลี่ยนไอคอนขั้นตอนที่ ${i + 1}`}
                    aria-expanded={pickerFor === i}
                    onClick={() => setPickerFor(pickerFor === i ? null : i)}
                  >
                    <StepIcon name={step.icon || "check"} />
                    <span className="sol-admin__ring-edit" aria-hidden="true">✎</span>
                  </button>
                  {pickerFor === i && (
                    <IconPicker
                      value={step.icon || "check"}
                      align={i < steps.length / 2 ? "start" : "end"}
                      onChange={(icon) => updateStep(i, { icon })}
                      onClose={() => setPickerFor(null)}
                    />
                  )}
                  <span className="sol-step__num">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="sol-step__label">
                    <InlineInput
                      multiline
                      rows={1}
                      value={step[`label_${lang}`] || ""}
                      placeholder={step[`label_${otherLang}`] || "ชื่อขั้นตอน"}
                      aria-label={`ชื่อขั้นตอนที่ ${i + 1}`}
                      onChange={(e) => updateStep(i, { [`label_${lang}`]: e.target.value })}
                    />
                  </h3>
                  <div className="sol-step__desc">
                    <InlineInput
                      multiline
                      rows={2}
                      value={step[`desc_${lang}`] || ""}
                      placeholder={step[`desc_${otherLang}`] || "คำอธิบายสั้นๆ"}
                      aria-label={`คำอธิบายขั้นตอนที่ ${i + 1}`}
                      onChange={(e) => updateStep(i, { [`desc_${lang}`]: e.target.value })}
                    />
                  </div>
                  <div className="sol-admin__step-tools">
                    <button
                      type="button"
                      className="contact-admin__remove"
                      disabled={i === 0}
                      onClick={() => moveStep(i, -1)}
                      aria-label={`เลื่อนขั้นตอนที่ ${i + 1} ไปก่อนหน้า`}
                      title="เลื่อนไปก่อนหน้า"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="contact-admin__remove"
                      disabled={i === steps.length - 1}
                      onClick={() => moveStep(i, 1)}
                      aria-label={`เลื่อนขั้นตอนที่ ${i + 1} ไปถัดไป`}
                      title="เลื่อนไปถัดไป"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className="contact-admin__remove"
                      disabled={steps.length <= MIN_STEPS}
                      onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}
                      aria-label={`ลบขั้นตอนที่ ${i + 1}`}
                      title="ลบขั้นตอน"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            <div className="sol-admin__list-actions sol-admin__process-actions">
              <button
                type="button"
                className="btn contact-admin__small-btn"
                disabled={steps.length >= MAX_STEPS}
                onClick={() => setSteps([...steps, { icon: "check", label_en: "", label_th: "", desc_en: "", desc_th: "" }])}
              >
                + เพิ่มขั้นตอน
              </button>
              <button type="button" className="btn contact-admin__small-btn" onClick={() => setSteps(builtInSteps())}>
                ↺ กลับไปใช้ขั้นตอนเริ่มต้น
              </button>
              <span className="contact-admin__hint">
                คลิกที่วงกลมเพื่อเปลี่ยนไอคอนหรืออัปโหลดไอคอนเอง · {MIN_STEPS}–{MAX_STEPS} ขั้นตอน · ข้อความที่ยังไม่แปลจะแสดงอีกภาษาแทน (ตัวจาง)
              </span>
            </div>
          </div>
        </section>

        {/* INDUSTRIES — managed elsewhere */}
        {industries && (
          <>
            <ManagedNote>
              อุตสาหกรรม — แก้ไขรายการได้ที่ <Link to="/admin/industries">สไลด์อุตสาหกรรม (Industries Slider)</Link>
            </ManagedNote>
            <section className="section industries-section sol-industries" inert="">
              <div className="container">
                <SectionLabel title={t.industriesTitle} lede={t.industriesLede} />
                <IndustriesSlider industries={industries} exploreLabel={exploreMore} lang={lang} />
              </div>
            </section>
          </>
        )}

        {/* CTA — preview only */}
        <ManagedNote>แถบปิดท้ายหน้า — แสดงตัวอย่างเท่านั้น</ManagedNote>
        <section className="cta-band history-cta" inert="">
          <div className="container cta-band__wrap">
            <h2>{t.ctaTitle}</h2>
            <p className="history-cta__sub">{t.ctaSub}</p>
            <div className="history-cta__actions">
              <span className="btn btn-primary">
                {common.contactUs} <span className="btn-arrow">→</span>
              </span>
              <span className="btn">{common.viewProducts}</span>
            </div>
          </div>
        </section>
      </div>

      {deleteTarget && (
        <ConfirmModal
          title="ลบ Solution นี้?"
          message={deleteTarget.id ? "Solution นี้จะถูกลบออกจากหน้าเว็บทันที และกู้คืนไม่ได้" : "Solution ใหม่ที่ยังไม่ได้บันทึกนี้จะถูกนำออก"}
          detail={blockName(deleteTarget)}
          confirmLabel="ลบ"
          busy={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
