import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";

/**
 * "Our Customers" logo management — deliberately image-only (no name,
 * link, or other text fields), matching the public carousel which only
 * ever renders the logos themselves.
 *
 * Each existing logo is managed through ImageUploadField's own
 * Change/Remove controls: "Change image" = replace, "Remove" = delete
 * the logo entirely. A permanent empty ImageUploadField at the end acts
 * as the "add a new logo" slot — uploading to it creates a new entry
 * and the slot resets itself for the next one.
 */
export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null); // per-card busy state (replace/delete/reorder)
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .adminGetCustomers()
      .then(setCustomers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAdd = async (url) => {
    if (!url) return; // ImageUploadField fires "" on Remove — nothing to add there
    setError("");
    setAdding(true);
    try {
      await api.adminCreateCustomer({ imageUrl: url });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleImageChange = async (customer, url) => {
    setError("");
    setBusyId(customer.id);
    try {
      if (url) {
        await api.adminUpdateCustomer(customer.id, { imageUrl: url });
      } else {
        if (!confirm("ลบโลโก้นี้?")) return load();
        await api.adminDeleteCustomer(customer.id);
      }
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReorder = async (id, direction) => {
    setError("");
    setBusyId(id);
    try {
      await api.adminReorderCustomer(id, direction);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "Our Customers" }]} />

      <div className="admin-edit-notice" style={{ marginBottom: 20 }}>
        🏢 จัดการโลโก้ลูกค้าที่แสดงในหน้าแรก (Hero → Our Customers → Our Strength) — โลโก้จะเลื่อนวนต่อเนื่องจากขวาไปซ้ายโดยอัตโนมัติ
        ใช้ลูกศร ↑ ↓ เพื่อกำหนดลำดับการแสดงผล
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      {loading ? (
        <p className="empty-state">กำลังโหลด…</p>
      ) : (
        <div className="admin-customer-grid">
          {customers.map((c, i) => (
            <div className={`admin-customer-card ${busyId === c.id ? "is-busy" : ""}`} key={c.id}>
              <div className="admin-customer-card__head">
                <span className="admin-list-table__muted">#{i + 1}</span>
                <div className="admin-sort-arrows">
                  <button
                    onClick={() => handleReorder(c.id, "up")}
                    disabled={busyId === c.id || i === 0}
                    aria-label="เลื่อนขึ้น"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleReorder(c.id, "down")}
                    disabled={busyId === c.id || i === customers.length - 1}
                    aria-label="เลื่อนลง"
                  >
                    ↓
                  </button>
                </div>
              </div>
              <ImageUploadField value={c.image_url} onChange={(url) => handleImageChange(c, url)} />
            </div>
          ))}

          <div className="admin-customer-card admin-customer-card--add">
            <span className="admin-customer-card__label">
              {adding ? "กำลังอัปโหลด…" : "+ เพิ่มโลโก้ใหม่"}
            </span>
            <ImageUploadField value="" onChange={handleAdd} />
          </div>
        </div>
      )}

      {!loading && customers.length === 0 && (
        <p className="admin-list-table__submeta" style={{ marginTop: 10 }}>
          ยังไม่มีโลโก้ลูกค้า — อัปโหลดรูปแรกในกล่อง "+ เพิ่มโลโก้ใหม่" ด้านบน
        </p>
      )}
    </>
  );
}
