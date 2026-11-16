import { useState } from "react";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import IconPicker from "../../components/IconPicker.jsx";
import { Icon, WHY_BG_IMAGE, parseIconList } from "../../components/WhyTrisak.jsx";
import { translations } from "../../i18n/translations.js";

/**
 * Admin > History: the "Why TRISAK Group" section (components/WhyTrisak.jsx)
 * edited in place — heading, lede, the reasons on the left, the process
 * chain on the right (icon, title, text, order) and the background photo.
 * Reasons/steps live in about_content.why_reasons / why_steps as JSON text.
 */

const MAX_ITEMS = 8;

/** The built-in reasons or steps in both languages, as stored in the DB. */
export function builtInWhyList(key) {
  const en = translations.en.history[key];
  const th = translations.th.history[key];
  return en.map((item, i) => ({
    icon: item.icon,
    title_en: item.title,
    title_th: th[i]?.title || "",
    body_en: item.body,
    body_th: th[i]?.body || "",
  }));
}

/** Text box that takes the look of the element it sits in. */
function InlineInput({ multiline = false, rows = 2, ...props }) {
  return multiline ? (
    <textarea className="home-admin__input" rows={rows} {...props} />
  ) : (
    <input className="home-admin__input" {...props} />
  );
}

/** ↑ ↓ × for one reason / step. */
function ItemTools({ index, count, min, onMove, onRemove, label }) {
  return (
    <div className="why-admin__tools">
      <button type="button" className="contact-admin__remove" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`เลื่อน${label}ที่ ${index + 1} ขึ้น`} title="เลื่อนขึ้น">
        ↑
      </button>
      <button type="button" className="contact-admin__remove" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`เลื่อน${label}ที่ ${index + 1} ลง`} title="เลื่อนลง">
        ↓
      </button>
      <button type="button" className="contact-admin__remove" disabled={count <= min} onClick={onRemove} aria-label={`ลบ${label}ที่ ${index + 1}`} title="ลบ">
        ×
      </button>
    </div>
  );
}

