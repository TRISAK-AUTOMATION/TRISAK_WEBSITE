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

// Depth-ordered flat list (for the "- " / "-- " indented dropdown), same
// logic as the list page.
function flattenTree(categories) {
  const byParent = new Map();
  for (const c of categories) {
    const key = c.parent_id ?? "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.sort_order - b.sort_order);
  const result = [];
  function walk(parentKey, depth) {
    for (const child of byParent.get(parentKey) || []) {
      result.push({ ...child, depth });
      walk(child.id, depth + 1);
    }
  }
  walk("root", 0);
  return result;
}

function getDescendantIds(categories, rootId) {
  const ids = new Set();
  const byParent = new Map();
  for (const c of categories) {
    const key = c.parent_id ?? "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  }
  function walk(id) {
    for (const child of byParent.get(id) || []) {
      ids.add(child.id);
      walk(child.id);
    }
  }
  walk(rootId);
  return ids;
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
  const [parentId, setParentId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.adminGetCategories().then(setAllCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api
      .adminGetCategory(id)
      .then((c) => {
        setName(c.name);
        setSlug(c.slug);
        setImageUrl(c.image_url || "");
        setParentId(c.parent_id ? String(c.parent_id) : "");
        setIsActive(c.is_active);
        // Preserve the category's existing position among its siblings
        // — otherwise saving an unrelated edit would silently reset it
        // and undo any reordering done from the category list.
        setSortOrder(c.sort_order ?? 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // New category: append to the end of its sibling group (same
      // parent) instead of defaulting to 0, which would jump it in
      // front of every existing sibling.
      const newParentId = parentId ? Number(parentId) : null;
      const nextSortOrder = isEdit
        ? sortOrder
        : allCategories
            .filter((c) => (c.parent_id ?? null) === newParentId)
            .reduce((max, c) => Math.max(max, c.sort_order ?? 0), -1) + 1;
      const payload = {
        name,
        slug,
        imageUrl: imageUrl || null,
        parentId: newParentId,
        isActive,
        sortOrder: nextSortOrder,
      };
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

  // exclude itself and its own descendants from the parent picker, to
  // avoid creating a cycle in the tree (the backend also rejects this,
  // this is just so the UI doesn't offer an invalid choice in the first place)
  const excludedIds = isEdit ? getDescendantIds(allCategories, Number(id)) : new Set();
  if (isEdit) excludedIds.add(Number(id));
  const parentOptions = flattenTree(allCategories).filter((c) => !excludedIds.has(c.id));

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
            <span className="admin-edit-sidebar__label">หมวดหมู่แม่</span>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">— ไม่มี (หมวดหมู่ใหญ่) —</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.depth > 0 ? "- ".repeat(c.depth) : ""}
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
