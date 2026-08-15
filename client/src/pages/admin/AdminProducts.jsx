import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api
      .adminGetProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    try {
      await api.adminDeleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await api.adminLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <section className="admin-shell">
      <div className="admin-shell__topbar">
        <div>
          <span className="eyebrow">TRISAK Admin</span>
          <h1 style={{ fontSize: "1.8rem" }}>Products</h1>
        </div>
        <div className="admin-shell__actions">
          <Link to="/admin/catalog" className="btn">
            Manage Catalog
          </Link>
          <Link to="/admin/products/new" className="btn btn-primary">
            + Add Product
          </Link>
          <button className="btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>

      {loading && <p className="empty-state">Loading…</p>}
      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      {!loading && !error && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Model</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Series</th>
              <th>New</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.model}</td>
                <td>{p.brand}</td>
                <td>{p.category}</td>
                <td>{p.series || "—"}</td>
                <td>{p.is_new ? "✓" : ""}</td>
                <td className="admin-table__actions">
                  <Link to={`/admin/products/${p.id}/edit`} className="btn">
                    Edit
                  </Link>
                  <button className="btn admin-table__delete" onClick={() => handleDelete(p.id, p.name)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  No products yet — add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
