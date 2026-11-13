import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import {
  HistoryPageHeader,
  HISTORY_TIMELINE_PATH,
  HISTORY_STATS_PATH,
} from "../../components/HistoryAdmin.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";
import SectionLabel from "../../components/SectionLabel.jsx";
import WhyTrisak from "../../components/WhyTrisak.jsx";
import { PartnerBrands, ExperienceBanner, BrandLanesTimeline, INTRO_IMAGE_DEFAULT } from "../History.jsx";
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
  const form = { hero_bg_image: "", intro_image: "" };
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
  const [brands, setBrands] = useState(null);

  useEffect(() => {
    api
      .getBrands()
      .then(setBrands)
      .catch(() => setBrands(null));
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
        {/* HERO: Company Introduction */}
        <section className="intro">
          <img className="intro__bg" src={form.intro_image || INTRO_IMAGE_DEFAULT} alt="" />
          <div className="container intro__text">
            <h1>
              <InlineInput {...bind("intro_title", t.introTitle, "หัวข้อ")} />
            </h1>
            <p className="intro__lede">
              <InlineInput multiline rows={3} {...bind("intro_lede", t.introLede, "ข้อความเกริ่นนำ (Lede)")} />
            </p>
            <p className="intro__body">
              <InlineInput multiline rows={4} {...bind("intro_body", t.introBody, "เนื้อหาย่อหน้าหลัก")} />
            </p>
          </div>
        </section>

        <div className="panel home-admin__hero-bg">
          <span className="admin-edit-sidebar__label">
            ภาพพื้นหลัง “แนะนำบริษัท” (ไม่บังคับ — ใช้ร่วมกันทั้งสองภาษา, ว่าง = รูปเริ่มต้น)
          </span>
          <ImageUploadField
            accept="image/*"
            maxSizeMB={10}
            value={form.intro_image || ""}
            onChange={(url) => {
              setSuccess(false);
              setForm((f) => ({ ...f, intro_image: url }));
            }}
          />
        </div>

        {/* TIMELINE */}
        <section className="section history-admin__managed">
          <div className="container">
            <ManagedBar
              note="ไทม์ไลน์แก้ไขได้จากแท็บ “ไทม์ไลน์ (Timeline)”"
              to={HISTORY_TIMELINE_PATH}
              linkLabel="แก้ไขไทม์ไลน์"
            />
            <SectionLabel title={t.timelineTitle} />
            {timeline.length ? (
              <BrandLanesTimeline items={timeline} brands={brands} />
            ) : (
              emptyNote("ยังไม่มีรายการไทม์ไลน์ที่เปิดใช้งาน")
            )}
          </div>
        </section>

        {/* WHY TRISAK GROUP (static text, preview only) */}
        <div className="history-admin__managed">
          <div className="container">
            <ManagedBar note="ส่วน “Why TRISAK Group” เป็นข้อความคงที่ (แก้ไขในโค้ด)" />
          </div>
          <WhyTrisak
            title={t.whyTitle}
            lede={t.whyLede}
            reasons={t.whyReasons}
            processTitle={t.whyProcessTitle}
            steps={t.whySteps}
          />
        </div>

        {/* EXPERIENCE + STATISTICS + PARTNERS (heading text is static; numbers from the Statistics tab) */}
        <section className="section history-admin__managed">
          <div className="container">
            <ManagedBar
              note="หัวข้อ “ประสบการณ์ของเรา” เป็นข้อความคงที่ — ตัวเลขสถิติแก้ไขได้จากแท็บ “สถิติ (Statistics)” · โลโก้ OMRON / YASKAWA / NITTO ดึงจากเมนู แบรนด์ (Brands)"
              to={HISTORY_STATS_PATH}
              linkLabel="แก้ไขสถิติ"
            />
            {!stats.length && emptyNote("ยังไม่มีสถิติที่เปิดใช้งาน")}
          </div>
          <ExperienceBanner
            eyebrow={t.experienceEyebrow}
            title={t.experienceTitle}
            lede={t.experienceLede}
            stats={stats}
          >
            <SectionLabel eyebrow={t.partnersEyebrow} title={t.partnersTitle} />
            <PartnerBrands brands={brands} />
          </ExperienceBanner>
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
