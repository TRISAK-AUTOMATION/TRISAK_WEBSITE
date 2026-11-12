import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { HomePageHeader, HOME_AUTOMATION_PATH } from "../../components/HomeAdmin.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";
import SignalLine from "../../components/SignalLine.jsx";
import { GroupWordmark } from "../../components/GroupSlider.jsx";
import { translations } from "../../i18n/translations.js";
import trisakLogo from "../../assets/logos/trisak.png";
import faccoLogo from "../../assets/logos/facco.png";
import htcLogo from "../../assets/logos/htc.png";
import HeroBgMedia from "../../components/HeroBgMedia.jsx";

/**
 * Admin > Home > Content — laid out exactly like the public Home page
 * (pages/Home.jsx): the real Hero, "Our Strength" and CTA sections are
 * rendered with the front-end classes and their text is edited in place.
 * Empty fields fall back to the built-in translation (shown as a faded
 * placeholder), the same rule the public page uses. Sections whose data is
 * managed elsewhere are shown as a short band with a link to their editor.
 */

const GROUP_LOGOS = [
  { src: trisakLogo, height: 45 },
  { src: faccoLogo, height: 48 },
  { src: htcLogo, height: 66 },
];

const FIELD_SUFFIXES = [
  "hero_meta",
  "hero_title_line1",
  "hero_title_line2",
  "hero_sub",
  "strength_eyebrow",
  "strength_title",
  "strength1_title",
  "strength1_body",
  "strength2_title",
  "strength2_body",
  "strength3_title",
  "strength3_body",
  "cta_title_line1",
  "cta_title_line2",
];

