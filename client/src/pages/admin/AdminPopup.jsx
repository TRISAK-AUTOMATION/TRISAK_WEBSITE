import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";

export default function AdminPopup() {
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api
      .adminGetPopupSettings()
      .then((d) => {
        if (d) {
          setImageUrl(d.image_url || "");
          setIsActive(d.is_active);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await api.adminUpdatePopupSettings({
        imageUrl: imageUrl || null,
        isActive,
      });
      setImageUrl(updated.image_url || "");
      setIsActive(updated.is_active);
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

  return (
    <form onSubmit={handleSubmit}>
      <AdminBreadcrumb items={[{ label: "การตั้งค่า" }, { label: "ป๊อปอัพ" }]} />

      <div className="admin-edit-tabbar">
        <h2 style={{ margin: 0 }}>ป๊อปอัพหน้าแรก</h2>
        <div className="admin-edit-tabbar__actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            💾 {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
      {success && <p className="contact-form__status contact-form__status--ok">บันทึกสำเร็จ</p>}

      <div className="admin-edit-layout">
        <div className="admin-edit-main panel">
          <div className="admin-edit-notice">
            🔔 ป๊อปอัพนี้จะแสดง<strong>ทุกครั้ง</strong>ที่มีการโหลดหน้าแรก (รีเฟรช, กลับมาที่หน้าแรก,
            หรือเปิดเซสชันใหม่) เป็นรูปภาพล้วน ไม่มีข้อความหรือปุ่มใดๆ — ปิดได้ด้วยปุ่ม × เท่านั้น
          </div>
          <p className="admin-form__hint">
            แนะนำรูปภาพแนวตั้งหรือสี่เหลี่ยมจัตุรัส พื้นหลังโปร่งใสหรือทึบก็ได้ ไฟล์ไม่เกิน 5 MB
          </p>
          <ImageUploadField value={imageUrl} onChange={setImageUrl} />
        </div>

        <aside className="admin-edit-sidebar">
          <div className="panel admin-edit-sidebar__section">
            <span className="admin-edit-sidebar__label">การแสดงผล</span>
            <label className="admin-toggle">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="admin-toggle__track">
                <span className="admin-toggle__thumb" />
              </span>
              เปิดใช้งานป๊อปอัพ
            </label>
            {isActive && !imageUrl && (
              <p className="admin-form__hint" style={{ marginTop: 10 }}>
                ⚠️ ยังไม่มีรูปภาพ — ป๊อปอัพจะยังไม่แสดงจนกว่าจะอัพโหลดรูปภาพ
              </p>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