export default function HistoryWhyEditor({ form, lang, onChange }) {
  const [picker, setPicker] = useState(null); // "reasons:2" / "steps:0"
  const t = translations[lang]?.history || translations.en.history;
  const other = lang === "th" ? "en" : "th";

  const text = (base) => form[`${base}_${lang}`] || "";
  const bind = (base, placeholder, label) => ({
    value: text(base),
    placeholder,
    "aria-label": label,
    onChange: (e) => onChange(`${base}_${lang}`, e.target.value),
  });

  const lists = {
    reasons: parseIconList(form.why_reasons),
    steps: parseIconList(form.why_steps),
  };
  const setList = (which, list) => onChange(which === "reasons" ? "why_reasons" : "why_steps", JSON.stringify(list));
  const updateItem = (which, i, patch) => setList(which, lists[which].map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const moveItem = (which, i, dir) => {
    const next = [...lists[which]];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setList(which, next);
    setPicker(null);
  };
  const removeItem = (which, i) => {
    setList(which, lists[which].filter((_, idx) => idx !== i));
    setPicker(null);
  };
  const addItem = (which) =>
    setList(which, [...lists[which], { icon: "check", title_en: "", title_th: "", body_en: "", body_th: "" }]);

  // the icon button + its picker, shared by reasons (filled disc) and steps (ring)
  const iconButton = (which, i, item, className) => {
    const id = `${which}:${i}`;
    return (
      <>
        <button
          type="button"
          className={`${className} why-admin__icon-btn`}
          data-icon-trigger=""
          aria-label={`เปลี่ยนไอคอน`}
          aria-expanded={picker === id}
          title="คลิกเพื่อเปลี่ยนไอคอน"
          onClick={() => setPicker(picker === id ? null : id)}
        >
          <Icon name={item.icon || "check"} />
          <span className="sol-admin__ring-edit" aria-hidden="true">✎</span>
        </button>
        {picker === id && (
          <IconPicker
            value={item.icon || "check"}
            align="start"
            onChange={(icon) => updateItem(which, i, { icon })}
            onClose={() => setPicker(null)}
          />
        )}
      </>
    );
  };

  const itemText = (which, i, item, Tag, headLabel) => (
    <div className="why-admin__text">
      <Tag>
        <InlineInput
          multiline
          rows={1}
          value={item[`title_${lang}`] || ""}
          placeholder={item[`title_${other}`] || headLabel}
          aria-label={`${headLabel}ที่ ${i + 1}`}
          onChange={(e) => updateItem(which, i, { [`title_${lang}`]: e.target.value })}
        />
      </Tag>
      <p>
        <InlineInput
          multiline
          rows={2}
          value={item[`body_${lang}`] || ""}
          placeholder={item[`body_${other}`] || "คำอธิบาย"}
          aria-label={`คำอธิบายที่ ${i + 1}`}
          onChange={(e) => updateItem(which, i, { [`body_${lang}`]: e.target.value })}
        />
      </p>
    </div>
  );

  const listActions = (which, label) => (
    <div className="sol-admin__list-actions why-admin__actions">
      <button
        type="button"
        className="btn contact-admin__small-btn"
        disabled={lists[which].length >= MAX_ITEMS}
        onClick={() => addItem(which)}
      >
        + เพิ่ม{label}
      </button>
      <button
        type="button"
        className="btn contact-admin__small-btn"
        onClick={() => setList(which, builtInWhyList(which === "reasons" ? "whyReasons" : "whySteps"))}
      >
        ↺ ใช้ค่าเริ่มต้น
      </button>
    </div>
  );

  return (
    <>
      <section className="section why why-admin">
        <div
          className="why__bg"
          aria-hidden="true"
          style={{ backgroundImage: `url("${(form.why_bg_image || WHY_BG_IMAGE).replace(/["\\]/g, "")}")` }}
        />
        <div className="container why__grid">
          <div className="why__intro">
            <h2>
              <InlineInput multiline rows={1} {...bind("why_title", t.whyTitle, "หัวข้อส่วน Why TRISAK")} />
            </h2>
            <div className="why__lede">
              <InlineInput multiline rows={2} {...bind("why_lede", t.whyLede, "คำอธิบายใต้หัวข้อ")} />
            </div>
            <ul className="why__reasons">
              {lists.reasons.map((r, i) => (
                <li className="why__reason why-admin__item" key={i}>
                  <span className="why-admin__icon-wrap">{iconButton("reasons", i, r, "why__disc")}</span>
                  {itemText("reasons", i, r, "h3", "หัวข้อเหตุผล")}
                  <ItemTools
                    index={i}
                    count={lists.reasons.length}
                    min={1}
                    label="เหตุผล"
                    onMove={(dir) => moveItem("reasons", i, dir)}
                    onRemove={() => removeItem("reasons", i)}
                  />
                </li>
              ))}
            </ul>
            {listActions("reasons", "เหตุผล")}
          </div>

          <div className="why__process">
            <h3 className="why__process-title">
              <InlineInput {...bind("why_process_title", t.whyProcessTitle, "หัวข้อขั้นตอนการทำงาน")} />
            </h3>
            <ol className="why__steps">
              {lists.steps.map((s, i) => (
                <li className="why__step why-admin__item" key={i}>
                  <span className="why-admin__icon-wrap">{iconButton("steps", i, s, "why__ring")}</span>
                  {itemText("steps", i, s, "h4", "ชื่อขั้นตอน")}
                  <ItemTools
                    index={i}
                    count={lists.steps.length}
                    min={2}
                    label="ขั้นตอน"
                    onMove={(dir) => moveItem("steps", i, dir)}
                    onRemove={() => removeItem("steps", i)}
                  />
                </li>
              ))}
            </ol>
            {listActions("steps", "ขั้นตอน")}
          </div>
        </div>
      </section>
      <div className="panel home-admin__hero-bg why-admin__bg">
        <span className="admin-edit-sidebar__label">
          ภาพพื้นหลังส่วน Why TRISAK (ด้านหลังขั้นตอนการทำงาน — ใช้ร่วมกันทั้งสองภาษา)
        </span>
        <ImageUploadField value={form.why_bg_image || ""} onChange={(url) => onChange("why_bg_image", url)} />
        <p className="contact-admin__hint">
          ว่าง = ใช้ภาพโรงงานเริ่มต้น · ภาพจะถูกทำให้จางและไล่สีจากซ้ายไปขวาโดยอัตโนมัติ · คลิกที่ไอคอนเพื่อเปลี่ยนหรืออัปโหลดไอคอนเอง ·
          ข้อความที่ยังไม่แปลจะแสดงอีกภาษาแทน (ตัวจาง)
        </p>
      </div>
    </>
  );
}
