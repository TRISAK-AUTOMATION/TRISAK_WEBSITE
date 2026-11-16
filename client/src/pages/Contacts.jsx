import { useEffect, useRef, useState } from "react";
import ContactForm from "../components/ContactForm.jsx";
import Reveal from "../components/Reveal.jsx";
import ContactIcon from "../components/contactIcons.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { api } from "../api/client.js";
import HeroBgMedia from "../components/HeroBgMedia.jsx";
export { default as defaultLineQr } from "../assets/contact/line-qr-trisak.png";
import defaultLineQr from "../assets/contact/line-qr-trisak.png";

// Company LINE Official Account — used unless the admin sets other values.
export const DEFAULT_LINE_ID = "@trisak";

// Share links for "Open in Google Maps" when the admin hasn't set one.
export const DEFAULT_MAP_LINKS = {
  head_office: "https://maps.app.goo.gl/oyn9GMxXdquFfps27",
  warehouse: "https://maps.app.goo.gl/LT1BuDaHmF1mNaMV8",
};

// Brands TRISAK is the authorized distributor for (PRODUCT.md). Only these
// are shown under "Authorized distributor" — other catalog brands are not.
const AUTHORIZED_BRANDS = ["omron", "yaskawa", "nitto"];

// Turns what the admin typed into an embeddable Google Maps src. Accepts the
// "Embed a map" <iframe> code or its src, a google.com/maps URL (its @lat,lng
// is used), "lat,lng", or any address/place name.
export function toMapEmbedSrc(input, lang) {
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

// "+66 (0)2 000 0000" → "+6620000000" for tel: links.
const telHref = (phone) => `tel:${phone.replace(/\(0\)/g, "").replace(/[^\d+]/g, "")}`;

// "@trisak" → https://line.me/R/ti/p/@trisak (used when no LINE URL is set).
const lineHref = (id) => `https://line.me/R/ti/p/${encodeURIComponent(id.startsWith("@") ? id : `@${id}`)}`;

function parseList(text) {
  try {
    const v = JSON.parse(text || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * One row in the channel list. With a single link the whole row is the
 * link; with several (phone + email of one department) each is its own link.
 */
function ChannelRow({ icon, label, links = [], text, copyText, copyLabels }) {
  const single = links.length === 1 ? links[0] : null;
  const inner = (
    <>
      <span className="contact-channel__icon">
        <ContactIcon name={icon} />
      </span>
      <span className="contact-channel__text">
        <span className="contact-channel__label">{label}</span>
        {text && <span className="contact-channel__value">{text}</span>}
        {single && <span className="contact-channel__value">{single.value}</span>}
        {links.length > 1 && (
          <span className="contact-channel__multi">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="contact-channel__value contact-channel__inline">
                {l.value}
              </a>
            ))}
          </span>
        )}
      </span>
      {single && (
        <span className="contact-channel__arrow">
          <ContactIcon name={single.external ? "external" : "arrow"} size={18} />
        </span>
      )}
    </>
  );
  return (
    <li className={copyText ? "has-copy" : undefined}>
      {single ? (
        <a
          className="contact-channel contact-channel--link"
          href={single.href}
          {...(single.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {inner}
        </a>
      ) : (
        <div className="contact-channel">{inner}</div>
      )}
      {/* sibling of the link (a button can't sit inside an <a>) — desktop
          visitors can't dial a tel: link, so they get a one-click copy */}
      {copyText && (
        <CopyButton
          text={copyText}
          label={copyLabels.copy}
          doneLabel={copyLabels.copied}
          className="contact-channel__copy"
          iconOnly
        />
      )}
    </li>
  );
}

const deptLinks = (phone, email) => [
  ...(phone ? [{ href: telHref(phone), value: phone }] : []),
  ...(email ? [{ href: `mailto:${email}`, value: email }] : []),
];

function CopyButton({ text, label, doneLabel, className = "copy-btn", iconOnly = false }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* clipboard blocked — the value is still selectable */
    }
  };
  return (
    <button
      type="button"
      className={`${className} ${done ? "is-done" : ""}`}
      onClick={copy}
      aria-label={iconOnly ? `${label} ${text}` : undefined}
      title={iconOnly ? label : undefined}
    >
      <ContactIcon name={done ? "check" : "copy"} size={16} />
      {iconOnly ? (
        <span className="contact-channel__copy-tip" aria-live="polite">
          {done ? doneLabel : label}
        </span>
      ) : done ? (
        doneLabel
      ) : (
        label
      )}
    </button>
  );
}

/** LINE QR that opens large in a native <dialog> (Esc / backdrop closes it). */
function LineQr({ src, lineId, t }) {
  const dialogRef = useRef(null);
  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();
  return (
    <>
      <button type="button" className="contact-qr" onClick={open} aria-haspopup="dialog">
        <img src={src} alt={`LINE ${lineId}`} width="96" height="96" />
        <span className="contact-qr__text">
          <strong>{t("contacts.qrTitle")}</strong>
          {t("contacts.qrSub")}
          <span className="contact-qr__zoom">{t("contacts.qrZoom")}</span>
        </span>
      </button>
      <dialog
        ref={dialogRef}
        className="qr-dialog"
        aria-label={`LINE ${lineId}`}
        onClick={(e) => e.target === dialogRef.current && close()}
      >
        <div className="qr-dialog__card">
          <button type="button" className="qr-dialog__close" onClick={close} aria-label={t("contactForm.successModal.close")}>
            <ContactIcon name="x" size={20} />
          </button>
          <img src={src} alt={`LINE ${lineId}`} />
          <p className="qr-dialog__id">LINE {lineId}</p>
          <p className="qr-dialog__sub">{t("contacts.qrSub")}</p>
        </div>
      </dialog>
    </>
  );
}

// Cursor-following light on the form card's edge (CSS reads --mx/--my).
const trackPointer = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};

