import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api/client.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import ContactIcon from "./contactIcons.jsx";

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

// Translations may still carry a trailing " *"; the required marker is drawn here instead.
function FieldLabel({ text, required }) {
  const label = text.replace(/\s*\*\s*$/, "");
  return (
    <span className="contact-form__label">
      {label}
      {required && (
        <em className="contact-form__req" aria-hidden="true">
          *
        </em>
      )}
    </span>
  );
}

// Mirrors the server's allow-list (server/src/middleware/uploadContactAttachment.js).
const ATTACH_EXT = [".pdf", ".xlsx", ".xls", ".csv", ".docx", ".doc", ".png", ".jpg", ".jpeg"];
const ATTACH_MAX = 10 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MAX = 5000; // server limit (contactController MAX_MESSAGE_LENGTH)

const formatSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// Pre-fill from a link such as /contacts?interest=automation_solution&topic=Robotic%20Solutions
// (the Automation Solution page's "Discuss this solution" buttons).
function prefilledForm(t) {
  const params = new URLSearchParams(window.location.search);
  const interest = params.get("interest");
  const topic = (params.get("topic") || "").slice(0, 150).trim();
  return {
    ...initialForm,
    interestedIn: INTEREST_VALUES.includes(interest) ? interest : "",
    message: topic ? `${t("contactForm.prefillTopic")} ${topic}\n\n` : "",
  };
}

export default function ContactForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => prefilledForm(t));
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | error
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const touch = (field) => () => setTouched((tc) => ({ ...tc, [field]: true }));

  // Inline validation — shown once a field has been left (or on submit).
  const errors = {
    name: !form.name.trim() ? t("contactForm.errors.nameRequired") : "",
    email: !form.email.trim()
      ? t("contactForm.errors.emailRequired")
      : !EMAIL_RE.test(form.email.trim())
        ? t("contactForm.errors.emailInvalid")
        : "",
  };
  const shown = (field) => (touched[field] ? errors[field] : "");

  const pickFile = (f) => {
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ATTACH_EXT.includes(ext)) {
      setFileError(t("contactForm.attach.badType"));
      return;
    }
    if (f.size > ATTACH_MAX) {
      setFileError(t("contactForm.attach.tooLarge"));
      return;
    }
    setFileError("");
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true });
    if (errors.name || errors.email) {
      e.currentTarget.querySelector(errors.name ? "input[autocomplete=name]" : "input[type=email]")?.focus();
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      await api.submitContact(form, file || undefined);
      setStatus("idle");
      setShowSuccess(true); // form is reset when the popup is closed
    } catch (err) {
      setStatus("error");
      if (err?.status === 429) setErrorMsg(t("contactForm.errors.tooMany"));
      else if (/attachment/i.test(err?.message || "")) setErrorMsg(t("contactForm.attach.rejected"));
      else setErrorMsg(t("contactForm.submitError"));
    }
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    setForm(initialForm);
    setFile(null);
    setTouched({});
  };

  const fieldProps = (field) => ({
    value: form[field],
    onChange: update(field),
    onBlur: touch(field),
    "aria-invalid": shown(field) ? "true" : undefined,
    "aria-describedby": shown(field) ? `cf-${field}-err` : undefined,
  });

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-form__row">
        <label className="contact-form__field">
          <FieldLabel text={t("contactForm.name")} required />
          <input required autoComplete="name" {...fieldProps("name")} />
          {shown("name") && (
            <small id="cf-name-err" className="contact-form__error">
              {shown("name")}
            </small>
          )}
        </label>
        <label className="contact-form__field">
          <FieldLabel text={t("contactForm.company")} />
          <input autoComplete="organization" value={form.company} onChange={update("company")} />
        </label>
      </div>

      <div className="contact-form__row">
        <label className="contact-form__field">
          <FieldLabel text={t("contactForm.email")} required />
          <input type="email" required autoComplete="email" {...fieldProps("email")} />
          {shown("email") && (
            <small id="cf-email-err" className="contact-form__error">
              {shown("email")}
            </small>
          )}
        </label>
        <label className="contact-form__field">
          <FieldLabel text={t("contactForm.phone")} />
          <input type="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} />
        </label>
      </div>

      <fieldset className="contact-form__field">
        <legend className="contact-form__legend">{t("contactForm.interestedIn")}</legend>
        <div className="contact-form__pills">
          {INTEREST_VALUES.map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={form.interestedIn === value}
              className={`contact-form__pill ${form.interestedIn === value ? "is-selected" : ""}`}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  interestedIn: f.interestedIn === value ? "" : value,
                }))
              }
            >
              <span className="contact-form__pill-check" aria-hidden="true">
                <ContactIcon name="check" size={14} />
              </span>
              {t(`contactForm.interests.${value}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="contact-form__field">
        <FieldLabel text={t("contactForm.message")} />
        <textarea rows={5} maxLength={MESSAGE_MAX} value={form.message} onChange={update("message")} />
        <small
          className={`contact-form__count ${form.message.length > MESSAGE_MAX * 0.9 ? "is-near" : ""}`}
          aria-live={form.message.length > MESSAGE_MAX * 0.9 ? "polite" : "off"}
        >
          {form.message.length.toLocaleString()} / {MESSAGE_MAX.toLocaleString()}
        </small>
      </label>

      <div className="contact-form__field">
        <span className="contact-form__label">{t("contactForm.attach.label")}</span>
        {file ? (
          <div className="attach-file">
            <span className="attach-file__icon">
              <ContactIcon name="doc" size={20} />
            </span>
            <span className="attach-file__text">
              <span className="attach-file__name">{file.name}</span>
              <span className="attach-file__size">{formatSize(file.size)}</span>
            </span>
            <button
              type="button"
              className="attach-file__remove"
              onClick={() => setFile(null)}
              aria-label={t("contactForm.attach.remove")}
            >
              <ContactIcon name="x" size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`attach-drop ${dragging ? "is-dragging" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
          >
            <ContactIcon name="clip" size={20} />
            <span>
              <strong>{t("contactForm.attach.cta")}</strong>
              <span className="attach-drop__hint">{t("contactForm.attach.hint")}</span>
            </span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept={ATTACH_EXT.join(",")}
          onChange={(e) => {
            pickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {fileError && (
          <small className="contact-form__error" role="alert">
            {fileError}
          </small>
        )}
      </div>

      <button
        type="submit"
        className={`btn btn-primary contact-form__submit ${status === "submitting" ? "is-busy" : ""}`}
        disabled={status === "submitting"}
      >
        {status === "submitting" ? t("contactForm.sending") : t("contactForm.send")}
        {status === "submitting" ? (
          <span className="contact-form__spinner" aria-hidden="true" />
        ) : (
          <span className="btn-arrow" aria-hidden="true">
            →
          </span>
        )}
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
