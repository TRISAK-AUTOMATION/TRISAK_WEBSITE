import { useRef } from "react";
import AdminModal, { ModalButton } from "./AdminModal.jsx";

/**
 * Shared "Saved Successfully" popup for every Admin Edit page.
 *
 * Built on top of AdminModal, so it automatically gets the same overlay,
 * entrance animation, and close behaviour (Esc key, backdrop click, ×
 * button) as the rest of the admin modal system — no per-page CSS or
 * markup needed.
 *
 * All Admin Edit pages should use THIS component for save-success
 * feedback instead of rolling their own inline text/toast. Render it
 * conditionally right after a successful save, e.g.:
 *
 *   const [showSuccess, setShowSuccess] = useState(false);
 *   ...
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     try {
 *       await api.adminUpdateSomething(form);
 *       setShowSuccess(true);       // open the popup
 *     } catch (err) {
 *       setError(err.message);      // never opens the popup on failure
 *     }
 *   };
 *   ...
 *   {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
 *
 * The popup stays open until the admin clicks OK (or Esc / backdrop) —
 * closing it only flips local state, it never navigates or reloads the
 * page, so the admin stays on the current Edit page with their
 * already-saved data still on screen.
 */
export default function SuccessModal({
  title = "Saved Successfully",
  message = "The changes have been saved successfully.",
  okLabel = "OK",
  onClose,
}) {
  const okRef = useRef(null);

  return (
    <AdminModal
      title={title}
      size="sm"
      role="alertdialog"
      onClose={onClose}
      initialFocusRef={okRef}
      footer={
        <ModalButton ref={okRef} variant="primary" onClick={onClose}>
          {okLabel}
        </ModalButton>
      }
    >
      <div className="success-modal__body">
        <span className="success-modal__icon" aria-hidden="true">
          <svg viewBox="0 0 52 52" className="success-modal__check">
            <circle className="success-modal__check-circle" cx="26" cy="26" r="24" fill="none" />
            <path className="success-modal__check-mark" fill="none" d="M14 27l7 7 16-16" />
          </svg>
        </span>
        <p className="admin-modal__text success-modal__message">{message}</p>
      </div>
    </AdminModal>
  );
}
