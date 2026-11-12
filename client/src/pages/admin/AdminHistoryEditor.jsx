import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import {
  HistoryPageHeader,
  HISTORY_TIMELINE_PATH,
  HISTORY_STATS_PATH,
  HISTORY_ORG_PATH,
} from "../../components/HistoryAdmin.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";
import SectionLabel from "../../components/SectionLabel.jsx";
import { OrgItem, unitSep, BRANDS } from "../History.jsx";
import { translations } from "../../i18n/translations.js";

/**
 * Admin > ประวัติบริษัท (History) > Content — laid out exactly like the
 * public History page (pages/History.jsx), the same way Admin > Home mirrors
 * the Home page. The Hero and Introduction text is edited in place; empty
 * fields fall back to the built-in translation (shown as a faded
 * placeholder), the same rule the public page uses. Timeline, Statistics and
 * Organization show the live data as a preview with a link to their tab.
 */

const FIELD_SUFFIXES = [
  "hero_meta",
  "hero_title",
  "hero_sub",
  "intro_eyebrow",
  "intro_title",
  "intro_lede",
  "intro_body",
];

function emptyForm() {
  const form = { hero_bg_image: "" };
  for (const base of FIELD_SUFFIXES) {
    form[`${base}_en`] = "";
    form[`${base}_th`] = "";
  }
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

/** Bar above a preview section whose data is edited in another tab / place. */
function ManagedBar({ note, to, linkLabel }) {
  return (
    <div className="home-admin__managed-note history-admin__managed-bar">
      <span>🔒 {note}</span>
      {to && (
        <Link to={to} className="btn">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

export default function AdminHistoryEditor() {
  const [form, setForm] = useState(emptyForm);
  const [savedForm, setSavedForm] = useState(null);
  const [historyContent, setHistoryContent] = useState(null);
  const [lang, setLang] = useState("th"); // which language's fields are shown for editing
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .adminGetAboutContent()
      .then((d) => {
        const next = { ...emptyForm(), ...(d || {}) };
        setForm(next);
        setSavedForm(next);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // Same data the public page shows (active items only) — preview only.
    api
      .getHistoryContent()
      .then(setHistoryContent)
      .catch(() => setHistoryContent({ timeline: [], stats: [], org: [] }));
  }, []);

  const t = translations[lang]?.history || translations.en.history;

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

  const hasChanges = savedForm && JSON.stringify(form) !== JSON.stringify(savedForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await api.adminUpdateAboutContent(form);
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

  // `${base}_${lang}` with English as the fallback for a blank translation (as on the public page).
  const pick = (row, base) => row[`${base}_${lang}`] || row[`${base}_en`] || "";
  const timeline = (historyContent?.timeline || []).map((m) => ({
    id: m.id,
    year: pick(m, "year"),
    title: pick(m, "title"),
    body: pick(m, "description"),
    image: m.image_url,
  }));
  const stats = (historyContent?.stats || []).map((s) => ({
    id: s.id,
    num: s.value,
    unit: pick(s, "unit"),
    label: pick(s, "label"),
  }));
  const toNode = (n) => ({
    id: n.id,
    name: pick(n, "name"),
    person: pick(n, "person"),
    image: n.image_url,
    children: n.children.map(toNode),
  });
  const orgRoots = (historyContent?.org || []).map(toNode);
  const previewLoading = !historyContent;
  const emptyNote = (text) => (
    <p className="empty-state history-admin__empty">{previewLoading ? "กำลังโหลด…" : text}</p>
  );

  return (
    <form onSubmit={handleSubmit}>
      <HistoryPageHeader
        actions={
          <div className="home-admin__toolbar">
            <label className="career-admin__lang">
              <span>ภาษา</span>
              <select value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="th">🇹🇭 ภาษาไทย</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </label>
            <a className="btn" href="/history" target="_blank" rel="noopener noreferrer">
              ดูหน้าเว็บ ↗
            </a>
            <button type="submit" className="btn btn-primary" disabled={saving || !hasChanges}>
              💾 {saving ? "กำลังบันทึก…" : hasChanges ? "บันทึก" : "บันทึกแล้ว"}
            </button>
          </div>
        }
      />

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
      {success && <SuccessModal onClose={() => setSuccess(false)} />}

      <div className="admin-edit-notice">
        🔔 กำลังแก้ไขเวอร์ชัน <strong>{lang === "th" ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> — หน้าด้านล่างแสดงเหมือนหน้าประวัติบริษัทจริง
        คลิกที่ข้อความเพื่อพิมพ์แก้ได้ทันที ช่องที่เว้นว่างจะใช้ข้อความเริ่มต้น (ตัวจาง) ระบบจะบันทึกทั้งสองภาษาพร้อมกันตอนกด
        “บันทึก” ส่วนไทม์ไลน์ / สถิติ / โครงสร้างองค์กรแก้ไขได้จากแท็บด้านบน
      </div>

      <div className="home-admin__page history-admin__page">
        {/* HERO */}
        <section className={`hero hero--compact${form.hero_bg_image ? " hero--has-bg" : ""}`}>
          {form.hero_bg_image && (
            <>
              <div className="hero__bg-image" style={{ backgroundImage: `url(${form.hero_bg_image})` }} aria-hidden="true" />
              <div className="hero__bg-scrim" aria-hidden="true" />
            </>
          )}
          <div className="hero__grid-overlay" aria-hidden="true" />
          <div className="container hero__content">
            <span className="hero__meta">
              <InlineInput {...bind("hero_meta", t.heroMeta, "ข้อความเล็กเหนือหัวข้อ (Meta)")} />
            </span>
            <h1>
              <InlineInput {...bind("hero_title", t.heroTitle, "หัวข้อหลัก")} />
            </h1>
            <p className="hero__sub">
              <InlineInput multiline rows={3} {...bind("hero_sub", t.heroSub, "คำอธิบายใต้หัวข้อ")} />
            </p>
          </div>
        </section>

        <div className="panel home-admin__hero-bg">
          <span className="admin-edit-sidebar__label">ภาพพื้นหลัง Hero (ไม่บังคับ — ใช้ร่วมกันทั้งสองภาษา)</span>
          <ImageUploadField
            value={form.hero_bg_image || ""}
            onChange={(url) => {
              setSuccess(false);
              setForm((f) => ({ ...f, hero_bg_image: url }));
            }}
          />
        </div>

        {/* INTRODUCTION */}
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">
                <InlineInput {...bind("intro_eyebrow", t.introEyebrow, "ข้อความเล็กเหนือหัวข้อ (Eyebrow)")} />
              </span>
              <h2>
                <InlineInput {...bind("intro_title", t.introTitle, "หัวข้อ")} />
              </h2>
              <p className="lede">
                <InlineInput multiline rows={2} {...bind("intro_lede", t.introLede, "ข้อความเกริ่นนำ (Lede)")} />
              </p>
            </div>
            <p className="lede" style={{ maxWidth: "62ch" }}>
              <InlineInput multiline rows={4} {...bind("intro_body", t.introBody, "เนื้อหาย่อหน้าหลัก")} />
            </p>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="section history-admin__managed">
          <div className="container">
            <ManagedBar
              note="ไทม์ไลน์แก้ไขได้จากแท็บ “ไทม์ไลน์ (Timeline)”"
              to={HISTORY_TIMELINE_PATH}
              linkLabel="แก้ไขไทม์ไลน์"
            />
            <SectionLabel eyebrow={t.timelineEyebrow} title={t.timelineTitle} />
            {timeline.length ? (
              <div className="timeline">
                {timeline.map((m) => (
                  <div className="timeline__item" key={m.id}>
                    <span className="timeline__year">{m.year}</span>
                    <h3>{m.title}</h3>
                    {m.body && <p>{m.body}</p>}
                    {m.image && <img className="timeline__image" src={m.image} alt="" loading="lazy" />}
                  </div>
                ))}
              </div>
            ) : (
              emptyNote("ยังไม่มีรายการไทม์ไลน์ที่เปิดใช้งาน")
            )}
          </div>
        </section>

        {/* STATISTICS */}
        <section className="section history-admin__managed">
          <div className="container">
            <ManagedBar
              note="ตัวเลขสถิติแก้ไขได้จากแท็บ “สถิติ (Statistics)”"
              to={HISTORY_STATS_PATH}
              linkLabel="แก้ไขสถิติ"
            />
            <SectionLabel eyebrow={t.statsEyebrow} title={t.statsTitle} />
            {stats.length ? (
              <div className="stat-row">
                {stats.map((s) => (
                  <div className="stat-cell" key={s.id}>
                    <span className="stat-cell__num">
                      {s.num}
                      {s.unit ? unitSep(s.unit) + s.unit : ""}
                    </span>
                    <span className="stat-cell__label">{s.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              emptyNote("ยังไม่มีสถิติที่เปิดใช้งาน")
            )}
          </div>
        </section>

        {/* ORGANIZATION */}
        <section className="section history-admin__managed">
          <div className="container">
            <ManagedBar
              note="แผนผังองค์กรแก้ไขได้จากแท็บ “โครงสร้างองค์กร (Organization)”"
              to={HISTORY_ORG_PATH}
              linkLabel="แก้ไขโครงสร้างองค์กร"
            />
            <SectionLabel eyebrow={t.structureEyebrow} title={t.structureTitle} />
            {orgRoots.length ? (
              <div className="org-diagram panel">
                {orgRoots.length === 1 ? (
                  <OrgItem node={orgRoots[0]} root />
                ) : (
                  <div className="org-branch">
                    {orgRoots.map((node) => (
                      <OrgItem key={node.id} node={node} root />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              emptyNote("ยังไม่มีโครงสร้างองค์กรที่เปิดใช้งาน")
            )}
          </div>
        </section>

        {/* EXPERIENCE + PARTNERS (static on the public page) */}
        <section className="section history-admin__managed">
          <div className="container">
            <ManagedBar note="ส่วนนี้เป็นข้อความคงที่ของหน้าเว็บ (แก้ไขจากระบบหลังบ้านไม่ได้)" />
            <SectionLabel eyebrow={t.experienceEyebrow} title={t.experienceTitle} lede={t.experienceLede} />
          </div>
        </section>

        <section className="section history-admin__managed">
          <div className="container">
            <ManagedBar note="ส่วนนี้เป็นข้อความคงที่ของหน้าเว็บ (แก้ไขจากระบบหลังบ้านไม่ได้)" />
            <SectionLabel index="06" eyebrow={t.partnersEyebrow} title={t.partnersTitle} />
            <div className="brand-strip">
              {BRANDS.map((b) => (
                <span className="brand-strip__name" key={b}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="admin-form__submit-row">
        <button type="submit" className="btn btn-primary" disabled={saving || !hasChanges}>
          {saving ? "กำลังบันทึก…" : hasChanges ? "บันทึก" : "บันทึกแล้ว"}
        </button>
      </div>
    </form>
  );
}
