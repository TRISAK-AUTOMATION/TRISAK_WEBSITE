import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import { ConfirmModal, useToast } from "../../components/AdminModal.jsx";
import AdminProductForm from "./AdminProductForm.jsx";

const PAGE_SIZE = 10;

const ISSUE_LABELS = {
  "missing-image": "แสดงเฉพาะสินค้าที่ยังไม่มีรูปภาพ",
  "missing-datasheet": "แสดงเฉพาะสินค้าที่ยังไม่มี Datasheet",
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  // edit popup / delete confirmation popup / success notification
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { toast, showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const issue = searchParams.get("issue") || "";

  // `silent` refreshes the list in place without flashing the loading row
  const load = ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    return api
      .adminGetProducts()
      .then((data) => {
        setProducts(data);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => {
      if (issue === "missing-image") return !p.image_url;
      if (issue === "missing-datasheet") return !p.has_datasheet;
      return true;
    });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // If deleting the last item of the last page leaves it empty, step back.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Clicking Delete only opens the confirmation popup — nothing is deleted yet.
  const handleDelete = (product) => {
    setDeleteError("");
    setDeleteTarget(product);
  };

  const cancelDelete = () => setDeleteTarget(null);

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.adminDeleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      showToast("Product deleted successfully.");
      load({ silent: true });
    } catch {
      // keep the popup open and the product in the list
      setDeleteError("The product could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaved = () => {
    setEditingId(null);
    showToast("Product updated successfully.");
    load({ silent: true });
  };

  const handleReorder = async (id, direction) => {
    setError("");
    try {
      await api.adminReorderProduct(id, direction);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async () => {
    setError("");
    setExporting(true);
    try {
      await api.adminExportProductsExcel();
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "รายการ" }]} />

      {issue && ISSUE_LABELS[issue] && (
        <div className="admin-edit-notice" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{ISSUE_LABELS[issue]}</span>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setSearchParams({});
              setPage(1);
            }}
          >
            ล้างตัวกรอง ✕
          </button>
        </div>
      )}

      <div className="admin-list-toolbar">
        <input
          type="text"
          placeholder="ค้นหา..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="admin-list-toolbar__actions">
          <button type="button" className="btn" onClick={handleExport} disabled={exporting}>
            {exporting ? "กำลัง Export…" : "⬇ Export Excel"}
          </button>
          <Link to="/admin/products/import" className="btn">
            ⬆ Import Excel
          </Link>
          <Link to="/admin/products/new" className="btn btn-primary">
            + เพิ่ม
          </Link>
        </div>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-list-table-wrap">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>รูปภาพ</th>
              <th>ชื่อ</th>
              <th>แบรนด์ / หมวดหมู่ / ซีรีย์</th>
              <th>จัดเรียง</th>
              <th>อัพเดท</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="empty-state">
                  กำลังโหลด…
                </td>
              </tr>
            )}
            {!loading && pageItems.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  ยังไม่มีสินค้า — เพิ่มรายการแรกได้เลย
                </td>
              </tr>
            )}
            {!loading &&
              pageItems.map((p, i) => (
                <tr key={p.id}>
                  <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td>
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="admin-list-thumb" />
                    ) : (
                      <span className="admin-list-thumb admin-list-thumb--empty" />
                    )}
                  </td>
                  <td>
                    {p.name} {p.is_new && <span className="admin-badge-new">NEW</span>}
                    <div className="admin-list-table__submeta">{p.model}</div>
                  </td>
                  <td className="admin-list-table__muted">
                    {p.brand} / {p.category}
                    {p.series ? ` / ${p.series}` : ""}
                  </td>
                  <td>
                    <div className="admin-sort-arrows">
                      <button onClick={() => handleReorder(p.id, "up")} aria-label="เลื่อนขึ้น">
                        ↑
                      </button>
                      <button onClick={() => handleReorder(p.id, "down")} aria-label="เลื่อนลง">
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="admin-list-table__date">
                    {new Date(p.updated_at).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn--edit"
                        onClick={() => setEditingId(p.id)}
                        title="แก้ไข"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn--delete"
                        onClick={() => handleDelete(p)}
                        title="ลบ"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="admin-pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ก่อนหน้า
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            ถัดไป
          </button>
          <span className="admin-pagination__total">
            {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} จาก{" "}
            {filtered.length} รายการ
          </span>
        </div>
      )}

      {editingId !== null && (
        <AdminProductForm
          key={editingId}
          productId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Product?"
          message="Are you sure you want to delete this product? This action cannot be undone."
          detail={`${deleteTarget.name}${deleteTarget.model ? ` · ${deleteTarget.model}` : ""}`}
          busy={deleting}
          error={deleteError}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}

      {toast}
    </>
  );
}
