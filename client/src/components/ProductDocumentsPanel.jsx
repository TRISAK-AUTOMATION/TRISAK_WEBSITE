import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { ConfirmModal, useToast } from "./AdminModal.jsx";

export const DOCUMENT_TYPES = [
  "Datasheet",
  "User Manual",
  "Installation Manual",
  "Catalog",
  "Technical Document",
  "Other",
];

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB — keep in sync with the server limit

function formatSize(bytes) {
  const n = Number(bytes);
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function validateFile(file) {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) return "Only PDF files are allowed.";
  if (file.size > MAX_SIZE) return "The file exceeds the maximum allowed size of 20 MB.";
  return "";
}

function fileKindLabel(file) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name) ? "PDF" : (file.type || "Unknown");
}

/** Inline "add" / "replace" upload form — shown one at a time. */
function UploadForm({ mode, initial, onCancel, onSubmit }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [documentType, setDocumentType] = useState(initial?.documentType || "Datasheet");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [progress, setProgress] = useState(null); // null = not uploading
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const pickFile = (f) => {
    if (!f) return;
    const problem = validateFile(f);
    setFileError(problem);
    // Don't drop a previously-selected valid file just because this pick
    // failed validation — the admin should still see what they had chosen.
    if (!problem) setFile(f);
  };

  // Reset the native input too, so choosing the very same file again still
  // fires a change event (browsers don't re-fire on an unchanged value).
  const removeFile = () => {
    setFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async (e) => {
    e.preventDefault();
    if (progress !== null) return;
    if (!title.trim()) return setError("Please enter a document title.");
    if (mode === "add" && !file) return setError("Please choose a PDF file to upload.");
    if (file) {
      const problem = validateFile(file);
      if (problem) return setError(problem);
    }
    setError("");
    setProgress(0);
    try {
      await onSubmit({ title: title.trim(), documentType, file }, setProgress);
      // parent unmounts this form on success
    } catch (err) {
      setProgress(null);
      setError(err.message || "Upload failed. Please try again.");
    }
  };

  return (
    <form className="doc-upload" onSubmit={submit}>
      <div className="admin-form__row">
        <label className="contact-form__field">
          <span>Document Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. CJ2M Datasheet" />
        </label>
        <label className="contact-form__field">
          <span>Document Type</span>
          <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="doc-upload__file">
        <span>{mode === "replace" ? "New PDF File" : "PDF File"}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => {
            pickFile(e.target.files?.[0]);
            // Clear the raw input value so re-picking the same file (after
            // Remove, or after fixing a mistaken pick) reliably re-fires
            // this change handler.
            e.target.value = "";
          }}
        />
        {file && (
          <span className="doc-upload__selected">
            <span className="doc-upload__selected-badge">{fileKindLabel(file)}</span>
            <span className="doc-upload__filename">
              {file.name} · {formatSize(file.size)}
            </span>
            <button type="button" className="doc-upload__remove" onClick={removeFile}>
              Remove
            </button>
          </span>
        )}
        {mode === "replace" && !file && (
          <span className="doc-upload__hint">Leave empty to keep the current file and only update the details.</span>
        )}
      </label>
      {fileError && <p className="doc-upload__error">{fileError}</p>}

      {progress !== null && (
        <div className="doc-upload__progress">
          <div className="doc-upload__progress-bar" style={{ width: `${progress}%` }} />
          <span>{progress < 100 ? `Uploading… ${progress}%` : "Saving…"}</span>
        </div>
      )}

      {error && (
        <p className="admin-modal__error" role="alert">
          {error}
        </p>
      )}

      <div className="doc-upload__actions">
        <button type="button" className="admin-modal__btn admin-modal__btn--secondary" onClick={onCancel} disabled={progress !== null}>
          Cancel
        </button>
        <button type="submit" className="admin-modal__btn admin-modal__btn--primary" disabled={progress !== null}>
          {progress !== null ? "Saving…" : mode === "replace" ? "Save Replacement" : "Upload"}
        </button>
      </div>
    </form>
  );
}

