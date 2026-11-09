import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api/client.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const MAX_RESUME_MB = 5;
const RESUME_EXT = [".pdf", ".doc", ".docx"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-.\s]{6,30}$/;

const emptyForm = { fullName: "", phone: "", email: "", message: "" };

const formatSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * "สมัครงานตำแหน่งนี้" popup: name, phone, email, résumé, message.
 * Confirm sends the application to Admin > ตำแหน่งงาน > คำขอสมัครงาน.
 * Closes with Cancel / × / Esc (Esc and the backdrop are ignored once the
 * applicant has typed something, so an accidental click never loses the form).
 */
export default function ApplyJobModal({ job, jobTitle, onClose }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [submitError, setSubmitError] = useState("");
  const firstFieldRef = useRef(null);
  const fileRef = useRef(null);

  const dirty = Boolean(file || Object.values(form).some((v) => v.trim()));
  const sending = status === "sending";

  useEffect(() => {
    firstFieldRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !sending && (!dirty || status === "done")) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, sending, status, onClose]);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: "" }));
  };

  const pickFile = (e) => {
    const f = e.target.files?.[0] || null;
    setErrors((er) => ({ ...er, resume: "" }));
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!RESUME_EXT.includes(ext)) {
      setErrors((er) => ({ ...er, resume: t("career.apply.errResumeType") }));
      e.target.value = "";
      return;
    }
    if (f.size > MAX_RESUME_MB * 1024 * 1024) {
      setErrors((er) => ({ ...er, resume: t("career.apply.errResumeSize") }));
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  const removeFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validate = () => {
    const er = {};
    if (!form.fullName.trim()) er.fullName = t("career.apply.errRequired");
    if (!form.phone.trim()) er.phone = t("career.apply.errRequired");
    else if (!PHONE_RE.test(form.phone.trim())) er.phone = t("career.apply.errPhone");
    if (!form.email.trim()) er.email = t("career.apply.errRequired");
    else if (!EMAIL_RE.test(form.email.trim())) er.email = t("career.apply.errEmail");
    if (!file) er.resume = t("career.apply.errResumeRequired");
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    const data = new FormData();
    data.append("jobId", String(job.id));
    data.append("fullName", form.fullName.trim());
    data.append("phone", form.phone.trim());
    data.append("email", form.email.trim());
    data.append("message", form.message.trim());
    data.append("resume", file);
    setStatus("sending");
    try {
      await api.submitCareerApplication(data);
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setSubmitError(err.status === 429 ? t("career.apply.errTooMany") : t("career.apply.errSubmit"));
    }
  };

  const fieldError = (key) =>
    errors[key] ? (
      <span className="apply-modal__error" id={`apply-err-${key}`} role="alert">
        {errors[key]}
      </span>
    ) : null;

  return createPortal(
    <div className="cf-modal-backdrop" onClick={() => !sending && (!dirty || status === "done") && onClose()}>
      <div
        className={`cf-modal apply-modal${status === "done" ? " apply-modal--done" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="cf-modal__x" onClick={onClose} disabled={sending} aria-label={t("career.apply.close")}>
          ×
        </button>

        {status === "done" ? (
          <>
            <div className="cf-modal__icon" aria-hidden="true">
              <svg viewBox="0 0 52 52" width="44" height="44" fill="none">
                <path d="M14 27l8 8 16-17" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 id="apply-modal-title" className="cf-modal__title">{t("career.apply.successTitle")}</h3>
            <div className="cf-modal__body">
              <p>{t("career.apply.successText")}</p>
            </div>
            <button type="button" className="btn btn-primary cf-modal__ok" onClick={onClose} autoFocus>
              {t("career.apply.ok")}
            </button>
          </>
        ) : (
          <form className="apply-modal__form" onSubmit={submit} noValidate>
            <header className="apply-modal__head">
              <span className="apply-modal__eyebrow">{t("career.apply.title")}</span>
              <h3 id="apply-modal-title" className="apply-modal__job">{jobTitle}</h3>
            </header>

            <label className="contact-form__field">
              <span>{t("career.apply.fullName")} <em aria-hidden="true">*</em></span>
              <input
                ref={firstFieldRef}
                value={form.fullName}
                onChange={update("fullName")}
                autoComplete="name"
                maxLength={150}
                required
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "apply-err-fullName" : undefined}
              />
              {fieldError("fullName")}
            </label>

            <div className="contact-form__row">
              <label className="contact-form__field">
                <span>{t("career.apply.phone")} <em aria-hidden="true">*</em></span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  autoComplete="tel"
                  maxLength={30}
                  required
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "apply-err-phone" : undefined}
                />
                {fieldError("phone")}
              </label>
              <label className="contact-form__field">
                <span>{t("career.apply.email")} <em aria-hidden="true">*</em></span>
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  autoComplete="email"
                  maxLength={150}
                  required
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "apply-err-email" : undefined}
                />
                {fieldError("email")}
              </label>
            </div>

            <div className="contact-form__field">
              <span id="apply-resume-label">{t("career.apply.resume")} <em aria-hidden="true">*</em></span>
              {file ? (
                <div className="apply-modal__file">
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                    <path d="M14 3v5h5" />
                  </svg>
                  <span className="apply-modal__file-name">{file.name}</span>
                  <span className="apply-modal__file-size">{formatSize(file.size)}</span>
                  <button type="button" className="apply-modal__file-remove" onClick={removeFile} aria-label={t("career.apply.removeFile")}>
                    ×
                  </button>
                </div>
              ) : (
                <label className={`apply-modal__drop${errors.resume ? " is-invalid" : ""}`}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={pickFile}
                    aria-labelledby="apply-resume-label"
                    aria-describedby={errors.resume ? "apply-err-resume" : "apply-resume-hint"}
                  />
                  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
                  </svg>
                  <span className="apply-modal__drop-main">{t("career.apply.chooseFile")}</span>
                  <span className="apply-modal__drop-hint" id="apply-resume-hint">{t("career.apply.resumeHint")}</span>
                </label>
              )}
              {fieldError("resume")}
            </div>

            <label className="contact-form__field">
              <span>{t("career.apply.message")}</span>
              <textarea rows={4} value={form.message} onChange={update("message")} maxLength={3000} />
            </label>

            {submitError && (
              <p className="contact-form__status contact-form__status--error" role="alert">
                {submitError}
              </p>
            )}

            <div className="apply-modal__actions">
              <button type="button" className="btn" onClick={onClose} disabled={sending}>
                {t("career.apply.cancel")}
              </button>
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? t("career.apply.sending") : t("career.apply.confirm")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
