import { useEffect, useState } from "react";
import SectionLabel from "../components/SectionLabel.jsx";
import ContactForm from "../components/ContactForm.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../api/client.js";
import HeroBgMedia from "../components/HeroBgMedia.jsx";

// Share links for "Open in Google Maps" when the admin hasn't set one.
const DEFAULT_MAP_LINKS = {
  head_office: "https://maps.app.goo.gl/oyn9GMxXdquFfps27",
  warehouse: "https://maps.app.goo.gl/LT1BuDaHmF1mNaMV8",
};

// Turns what the admin typed into an embeddable Google Maps src. Accepts the
// "Embed a map" <iframe> code or its src, a google.com/maps URL (its @lat,lng
// is used), "lat,lng", or any address/place name.
function toMapEmbedSrc(input, lang) {
  let v = (input || "").trim();
  if (!v) return "";
  const iframeSrc = v.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  if (iframeSrc) v = iframeSrc[1].replace(/&amp;/g, "&");
  if (/^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(v)) return v;
  const at = v.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const latLng = v.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/);
  let q = v.replace(/\n+/g, " ");
  if (at) q = `${at[1]},${at[2]}`;
  else if (latLng) q = `${latLng[1]},${latLng[2]}`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&hl=${lang}&output=embed`;
}

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
  const mapLocations = [
    { key: "head_office", label: cc("head_office_label", t("contacts.headOffice")), address: headOfficeAddress },
    { key: "warehouse", label: cc("warehouse_label", t("contacts.warehouse")), address: warehouseAddress },
  ].map((loc) => ({
    ...loc,
    src: toMapEmbedSrc(ccPlain(`${loc.key}_map`, "") || loc.address, lang),
    link: ccPlain(`${loc.key}_map_link`, DEFAULT_MAP_LINKS[loc.key]),
  }));
  const heroBgImage = pageContent?.hero_bg_image || "";

  return (
    <>
      <section className={`hero hero--compact hero--centered ${heroBgImage ? "hero--has-bg" : ""}`}>
        {heroBgImage && (
          <>
            <HeroBgMedia src={heroBgImage} />
            <div className="hero__bg-scrim" aria-hidden="true" />
          </>
        )}
        <div className="hero__grid-overlay" aria-hidden="true" />
        <div className="container hero__content">
          <span className="hero__meta">{cc("hero_meta", t("contacts.heroMeta"))}</span>
          <h1>{cc("hero_title", t("contacts.heroTitle"))}</h1>
          <p className="hero__sub">{cc("hero_sub", t("contacts.heroSub"))}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel eyebrow={cc("info_eyebrow", t("contacts.infoEyebrow"))} title={cc("info_title", t("contacts.infoTitle"))} />
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
          <SectionLabel eyebrow={cc("map_eyebrow", t("contacts.mapEyebrow"))} title={cc("map_title", t("contacts.mapTitle"))} />
          <div className="map-grid">
            {mapLocations.map((loc) => (
              <div className="map-frame map-frame--live" key={loc.key}>
                {loc.src && (
                  <iframe
                    className="map-frame__embed"
                    src={loc.src}
                    title={loc.label}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                )}
                <span className="map-frame__pin map-frame__pin--tag">{loc.label}</span>
                <a className="map-frame__open" href={loc.link} target="_blank" rel="noopener noreferrer">
                  {t("contacts.openInMaps")} ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
