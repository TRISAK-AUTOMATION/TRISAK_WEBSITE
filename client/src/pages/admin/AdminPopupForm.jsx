import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";

export default function AdminPopupForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [tab, setTab] = useState("data"); // data | upload
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    api
      .adminGetPopup(id)
      .then((p) => {
        setTitle(p.title);
        setMessage(p.message || "");
        setImageUrl(p.image_url || "");
        setLinkUrl(p.link_url || "");
        setLinkLabel(p.link_label || "");
        setIsActive(p.is_active);
        setStartDate(p.start_date ? p.start_date.slice(0, 10) : "");
        setEndDate(p.end_date ? p.end_date.slice(0, 10) : "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        title,
        message: message || null,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        linkLabel: linkLabel || null,
        isActive,
        startDate: startDate || null,
        endDate: endDate || null,
      };
      if (isEdit) {
        await api.adminUpdatePopup(id, payload);
      } else {
        await api.adminCreatePopup(payload);
      }
      navigate("/admin/popups");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="empty-state">กำลังโหลด…</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <AdminBreadcrumb
        items={[
          { label: "ป๊อปอัพ", to: "/admin/popups" },
          { label: isEdit ? "แก้ไข" : "เพิ่ม" },
        ]}
      />

      <div className="admin-edit-tabbar">
        <div className="admin-edit-tabs">
          <button
            type="button"
            className={`admin-edit-tab ${tab === "data" ? "is-active" : ""}`}
            onClick={() => setTab("data")}
          >
            📝 ข้อมูล
          </button>
          <button
            type="button"
            className={`admin-edit-tab ${tab === "upload" ? "is-active" : ""}`}
            onClick={() => setTab("upload")}
          >
            อัพโหลด
          </button>
        </div>
        <div className="admin-edit-tabbar__actions">
          <button type="button" className="btn admin-btn-cancel" onClick={() => navigate("/admin/popups")}>
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            💾 {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-edit-layout">
        <div className="admin-edit-main panel">
          {tab === "data" && (
            <>
              <div className="admin-edit-notice">
                🔔 ป๊อปอัพจะแสดงบนเว็บไซต์เมื่อ <strong>เปิดใช้งาน</strong> และอยู่ในช่วงเวลาที่กำหนด (ถ้ามี)
              </div>
              <label className="contact-form__field">
                <span>
                  หัวข้อ<span className="admin-required">*</span>
                </span>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="contact-form__field" style={{ marginTop: 20 }}>
                <span>ข้อความ</span>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="รายละเอียดของป๊อปอัพ..."
                />
              </label>
              <div className="admin-form__row" style={{ marginTop: 20 }}>
                <label className="contact-form__field">
                  <span>ลิงก์ (URL)</span>
                  <input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="/products หรือ https://example.com"
                  />
                </label>
                <label className="contact-form__field">
                  <span>ข้อความปุ่ม</span>
                  <input
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    placeholder="ดูเพิ่มเติม"
                  />
                </label>
              </div>
              <div className="admin-form__row" style={{ marginTop: 20 }}>
                <label className="contact-form__field">
                  <span>วันที่เริ่มแสดง</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </label>
                <label className="contact-form__field">
                  <span>วันที่สิ้นสุด</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </label>
              </div>
            </>
          )}

          {tab === "upload" && (
            <>
              <div className="admin-edit-notice">รูปภาพป๊อปอัพ (ไม่บังคับ)</div>
              <ImageUploadField value={imageUrl} onChange={setImageUrl} />
            </>
          )}
        </div>

        <aside className="admin-edit-sidebar">
          <div className="panel admin-edit-sidebar__section">
            <span className="admin-edit-sidebar__label">สถานะ</span>
            <label className="admin-toggle">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="admin-toggle__track">
                <span className="admin-toggle__thumb" />
              </span>
              การแสดงผล
            </label>
          </div>
        </aside>
      </div>
    </form>
  );
}