function LocationMedia({ loc, t }) {
  const [view, setView] = useState(loc.photo ? "photo" : "map");
  return (
    <div className="location-card__media">
      {view === "photo" && loc.photo ? (
        <img src={loc.photo} alt={loc.label} loading="lazy" />
      ) : (
        loc.src && (
          <iframe src={loc.src} title={loc.label} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        )
      )}
      {loc.photo && (
        <div className="location-card__toggle" role="group" aria-label={loc.label}>
          {["photo", "map"].map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
              {t(`contacts.view_${v}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Contacts() {
  const { t, lang } = useLanguage();
  const [pageContent, setPageContent] = useState(null);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    api
      .getContactsPageContent()
      .then(setPageContent)
      .catch(() => setPageContent(null));
    api
      .getBrands()
      .then((rows) => setBrands(Array.isArray(rows) ? rows : []))
      .catch(() => setBrands([]));
  }, []);

  // Links ending in #quote (e.g. "Discuss this solution") land on the form.
  // The router doesn't scroll to hashes, so do it once the page has laid out.
  useEffect(() => {
    if (window.location.hash !== "#quote") return undefined;
    const id = setTimeout(() => document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
    return () => clearTimeout(id);
  }, []);

  // Reads `${field}_${lang}` from the admin-editable contacts_page_content
  // row, falling back to the built-in translation/hardcoded default if the
  // DB row isn't loaded yet (or unedited).
  const cc = (field, fallback) => {
    if (!pageContent) return fallback;
    const value = pageContent[`${field}_${lang}`];
    return value || fallback;
  };
  const ccPlain = (field, fallback = "") => (pageContent && pageContent[field]) || fallback;

  const headPhone = ccPlain("head_office_phone", "+66 (0)2 000 0000");
  const headEmail = ccPlain("head_office_email", "contact@trisakgroup.com");
  const lineId = ccPlain("line_id", DEFAULT_LINE_ID);
  const lineUrl = ccPlain("line_url") || (lineId ? lineHref(lineId) : "");
  // the bundled QR belongs to @trisak only — don't pair it with another ID
  const lineQr = ccPlain("line_qr_image") || (lineId === DEFAULT_LINE_ID ? defaultLineQr : "");
  const officeHours = cc("office_hours", "");
  const support = deptLinks(ccPlain("support_phone"), ccPlain("support_email"));
  const accounting = deptLinks(ccPlain("accounting_phone"), ccPlain("accounting_email"));

  const companyName = cc("company_name", "");
  const taxId = ccPlain("tax_id");
  const vendorDocs = parseList(ccPlain("vendor_docs"))
    .filter((d) => d.url)
    .map((d) => ({ url: d.url, label: d[`label_${lang}`] || d.label_en || d.label_th || "PDF" }));
  const faq = parseList(ccPlain("faq"))
    .map((f) => ({ q: f[`q_${lang}`] || "", a: f[`a_${lang}`] || "" }))
    .filter((f) => f.q && f.a);

  const authorized = brands.filter((b) =>
    AUTHORIZED_BRANDS.some((k) => (b.slug || "").toLowerCase().includes(k) || (b.name || "").toLowerCase().includes(k))
  );

  const locations = [
    {
      key: "head_office",
      label: cc("head_office_label", t("contacts.headOffice")),
      address: cc("head_office_address", t("contacts.headOfficeAddress")),
      phone: headPhone,
      email: headEmail,
    },
    {
      key: "warehouse",
      label: cc("warehouse_label", t("contacts.warehouse")),
      address: cc("warehouse_address", t("contacts.warehouseAddress")),
      phone: ccPlain("warehouse_phone", "+66 (0)2 111 1111"),
      email: ccPlain("warehouse_email", "warehouse@trisakgroup.com"),
    },
  ].map((loc) => ({
    ...loc,
    src: toMapEmbedSrc(ccPlain(`${loc.key}_map`) || loc.address, lang),
    link: ccPlain(`${loc.key}_map_link`, DEFAULT_MAP_LINKS[loc.key]),
    photo: ccPlain(`${loc.key}_photo`),
  }));
  const heroBgImage = pageContent?.hero_bg_image || "";
  const copyLabels = { copy: t("contacts.copy"), copied: t("contacts.copied") };

  return (
    <>
      {/* Fragment, not a wrapper: the hero must stay a sibling of .site-header
          so it slides up under the transparent header. */}
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
          <div className="hero__actions contact-hero__actions">
            {headPhone && (
              <a className="btn btn-primary" href={telHref(headPhone)}>
                <ContactIcon name="phone" size={16} />
                {t("contacts.callNow")}
              </a>
            )}
            {lineId ? (
              <a className="btn contact-hero__line" href={lineUrl} target="_blank" rel="noopener noreferrer">
                <ContactIcon name="chat" size={16} />
                LINE {lineId}
              </a>
            ) : (
              headEmail && (
                <a className="btn contact-hero__ghost" href={`mailto:${headEmail}`}>
                  <ContactIcon name="mail" size={16} />
                  {t("contacts.emailUs")}
                </a>
              )
            )}
          </div>
        </div>
      </section>

      <section className="contact-main">
        <div className="container contact-main__grid">
          <div className="contact-channels">
            <h2 className="contact-main__title">{cc("info_title", t("contacts.infoTitle"))}</h2>
            <p className="contact-main__lede">{t("contacts.infoLede")}</p>
            <ul className="contact-channels__list">
              {headPhone && (
                <ChannelRow
                  icon="phone"
                  label={t("contacts.phoneLabel")}
                  links={[{ href: telHref(headPhone), value: headPhone }]}
                  copyText={headPhone}
                  copyLabels={copyLabels}
                />
              )}
              {support.length > 0 && <ChannelRow icon="support" label={t("contacts.supportLabel")} links={support} />}
              {accounting.length > 0 && (
                <ChannelRow icon="receipt" label={t("contacts.accountingLabel")} links={accounting} />
              )}
              {headEmail && (
                <ChannelRow
                  icon="mail"
                  label={t("contacts.emailLabel")}
                  links={[{ href: `mailto:${headEmail}`, value: headEmail }]}
                  copyText={headEmail}
                  copyLabels={copyLabels}
                />
              )}
              {lineId && (
                <ChannelRow icon="chat" label="LINE" links={[{ href: lineUrl, value: lineId, external: true }]} />
              )}
              {officeHours && <ChannelRow icon="clock" label={t("contacts.hoursLabel")} text={officeHours} />}
            </ul>

            {lineQr && <LineQr src={lineQr} lineId={lineId} t={t} />}

            {authorized.length > 0 && (
              <div className="contact-trust">
                <p className="contact-trust__head">
                  <ContactIcon name="badge" size={18} />
                  {t("contacts.authorizedTitle")}
                </p>
                <ul className="contact-trust__logos">
                  {authorized.map((b) => (
                    <li key={b.slug || b.name}>
                      {b.logo_url ? <img src={b.logo_url} alt={b.name} /> : <span>{b.name}</span>}
                    </li>
                  ))}
                </ul>
                <p className="contact-trust__sub">{t("contacts.authorizedSub")}</p>
              </div>
            )}
          </div>

          <div className="contact-form-card" id="quote" onPointerMove={trackPointer}>
            <h2 className="contact-form-card__title">{t("contacts.formTitle")}</h2>
            <p className="contact-form-card__sub">{t("contacts.formSub")}</p>
            <ContactForm />
          </div>
        </div>
      </section>

      {(companyName || taxId || vendorDocs.length > 0) && (
        <section className="section contact-procure">
          <Reveal className="container contact-procure__grid">
            <div>
              <h2 className="contact-procure__title">{t("contacts.procureTitle")}</h2>
              <p className="contact-procure__lede">{t("contacts.procureSub")}</p>
            </div>
            <div className="contact-procure__body">
              {(companyName || taxId) && (
                <dl className="contact-procure__facts">
                  {companyName && (
                    <div>
                      <dt>{t("contacts.companyNameLabel")}</dt>
                      <dd>{companyName}</dd>
                    </div>
                  )}
                  {taxId && (
                    <div>
                      <dt>{t("contacts.taxIdLabel")}</dt>
                      <dd className="contact-procure__taxid">
                        <span>{taxId}</span>
                        <CopyButton text={taxId} label={t("contacts.copy")} doneLabel={t("contacts.copied")} />
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              {vendorDocs.length > 0 && (
                <ul className="contact-procure__docs">
                  {vendorDocs.map((d) => (
                    <li key={d.url}>
                      <a href={d.url} target="_blank" rel="noopener noreferrer" download>
                        <span className="contact-procure__doc-icon">
                          <ContactIcon name="doc" />
                        </span>
                        <span className="contact-procure__doc-name">{d.label}</span>
                        <span className="contact-procure__doc-meta">PDF</span>
                        <ContactIcon name="download" size={18} />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        </section>
      )}

      <section className="section contact-locations">
        <div className="container">
          <h2 className="contact-locations__title">{cc("map_title", t("contacts.mapTitle"))}</h2>
          <div className="contact-locations__grid">
            {locations.map((loc, i) => (
              <Reveal as="article" className="location-card" key={loc.key} style={{ transitionDelay: `${i * 0.12}s` }}>
                <LocationMedia loc={loc} t={t} />
                <div className="location-card__body">
                  <h3 className="location-card__name">{loc.label}</h3>
                  <address className="location-card__address">
                    {loc.address.split("\n").map((line, i) => (
                      <span key={i}>{line}</span>
                    ))}
                  </address>
                  <div className="location-card__links">
                    {loc.phone && (
                      <a href={telHref(loc.phone)}>
                        <ContactIcon name="phone" size={16} />
                        {loc.phone}
                      </a>
                    )}
                    {loc.email && (
                      <a href={`mailto:${loc.email}`}>
                        <ContactIcon name="mail" size={16} />
                        {loc.email}
                      </a>
                    )}
                  </div>
                  <a className="location-card__directions" href={loc.link} target="_blank" rel="noopener noreferrer">
                    {t("contacts.openInMaps")}
                    <ContactIcon name="external" size={16} />
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {faq.length > 0 && (
        <section className="section contact-faq">
          <Reveal className="container contact-faq__grid">
            <h2 className="contact-faq__title">{t("contacts.faqTitle")}</h2>
            <div className="contact-faq__list">
              {faq.map((f, i) => (
                <details key={i} className="contact-faq__item">
                  <summary>
                    <span>{f.q}</span>
                    <ContactIcon name="chevron" size={20} />
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}