/**
 * Documents section for the Product Edit form/modal. Upload, replace and
 * delete each act immediately against the server — independent of the
 * product's own Save button — so a document action never risks the rest
 * of the product's edits, and vice versa.
 */
export default function ProductDocumentsPanel({ productId }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [panel, setPanel] = useState(null); // null | { mode: "add" } | { mode: "replace", doc }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { toast, showToast } = useToast();

  const load = () => {
    setLoading(true);
    return api
      .getProductDocuments(productId)
      .then((rows) => {
        setDocs(rows);
        setLoadError("");
      })
      .catch((err) => setLoadError(err.message || "Failed to load documents."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Each mutation endpoint (upload/replace/delete) already returns the
  // exact record that is now in the database, so the list is updated
  // straight from that response rather than by following up with a GET.
  // A GET made immediately after a write is the one request a browser (or
  // a proxy in between) is most likely to serve from a stale cache — the
  // API now sends Cache-Control: no-store to prevent that, but not
  // re-deriving the UI from a second, avoidable request removes the risk
  // entirely rather than just mitigating it.
  const handleAdd = async ({ title, documentType, file }, onProgress) => {
    const created = await api.adminUploadProductDocument(productId, { title, documentType, file }, { onProgress });
    setPanel(null);
    showToast("Document uploaded successfully.");
    setDocs((prev) => [...prev, created]);
  };

  const handleReplace = async (doc, { title, documentType, file }, onProgress) => {
    const updated = await api.adminReplaceProductDocument(productId, doc.id, { title, documentType, file }, { onProgress });
    setPanel(null);
    showToast(file ? "Document replaced successfully." : "Document updated successfully.");
    setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.adminDeleteProductDocument(productId, deleteTarget.id);
      const deletedId = deleteTarget.id;
      setDeleteTarget(null);
      showToast("Document deleted successfully.");
      setDocs((prev) => prev.filter((d) => d.id !== deletedId));
    } catch {
      setDeleteError("The document could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="doc-panel">
      {loading && <p className="empty-state">กำลังโหลด…</p>}
      {!loading && loadError && (
        <p className="contact-form__status contact-form__status--error">{loadError}</p>
      )}

      {!loading && !loadError && (
        <>
          {docs.length === 0 && !panel && <p className="empty-state">No documents uploaded yet.</p>}

          {docs.length > 0 && (
            <ul className="doc-list">
              {docs.map((doc) => (
                <li className="doc-row" key={doc.id}>
                  <div className="doc-row__icon" aria-hidden="true">
                    PDF
                  </div>
                  <div className="doc-row__info">
                    <span className="doc-row__type">{doc.documentType}</span>
                    <span className="doc-row__title">{doc.title}</span>
                    <span className="doc-row__meta">
                      {doc.fileName}
                      {doc.fileSize ? ` · ${formatSize(doc.fileSize)}` : ""} · {formatDate(doc.updatedAt)}
                    </span>
                  </div>
                  <div className="doc-row__actions">
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn">
                      Preview
                    </a>
                    <a href={doc.fileUrl} download={doc.fileName} className="btn">
                      Download
                    </a>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setPanel({ mode: "replace", doc })}
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn--delete"
                      title="Delete"
                      onClick={() => {
                        setDeleteError("");
                        setDeleteTarget(doc);
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {panel?.mode === "add" && (
            <UploadForm mode="add" onCancel={() => setPanel(null)} onSubmit={handleAdd} />
          )}
          {panel?.mode === "replace" && (
            <UploadForm
              mode="replace"
              initial={panel.doc}
              onCancel={() => setPanel(null)}
              onSubmit={(values, onProgress) => handleReplace(panel.doc, values, onProgress)}
            />
          )}

          {!panel && (
            <button type="button" className="btn" onClick={() => setPanel({ mode: "add" })}>
              + Add Document
            </button>
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Document?"
          message="Are you sure you want to delete this document? This action cannot be undone."
          detail={deleteTarget.title}
          busy={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {toast}
    </div>
  );
}
