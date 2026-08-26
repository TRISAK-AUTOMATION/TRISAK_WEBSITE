import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../../api/client.js";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";

const emptyForm = {
  name: "",
  slug: "",
  brandId: "",
  categoryId: "",
  seriesId: "",
  model: "",
  shortDescription: "",
  description: "",
  imageUrl: "",
  isNew: false,
  features: [],
  images: [],
  specs: [],
  documents: [],
  relatedProductIds: [],
};

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.adminGetBrands().then(setBrands).catch(() => {});
    api.adminGetCategories().then(setCategories).catch(() => {});
    api.adminGetSeriesList().then(setSeriesList).catch(() => {});
    api.adminGetProducts().then(setAllProducts).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api
      .adminGetProduct(id)
      .then((p) => {
        setForm({
          name: p.name || "",
          slug: p.slug || "",
          brandId: String(p.brand_id || ""),
          categoryId: String(p.category_id || ""),
          seriesId: p.series_id ? String(p.series_id) : "",
          model: p.model || "",
          shortDescription: p.short_description || "",
          description: p.description || "",
          imageUrl: p.image_url || "",
          isNew: p.is_new || false,
          features: p.features || [],
          images: p.images?.map((i) => ({ imageUrl: i.image_url, sortOrder: i.sort_order })) || [],
          specs: p.specs?.map((s) => ({ label: s.label, value: s.value, sortOrder: s.sort_order })) || [],
          documents:
            p.documents?.map((d) => ({
              label: d.label,
              fileUrl: d.file_url,
              docType: d.doc_type,
              sortOrder: d.sort_order,
            })) || [],
          relatedProductIds: p.relatedProductIds || [],
          // Preserve the product's existing position — otherwise saving
          // an unrelated edit would silently reset it and undo any
          // reordering done from the product list.
          sortOrder: p.sort_order ?? 0,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const seriesForBrandCategory = seriesList.filter(
    (s) => String(s.brand_id) === form.brandId && String(s.category_id) === form.categoryId
  );

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleNameChange = (value) => {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  };

  // ---- dynamic list helpers (features / specs / documents / images) ----
  const addListItem = (field, item) =>
    setForm((f) => ({ ...f, [field]: [...f[field], item] }));
  const updateListItem = (field, index, patch) =>
    setForm((f) => ({
      ...f,
      [field]: f[field].map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  const removeListItem = (field, index) =>
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));

  const toggleRelated = (productId) => {
    setForm((f) => {
      const has = f.relatedProductIds.includes(productId);
      return {
        ...f,
        relatedProductIds: has
          ? f.relatedProductIds.filter((id2) => id2 !== productId)
          : [...f.relatedProductIds, productId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      brandId: Number(form.brandId),
      categoryId: Number(form.categoryId),
      seriesId: form.seriesId ? Number(form.seriesId) : null,
      // New product: append to the end of the current order instead of
      // defaulting to 0, which would jump it in front of every existing
      // product (and collide with whichever product already sits at 0).
      sortOrder: isEdit
        ? form.sortOrder ?? 0
        : allProducts.reduce((max, p) => Math.max(max, p.sort_order ?? 0), -1) + 1,
    };
    try {
      if (isEdit) {
        await api.adminUpdateProduct(id, payload);
      } else {
        await api.adminCreateProduct(payload);
      }
      navigate("/admin/products");
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
    <>
      <AdminBreadcrumb
        items={[
          { label: "รายการ", to: "/admin/products" },
          { label: isEdit ? "แก้ไข" : "เพิ่ม" },
        ]}
      />

      <form className="admin-form" onSubmit={handleSubmit}>
        {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

        <div className="admin-form__section panel">
          <h3>Basics</h3>
          <div className="admin-form__row">
            <label className="contact-form__field">
              <span>Name *</span>
              <input required value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
            </label>
            <label className="contact-form__field">
              <span>Slug *</span>
              <input
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  updateField("slug", e.target.value);
                }}
              />
            </label>
          </div>

          <div className="admin-form__row">
            <label className="contact-form__field">
              <span>Brand *</span>
              <select
                required
                value={form.brandId}
                onChange={(e) => updateField("brandId", e.target.value)}
              >
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="contact-form__field">
              <span>Category *</span>
              <select
                required
                value={form.categoryId}
                onChange={(e) => updateField("categoryId", e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="contact-form__field">
              <span>
                Series{" "}
                <Link to="/admin/series/new" className="admin-form__inline-link">
                  (+ add new)
                </Link>
              </span>
              <select value={form.seriesId} onChange={(e) => updateField("seriesId", e.target.value)}>
                <option value="">No series</option>
                {seriesForBrandCategory.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-form__row">
            <label className="contact-form__field">
              <span>Model</span>
              <input value={form.model} onChange={(e) => updateField("model", e.target.value)} />
            </label>
            <label className="contact-form__field">
              <span>Short Description</span>
              <input
                value={form.shortDescription}
                onChange={(e) => updateField("shortDescription", e.target.value)}
              />
            </label>
          </div>

          <label className="contact-form__field">
            <span>Description</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </label>

          <div className="admin-form__row">
            <div className="contact-form__field">
              <span>Main Image</span>
              <ImageUploadField
                value={form.imageUrl}
                onChange={(url) => updateField("imageUrl", url)}
              />
            </div>
            <label className="admin-form__checkbox">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => updateField("isNew", e.target.checked)}
              />
              <span>Mark as "NEW"</span>
            </label>
          </div>
        </div>

        <div className="admin-form__section panel">
          <h3>Features</h3>
          {form.features.map((feat, i) => (
            <div className="admin-form__list-row" key={i}>
              <input
                value={feat}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    features: f.features.map((x, idx) => (idx === i ? e.target.value : x)),
                  }))
                }
              />
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }))
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn"
            onClick={() => setForm((f) => ({ ...f, features: [...f.features, ""] }))}
          >
            + Add feature
          </button>
        </div>

        <div className="admin-form__section panel">
          <h3>Additional Images</h3>
          <div className="admin-form__image-grid">
            {form.images.map((img, i) => (
              <div className="admin-form__image-slot" key={i}>
                <ImageUploadField
                  value={img.imageUrl}
                  onChange={(url) => updateListItem("images", i, { imageUrl: url })}
                />
                <button type="button" className="btn" onClick={() => removeListItem("images", i)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => addListItem("images", { imageUrl: "", sortOrder: form.images.length })}
          >
            + Add image
          </button>
        </div>

        <div className="admin-form__section panel">
          <h3>Specifications</h3>
          {form.specs.map((spec, i) => (
            <div className="admin-form__list-row admin-form__list-row--pair" key={i}>
              <input
                placeholder="Label (e.g. Program Capacity)"
                value={spec.label}
                onChange={(e) => updateListItem("specs", i, { label: e.target.value })}
              />
              <input
                placeholder="Value (e.g. 512 KB)"
                value={spec.value}
                onChange={(e) => updateListItem("specs", i, { value: e.target.value })}
              />
              <button type="button" className="btn" onClick={() => removeListItem("specs", i)}>
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn"
            onClick={() =>
              addListItem("specs", { label: "", value: "", sortOrder: form.specs.length })
            }
          >
            + Add spec
          </button>
        </div>

        <div className="admin-form__section panel">
          <h3>Documents</h3>
          {form.documents.map((doc, i) => (
            <div className="admin-form__list-row admin-form__list-row--pair" key={i}>
              <input
                placeholder="Label (e.g. Datasheet (PDF))"
                value={doc.label}
                onChange={(e) => updateListItem("documents", i, { label: e.target.value })}
              />
              <input
                placeholder="File URL"
                value={doc.fileUrl}
                onChange={(e) => updateListItem("documents", i, { fileUrl: e.target.value })}
              />
              <button type="button" className="btn" onClick={() => removeListItem("documents", i)}>
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn"
            onClick={() =>
              addListItem("documents", {
                label: "",
                fileUrl: "",
                docType: "pdf",
                sortOrder: form.documents.length,
              })
            }
          >
            + Add document
          </button>
        </div>

        <div className="admin-form__section panel">
          <h3>Related Products</h3>
          <div className="admin-form__related-grid">
            {allProducts
              .filter((p) => !isEdit || String(p.id) !== id)
              .map((p) => (
                <label key={p.id} className="admin-form__checkbox">
                  <input
                    type="checkbox"
                    checked={form.relatedProductIds.includes(p.id)}
                    onChange={() => toggleRelated(p.id)}
                  />
                  <span>
                    {p.name} <span className="tag-index">{p.brand}</span>
                  </span>
                </label>
              ))}
          </div>
        </div>

        <div className="admin-form__submit-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
          </button>
          <Link to="/admin/products" className="btn">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
