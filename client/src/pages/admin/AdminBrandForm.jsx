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

export default function AdminBrandForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [tab, setTab] = useState("data"); // data | upload
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) {
      // New brand: append to the end of the current order instead of
      // hardcoding 0, which would jump it in front of every existing
      // brand (and collide with whichever brand already sits at 0).
      api
        .adminGetBrands()
        .then((brands) => {
          const maxOrder = brands.reduce((max, b) => Math.max(max, b.sort_order ?? 0), -1);
          setSortOrder(maxOrder + 1);
        })
        .catch(() => {});
      return;
    }
    api
      .adminGetBrand(id)
      .then((b) => {
        setName(b.name);
        setSlug(b.slug);
        setLogoUrl(b.logo_url || "");
        setIsActive(b.is_active);
        // Preserve the brand's existing position — otherwise saving an
        // unrelated edit (e.g. swapping the logo) would reset it to 0
        // and silently undo any reordering done from the brand list.
        setSortOrder(b.sort_order ?? 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { name, slug, logoUrl: logoUrl || null, isActive, sortOrder };
      if (isEdit) {
        await api.adminUpdateBrand(id, payload);
      } else {
        await api.adminCreateBrand(payload);
      }
      navigate("/admin/brands");
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
          { label: "แบรนด์", to: "/admin/brands" },
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
          <button type="button" className="btn admin-btn-cancel" onClick={() => navigate("/admin/brands")}>
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
              <div className="admin-edit-notice">โลโก้แบรนด์</div>
              <ImageUploadField value={logoUrl} onChange={setLogoUrl} />
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
