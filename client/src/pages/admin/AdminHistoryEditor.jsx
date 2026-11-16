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
import { parseIconList } from "../../components/WhyTrisak.jsx";
import HistoryWhyEditor, { builtInWhyList } from "./HistoryWhyEditor.jsx";
import { PartnerBrands, ExperienceBanner, BrandLanesTimeline, INTRO_IMAGE_DEFAULT, statIcon } from "../History.jsx";
import IconPicker from "../../components/IconPicker.jsx";
import { Icon } from "../../components/WhyTrisak.jsx";
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
  "why_title",
  "why_lede",
  "why_process_title",
  "exp_eyebrow",
  "exp_title",
  "exp_lede",
  "partners_eyebrow",
  "partners_title",
];

function emptyForm() {
  const form = { hero_bg_image: "", intro_image: "", why_bg_image: "", why_reasons: "", why_steps: "", exp_image: "" };
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
  const [statRows, setStatRows] = useState([]); // active history_stats rows, edited on the banner
  const [savedStats, setSavedStats] = useState("[]");
  const [statPicker, setStatPicker] = useState(null); // id of the statistic whose icon picker is open
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
        // start from the built-in reasons/steps so they can be edited in place;
        // counted as saved, so this alone does not enable the Save button
        if (!parseIconList(next.why_reasons).length) next.why_reasons = JSON.stringify(builtInWhyList("whyReasons"));
        if (!parseIconList(next.why_steps).length) next.why_steps = JSON.stringify(builtInWhyList("whySteps"));
        setForm(next);
        setSavedForm(next);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // Same data the public page shows (active items only) — preview only.
    api
      .getHistoryContent()
      .then((d) => {
        setHistoryContent(d);
        // the banner numbers are edited in place and saved back to history_stats
        setStatRows(d?.stats || []);
        setSavedStats(JSON.stringify(d?.stats || []));
      })
      .catch(() => setHistoryContent({ timeline: [], stats: [], org: [] }));
  }, []);

  const updateStat = (id, patch) => {
    setSuccess(false);
    setStatRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

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

  const savedStatById = Object.fromEntries(JSON.parse(savedStats || "[]").map((r) => [r.id, JSON.stringify(r)]));
  const changedStats = statRows.filter((r) => JSON.stringify(r) !== savedStatById[r.id]);
  const formChanged = savedForm && JSON.stringify(form) !== JSON.stringify(savedForm);
  const hasChanges = formChanged || changedStats.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const bad = changedStats.find((r) => !String(r.value).trim() || !String(r.label_en || "").trim());
    if (bad) {
      setError("ตัวเลขสถิติต้องมีค่าตัวเลข และคำอธิบายภาษาอังกฤษ (สลับเป็น English เพื่อกรอก)");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      if (formChanged) {
        const updated = await api.adminUpdateAboutContent(form);
        const next = { ...form, ...updated };
        setForm(next);
        setSavedForm(next);
      }
      for (const r of changedStats) {
        await api.adminUpdateHistoryItem("statistics", r.id, {
          value: String(r.value).trim(),
          unitEn: (r.unit_en || "").trim(),
          unitTh: (r.unit_th || "").trim(),
          labelEn: (r.label_en || "").trim(),
          labelTh: (r.label_th || "").trim(),
          icon: r.icon || "",
          isActive: true, // only active statistics are shown here
        });
      }
      setSavedStats(JSON.stringify(statRows));
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
  const stats = statRows.map((s) => ({
    id: s.id,
    num: s.value,
    unit: pick(s, "unit"),
    label: pick(s, "label"),
    icon: s.icon,
  }));
  // a card's icon as a button that opens the shared icon picker
  const renderStatIcon = (s, i) => {
    const current = statIcon(s, i);
    return (
      <span className="exp-admin__icon-wrap">
        <button
          type="button"
          className="exp-banner__stat-icon exp-admin__icon-btn"
          data-icon-trigger=""
          aria-label="เปลี่ยนไอคอน"
          aria-expanded={statPicker === s.id}
          title="คลิกเพื่อเปลี่ยนไอคอน"
          onClick={() => setStatPicker(statPicker === s.id ? null : s.id)}
        >
          <Icon name={current} />
          <span className="sol-admin__ring-edit" aria-hidden="true">✎</span>
        </button>
        {statPicker === s.id && (
          <IconPicker
            value={current}
            align={i === 0 ? "start" : i === stats.length - 1 ? "end" : "center"}
            onChange={(icon) => updateStat(s.id, { icon })}
            onClose={() => setStatPicker(null)}
          />
        )}
      </span>
    );
  };
  const otherLang = lang === "th" ? "en" : "th";
  // one banner number as edit boxes: value + unit, and the label under it
  const renderStat = (s) => {
    const row = statRows.find((r) => r.id === s.id);
    // the card + icon come from ExperienceBanner; only number + label are swapped
    return (
      <>
        <span className="exp-banner__num exp-admin__num">
          <InlineInput
            value={row.value}
            size={Math.max(2, String(row.value).length + 1)}
            aria-label="ตัวเลข"
            placeholder="0"
            onChange={(e) => updateStat(s.id, { value: e.target.value })}
          />
          <InlineInput
            value={row[`unit_${lang}`] || ""}
            size={Math.max(1, (row[`unit_${lang}`] || row[`unit_${otherLang}`] || "").length + 1)}
            aria-label="หน่วย / เครื่องหมายต่อท้าย"
            placeholder={row[`unit_${otherLang}`] || "+"}
            onChange={(e) => updateStat(s.id, { [`unit_${lang}`]: e.target.value })}
          />
        </span>
        <span className="exp-banner__label">
          <InlineInput
            multiline
            rows={2}
            value={row[`label_${lang}`] || ""}
            aria-label="คำอธิบายตัวเลข"
            placeholder={row[`label_${otherLang}`] || "คำอธิบาย"}
            onChange={(e) => updateStat(s.id, { [`label_${lang}`]: e.target.value })}
          />
        </span>
      </>
    );
  };
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

        {/* WHY TRISAK GROUP — edited in place */}
        <HistoryWhyEditor
          form={form}
          lang={lang}
          onChange={(field, val) => {
            setSuccess(false);
            setForm((f) => ({ ...f, [field]: val }));
          }}
        />

        {/* EXPERIENCE + STATISTICS + PARTNERS — text, photo and numbers edited in place */}
        <section className="section history-admin__managed exp-admin">
          <div className="container">
            <ManagedBar
              note="แก้ข้อความ ตัวเลข และรูปได้ในส่วนนี้ — เพิ่ม/ลบ/สลับลำดับ/ซ่อนตัวเลขสถิติ ทำที่แท็บ “สถิติ (Statistics)” · โลโก้ OMRON / YASKAWA / NITTO ดึงจากเมนู แบรนด์ (Brands)"
              to={HISTORY_STATS_PATH}
              linkLabel="จัดการสถิติ"
            />
            {!stats.length && emptyNote("ยังไม่มีสถิติที่เปิดใช้งาน")}
          </div>
          <ExperienceBanner
            eyebrow={<InlineInput {...bind("exp_eyebrow", t.experienceEyebrow, "ข้อความเล็กเหนือหัวข้อ")} />}
            title={<InlineInput multiline rows={1} {...bind("exp_title", t.experienceTitle, "หัวข้อประสบการณ์")} />}
            lede={<InlineInput multiline rows={2} {...bind("exp_lede", t.experienceLede, "คำอธิบายใต้หัวข้อ")} />}
            stats={stats}
            renderStat={renderStat}
            renderIcon={renderStatIcon}
            photo={form.exp_image}
          >
            <div className="section-head exp-admin__partners-head">
              <span className="eyebrow">
                <InlineInput {...bind("partners_eyebrow", t.partnersEyebrow, "ข้อความเล็กเหนือหัวข้อพันธมิตร")} />
              </span>
              <h2>
                <InlineInput multiline rows={1} {...bind("partners_title", t.partnersTitle, "หัวข้อพันธมิตรและแบรนด์")} />
              </h2>
            </div>
            <PartnerBrands brands={brands} />
          </ExperienceBanner>
          <div className="panel home-admin__hero-bg exp-admin__photo-panel">
            <span className="admin-edit-sidebar__label">
              รูปในกรอบเอียงด้านขวา (ใช้ร่วมกันทั้งสองภาษา)
            </span>
            <ImageUploadField
              value={form.exp_image || ""}
              onChange={(url) => {
                setSuccess(false);
                setForm((f) => ({ ...f, exp_image: url }));
              }}
            />
            <p className="contact-admin__hint">ว่าง = ใช้รูปหุ่นยนต์เริ่มต้น · ระบบลงโทนสีน้ำเงินให้เข้ากับธีมเอง · ภาพแนวนอนจะดูดีที่สุด</p>
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
