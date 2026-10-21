import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import { ConfirmModal } from "../../components/AdminModal.jsx";
import { AdminEditLayout, AdminLanguageSelect } from "../../components/AdminEditSidebar.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import ImagePositionField from "../../components/ImagePositionField.jsx";
import SuccessModal from "../../components/SuccessModal.jsx";

const HERO_SUFFIXES = ["hero_meta", "hero_title", "hero_sub"];
const toLines = (value) => value.split("\n").map((item) => item.trim()).filter(Boolean);

function emptyHeroForm() {
  const form = { hero_bg_image: "" };
  for (const base of HERO_SUFFIXES) {
    form[`${base}_en`] = "";
    form[`${base}_th`] = "";
  }
  return form;
}

function emptyBlockForm() {
  return { name: "", nameTh: "", summary: "", summaryTh: "", services: "", servicesTh: "", benefits: "", benefitsTh: "", imageUrl: "", imagePositionX: 50, imagePositionY: 50 };
}

function rowToBlockForm(block) {
  return {
    name: block.name || "", nameTh: block.name_th || "", summary: block.summary || "", summaryTh: block.summary_th || "",
    services: (block.services || []).join("\n"), servicesTh: (block.services_th || []).join("\n"),
    benefits: (block.benefits || []).join("\n"), benefitsTh: (block.benefits_th || []).join("\n"), imageUrl: block.image_url || "",
    imagePositionX: block.image_position_x ?? 50, imagePositionY: block.image_position_y ?? 50,
  };
}

