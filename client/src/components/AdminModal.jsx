import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Shared Bootstrap-style modal system for the Admin Panel. Every admin
 * popup (Contact Request details/delete, Product edit/delete, …) is built
 * from these pieces so design, spacing, buttons and behaviour stay
 * identical everywhere:
 *
 *   <AdminModal>   header (title + ×) · scrollable body · optional error
 *                  strip · footer with buttons
 *   <ConfirmModal> a small AdminModal for destructive confirmations
 *   useToast()     success / error notification in the top-right corner
 *
 * Shared behaviour:
 *   - dimmed overlay; the page behind does not scroll while a modal is open
 *   - Esc and clicking the overlay close it (unless `dismissible` is false,
 *     used by the Edit Product modal while it has unsaved changes)
 *   - the × button and Cancel always work, except while `busy` (a request
 *     is in flight)
 *   - with several modals open, only the top-most one reacts to Esc
 */

// ---- modal stack + scroll lock (module-level so nested modals cooperate) ----
let nextModalId = 1;
const openModals = []; // ids, last = top-most
let savedBodyOverflow = "";

function registerModal(id) {
  if (openModals.length === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  openModals.push(id);
}

function unregisterModal(id) {
  const i = openModals.indexOf(id);
  if (i !== -1) openModals.splice(i, 1);
  if (openModals.length === 0) document.body.style.overflow = savedBodyOverflow;
}

export default function AdminModal({
  title,
  onClose,
  size = "md", // "sm" | "md" | "lg"
  busy = false,
  dismissible = true,
  error = "",
  footer = null,
  role = "dialog",
  initialFocusRef = null,
  children,
}) {
  const idRef = useRef(null);
  if (idRef.current === null) idRef.current = nextModalId++;
  const dialogRef = useRef(null);
  const downOnBackdrop = useRef(false);

  // keep the latest values reachable from the long-lived key handler
  const live = useRef({});
  live.current = { onClose, busy, dismissible };

  useEffect(() => {
    const id = idRef.current;
    const previouslyFocused = document.activeElement;
    registerModal(id);
    (initialFocusRef?.current || dialogRef.current)?.focus();

    const onKey = (e) => {
      if (e.key !== "Escape" || openModals[openModals.length - 1] !== id) return;
      const { onClose: close, busy: isBusy, dismissible: canDismiss } = live.current;
      if (canDismiss && !isBusy) close();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      unregisterModal(id);
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus?.();
    };
    // mount/unmount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only a press *and* release on the overlay itself counts — so dragging
  // to select text inside a form and letting go outside doesn't close it.
  const onBackdropMouseDown = (e) => {
    downOnBackdrop.current = e.target === e.currentTarget;
  };
  const onBackdropClick = (e) => {
    if (downOnBackdrop.current && e.target === e.currentTarget && dismissible && !busy) onClose();
    downOnBackdrop.current = false;
  };

  return createPortal(
    <div
      className="admin-modal-backdrop"
      onMouseDown={onBackdropMouseDown}
      onClick={onBackdropClick}
    >
      <div
        ref={dialogRef}
        className={`admin-modal admin-modal--${size}`}
        role={role}
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">{title}</h2>
          <button
            type="button"
            className="admin-modal__close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="admin-modal__body">{children}</div>

        {error && (
          <p className="admin-modal__error" role="alert">
            {error}
          </p>
        )}

        {footer && <div className="admin-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Standard footer buttons — use these so every modal looks the same. */
export const ModalButton = forwardRef(function ModalButton(
  { variant = "secondary", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      {...props}
      className={`admin-modal__btn admin-modal__btn--${variant}`}
    />
  );
});

/** Confirmation popup for destructive actions (delete). */
export function ConfirmModal({
  title,
  message,
  detail = "",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  busy = false,
  error = "",
  onCancel,
  onConfirm,
}) {
  const cancelRef = useRef(null);

  return (
    <AdminModal
      title={title}
      size="sm"
      role="alertdialog"
      busy={busy}
      error={error}
      onClose={onCancel}
      initialFocusRef={cancelRef} // safest default for a destructive action
      footer={
        <>
          <ModalButton ref={cancelRef} onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </ModalButton>
          <ModalButton variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : confirmLabel}
          </ModalButton>
        </>
      }
    >
      <p className="admin-modal__text">{message}</p>
      {detail && <p className="admin-modal__detail">{detail}</p>}
    </AdminModal>
  );
}

/** const { toast, showToast } = useToast();  …render {toast} once in the page. */
export function useToast(durationMs = 4000) {
  const [state, setState] = useState(null); // { text, type }
  const timer = useRef(null);

  const showToast = useCallback(
    (text, type = "success") => {
      clearTimeout(timer.current);
      setState({ text, type });
      timer.current = setTimeout(() => setState(null), durationMs);
    },
    [durationMs]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  const toast = state ? (
    <div className={`admin-toast admin-toast--${state.type}`} role="status" aria-live="polite">
      <span className="admin-toast__icon" aria-hidden="true">
        {state.type === "error" ? "!" : "✓"}
      </span>
      {state.text}
    </div>
  ) : null;

  return { toast, showToast };
}
