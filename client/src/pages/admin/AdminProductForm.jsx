import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../../api/client.js";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import AdminModal, { ModalButton } from "../../components/AdminModal.jsx";
import ProductDocumentsPanel from "../../components/ProductDocumentsPanel.jsx";
import { AVAILABILITY_OPTIONS, REPLACEMENT_STATUSES } from "../../utils/productAvailability.js";

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
  relatedProductIds: [],
  availabilityStatus: "available",
  statusNote: "",
  replacementProductId: "",
};

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Turn a raw API/database error into something an admin can act on.
function saveErrorMessage(err) {
  const msg = (err && err.message) || "";
  if (/duplicate key|unique constraint/i.test(msg)) {
    return "The product could not be saved because this slug is already used by another product. Please use a different slug and try again.";
  }
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return "The product could not be saved. Please check your connection and try again.";
  }
  return msg ? `The product could not be saved: ${msg}` : "The product could not be saved. Please try again.";
}

/**
 * Product form. Two modes:
 *  - page mode (default): used by /admin/products/new and /admin/products/:id/edit
 *  - modal mode: pass `onClose` (and optionally `productId` / `onSaved`) to
 *    render the edit form inside the shared admin modal popup — this is what
 *    the Edit button on the product list uses.
 */
export default function AdminProductForm({ productId, onClose, onSaved } = {}) {
  const routeParams = useParams();
  const embedded = Boolean(onClose);
  const id = productId != null ? String(productId) : routeParams.id;
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
  const [loadFailed, setLoadFailed] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [statusUpdatedAt, setStatusUpdatedAt] = useState(null);
  const [sourceData, setSourceData] = useState({ stock: null, itemStatus: null }); // read-only, set by Excel import
  const [replacementFilter, setReplacementFilter] = useState("");

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
        const loaded = {
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
          relatedProductIds: p.relatedProductIds || [],
          availabilityStatus: p.availability_status || "available",
          statusNote: p.status_note || "",
          replacementProductId: p.replacement_product_id ? String(p.replacement_product_id) : "",
          // Preserve the product's existing position — otherwise saving
          // an unrelated edit would silently reset it and undo any
          // reordering done from the product list.
          sortOrder: p.sort_order ?? 0,
        };
        setForm(loaded);
        setStatusUpdatedAt(p.status_updated_at || null);
        setSourceData({ stock: p.stock_quantity ?? null, itemStatus: p.item_status || null });
        setInitialSnapshot(JSON.stringify(loaded));
      })
      .catch((err) => {
        setLoadFailed(true);
        setError(err.message || "The product could not be loaded.");
      })
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

  // ---- dynamic list helpers (features / specs / images) ----
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

  // In the popup, backdrop-click / Esc only dismiss it while nothing has been
  // changed, so a stray click can't throw away a long edit.
  const dirty = embedded && initialSnapshot !== null && JSON.stringify(form) !== initialSnapshot;

  const validate = () => {
    if (!form.name.trim()) return "Please enter the product name.";
    if (!form.slug.trim()) return "Please enter a slug.";
    if (!form.brandId) return "Please select a brand.";
    if (!form.categoryId) return "Please select a category.";
    if (form.availabilityStatus === "replacement_available" && !form.replacementProductId)
      return "Please select the replacement product, or choose a different availability status.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim(),
      brandId: Number(form.brandId),
      categoryId: Number(form.categoryId),
      seriesId: form.seriesId ? Number(form.seriesId) : null,
      // Replacement is only sent for statuses that can have one, and only
      // when the admin picked it — nothing is inferred.
      statusNote: form.statusNote.trim(),
      replacementProductId: form.replacementProductId ? Number(form.replacementProductId) : null,
      // New product: append to the end of the current order instead of
      // defaulting to 0, which would jump it in front of every existing
      // product (and collide with whichever product already sits at 0).
      sortOrder: isEdit
        ? form.sortOrder ?? 0
        : allProducts.reduce((max, p) => Math.max(max, p.sort_order ?? 0), -1) + 1,
    };
    // Picker hidden (e.g. status Available after an import): don't send the
    // field at all, so the stored replacement link is kept, not cleared.
    if (!REPLACEMENT_STATUSES.includes(form.availabilityStatus)) delete payload.replacementProductId;
    try {
      if (isEdit) {
        await api.adminUpdateProduct(id, payload);
      } else {
        await api.adminCreateProduct(payload);
      }
      if (embedded) {
        onSaved?.();
      } else {
        navigate("/admin/products");
      }
    } catch (err) {
      setError(saveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const canHaveReplacement = REPLACEMENT_STATUSES.includes(form.availabilityStatus);
  const filterText = replacementFilter.trim().toLowerCase();
  const replacementChoices = allProducts.filter((p) => {
    if (String(p.id) === String(id)) return false; // never itself
    if (String(p.id) === form.replacementProductId) return true; // keep current pick visible
    if (!filterText) return true;
    return [p.model, p.name, p.brand].filter(Boolean).join(" ").toLowerCase().includes(filterText);
  });

  const handleStatusChange = (value) => updateField("availabilityStatus", value);

  const formId = "product-edit-form";

  const fields = (
    <>
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
                Series
                {!embedded && (
                  <>
                    {" "}
                    <Link to="/admin/series/new" className="admin-form__inline-link">
                      (+ add new)
                    </Link>
                  </>
                )}
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
          <h3>Availability</h3>
          <div className="admin-form__row">
            <label className="contact-form__field">
              <span>Status</span>
              <select value={form.availabilityStatus} onChange={(e) => handleStatusChange(e.target.value)}>
                {AVAILABILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="contact-form__field">
              <span>Status note (optional)</span>
              <input
                maxLength={500}
                value={form.statusNote}
                onChange={(e) => updateField("statusNote", e.target.value)}
                placeholder="e.g. Last-time buy until Dec 2026"
              />
            </label>
          </div>

          {canHaveReplacement && (
            <div className="admin-form__row">
              <label className="contact-form__field">
                <span>Find replacement product</span>
                <input
                  value={replacementFilter}
                  onChange={(e) => setReplacementFilter(e.target.value)}
                  placeholder="Search model, name or brand"
                />
              </label>
              <label className="contact-form__field">
                <span>Replacement product{form.availabilityStatus === "replacement_available" ? " *" : ""}</span>
                <select
                  value={form.replacementProductId}
                  onChange={(e) => updateField("replacementProductId", e.target.value)}
                >
                  <option value="">No replacement selected</option>
                  {replacementChoices.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.model ? `${p.model} — ${p.name}` : p.name} ({p.brand})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {isEdit && (
            <p className="admin-list-table__muted">
              Excel source data — In Stock: {sourceData.stock ?? "not set"}, Item Status:{" "}
              {sourceData.itemStatus || "not set"} (set by Excel import; Available / Unavailable / Discontinued are
              recalculated from these on each import).
            </p>
          )}

          {isEdit && (
            <p className="admin-list-table__muted">
              Status last updated:{" "}
              {statusUpdatedAt
                ? new Date(statusUpdatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
                : "not recorded yet"}
            </p>
          )}
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
          {isEdit ? (
            <ProductDocumentsPanel productId={id} />
          ) : (
            <p className="admin-form__hint">Save the product first, then come back to edit it to add PDF documents.</p>
          )}
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

    </>
  );

  // ---------- modal mode ----------
  if (embedded) {
    return (
      <AdminModal
        title="Edit Product"
        size="lg"
        onClose={onClose}
        busy={saving}
        dismissible={!dirty}
        error={error}
        footer={
          <>
            <ModalButton onClick={onClose} disabled={saving}>
              Cancel
            </ModalButton>
            <ModalButton
              type="submit"
              form={formId}
              variant="primary"
              disabled={saving || loading || loadFailed}
            >
              {saving ? "Saving…" : "Save"}
            </ModalButton>
          </>
        }
      >
        {loading && <p className="empty-state">กำลังโหลด…</p>}
        {!loading && !loadFailed && (
          <form id={formId} className="admin-form" onSubmit={handleSubmit}>
            {fields}
          </form>
        )}
      </AdminModal>
    );
  }

  // ---------- page mode ----------
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

      {loadFailed ? (
        <p className="contact-form__status contact-form__status--error">{error}</p>
      ) : (
        <form className="admin-form" onSubmit={handleSubmit}>
          {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
          {fields}

          <div className="admin-form__submit-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
            </button>
            <Link to="/admin/products" className="btn">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
