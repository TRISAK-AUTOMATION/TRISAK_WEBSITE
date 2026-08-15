import SectionLabel from "../components/SectionLabel.jsx";
import ContactForm from "../components/ContactForm.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Contacts() {
  const { t } = useLanguage();

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{t("contacts.heroMeta")}</span>
          <h1>{t("contacts.heroTitle")}</h1>
          <p className="hero__sub">{t("contacts.heroSub")}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel index="01" eyebrow={t("contacts.infoEyebrow")} title={t("contacts.infoTitle")} />
          <div className="contacts-layout">
            <div className="panel">
              <div className="contact-info-block">
                <span className="contact-info-block__label">{t("contacts.headOffice")}</span>
                <p>
                  {t("contacts.headOfficeAddress")
                    .split("\n")
                    .map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  +66 (0)2 000 0000
                  <br />
                  contact@trisakgroup.com
                </p>
              </div>
              <div className="contact-info-block">
                <span className="contact-info-block__label">{t("contacts.warehouse")}</span>
                <p>
                  {t("contacts.warehouseAddress")
                    .split("\n")
                    .map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  +66 (0)2 111 1111
                  <br />
                  warehouse@trisakgroup.com
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
          <SectionLabel index="02" eyebrow={t("contacts.mapEyebrow")} title={t("contacts.mapTitle")} />
          <div className="map-frame">
            <span className="map-frame__pin" style={{ top: "38%", left: "42%" }}>
              {t("contacts.headOffice")}
            </span>
            <span className="map-frame__pin" style={{ top: "60%", left: "64%" }}>
              {t("contacts.warehouse")}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