export default function AdminAutomationSolution() {
  const [activeTab, setActiveTab] = useState("hero");
  const [heroForm, setHeroForm] = useState(emptyHeroForm);
  const [heroLang, setHeroLang] = useState("th");
  const [heroLoading, setHeroLoading] = useState(true);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroError, setHeroError] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [blocksLoading, setBlocksLoading] = useState(true);
  const [blocksError, setBlocksError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [blockForm, setBlockForm] = useState(emptyBlockForm);
  const [blockSnapshot, setBlockSnapshot] = useState("");
  const [blockLang, setBlockLang] = useState("th");
  const [blockSaving, setBlockSaving] = useState(false);
  const [discardTarget, setDiscardTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadBlocks = () => {
    setBlocksLoading(true);
    return api.adminGetSolutions().then(setBlocks).catch((err) => setBlocksError(err.message)).finally(() => setBlocksLoading(false));
  };

  useEffect(() => {
    api.adminGetAutomationSolutionContent().then((data) => data && setHeroForm((form) => ({ ...form, ...data }))).catch((err) => setHeroError(err.message)).finally(() => setHeroLoading(false));
    loadBlocks();
  }, []);

  const heroField = (base) => `${base}_${heroLang}`;
  const heroValue = (base) => heroForm[heroField(base)] || "";
  const updateHero = (base, value) => setHeroForm((form) => ({ ...form, [heroField(base)]: value }));
  const handleHeroSubmit = async (event) => {
    event.preventDefault(); setHeroSaving(true); setHeroError("");
    try {
      const updated = await api.adminUpdateAutomationSolutionContent(heroForm);
      setHeroForm((form) => ({ ...form, ...updated }));
      setSuccessMessage("Hero changes have been saved successfully.");
    } catch (err) { setHeroError(err.message); } finally { setHeroSaving(false); }
  };

  const isBlockDirty = editingId !== null && JSON.stringify(blockForm) !== blockSnapshot;
  const openBlock = (block) => {
    const form = block ? rowToBlockForm(block) : emptyBlockForm();
    setBlockForm(form); setBlockSnapshot(JSON.stringify(form)); setBlockLang(block ? "th" : "en"); setEditingId(block ? block.id : "new");
  };
  const closeBlock = () => { setEditingId(null); setBlockForm(emptyBlockForm()); setBlockSnapshot(""); };
  const performTransition = (target) => {
    setDiscardTarget(null);
    if (target.type === "tab") { closeBlock(); setActiveTab(target.tab); return; }
    closeBlock();
    if (target.type === "edit") openBlock(target.block);
    if (target.type === "add") openBlock(null);
  };
  const requestTransition = (target) => isBlockDirty ? setDiscardTarget(target) : performTransition(target);
  const selectTab = (tab) => {
    if (tab === activeTab) return;
    if (tab === "hero") requestTransition({ type: "tab", tab });
    else setActiveTab(tab);
  };
  const updateBlock = (field, value) => setBlockForm((form) => ({ ...form, [field]: value }));
  const handleBlockSubmit = async (event) => {
    event.preventDefault(); setBlockSaving(true); setBlocksError("");
    const payload = {
      name: blockForm.name, nameTh: blockForm.nameTh || null, summary: blockForm.summary || null, summaryTh: blockForm.summaryTh || null,
      services: toLines(blockForm.services), servicesTh: toLines(blockForm.servicesTh), benefits: toLines(blockForm.benefits), benefitsTh: toLines(blockForm.benefitsTh),
      imageUrl: blockForm.imageUrl || null, imagePositionX: blockForm.imageUrl ? blockForm.imagePositionX : 50, imagePositionY: blockForm.imageUrl ? blockForm.imagePositionY : 50,
    };
    try {
      if (editingId === "new") await api.adminCreateSolution(payload); else await api.adminUpdateSolution(editingId, payload);
      closeBlock(); await loadBlocks(); setSuccessMessage("Solution Block changes have been saved successfully.");
    } catch (err) { setBlocksError(err.message); } finally { setBlockSaving(false); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true); setDeleteError("");
    try {
      await api.adminDeleteSolution(deleteTarget.id);
      if (editingId === deleteTarget.id) closeBlock();
      setDeleteTarget(null); await loadBlocks();
    } catch (err) { setDeleteError(err.message); } finally { setDeleting(false); }
  };
  const blockTitle = (block) => block.name_th ? `${block.name} / ${block.name_th}` : block.name;
  const fields = blockLang === "th"
    ? { name: "nameTh", summary: "summaryTh", services: "servicesTh", benefits: "benefitsTh", suffix: "TH", heading: "Thai (ไทย)" }
    : { name: "name", summary: "summary", services: "services", benefits: "benefits", suffix: "EN", heading: "English" };
  const blockEditor = (id) => <form onSubmit={handleBlockSubmit} className="admin-solution-block-editor">
    <AdminEditLayout sidebar={<AdminLanguageSelect value={blockLang} onChange={setBlockLang} />}>
      <div className="admin-form__section panel"><h3>{id === "new" ? "Add Solution Block" : "Edit Solution Block"} — {fields.heading}</h3>
        <label className="contact-form__field"><span>Title ({fields.suffix}){blockLang === "en" && <span className="admin-required">*</span>}</span><input required={blockLang === "en"} value={blockForm[fields.name]} onChange={(e) => updateBlock(fields.name, e.target.value)} /></label>
        <label className="contact-form__field" style={{ marginTop: 20 }}><span>Summary ({fields.suffix})</span><textarea rows={3} value={blockForm[fields.summary]} onChange={(e) => updateBlock(fields.summary, e.target.value)} /></label>
        <div className="admin-form__row" style={{ marginTop: 20 }}><label className="contact-form__field"><span>Services ({fields.suffix}) — one per line</span><textarea rows={4} value={blockForm[fields.services]} onChange={(e) => updateBlock(fields.services, e.target.value)} /></label><label className="contact-form__field"><span>Benefits ({fields.suffix}) — one per line</span><textarea rows={4} value={blockForm[fields.benefits]} onChange={(e) => updateBlock(fields.benefits, e.target.value)} /></label></div>
        <div style={{ marginTop: 20 }}><span className="admin-edit-sidebar__label" style={{ display: "block", marginBottom: 10 }}>Image</span>{blockForm.imageUrl && <ImagePositionField imageUrl={blockForm.imageUrl} positionX={blockForm.imagePositionX} positionY={blockForm.imagePositionY} onChange={({ x, y }) => setBlockForm((form) => ({ ...form, imagePositionX: x, imagePositionY: y }))} />}<div style={{ marginTop: blockForm.imageUrl ? 12 : 0 }}><ImageUploadField value={blockForm.imageUrl} hidePreview onChange={(url) => setBlockForm((form) => ({ ...form, imageUrl: url, imagePositionX: 50, imagePositionY: 50 }))} /></div></div>
        <div className="admin-form__submit-row"><button type="button" className="btn admin-btn-cancel" onClick={closeBlock}>Cancel</button><button type="submit" className="btn btn-primary" disabled={blockSaving}>{blockSaving ? "Saving…" : "Save"}</button></div>
      </div>
    </AdminEditLayout>
  </form>;

  return <>
    <AdminBreadcrumb items={[{ label: "โซลูชันระบบอัตโนมัติ (Automation Solution)" }]} />
    <div className="admin-edit-tabbar"><div className="admin-edit-tabs" role="tablist" aria-label="Automation Solution editor"><button type="button" role="tab" aria-selected={activeTab === "hero"} className={`admin-edit-tab ${activeTab === "hero" ? "is-active" : ""}`} onClick={() => selectTab("hero")}>Edit HERO</button><button type="button" role="tab" aria-selected={activeTab === "blocks"} className={`admin-edit-tab ${activeTab === "blocks" ? "is-active" : ""}`} onClick={() => selectTab("blocks")}>Edit Solution Block</button></div>{activeTab === "hero" && <div className="admin-edit-tabbar__actions"><button type="submit" form="automation-hero-form" className="btn btn-primary" disabled={heroSaving || heroLoading}>💾 {heroSaving ? "Saving…" : "Save HERO"}</button></div>}</div>
    {activeTab === "hero" && <form id="automation-hero-form" onSubmit={handleHeroSubmit}>{heroError && <p className="contact-form__status contact-form__status--error">{heroError}</p>}{!heroLoading && <AdminEditLayout sidebar={<AdminLanguageSelect value={heroLang} onChange={setHeroLang} />}><div className="admin-form"><div className="admin-form__section panel"><h3>Hero</h3><label className="contact-form__field"><span>ข้อความเล็กเหนือหัวข้อ (Meta)</span><input value={heroValue("hero_meta")} onChange={(e) => updateHero("hero_meta", e.target.value)} /></label><label className="contact-form__field" style={{ marginTop: 20 }}><span>หัวข้อหลัก</span><input value={heroValue("hero_title")} onChange={(e) => updateHero("hero_title", e.target.value)} /></label><label className="contact-form__field" style={{ marginTop: 20 }}><span>คำอธิบายใต้หัวข้อ</span><textarea rows={3} value={heroValue("hero_sub")} onChange={(e) => updateHero("hero_sub", e.target.value)} /></label><label className="contact-form__field" style={{ marginTop: 20 }}><span>Hero background image (Automation Solution page only — optional)</span><ImageUploadField value={heroForm.hero_bg_image} onChange={(url) => setHeroForm((form) => ({ ...form, hero_bg_image: url }))} /></label></div></div></AdminEditLayout>}</form>}
    {activeTab === "blocks" && <><div className="admin-edit-notice">Manage the solution blocks shown on the Automation Solution page. Edit opens only the selected block; image upload and crop positioning are retained.</div>{blocksError && <p className="contact-form__status contact-form__status--error">{blocksError}</p>}{!blocksLoading && <div className="admin-solution-blocks">{blocks.map((block, index) => <div key={block.id} className="admin-solution-block-item"><div className="admin-solution-block-row panel">{block.image_url ? <img src={block.image_url} alt="" className="admin-list-thumb" /> : <span className="admin-list-thumb admin-list-thumb--empty" />}<div className="admin-solution-block-row__info"><strong>{blockTitle(block)}</strong>{block.summary && <p className="admin-list-table__submeta">{block.summary}</p>}</div><span className="admin-solution-block-order">#{index + 1}</span><div className="admin-row-actions"><button type="button" className="admin-icon-btn admin-icon-btn--edit" onClick={() => requestTransition({ type: "edit", block })} title="Edit">✎</button><button type="button" className="admin-icon-btn admin-icon-btn--delete" onClick={() => { setDeleteError(""); setDeleteTarget(block); }} title="Delete">🗑</button></div></div>{editingId === block.id && blockEditor(block.id)}</div>)}{!blocks.length && editingId === null && <p className="empty-state">No Solution Blocks yet — add the first block below.</p>}{editingId === "new" && blockEditor("new")}{editingId === null && <button type="button" className="btn" onClick={() => requestTransition({ type: "add" })}>+ Add Solution Block</button>}</div>}</>}
    {successMessage && <SuccessModal message={successMessage} onClose={() => setSuccessMessage("")} />}
    {discardTarget && <ConfirmModal title="Discard unsaved changes?" message="Your unsaved Solution Block changes will be discarded." detail="This cannot be undone." confirmLabel="Discard changes" onCancel={() => setDiscardTarget(null)} onConfirm={() => performTransition(discardTarget)} />}
    {deleteTarget && <ConfirmModal title="Delete Solution Block?" message="Are you sure you want to delete this Solution Block? This action cannot be undone." detail={blockTitle(deleteTarget)} confirmLabel="Delete" busy={deleting} error={deleteError} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
  </>;
}
