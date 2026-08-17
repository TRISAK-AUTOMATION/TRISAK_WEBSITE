import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const TABS = ["brands", "categories", "series"];

export default function AdminCatalog() {
  const [tab, setTab] = useState("series"); // series is the one people usually come here for
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [error, setError] = useState("");

  const loadAll = () => {
    api.adminGetBrands().then(setBrands).catch((e) => setError(e.message));
    api.adminGetCategories().then(setCategories).catch((e) => setError(e.message));
    api.adminGetSeriesList().then(setSeriesList).catch((e) => setError(e.message));
  };

  useEffect(loadAll, []);

  return (
    <section className="admin-shell">
      <div className="admin-shell__topbar">
        <div>
          <span className="eyebrow">TRISAK Admin</span>
          <h1 style={{ fontSize: "1.8rem" }}>Manage Catalog</h1>
        </div>
        <Link to="/admin/products" className="btn">
          ← Back to products
        </Link>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="pill-row">
        {TABS.map((tb) => (
          <button key={tb} className={`pill ${tab === tb ? "is-active" : ""}`} onClick={() => setTab(tb)}>
            {tb === "brands" ? "Brands" : tb === "categories" ? "Categories" : "Series"}
          </button>
        ))}
      </div>

      {tab === "brands" && <BrandsTab brands={brands} onChanged={loadAll} setError={setError} />}
      {tab === "categories" && (
        <CategoriesTab categories={categories} onChanged={loadAll} setError={setError} />
      )}
      {tab === "series" && (
        <SeriesTab
          seriesList={seriesList}
          brands={brands}
          categories={categories}
          onChanged={loadAll}
          setError={setError}
        />
      )}
    </section>
  );
}

// =====================================================================
// Brands
// =====================================================================

