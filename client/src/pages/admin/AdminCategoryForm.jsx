import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminCategoryForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [tab, setTab] = useState("data");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    api
      .adminGetCategory(id)
      .then((c) => {
        setName(c.name);
        setSlug(c.slug);
        setImageUrl(c.image_url || "");
        setIsActive(c.is_active);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { name, slug, imageUrl: imageUrl || null, isActive, sortOrder: 0 };
      if (isEdit) {
        await api.adminUpdateCategory(id, payload);
      } else {
        await api.adminCreateCategory(payload);
      }
      navigate("/admin/categories");
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
          { label: "หมวดหมู่", to: "/admin/categories" },
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
            🇹🇭 ข้อมูล
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
          <button
            type="button"
            className="btn admin-btn-cancel"
            onClick={() => navigate("/admin/categories")}
          >
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
                🔔 คุณกำลังจัดการข้อมูล <strong>ภาษาไทย 🇹🇭</strong>
              </div>
              <label className="contact-form__field">
                <span>
                  ชื่อ<span className="admin-required">*</span>
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                />
              </label>
              <label className="contact-form__field" style={{ marginTop: 20 }}>
                <span>Slug</span>
                <input
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                />
              </label>
            </>
          )}

          {tab === "upload" && (
            <>
              <div className="admin-edit-notice">รูปภาพหมวดหมู่</div>
              <ImageUploadField value={imageUrl} onChange={setImageUrl} />
            </>
          )}
        </div>

        <aside className="admin-edit-sidebar">
          <div className="panel admin-edit-sidebar__section">
            <span className="admin-edit-sidebar__label">ภาษา</span>
            <select disabled defaultValue="th">
              <option value="th">🇹🇭 ภาษาไทย</option>
            </select>
          </div>

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
