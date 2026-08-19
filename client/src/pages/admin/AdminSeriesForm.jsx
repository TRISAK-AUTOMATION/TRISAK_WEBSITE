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

export default function AdminSeriesForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [tab, setTab] = useState("data");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.adminGetBrands().then(setBrands).catch(() => {});
    api.adminGetCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api
      .adminGetSeries(id)
      .then((s) => {
        setName(s.name);
        setSlug(s.slug);
        setTagline(s.tagline || "");
        setDescription(s.description || "");
        setImageUrl(s.image_url || "");
        setBrandId(String(s.brand_id));
        setCategoryId(String(s.category_id));
        setIsNew(s.is_new);
        setIsActive(s.is_active);
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
        name,
        slug,
        tagline,
        description,
        imageUrl: imageUrl || null,
        brandId: Number(brandId),
        categoryId: Number(categoryId),
        isNew,
        isActive,
        sortOrder: 0,
      };
      if (isEdit) {
        await api.adminUpdateSeries(id, payload);
      } else {
        await api.adminCreateSeries(payload);
      }
      navigate("/admin/series");
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
          { label: "ซีรีย์", to: "/admin/series" },
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
            onClick={() => navigate("/admin/series")}
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
              <label className="contact-form__field" style={{ marginTop: 20 }}>
                <span>Tagline</span>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </label>
              <label className="contact-form__field" style={{ marginTop: 20 }}>
                <span>รายละเอียด</span>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              <label className="admin-form__checkbox" style={{ marginTop: 20 }}>
                <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
                <span>เป็นสินค้าใหม่ (NEW)</span>
              </label>
            </>
          )}

          {tab === "upload" && (
            <>
              <div className="admin-edit-notice">รูปภาพซีรีย์</div>
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
            <span className="admin-edit-sidebar__label">แบรนด์</span>
            <select required value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              <option value="">กรุณาเลือก แบรนด์</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="panel admin-edit-sidebar__section">
            <span className="admin-edit-sidebar__label">หมวดหมู่</span>
            <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">กรุณาเลือก หมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
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
