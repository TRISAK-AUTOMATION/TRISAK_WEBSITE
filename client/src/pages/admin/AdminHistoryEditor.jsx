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
import ImageListField from "../../components/ImageListField.jsx";
import { expPhotos, EXP_PHOTOS_DEFAULT } from "../../components/ExpGallery.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";
import SectionLabel from "../../components/SectionLabel.jsx";
import { parseIconList } from "../../components/WhyTrisak.jsx";
import HistoryWhyEditor, { builtInWhyList } from "./HistoryWhyEditor.jsx";
import { PartnerBrands, OrgChart, INTRO_IMAGE_DEFAULT, foundedYear, storyEntries, unitSep } from "../History.jsx";
import HistoryStory from "../../components/HistoryStory.jsx";
import { TodaySection, WorkSection, ClosingSection } from "../../components/HistorySections.jsx";
import { translations } from "../../i18n/translations.js";

/**
 * Admin > ประวัติบริษัท (History) > Content — built from the same sections as
 * the public History page (pages/History.jsx): opening story, Today, Why,
 * Organization, Our work, Closing. Text is edited in place; empty fields fall
 * back to the built-in translation (shown as a faded placeholder), the same
 * rule the public page uses. The opening uses its plain (flow) layout so it
 * holds still for editing. Timeline and Organization are previews with a link
 * to their tab; statistics are edited in place.
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
  const form = { hero_bg_image: "", intro_image: "", why_bg_image: "", why_reasons: "", why_steps: "", exp_image: "", exp_images: [] };
  for (const base of FIELD_SUFFIXES) {
    form[`${base}_en`] = "";
    form[`${base}_th`] = "";
  }
  return form;
}

// exp_images is kept as an array while editing (the API stores a JSON string);
// an older single exp_image becomes the first item of the list.
function withPhotoList(d) {
  const photos = expPhotos({ exp_images: d.exp_images, exp_image: d.exp_image });
  return { ...d, exp_images: photos === EXP_PHOTOS_DEFAULT ? [] : photos };
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
        const next = withPhotoList({ ...emptyForm(), ...(d || {}) });
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
  const common = translations[lang]?.common || translations.en.common;

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
        const updated = await api.adminUpdateAboutContent({ ...form, exp_image: form.exp_images[0] || "" });
        const next = withPhotoList({ ...form, ...updated });
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
  const otherLang = lang === "th" ? "en" : "th";
  // one statistic as edit boxes: the label (dt) over the value + unit (dd)
  const renderStat = (s) => {
    const row = statRows.find((r) => r.id === s.id);
    return (
      <>
        <dt>
          <InlineInput
            value={row[`label_${lang}`] || ""}
            aria-label="คำอธิบายตัวเลข"
            placeholder={row[`label_${otherLang}`] || "คำอธิบาย"}
            onChange={(e) => updateStat(s.id, { [`label_${lang}`]: e.target.value })}
          />
        </dt>
        <dd className="history-admin__stat-num">
          <InlineInput
            value={row.value}
            aria-label="ตัวเลข"
            placeholder="0"
            onChange={(e) => updateStat(s.id, { value: e.target.value })}
          />
          <InlineInput
            value={row[`unit_${lang}`] || ""}
            aria-label="หน่วย / เครื่องหมายต่อท้าย"
            placeholder={row[`unit_${otherLang}`] || "+"}
            onChange={(e) => updateStat(s.id, { [`unit_${lang}`]: e.target.value })}
          />
        </dd>
      </>
    );
  };
  const toNode = (n) => ({
    id: n.id,
    name: pick(n, "name"),
    person: pick(n, "person"),
    image: n.image_url,
    children: (n.children || []).map(toNode),
  });
  const orgRoots = (historyContent?.org || []).map(toNode);
  const founded = foundedYear(timeline);
  const previewLoading = !historyContent;
  const emptyNote = (text) => (
    <p className="empty-state history-admin__empty">{previewLoading ? "กำลังโหลด…" : text}</p>
  );
  const setPhotos = (patch) => {
    setSuccess(false);
    setForm((f) => ({ ...f, ...patch }));
  };

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
        🔔 กำลังแก้ไขเวอร์ชัน <strong>{lang === "th" ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> — หน้าด้านล่างเรียงเหมือนหน้าประวัติบริษัทจริง
        คลิกที่ข้อความเพื่อพิมพ์แก้ได้ทันที ช่องที่เว้นว่างจะใช้ข้อความเริ่มต้น (ตัวจาง) ระบบจะบันทึกทั้งสองภาษาพร้อมกันตอนกด
        “บันทึก” ส่วนไทม์ไลน์ / โครงสร้างองค์กร แก้ไขได้จากแท็บด้านบน (ช่วงเปิดหน้าแสดงแบบเลื่อนลงธรรมดาเพื่อให้แก้ได้
        ส่วนหน้าเว็บจริงบนจอใหญ่เป็นแบบเลื่อนดูทีละปี)
      </div>

      <div className="home-admin__page history-admin__page">
        {/* 1. OPENING: photo, title, lede + the timeline as chapters */}
        <div className="container history-admin__under">
          <div className="panel home-admin__hero-bg">
            <span className="admin-edit-sidebar__label">รูปเปิดหน้า (ใช้ร่วมกันทั้งสองภาษา · ว่าง = รูปเริ่มต้น)</span>
            <ImageUploadField
              accept="image/*"
              maxSizeMB={10}
              value={form.intro_image || ""}
              onChange={(url) => setPhotos({ intro_image: url })}
            />
          </div>
        </div>
        <HistoryStory
          flow
          photo={form.intro_image || INTRO_IMAGE_DEFAULT}
          eyebrow={founded ? "TRISAK GROUP · " + t.factSince + " " + founded : "TRISAK GROUP"}
          title={<InlineInput multiline rows={1} {...bind("intro_title", t.introTitle, "หัวข้อ")} />}
          lede={<InlineInput multiline rows={2} {...bind("intro_lede", t.introLede, "ข้อความเกริ่นนำ (Lede)")} />}
          entries={storyEntries(timeline, brands)}
          labels={t.story}
        />
        <div className="container history-admin__under">
          <ManagedBar
            note={
              timeline.length
                ? "ปี / ข้อความ / รูปของแต่ละช่วง แก้ไขได้จากแท็บ “ไทม์ไลน์ (Timeline)”"
                : previewLoading
                  ? "กำลังโหลดไทม์ไลน์…"
                  : "ยังไม่มีรายการไทม์ไลน์ที่เปิดใช้งาน"
            }
            to={HISTORY_TIMELINE_PATH}
            linkLabel="แก้ไขไทม์ไลน์"
          />
        </div>

        {/* 2. TODAY: years in automation, intro paragraph, statistics (edited in place) */}
        <TodaySection
          eyebrow={t.todayEyebrow}
          years={founded ? new Date().getFullYear() - founded : null}
          yearsLabel={t.factYears}
          body={<InlineInput multiline rows={4} {...bind("intro_body", t.introBody, "เนื้อหาย่อหน้าหลัก")} />}
          stats={stats}
          unitSep={unitSep}
          renderStat={renderStat}
        />
        <div className="container history-admin__under">
          <ManagedBar
            note={
              stats.length
                ? "แก้ตัวเลขและคำอธิบายได้ด้านบน — เพิ่ม / ลบ / สลับลำดับ / ซ่อน ทำที่แท็บ “สถิติ (Statistics)”"
                : "ยังไม่มีสถิติที่เปิดใช้งาน"
            }
            to={HISTORY_STATS_PATH}
            linkLabel="จัดการสถิติ"
          />
        </div>

        {/* 3. WHY TRISAK GROUP — edited in place */}
        <HistoryWhyEditor
          form={form}
          lang={lang}
          onChange={(field, val) => {
            setSuccess(false);
            setForm((f) => ({ ...f, [field]: val }));
          }}
        />

        {/* 4. ORGANIZATION — preview, edited in its tab */}
        <section className="section history-section history-org history-admin__managed">
          <div className="container">
            <ManagedBar note="โครงสร้างองค์กรแก้ไขได้จากแท็บ “โครงสร้างองค์กร”" to={HISTORY_ORG_PATH} linkLabel="แก้ไขโครงสร้าง" />
            <SectionLabel title={t.structureTitle} />
            {orgRoots.length ? <OrgChart roots={orgRoots} /> : emptyNote("ยังไม่มีโครงสร้างองค์กร (หน้าเว็บจะซ่อนส่วนนี้)")}
          </div>
        </section>

        {/* 5. OUR WORK: heading, lede and the photo slider */}
        <WorkSection
          eyebrow={<InlineInput {...bind("exp_eyebrow", t.experienceEyebrow, "ข้อความเล็กเหนือหัวข้อ")} />}
          title={<InlineInput multiline rows={1} {...bind("exp_title", t.experienceTitle, "หัวข้อผลงาน")} />}
          lede={<InlineInput multiline rows={2} {...bind("exp_lede", t.experienceLede, "คำอธิบายใต้หัวข้อ")} />}
          photos={form.exp_images.length ? form.exp_images : EXP_PHOTOS_DEFAULT}
          galleryLabels={t.expGallery}
        />
        <div className="container history-admin__under">
          <div className="panel home-admin__hero-bg">
            <span className="admin-edit-sidebar__label">รูปผลงาน (ใช้ร่วมกันทั้งสองภาษา · สูงสุด 12 รูป)</span>
            <ImageListField max={12} value={form.exp_images} onChange={(urls) => setPhotos({ exp_images: urls })} />
            <p className="contact-admin__hint">
              แสดงเป็นสไลด์ เริ่มจากรูปที่ 1 · ใช้ลูกศรสลับลำดับ · ว่าง = ใช้รูปเริ่มต้น · ภาพแนวนอนคมชัดจะดูดีที่สุด
            </p>
          </div>
        </div>

        {/* 6. CLOSING: partners + call to action (logos come from Admin > Brands) */}
        <ClosingSection
          eyebrow={<InlineInput {...bind("partners_eyebrow", t.partnersEyebrow, "ข้อความเล็กเหนือหัวข้อพันธมิตร")} />}
          title={t.ctaTitle}
          sub={t.ctaSub}
          logos={<PartnerBrands brands={brands} />}
          contactLabel={common.contactUs}
          productsLabel={common.viewProducts}
        />
        <div className="container history-admin__under">
          <ManagedBar note="โลโก้ดึงจากเมนูแบรนด์ (Brands)" />
        </div>
      </div>

      <div className="admin-form__submit-row">
        <button type="submit" className="btn btn-primary" disabled={saving || !hasChanges}>
          {saving ? "กำลังบันทึก…" : hasChanges ? "บันทึก" : "บันทึกแล้ว"}
        </button>
      </div>
    </form>
  );
}
