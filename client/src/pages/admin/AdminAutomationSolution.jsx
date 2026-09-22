import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import ImagePositionField from "../../components/ImagePositionField.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";

const HERO_SUFFIXES = ["hero_meta", "hero_title", "hero_sub"];

function emptyHeroForm() {
  const form = {};
  for (const base of HERO_SUFFIXES) {
    form[`${base}_en`] = "";
    form[`${base}_th`] = "";
  }
  return form;
}

function emptyBlockForm() {
  return {
    name: "",
    summary: "",
    services: "",
    benefits: "",
    imageUrl: "",
    imagePositionX: 50,
    imagePositionY: 50,
  };
}

export default function AdminAutomationSolution() {
  // ---- Hero (bilingual) ----
  const [heroForm, setHeroForm] = useState(emptyHeroForm);
  const [lang, setLang] = useState("th");
  const [heroLoading, setHeroLoading] = useState(true);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroError, setHeroError] = useState("");
  const [heroSuccess, setHeroSuccess] = useState(false);

  // ---- Solution Blocks ----
  const [blocks, setBlocks] = useState([]);
  const [blocksLoading, setBlocksLoading] = useState(true);
  const [blocksError, setBlocksError] = useState("");
  const [editingId, setEditingId] = useState(null); // null = not editing, "new" = adding, else block id
  const [blockForm, setBlockForm] = useState(emptyBlockForm);
  const [blockSaving, setBlockSaving] = useState(false);

  useEffect(() => {
    api
      .adminGetAutomationSolutionContent()
      .then((d) => {
        if (d) setHeroForm((f) => ({ ...f, ...d }));
      })
      .catch((err) => setHeroError(err.message))
      .finally(() => setHeroLoading(false));
    loadBlocks();
  }, []);

  const loadBlocks = () => {
    setBlocksLoading(true);
    api
      .adminGetSolutions()
      .then(setBlocks)
      .catch((err) => setBlocksError(err.message))
      .finally(() => setBlocksLoading(false));
  };

  // -- hero handlers --
  const heroField = (base) => `${base}_${lang}`;
  const heroValue = (base) => heroForm[heroField(base)] || "";
  const updateHero = (base, val) => {
    setHeroSuccess(false);
    setHeroForm((f) => ({ ...f, [heroField(base)]: val }));
  };

  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    setHeroSaving(true);
    setHeroError("");
    setHeroSuccess(false);
    try {
      const updated = await api.adminUpdateAutomationSolutionContent(heroForm);
      setHeroForm((f) => ({ ...f, ...updated }));
      setHeroSuccess(true);
    } catch (err) {
      setHeroError(err.message);
    } finally {
      setHeroSaving(false);
    }
  };

  // -- block handlers --
  const startAddBlock = () => {
    setBlockForm(emptyBlockForm());
    setEditingId("new");
  };

  const startEditBlock = (b) => {
    setBlockForm({
      name: b.name || "",
      summary: b.summary || "",
      services: (b.services || []).join("\n"),
      benefits: (b.benefits || []).join("\n"),
      imageUrl: b.image_url || "",
      imagePositionX: b.image_position_x ?? 50,
      imagePositionY: b.image_position_y ?? 50,
    });
    setEditingId(b.id);
  };

  const cancelBlockEdit = () => {
    setEditingId(null);
    setBlockForm(emptyBlockForm());
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    setBlockSaving(true);
    setBlocksError("");
    try {
      const payload = {
        name: blockForm.name,
        summary: blockForm.summary || null,
        services: blockForm.services.split("\n").map((s) => s.trim()).filter(Boolean),
        benefits: blockForm.benefits.split("\n").map((s) => s.trim()).filter(Boolean),
        imageUrl: blockForm.imageUrl || null,
        imagePositionX: blockForm.imageUrl ? blockForm.imagePositionX : 50,
        imagePositionY: blockForm.imageUrl ? blockForm.imagePositionY : 50,
      };
      if (editingId === "new") {
        await api.adminCreateSolution(payload);
      } else {
        await api.adminUpdateSolution(editingId, payload);
      }
      cancelBlockEdit();
      loadBlocks();
    } catch (err) {
      setBlocksError(err.message);
    } finally {
      setBlockSaving(false);
    }
  };

  const handleDeleteBlock = async (b) => {
    if (!confirm(`ลบ Solution Block "${b.name}"?`)) return;
    setBlocksError("");
    try {
      await api.adminDeleteSolution(b.id);
      loadBlocks();
    } catch (err) {
      setBlocksError(err.message);
    }
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "โซลูชันระบบอัตโนมัติ (Automation Solution)" }]} />

      {/* ---- Hero ---- */}
      <form onSubmit={handleHeroSubmit}>
        <div className="admin-edit-tabbar">
          <div className="admin-edit-tabs">
            <button
              type="button"
              className={`admin-edit-tab ${lang === "th" ? "is-active" : ""}`}
              onClick={() => setLang("th")}
            >
              🇹🇭 ภาษาไทย
            </button>
            <button
              type="button"
              className={`admin-edit-tab ${lang === "en" ? "is-active" : ""}`}
              onClick={() => setLang("en")}
            >
              🇬🇧 English
            </button>
          </div>
          <div className="admin-edit-tabbar__actions">
            <button type="submit" className="btn btn-primary" disabled={heroSaving || heroLoading}>
              💾 {heroSaving ? "กำลังบันทึก…" : "บันทึก Hero"}
            </button>
          </div>
        </div>

        {heroError && <p className="contact-form__status contact-form__status--error">{heroError}</p>}
        {heroSuccess && <SuccessModal onClose={() => setHeroSuccess(false)} />}

        {!heroLoading && (
          <div className="admin-form">
            <div className="admin-form__section panel">
              <h3>Hero</h3>
              <label className="contact-form__field">
                <span>ข้อความเล็กเหนือหัวข้อ (Meta)</span>
                <input value={heroValue("hero_meta")} onChange={(e) => updateHero("hero_meta", e.target.value)} />
              </label>
              <label className="contact-form__field" style={{ marginTop: 20 }}>
                <span>หัวข้อหลัก</span>
                <input value={heroValue("hero_title")} onChange={(e) => updateHero("hero_title", e.target.value)} />
              </label>
              <label className="contact-form__field" style={{ marginTop: 20 }}>
                <span>คำอธิบายใต้หัวข้อ</span>
                <textarea rows={3} value={heroValue("hero_sub")} onChange={(e) => updateHero("hero_sub", e.target.value)} />
              </label>
            </div>
          </div>
        )}
      </form>

      {/* ---- Solution Blocks ---- */}
      <div className="admin-edit-notice" style={{ marginTop: 32 }}>
        🔔 Solution Block คือการ์ดแต่ละใบในหน้านี้ (ชื่อ/รายละเอียด/บริการ/ประโยชน์ ใช้ภาษาเดียว ไม่มีแท็บ EN/TH)
        — จัดการรูปภาพและเพิ่ม/ลบการ์ดได้ที่นี่
      </div>

      {blocksError && <p className="contact-form__status contact-form__status--error">{blocksError}</p>}

      {!blocksLoading && (
        <div className="admin-solution-blocks">
          {blocks.map((b) => (
            <div className="admin-solution-block-row panel" key={b.id}>
              {b.image_url ? (
                <img src={b.image_url} alt="" className="admin-list-thumb" />
              ) : (
                <span className="admin-list-thumb admin-list-thumb--empty" />
              )}
              <div className="admin-solution-block-row__info">
                <strong>{b.name}</strong>
                {b.summary && <p className="admin-list-table__submeta">{b.summary}</p>}
              </div>
              <div className="admin-row-actions">
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn--edit"
                  onClick={() => startEditBlock(b)}
                  title="แก้ไข"
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn--delete"
                  onClick={() => handleDeleteBlock(b)}
                  title="ลบ"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}

          {!blocks.length && editingId === null && (
            <p className="empty-state">ยังไม่มี Solution Block — เพิ่มรายการแรกได้เลย</p>
          )}

          {editingId === null && (
            <button type="button" className="btn" onClick={startAddBlock}>
              + เพิ่ม Solution Block
            </button>
          )}
        </div>
      )}

      {editingId !== null && (
        <form onSubmit={handleBlockSubmit} className="admin-form" style={{ marginTop: 20 }}>
          <div className="admin-form__section panel">
            <h3>{editingId === "new" ? "เพิ่ม Solution Block" : "แก้ไข Solution Block"}</h3>

            <label className="contact-form__field">
              <span>
                ชื่อ<span className="admin-required">*</span>
              </span>
              <input
                required
                value={blockForm.name}
                onChange={(e) => setBlockForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>

            <label className="contact-form__field" style={{ marginTop: 20 }}>
              <span>รายละเอียดโดยย่อ</span>
              <textarea
                rows={3}
                value={blockForm.summary}
                onChange={(e) => setBlockForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </label>

            <div className="admin-form__row" style={{ marginTop: 20 }}>
              <label className="contact-form__field">
                <span>บริการ (บรรทัดละ 1 รายการ)</span>
                <textarea
                  rows={4}
                  value={blockForm.services}
                  onChange={(e) => setBlockForm((f) => ({ ...f, services: e.target.value }))}
                />
              </label>
              <label className="contact-form__field">
                <span>ประโยชน์ (บรรทัดละ 1 รายการ)</span>
                <textarea
                  rows={4}
                  value={blockForm.benefits}
                  onChange={(e) => setBlockForm((f) => ({ ...f, benefits: e.target.value }))}
                />
              </label>
            </div>

            <div style={{ marginTop: 20 }}>
              <span className="admin-edit-sidebar__label" style={{ display: "block", marginBottom: 10 }}>
                รูปภาพ
              </span>
              {blockForm.imageUrl && (
                <ImagePositionField
                  imageUrl={blockForm.imageUrl}
                  positionX={blockForm.imagePositionX}
                  positionY={blockForm.imagePositionY}
                  onChange={({ x, y }) =>
                    setBlockForm((f) => ({ ...f, imagePositionX: x, imagePositionY: y }))
                  }
                />
              )}
              <div style={{ marginTop: blockForm.imageUrl ? 12 : 0 }}>
                <ImageUploadField
                  value={blockForm.imageUrl}
                  hidePreview
                  onChange={(url) =>
                    // A newly uploaded/changed image starts centered; removing
                    // the image resets the saved crop point too.
                    setBlockForm((f) => ({ ...f, imageUrl: url, imagePositionX: 50, imagePositionY: 50 }))
                  }
                />
              </div>
            </div>

            <div className="admin-form__submit-row">
              <button type="button" className="btn admin-btn-cancel" onClick={cancelBlockEdit}>
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-primary" disabled={blockSaving}>
                {blockSaving ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
