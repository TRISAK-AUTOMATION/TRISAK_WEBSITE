import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api/client.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const INTEREST_VALUES = ["products", "automation_solution", "technical_support"];

const initialForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  interestedIn: "",
  message: "",
};

/** Bootstrap-style success modal. Closes via the button, the × icon,
 *  a click on the dimmed backdrop, or the Escape key. */
function SuccessModal({ onClose }) {
  const { t } = useLanguage();
  const okRef = useRef(null);

  useEffect(() => {
    okRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // stop the page behind the modal from scrolling while it is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="cf-modal-backdrop" onClick={onClose}>
      <div
        className="cf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cf-modal-title"
        aria-describedby="cf-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="cf-modal__x"
          onClick={onClose}
          aria-label={t("contactForm.successModal.close")}
        >
          ×
        </button>
        <div className="cf-modal__icon" aria-hidden="true">
          <svg viewBox="0 0 52 52" width="44" height="44" fill="none">
            <path
              d="M14 27l8 8 16-17"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 id="cf-modal-title" className="cf-modal__title">
          {t("contactForm.successModal.title")}
        </h3>
        <div id="cf-modal-desc" className="cf-modal__body">
          <p>{t("contactForm.successModal.text")}</p>
          <p>{t("contactForm.successModal.subtext")}</p>
        </div>
        <button ref={okRef} type="button" className="btn btn-primary cf-modal__ok" onClick={onClose}>
          {t("contactForm.successModal.ok")}
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function ContactForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle"); // idle | submitting | error
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      await api.submitContact(form);
      setStatus("idle");
      setShowSuccess(true); // form is reset when the popup is closed
    } catch {
      setStatus("error");
      setErrorMsg(t("contactForm.submitError"));
    }
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    setForm(initialForm);
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form__row">
        <label className="contact-form__field">
          <span>{t("contactForm.name")}</span>
          <input required value={form.name} onChange={update("name")} />
        </label>
        <label className="contact-form__field">
          <span>{t("contactForm.company")}</span>
          <input value={form.company} onChange={update("company")} />
        </label>
      </div>

      <div className="contact-form__row">
        <label className="contact-form__field">
          <span>{t("contactForm.email")}</span>
          <input type="email" required value={form.email} onChange={update("email")} />
        </label>
        <label className="contact-form__field">
          <span>{t("contactForm.phone")}</span>
          <input value={form.phone} onChange={update("phone")} />
        </label>
      </div>

      <fieldset className="contact-form__field">
        <span>{t("contactForm.interestedIn")}</span>
        <div className="contact-form__pills">
          {INTEREST_VALUES.map((value) => (
            <button
              type="button"
              key={value}
              className={`contact-form__pill ${
                form.interestedIn === value ? "is-selected" : ""
              }`}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  interestedIn: f.interestedIn === value ? "" : value,
                }))
              }
            >
              {t(`contactForm.interests.${value}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="contact-form__field">
        <span>{t("contactForm.message")}</span>
        <textarea rows={5} value={form.message} onChange={update("message")} />
      </label>

      <button type="submit" className="btn btn-primary" disabled={status === "submitting"}>
        {status === "submitting" ? t("contactForm.sending") : t("contactForm.send")}
        <span className="btn-arrow">→</span>
      </button>

      {status === "error" && (
        <p className="contact-form__status contact-form__status--error" role="alert">
          {errorMsg}
        </p>
      )}

      {showSuccess && <SuccessModal onClose={closeSuccess} />}
    </form>
  );
}
