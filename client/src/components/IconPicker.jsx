import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { Icon, ICON_NAMES, isIconUrl } from "./WhyTrisak.jsx";

// Shared by Admin > Automation Solution (process steps) and Admin > History
// ("Why TRISAK Group" reasons and steps). Styles: .sol-admin__picker* in admin.css.

// Thai names for the built-in icons (tooltip in the icon picker).
export const ICON_LABELS = {
  consult: "ให้คำปรึกษา", design: "ออกแบบ", box: "จัดหาสินค้า", wrench: "ติดตั้ง", check: "ตรวจสอบ/เสร็จสิ้น",
  headset: "ซัพพอร์ต", gear: "ระบบ/เฟือง", team: "ทีมงาน", handshake: "ความร่วมมือ", globe: "ทั่วโลก",
  search: "สำรวจ/ค้นหา", clipboard: "เช็กลิสต์", document: "เอกสาร/สเปก", chip: "PLC/ชิป", robot: "หุ่นยนต์",
  factory: "โรงงาน", chart: "ผลลัพธ์/กราฟ", shield: "ความปลอดภัย", truck: "ขนส่ง/ส่งมอบ", bolt: "ไฟฟ้า/พลังงาน",
  bulb: "ไอเดีย", target: "เป้าหมาย", rocket: "เริ่มใช้งาน", calendar: "วางแผน", clock: "เวลา/ตรงเวลา",
  award: "รับรองคุณภาพ", leaf: "ประหยัดพลังงาน", graduation: "ฝึกอบรม",
};
const MAX_ICON_MB = 1;

/**
 * Popover under a step's ring: every built-in icon as a clickable tile, plus
 * uploading an own icon (SVG/PNG with a transparent background — it is tinted
 * to the theme colour on the public page).
 */
export default function IconPicker({ value, align, onChange, onClose }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onDown = (e) => {
      // clicks on the trigger button itself are handled by its own toggle
      if (ref.current && !ref.current.contains(e.target) && !e.target.closest?.("[data-icon-trigger]")) onClose();
    };
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/svg+xml", "image/png", "image/webp"].includes(file.type)) return setError("ใช้ไฟล์ SVG, PNG หรือ WebP");
    if (file.size > MAX_ICON_MB * 1024 * 1024) return setError(`ไฟล์ต้องไม่เกิน ${MAX_ICON_MB} MB`);
    setBusy(true);
    setError("");
    try {
      const { url } = await api.adminUploadImage(file);
      onChange(url);
      onClose();
    } catch (err) {
      setError(err.message || "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={ref} className={`sol-admin__picker sol-admin__picker--${align}`} role="dialog" aria-label="เลือกไอคอน">
      <div className="sol-admin__picker-title">เลือกไอคอน</div>
      <div className="sol-admin__picker-grid">
        {ICON_NAMES.map((key) => (
          <button
            key={key}
            type="button"
            className={`sol-admin__picker-tile${value === key ? " is-selected" : ""}`}
            title={ICON_LABELS[key] || key}
            aria-label={ICON_LABELS[key] || key}
            aria-pressed={value === key}
            onClick={() => {
              onChange(key);
              onClose();
            }}
          >
            <Icon name={key} />
          </button>
        ))}
      </div>
      <div className="sol-admin__picker-upload">
        {isIconUrl(value) && (
          <span className="sol-admin__picker-tile is-selected" title="ไอคอนที่อัปโหลดไว้">
            <Icon name={value} />
          </span>
        )}
        <label className="btn contact-admin__small-btn" style={{ cursor: busy ? "wait" : "pointer" }}>
          {busy ? "กำลังอัปโหลด…" : isIconUrl(value) ? "⬆ เปลี่ยนไอคอนที่อัปโหลด" : "⬆ อัปโหลดไอคอนเอง"}
          <input type="file" accept="image/svg+xml,image/png,image/webp" hidden onChange={upload} disabled={busy} />
        </label>
      </div>
      <p className="contact-admin__hint">
        SVG หรือ PNG พื้นหลังใส ไม่เกิน {MAX_ICON_MB} MB — ระบบลงสีให้เข้ากับธีมเอง
      </p>
      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
    </div>
  );
}

