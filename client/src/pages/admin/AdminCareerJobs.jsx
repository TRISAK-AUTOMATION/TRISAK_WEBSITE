import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import { ConfirmModal } from "../../components/AdminModal.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import { translations } from "../../i18n/translations.js";
import HeroBgMedia from "../../components/HeroBgMedia.jsx";

/**
 * Admin > ตำแหน่งงาน (Career) — /admin/career
 *
 * Laid out like the public Career page so admins edit "in place":
 * job cards on the left, the selected job's full details on the right.
 * Below each job's Welfare and Benefits sit "วิธีการสมัคร" and "ติดต่อ",
 * which are shared by every job (career_page_content).
 *
 * Edits stay local until "บันทึก" — which saves every changed job plus the
 * shared section in one go. Reorder and delete apply immediately.
 */

const PinIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
const MoneyIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 9.5v5M18 9.5v5" />
  </svg>
);
const ClockIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const icon = (d) => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const sectionIcons = {
  summary: icon(<path d="M4 6h16M4 12h16M4 18h10" />),
  responsibilities: icon(
    <>
      <rect x="4" y="4" width="16" height="17" rx="2" />
      <path d="M9 3h6v3H9zM8 11h8M8 15h6" />
    </>
  ),
  requirements: icon(<path d="M20 6L9 17l-5-5" />),
  benefits: icon(
    <path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z" />
  ),
  apply: icon(
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  contact: icon(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
};

const blank = () => ({ en: "", th: "" });
let tempSeq = 1;
function newJob() {
  return {
    id: `new-${tempSeq++}`,
    isNew: true,
    title: blank(),
    location: blank(),
    salary: blank(),
    type: { en: "Full-time", th: "งานประจำ" },
    summary: blank(),
    responsibilities: [blank()],
    requirements: [blank()],
    benefits: [blank()],
    isActive: true,
  };
}

const toPayload = (job) => ({
  title: job.title,
  location: job.location,
  salary: job.salary,
  type: job.type,
  summary: job.summary,
  responsibilities: job.responsibilities,
  requirements: job.requirements,
  benefits: job.benefits,
  isActive: job.isActive,
});

/** Editable list of bilingual rows (add / remove / move), styled like the public list it edits. */
function ListEditor({ items, lang, onChange, addLabel, multiline = false, numbered = false }) {
  const other = lang === "th" ? "en" : "th";
  const set = (next) => onChange(next);
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };
  return (
    <div className="career-admin-list">
      {items.length === 0 && <p className="career-admin__empty">ยังไม่มีหัวข้อ</p>}
      <ol className="career-admin__steps">
        {items.map((item, i) => {
          const props = {
            value: item[lang] || "",
            placeholder: item[other] ? `(${other.toUpperCase()}) ${item[other]}` : "พิมพ์ข้อความ…",
            "aria-label": `หัวข้อที่ ${i + 1}`,
            onChange: (e) => set(items.map((it, idx) => (idx === i ? { ...it, [lang]: e.target.value } : it))),
          };
          return (
            <li key={i} className="career-admin__step">
              {numbered ? (
                <span className="career-steps__no career-admin-list__marker" aria-hidden="true">{i + 1}</span>
              ) : (
                <span className="career-admin-list__bullet" aria-hidden="true" />
              )}
              <label className="contact-form__field career-admin__step-field">
                {multiline ? <textarea rows={2} {...props} /> : <input {...props} />}
              </label>
              <div className="admin-row-actions">
                <button type="button" className="btn pillar-admin__arrow" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`เลื่อนหัวข้อที่ ${i + 1} ขึ้น`} title="เลื่อนขึ้น">↑</button>
                <button type="button" className="btn pillar-admin__arrow" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={`เลื่อนหัวข้อที่ ${i + 1} ลง`} title="เลื่อนลง">↓</button>
                <button type="button" className="btn pillar-admin__delete" onClick={() => set(items.filter((_, idx) => idx !== i))} aria-label={`ลบหัวข้อที่ ${i + 1}`}>ลบ</button>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="btn career-admin-list__add" onClick={() => set([...items, blank()])}>
        + {addLabel}
      </button>
    </div>
  );
}

function Section({ iconKey, title, children, note }) {
  return (
    <section className="career-detail__section">
      <h4 className="career-detail__section-title">
        <span className="career-detail__section-icon">{sectionIcons[iconKey]}</span>
        {title}
        {note && <span className="career-admin__section-note">{note}</span>}
      </h4>
      <div className="career-admin__section-body">{children}</div>
    </section>
  );
}

export default function AdminCareerJobs() {
  const [jobs, setJobs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [dirtyIds, setDirtyIds] = useState(() => new Set());
  const [shared, setShared] = useState({ apply_steps: [], hr_name_en: "", hr_name_th: "", hr_phone: "", hr_email: "", hr_line_id: "" });
  const [sharedDirty, setSharedDirty] = useState(false);
  const [lang, setLang] = useState("th");
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "hero" ? "hero" : "jobs";
  const setTab = (next) => setSearchParams(next === "hero" ? { tab: "hero" } : {}, { replace: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyReorder, setBusyReorder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    Promise.all([api.adminGetCareerJobs(), api.adminGetCareerPageContent()])
      .then(([list, content]) => {
        setJobs(list || []);
        setActiveId(list?.[0]?.id ?? null);
        if (content) {
          setShared((s) => ({ ...s, ...content, apply_steps: Array.isArray(content.apply_steps) ? content.apply_steps : [] }));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const hasChanges = dirtyIds.size > 0 || sharedDirty;
  useEffect(() => {
    if (!hasChanges) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasChanges]);

  const active = useMemo(() => jobs.find((j) => j.id === activeId) || null, [jobs, activeId]);
  const tr = (f) => (f ? f[lang] || f[lang === "th" ? "en" : "th"] || "" : "");

  const updateJob = (patch) => {
    setSuccess(false);
    setJobs((list) => list.map((j) => (j.id === activeId ? { ...j, ...patch } : j)));
    setDirtyIds((s) => new Set(s).add(activeId));
  };
  const setText = (field, value) => updateJob({ [field]: { ...active[field], [lang]: value } });

  const updateShared = (patch) => {
    setSuccess(false);
    setShared((s) => ({ ...s, ...patch }));
    setSharedDirty(true);
  };

  const addJob = () => {
    const job = newJob();
    setJobs((list) => [...list, job]);
    setDirtyIds((s) => new Set(s).add(job.id));
    setActiveId(job.id);
    setSuccess(false);
  };

  const moveJob = async (index, dir) => {
    const j = index + dir;
    const a = jobs[index];
    const b = jobs[j];
    if (!a || !b || a.isNew || b.isNew) return;
    setBusyReorder(true);
    setError("");
    try {
      await api.adminReorderCareerJob(a.id, dir < 0 ? "up" : "down");
      setJobs((list) => {
        const next = [...list];
        [next[index], next[j]] = [next[j], next[index]];
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyReorder(false);
    }
  };

  const confirmDelete = async () => {
    const job = deleteTarget;
    setDeleting(true);
    setDeleteError("");
    try {
      if (!job.isNew) await api.adminDeleteCareerJob(job.id);
      const remaining = jobs.filter((j) => j.id !== job.id);
      setJobs(remaining);
      setDirtyIds((s) => {
        const next = new Set(s);
        next.delete(job.id);
        return next;
      });
      if (activeId === job.id) setActiveId(remaining[0]?.id ?? null);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      let list = jobs;
      // in display order, so new jobs keep the order they were added in
      for (const job of jobs) {
        if (!dirtyIds.has(job.id)) continue;
        let saved;
        try {
          saved = job.isNew
            ? await api.adminCreateCareerJob(toPayload(job))
            : await api.adminUpdateCareerJob(job.id, toPayload(job));
        } catch (err) {
          setActiveId(job.id);
          throw new Error(`${tr(job.title) || "ตำแหน่งใหม่"}: ${err.message}`);
        }
        list = list.map((j) => (j.id === job.id ? saved : j));
        setJobs(list);
        setDirtyIds((s) => {
          const next = new Set(s);
          next.delete(job.id);
          return next;
        });
        if (activeId === job.id) setActiveId(saved.id);
      }
      if (sharedDirty) {
        const updated = await api.adminUpdateCareerPageContent(shared);
        setShared((s) => ({ ...s, ...updated, apply_steps: Array.isArray(updated?.apply_steps) ? updated.apply_steps : s.apply_steps }));
        setSharedDirty(false);
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="empty-state">กำลังโหลด…</p>;

  const hrNameField = `hr_name_${lang}`;
  const heroDefaults = translations[lang]?.career || {};

  return (
    <div className="career-admin">
      <AdminBreadcrumb items={[{ label: "ตำแหน่งงาน (Career)" }]} />

      <div className="admin-edit-tabbar career-admin__tabbar">
        <div className="admin-edit-tabs" role="tablist">
          {[
            ["jobs", "ตำแหน่งงาน"],
            ["hero", "Hero"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`admin-edit-tab${tab === key ? " is-active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="admin-edit-tabbar__actions career-admin__toolbar">
          <label className="career-admin__lang">
            <span>ภาษา</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="th">🇹🇭 ภาษาไทย</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </label>
          <a className="btn" href="/career" target="_blank" rel="noopener noreferrer">ดูหน้าเว็บ ↗</a>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || !hasChanges}>
            💾 {saving ? "กำลังบันทึก…" : hasChanges ? "บันทึก" : "บันทึกแล้ว"}
          </button>
        </div>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
      {success && <SuccessModal onClose={() => setSuccess(false)} />}

      <div className="admin-edit-notice">
        🔔 กำลังแก้ไขเวอร์ชัน <strong>{lang === "th" ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> — เลือกภาษาที่แถบด้านบนเพื่อแก้อีกภาษา{" "}
        {tab === "hero"
          ? "พิมพ์แก้ข้อความใน Hero ด้านล่างได้โดยตรง ช่องที่เว้นว่างจะใช้ข้อความเริ่มต้น (ตัวจาง) แล้วกด “บันทึก”"
          : "กดการ์ดด้านซ้ายเพื่อแก้ไขตำแหน่งนั้น แล้วกด “บันทึก” (การเรียงลำดับและการลบมีผลทันที)"}
      </div>

      {tab === "hero" && (
        <div className="career-admin__hero-wrap">
          <section className={`hero hero--compact hero--centered career-hero career-admin__hero${shared.hero_bg_image ? " hero--has-bg" : ""}`}>
            {shared.hero_bg_image && (
              <>
                <HeroBgMedia src={shared.hero_bg_image} />
                <div className="hero__bg-scrim" aria-hidden="true" />
              </>
            )}
            <div className="hero__grid-overlay" aria-hidden="true" />
            <div className="container hero__content career-admin__hero-content">
              <span className="hero__meta">
                <input
                  className="career-admin__hero-input"
                  aria-label="ข้อความเล็กเหนือหัวข้อ (Meta)"
                  value={shared[`hero_meta_${lang}`] || ""}
                  placeholder={heroDefaults.heroMeta}
                  onChange={(e) => updateShared({ [`hero_meta_${lang}`]: e.target.value })}
                />
              </span>
              <h1>
                <input
                  className="career-admin__hero-input"
                  aria-label="หัวข้อหลัก"
                  value={shared[`hero_title_${lang}`] || ""}
                  placeholder={heroDefaults.heroTitle}
                  onChange={(e) => updateShared({ [`hero_title_${lang}`]: e.target.value })}
                />
              </h1>
              <p className="hero__sub">
                <textarea
                  className="career-admin__hero-input"
                  rows={2}
                  aria-label="คำอธิบายใต้หัวข้อ"
                  value={shared[`hero_sub_${lang}`] || ""}
                  placeholder={heroDefaults.heroSub || "คำอธิบายใต้หัวข้อ (ไม่บังคับ)"}
                  onChange={(e) => updateShared({ [`hero_sub_${lang}`]: e.target.value })}
                />
              </p>
            </div>
          </section>

          <div className="panel career-admin__hero-bg">
            <span className="admin-edit-sidebar__label">ภาพพื้นหลัง Hero (ไม่บังคับ — ใช้ร่วมกันทั้งสองภาษา)</span>
            <ImageUploadField accept="image/*,video/mp4" maxSizeMB={10} value={shared.hero_bg_image || ""} onChange={(url) => updateShared({ hero_bg_image: url })} />
          </div>
        </div>
      )}

      {tab === "jobs" && (
      <div className="career-board career-admin__board">
        {/* LEFT — job cards, as on the public page */}
        <div className="career-list">
          <div className="career-list__head">
            <span className="career-list__count">{jobs.length} ตำแหน่ง</span>
            <span className="career-list__hint">{jobs.filter((j) => !j.isActive).length} ซ่อนอยู่</span>
          </div>

          {jobs.map((job, i) => {
            const selected = job.id === activeId;
            const dirty = dirtyIds.has(job.id);
            return (
              <div key={job.id} className={`career-admin__card-wrap${job.isActive ? "" : " is-hidden"}`}>
                <button
                  type="button"
                  className={`career-card${selected ? " is-active" : ""}`}
                  aria-pressed={selected}
                  onClick={() => setActiveId(job.id)}
                >
                  <span className="career-admin__badges">
                    {!job.isActive && <span className="career-admin__badge">ซ่อนอยู่</span>}
                    {job.isNew ? (
                      <span className="career-admin__badge career-admin__badge--new">ใหม่ · ยังไม่บันทึก</span>
                    ) : (
                      dirty && <span className="career-admin__badge career-admin__badge--dirty">ยังไม่บันทึก</span>
                    )}
                  </span>
                  <span className="career-card__title">{tr(job.title) || "(ยังไม่มีชื่อตำแหน่ง)"}</span>
                  <span className="career-card__meta">
                    <span className="career-card__meta-item"><PinIcon />{tr(job.location) || "—"}</span>
                    <span className="career-card__meta-item"><MoneyIcon />{tr(job.salary) || "—"}</span>
                  </span>
                  <span className="career-card__summary">{tr(job.summary) || "—"}</span>
                </button>
                <div className="career-admin__card-order">
                  <button type="button" className="btn pillar-admin__arrow" disabled={busyReorder || i === 0 || job.isNew || jobs[i - 1]?.isNew} onClick={() => moveJob(i, -1)} aria-label="เลื่อนตำแหน่งขึ้น" title="เลื่อนขึ้น">↑</button>
                  <button type="button" className="btn pillar-admin__arrow" disabled={busyReorder || i === jobs.length - 1 || job.isNew || jobs[i + 1]?.isNew} onClick={() => moveJob(i, 1)} aria-label="เลื่อนตำแหน่งลง" title="เลื่อนลง">↓</button>
                </div>
              </div>
            );
          })}

          <button type="button" className="career-admin__add-card" onClick={addJob}>
            + เพิ่มตำแหน่งงาน
          </button>
        </div>

        {/* RIGHT — full details of the selected job, editable */}
        <article className="career-detail career-admin__detail">
          {active ? (
            <>
              <header className="career-detail__head">
                <div className="career-detail__heading">
                  <label className="career-admin__field-label">
                    ชื่อตำแหน่ง
                    <input
                      className="career-admin__title-input"
                      value={active.title[lang] || ""}
                      placeholder={active.title[lang === "th" ? "en" : "th"] || "ชื่อตำแหน่งงาน"}
                      onChange={(e) => setText("title", e.target.value)}
                    />
                  </label>
                </div>
                <div className="career-admin__job-actions">
                  <label className="admin-toggle">
                    <input type="checkbox" checked={active.isActive} onChange={(e) => updateJob({ isActive: e.target.checked })} />
                    <span className="admin-toggle__track"><span className="admin-toggle__thumb" /></span>
                    {active.isActive ? "แสดงบนเว็บ" : "ซ่อนอยู่"}
                  </label>
                  <button
                    type="button"
                    className="btn pillar-admin__delete"
                    onClick={() => {
                      setDeleteError("");
                      setDeleteTarget(active);
                    }}
                  >
                    🗑 ลบตำแหน่งนี้
                  </button>
                </div>
                <div className="career-detail__chips">
                  {[
                    ["location", <PinIcon key="i" />, "สถานที่"],
                    ["salary", <MoneyIcon key="i" />, "เงินเดือน"],
                    ["type", <ClockIcon key="i" />, "ประเภทงาน"],
                  ].map(([field, ic, label]) => (
                    <label key={field} className="career-chip career-admin__chip">
                      {ic}
                      <input
                        value={active[field][lang] || ""}
                        placeholder={label}
                        aria-label={label}
                        onChange={(e) => setText(field, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </header>

              <Section iconKey="summary" title="รายละเอียดย่อ" note="แสดงบนการ์ด ประมาณ 3 บรรทัด">
                <label className="contact-form__field">
                  <textarea
                    rows={3}
                    aria-label="รายละเอียดย่อ"
                    value={active.summary[lang] || ""}
                    placeholder={active.summary[lang === "th" ? "en" : "th"] || ""}
                    onChange={(e) => setText("summary", e.target.value)}
                  />
                </label>
              </Section>

              <Section iconKey="responsibilities" title="Job Responsibilities">
                <ListEditor items={active.responsibilities} lang={lang} addLabel="เพิ่มหน้าที่" onChange={(v) => updateJob({ responsibilities: v })} />
              </Section>

              <Section iconKey="requirements" title="Requirements">
                <ListEditor items={active.requirements} lang={lang} addLabel="เพิ่มคุณสมบัติ" onChange={(v) => updateJob({ requirements: v })} />
              </Section>

              <Section iconKey="benefits" title="Welfare and Benefits">
                <ListEditor items={active.benefits} lang={lang} addLabel="เพิ่มสวัสดิการ" onChange={(v) => updateJob({ benefits: v })} />
              </Section>
            </>
          ) : (
            <p className="career-admin__empty">ยังไม่มีตำแหน่งงาน — กด “+ เพิ่มตำแหน่งงาน” ด้านซ้าย</p>
          )}

          <div className="career-admin__shared-divider">
            <span>ส่วนด้านล่างใช้ร่วมกันทุกตำแหน่งงาน</span>
          </div>

          <Section iconKey="apply" title={lang === "th" ? "วิธีการสมัคร" : "How to Apply"}>
            <ListEditor
              items={shared.apply_steps}
              lang={lang}
              multiline
              numbered
              addLabel="เพิ่มหัวข้อ"
              onChange={(v) => updateShared({ apply_steps: v })}
            />
          </Section>

          <Section iconKey="contact" title={lang === "th" ? "ติดต่อ" : "Contact"}>
            <div className="career-contact career-admin__contact">
              <label className="contact-form__field career-contact__person">
                <span className="career-contact__dept">ฝ่ายบุคคล — ชื่อผู้ติดต่อ</span>
                <input value={shared[hrNameField] || ""} onChange={(e) => updateShared({ [hrNameField]: e.target.value })} />
              </label>
              <div className="career-contact__list">
                {[
                  ["hr_phone", "โทรศัพท์", "tel"],
                  ["hr_email", "อีเมล", "email"],
                  ["hr_line_id", "Line ID", "text"],
                ].map(([f, label, type]) => (
                  <label key={f} className="career-contact__row career-admin__contact-row">
                    <span>{label}</span>
                    <input type={type} value={shared[f] || ""} onChange={(e) => updateShared({ [f]: e.target.value })} />
                  </label>
                ))}
              </div>
            </div>
          </Section>
        </article>
      </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="ลบตำแหน่งงาน"
          message={`ต้องการลบตำแหน่ง "${tr(deleteTarget.title) || "ตำแหน่งใหม่"}" ใช่หรือไม่?`}
          detail="การลบไม่สามารถย้อนกลับได้"
          confirmLabel="ลบ"
          cancelLabel="ยกเลิก"
          busyLabel="กำลังลบ…"
          busy={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
