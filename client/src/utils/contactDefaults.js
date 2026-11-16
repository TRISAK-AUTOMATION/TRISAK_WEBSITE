// Contact defaults shared by the Contacts page, its admin editor and the
// footer (kept here so the footer doesn't pull in the whole Contacts page).

// Company LINE Official Account — used unless the admin sets other values.
export const DEFAULT_LINE_ID = "@trisak";

// Share links for "Open in Google Maps" when the admin hasn't set one.
export const DEFAULT_MAP_LINKS = {
  head_office: "https://maps.app.goo.gl/oyn9GMxXdquFfps27",
  warehouse: "https://maps.app.goo.gl/LT1BuDaHmF1mNaMV8",
};

// "@trisak" → https://line.me/R/ti/p/@trisak (used when no LINE URL is set).
export const lineHref = (id) => `https://line.me/R/ti/p/${encodeURIComponent(id.startsWith("@") ? id : `@${id}`)}`;

// "(+66)2-274-0081 Ext.711" → "tel:+6622740081" (extension dropped).
export const telHref = (phone) => `tel:${String(phone).split(/ext|ต่อ/i)[0].replace(/[^\d+]/g, "")}`;
