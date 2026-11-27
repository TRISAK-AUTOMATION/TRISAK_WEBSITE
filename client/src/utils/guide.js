import { api } from "../api/client.js";

/**
 * Products guide helpers (pages/products/Guide*.jsx).
 *
 * The guide list is small (tens of series) and the same on every guide page,
 * so it is loaded once per visit and shared; pages render from the cached
 * copy at once and refresh it in the background.
 */
let cached = null;
let inflight = null;

export const cachedGuide = () => cached;

export function loadGuide() {
  if (!inflight) {
    inflight = api
      .getGuide()
      .then((data) => {
        cached = data;
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** `${base}_th` in Thai (blank → English), else the English field. */
export function tx(row, base, lang, enField = base) {
  if (!row) return "";
  if (lang === "th") return row[`${base}_th`] || row[enField] || "";
  return row[enField] || row[`${base}_th`] || "";
}

/** Bilingual JSON items use label_en / label_th style keys. */
export const tk = (item, base, lang) =>
  (lang === "th" ? item?.[`${base}_th`] || item?.[`${base}_en`] : item?.[`${base}_en`] || item?.[`${base}_th`]) || "";

export const typeName = (type, lang) => (lang === "th" ? type?.name_th || type?.name : type?.name) || "";

// the guide lives under /products/series (the full catalog keeps /products)
export const GUIDE_BASE = "/products/series";
export const typeHref = (slug) => `${GUIDE_BASE}/${slug}`;
export const seriesHref = (s) => `${GUIDE_BASE}/${s.type_slug}/${s.slug}`;

/** "{n} series" style templates. */
export const fill = (template, values) =>
  String(template || "").replace(/\{(\w+)\}/g, (_, k) => (values[k] ?? ""));
