import { useState } from "react";
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

export default function ContactForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      await api.submitContact(form);
      setStatus("success");
      setForm(initialForm);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || t("contactForm.genericError"));
    }
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

      {status === "success" && (
        <p className="contact-form__status contact-form__status--ok">
          {t("contactForm.success")}
        </p>
      )}
      {status === "error" && (
        <p className="contact-form__status contact-form__status--error">{errorMsg}</p>
      )}
    </form>
  );
}