function emptyForm() {
  const form = { hero_bg_image: "", strength1_cert_image: "", strength2_cert_image: "", strength3_cert_image: "" };
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

/** Placeholder band for a section that is edited from another admin page. */
function ManagedElsewhere({ eyebrow, title, note, to, linkLabel, className = "" }) {
  return (
    <section className={`section home-admin__managed ${className}`}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <div className="home-admin__managed-note">
          <span>🔒 {note}</span>
          {to && (
            <Link to={to} className="btn">
              {linkLabel} →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default function AdminHomeEditor() {
  const [form, setForm] = useState(emptyForm);
  const [savedForm, setSavedForm] = useState(null);
  const [lang, setLang] = useState("th"); // which language's fields are shown for editing
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .getHomeContent()
      .then((d) => {
        const next = { ...emptyForm(), ...(d || {}) };
        setForm(next);
        setSavedForm(next);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const t = translations[lang]?.home || translations.en.home;
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

  const hasChanges = savedForm && JSON.stringify(form) !== JSON.stringify(savedForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await api.adminUpdateHomeContent(form);
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

  const heroBgImage = form.hero_bg_image;

  return (
    <form onSubmit={handleSubmit}>
      <HomePageHeader
        actions={
          <div className="home-admin__toolbar">
            <label className="career-admin__lang">
              <span>ภาษา</span>
              <select value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="th">🇹🇭 ภาษาไทย</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </label>
            <a className="btn" href="/" target="_blank" rel="noopener noreferrer">
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
        🔔 กำลังแก้ไขเวอร์ชัน <strong>{lang === "th" ? "ภาษาไทย 🇹🇭" : "English 🇬🇧"}</strong> — หน้าด้านล่างแสดงเหมือนหน้าแรกจริง
        คลิกที่ข้อความเพื่อพิมพ์แก้ได้ทันที ช่องที่เว้นว่างจะใช้ข้อความเริ่มต้น (ตัวจาง) ระบบจะบันทึกทั้งสองภาษาพร้อมกันตอนกด
        “บันทึก”
      </div>

      <div className="home-admin__page">
        {/* 01 — HERO */}
        <section className={`hero hero--home home-admin__hero ${heroBgImage ? "hero--has-bg" : ""}`}>
          {heroBgImage && (
            <>
              <HeroBgMedia src={heroBgImage} />
              <div className="hero__bg-scrim" aria-hidden="true" />
            </>
          )}
          <div className="hero__grid-overlay" aria-hidden="true" />
          <div className="container hero__content">
            <span className="hero__meta">
              <InlineInput {...bind("hero_meta", t.heroMeta, "ข้อความเล็กเหนือหัวข้อ (Meta)")} />
            </span>
            <h1>
              <InlineInput {...bind("hero_title_line1", t.heroTitleLine1, "หัวข้อ บรรทัดที่ 1")} />
              <InlineInput {...bind("hero_title_line2", t.heroTitleLine2, "หัวข้อ บรรทัดที่ 2")} />
            </h1>
            <p className="hero__sub">
              <InlineInput multiline rows={3} {...bind("hero_sub", t.heroSub, "คำอธิบายใต้หัวข้อ")} />
            </p>
            <div className="hero__actions">
              <span className="btn btn-primary home-admin__static-btn">
                {common.viewProducts} <span className="btn-arrow">→</span>
              </span>
              <span className="btn btn-light home-admin__static-btn">
                {common.automationSolution} <span className="btn-arrow">→</span>
              </span>
            </div>
          </div>
        </section>

        <div className="panel home-admin__hero-bg">
          <span className="admin-edit-sidebar__label">ภาพพื้นหลัง Hero (ไม่บังคับ — ใช้ร่วมกันทั้งสองภาษา)</span>
          <ImageUploadField
            accept="image/*,video/mp4"
            maxSizeMB={10}
            value={heroBgImage}
            onChange={(url) => {
              setSuccess(false);
              setForm((f) => ({ ...f, hero_bg_image: url }));
            }}
          />
        </div>

        {/* 02 — OUR CUSTOMERS */}
        <ManagedElsewhere
          className="home-admin__managed--slim"
          eyebrow="Customers"
          title={lang === "th" ? "โลโก้ลูกค้า (แถบเลื่อน)" : "Customer logos (marquee)"}
          note="จัดการโลโก้ลูกค้าได้ที่เมนู “ลูกค้าของเรา (Our Customers)”"
          to="/admin/customers"
          linkLabel="ไปที่ลูกค้าของเรา"
        />

        {/* 03 — OUR STRENGTH */}
        <section className="section strength-grid">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">
                <InlineInput {...bind("strength_eyebrow", t.strengthEyebrow, "ข้อความเล็กเหนือหัวข้อ (Eyebrow)")} />
              </span>
              {/* Fixed brand heading — same as the public Home page. */}
              <h2>
                <GroupWordmark />
              </h2>
            </div>
            <div className="strength-signal">
              <SignalLine nodes={3} orientation="horizontal" />
            </div>
            <div className="grid cols-3">
              {[1, 2, 3].map((n, i) => (
                <div className="grid-cell strength-block" key={n}>
                  <div className="strength-block__logo-wrap">
                    <img
                      className="strength-block__logo"
                      src={GROUP_LOGOS[i].src}
                      alt=""
                      style={{ height: GROUP_LOGOS[i].height }}
                    />
                  </div>
                  <label className="home-admin__alt">
                    <span>ชื่อ (ใช้เป็นข้อความแทนโลโก้)</span>
                    <InlineInput {...bind(`strength${n}_title`, t.strengths[i]?.title, `จุดแข็งข้อที่ ${n} — หัวข้อ`)} />
                  </label>
                  <p>
                    <InlineInput
                      multiline
                      rows={3}
                      {...bind(`strength${n}_body`, t.strengths[i]?.body, `จุดแข็งข้อที่ ${n} — รายละเอียด`)}
                    />
                  </p>
                  <div className="home-admin__alt">
                    <span>รูปใบ Certificate (แสดงด้านขวาของสไลด์ — ใช้ร่วมกันทั้งสองภาษา)</span>
                    <ImageUploadField
                      value={form[`strength${n}_cert_image`] || ""}
                      accept="image/jpeg,image/png,image/webp"
                      maxSizeMB={5}
                      onChange={(url) => {
                        setSuccess(false);
                        setForm((f) => ({ ...f, [`strength${n}_cert_image`]: url }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04 — PRODUCTS */}
        <ManagedElsewhere
          eyebrow={t.productsEyebrow}
          title={t.productsTitle}
          note="โลโก้แบรนด์ในส่วนนี้ดึงจากเมนู สินค้า → “แบรนด์” อัตโนมัติ"
          to="/admin/brands"
          linkLabel="ไปที่แบรนด์"
        />

        {/* 05 — AUTOMATION SOLUTIONS */}
        <ManagedElsewhere
          eyebrow={t.solutionsEyebrow}
          title={t.solutionsTitle}
          note="การ์ดโซลูชันแก้ไขได้จากแท็บ “โซลูชันระบบอัตโนมัติ” ด้านบน"
          to={HOME_AUTOMATION_PATH}
          linkLabel="แก้ไขการ์ดโซลูชัน"
        />

        {/* 06 — INDUSTRIES */}
        <ManagedElsewhere
          eyebrow={t.industriesEyebrow}
          title={t.industriesTitle}
          note="สไลด์อุตสาหกรรมจัดการได้ที่เมนู “สไลด์อุตสาหกรรม (Industries Slider)”"
          to="/admin/industries"
          linkLabel="ไปที่สไลด์อุตสาหกรรม"
        />

        {/* 07 — CTA */}
        <section className="cta-band">
          <div className="container cta-band__wrap">
            <h2 className="home-admin__cta-title">
              <InlineInput {...bind("cta_title_line1", t.ctaTitleLine1, "CTA หัวข้อ บรรทัดที่ 1")} />
              <InlineInput {...bind("cta_title_line2", t.ctaTitleLine2, "CTA หัวข้อ บรรทัดที่ 2")} />
            </h2>
            <span className="btn btn-primary home-admin__static-btn">
              {common.contactUs} <span className="btn-arrow">→</span>
            </span>
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