function BrandsTab({ brands, onChanged, setError }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.adminCreateBrand({ name, slug, sortOrder: brands.length + 1 });
      setName("");
      setSlug("");
      setSlugTouched(false);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (b) => {
    setEditingId(b.id);
    setEditForm({ name: b.name, slug: b.slug });
  };

  const saveEdit = async (id) => {
    setError("");
    try {
      await api.adminUpdateBrand(id, { ...editForm, sortOrder: 0 });
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (b) => {
    if (!confirm(`Delete brand "${b.name}"?`)) return;
    setError("");
    try {
      await api.adminDeleteBrand(b.id);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-form">
      <div className="admin-form__section panel">
        <h3>Existing Brands</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id}>
                {editingId === b.id ? (
                  <>
                    <td>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        value={editForm.slug}
                        onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                      />
                    </td>
                    <td className="admin-table__actions">
                      <button className="btn btn-primary" onClick={() => saveEdit(b.id)}>
                        Save
                      </button>
                      <button className="btn" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{b.name}</td>
                    <td>{b.slug}</td>
                    <td className="admin-table__actions">
                      <button className="btn" onClick={() => startEdit(b)}>
                        Edit
                      </button>
                      <button className="btn admin-table__delete" onClick={() => handleDelete(b)}>
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={3} className="empty-state">
                  No brands yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form className="admin-form__section panel" onSubmit={handleSubmit}>
        <h3>Add Brand</h3>
        <div className="admin-form__row">
          <label className="contact-form__field">
            <span>Name *</span>
            <input
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label className="contact-form__field">
            <span>Slug *</span>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </label>
        </div>
        <div className="admin-form__submit-row" style={{ padding: "8px 0 0" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Adding…" : "Add Brand"}
          </button>
        </div>
      </form>
    </div>
  );
}

// =====================================================================
// Categories
// =====================================================================

function CategoriesTab({ categories, onChanged, setError }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.adminCreateCategory({ name, slug, sortOrder: categories.length + 1 });
      setName("");
      setSlug("");
      setSlugTouched(false);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditForm({ name: c.name, slug: c.slug });
  };

  const saveEdit = async (id) => {
    setError("");
    try {
      await api.adminUpdateCategory(id, { ...editForm, sortOrder: 0 });
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    setError("");
    try {
      await api.adminDeleteCategory(c.id);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-form">
      <div className="admin-form__section panel">
        <h3>Existing Categories</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                {editingId === c.id ? (
                  <>
                    <td>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        value={editForm.slug}
                        onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                      />
                    </td>
                    <td className="admin-table__actions">
                      <button className="btn btn-primary" onClick={() => saveEdit(c.id)}>
                        Save
                      </button>
                      <button className="btn" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{c.name}</td>
                    <td>{c.slug}</td>
                    <td className="admin-table__actions">
                      <button className="btn" onClick={() => startEdit(c)}>
                        Edit
                      </button>
                      <button className="btn admin-table__delete" onClick={() => handleDelete(c)}>
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="empty-state">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form className="admin-form__section panel" onSubmit={handleSubmit}>
        <h3>Add Category</h3>
        <div className="admin-form__row">
          <label className="contact-form__field">
            <span>Name *</span>
            <input
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label className="contact-form__field">
            <span>Slug *</span>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </label>
        </div>
        <div className="admin-form__submit-row" style={{ padding: "8px 0 0" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Adding…" : "Add Category"}
          </button>
        </div>
      </form>
    </div>
  );
}

// =====================================================================
// Series
// =====================================================================

function SeriesTab({ seriesList, brands, categories, onChanged, setError }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.adminCreateSeries({
        name,
        slug,
        brandId: Number(brandId),
        categoryId: Number(categoryId),
        tagline,
        description,
        isNew,
        sortOrder: seriesList.length + 1,
      });
      setName("");
      setSlug("");
      setSlugTouched(false);
      setTagline("");
      setDescription("");
      setIsNew(false);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      slug: s.slug,
      brandId: String(s.brand_id),
      categoryId: String(s.category_id),
      tagline: s.tagline || "",
      description: s.description || "",
      isNew: s.is_new,
    });
  };

  const saveEdit = async (id) => {
    setError("");
    try {
      await api.adminUpdateSeries(id, {
        ...editForm,
        brandId: Number(editForm.brandId),
        categoryId: Number(editForm.categoryId),
        sortOrder: 0,
      });
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete series "${s.name}"?`)) return;
    setError("");
    try {
      await api.adminDeleteSeries(s.id);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-form">
      <div className="admin-form__section panel">
        <h3>Existing Series</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Slug</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {seriesList.map((s) => (
              <tr key={s.id}>
                {editingId === s.id ? (
                  <>
                    <td>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </td>
                    <td>
                      <select
                        value={editForm.brandId}
                        onChange={(e) => setEditForm((f) => ({ ...f, brandId: e.target.value }))}
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={editForm.categoryId}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, categoryId: e.target.value }))
                        }
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        value={editForm.slug}
                        onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                      />
                    </td>
                    <td className="admin-table__actions">
                      <button className="btn btn-primary" onClick={() => saveEdit(s.id)}>
                        Save
                      </button>
                      <button className="btn" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{s.name}</td>
                    <td>{s.brand_name}</td>
                    <td>{s.category_name}</td>
                    <td>{s.slug}</td>
                    <td className="admin-table__actions">
                      <button className="btn" onClick={() => startEdit(s)}>
                        Edit
                      </button>
                      <button className="btn admin-table__delete" onClick={() => handleDelete(s)}>
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {seriesList.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  No series yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {editingId && (
          <div className="admin-form__row" style={{ marginTop: 16 }}>
            <label className="contact-form__field">
              <span>Tagline (editing "{editForm.name}")</span>
              <input
                value={editForm.tagline}
                onChange={(e) => setEditForm((f) => ({ ...f, tagline: e.target.value }))}
              />
            </label>
            <label className="admin-form__checkbox">
              <input
                type="checkbox"
                checked={editForm.isNew}
                onChange={(e) => setEditForm((f) => ({ ...f, isNew: e.target.checked }))}
              />
              <span>Mark as "NEW"</span>
            </label>
          </div>
        )}
      </div>

      <form className="admin-form__section panel" onSubmit={handleSubmit}>
        <h3>Add Series</h3>

        {(brands.length === 0 || categories.length === 0) && (
          <p className="contact-form__status contact-form__status--error">
            Add at least one Brand and one Category first (see the tabs above) before creating a
            series.
          </p>
        )}

        <div className="admin-form__row">
          <label className="contact-form__field">
            <span>Name *</span>
            <input
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label className="contact-form__field">
            <span>Slug *</span>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </label>
        </div>

        <div className="admin-form__row">
          <label className="contact-form__field">
            <span>Brand *</span>
            <select required value={brandId} onChange={(e) => setBrandId(e.target.value)}>
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
            <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="contact-form__field">
          <span>Tagline</span>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </label>

        <label className="contact-form__field">
          <span>Description</span>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <label className="admin-form__checkbox">
          <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
          <span>Mark as "NEW"</span>
        </label>

        <div className="admin-form__submit-row" style={{ padding: "8px 0 0" }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || brands.length === 0 || categories.length === 0}
          >
            {saving ? "Adding…" : "Add Series"}
          </button>
        </div>
      </form>
    </div>
  );
}
