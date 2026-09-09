import { useEffect, useState } from "react";
import SectionLabel from "../components/SectionLabel.jsx";
import ContactForm from "../components/ContactForm.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../api/client.js";

export default function Contacts() {
  const { t, lang } = useLanguage();
  const [pageContent, setPageContent] = useState(null);

  useEffect(() => {
    api
      .getContactsPageContent()
      .then(setPageContent)
      .catch(() => setPageContent(null));
  }, []);

  // Reads `${field}_${lang}` from the admin-editable
  // contacts_page_content row, falling back to the built-in
  // translation/hardcoded default if the DB row isn't loaded yet
  // (or unedited).
  const cc = (field, fallback) => {
    if (!pageContent) return fallback;
    const value = pageContent[`${field}_${lang}`];
    return value || fallback;
  };
  const ccPlain = (field, fallback) => (pageContent && pageContent[field]) || fallback;

  const headOfficeAddress = cc("head_office_address", t("contacts.headOfficeAddress"));
  const warehouseAddress = cc("warehouse_address", t("contacts.warehouseAddress"));

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{cc("hero_meta", t("contacts.heroMeta"))}</span>
          <h1>{cc("hero_title", t("contacts.heroTitle"))}</h1>
          <p className="hero__sub">{cc("hero_sub", t("contacts.heroSub"))}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel index="01" eyebrow={cc("info_eyebrow", t("contacts.infoEyebrow"))} title={cc("info_title", t("contacts.infoTitle"))} />
          <div className="contacts-layout">
            <div className="panel">
              <div className="contact-info-block">
                <span className="contact-info-block__label">
                  {cc("head_office_label", t("contacts.headOffice"))}
                </span>
                <p>
                  {headOfficeAddress.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                  {ccPlain("head_office_phone", "+66 (0)2 000 0000")}
                  <br />
                  {ccPlain("head_office_email", "contact@trisakgroup.com")}
                </p>
              </div>
              <div className="contact-info-block">
                <span className="contact-info-block__label">
                  {cc("warehouse_label", t("contacts.warehouse"))}
                </span>
                <p>
                  {warehouseAddress.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                  {ccPlain("warehouse_phone", "+66 (0)2 111 1111")}
                  <br />
                  {ccPlain("warehouse_email", "warehouse@trisakgroup.com")}
                </p>
              </div>
            </div>

            <div className="panel" style={{ padding: "40px 36px" }}>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel index="02" eyebrow={cc("map_eyebrow", t("contacts.mapEyebrow"))} title={cc("map_title", t("contacts.mapTitle"))} />
          <div className="map-frame">
            <span className="map-frame__pin" style={{ top: "38%", left: "42%" }}>
              {cc("head_office_label", t("contacts.headOffice"))}
            </span>
            <span className="map-frame__pin" style={{ top: "60%", left: "64%" }}>
              {cc("warehouse_label", t("contacts.warehouse"))}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
