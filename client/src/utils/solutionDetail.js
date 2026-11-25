import { translations } from "../i18n/translations.js";

// Content of a solution's own page (/automation-solution/:slug), as stored in
// solutions.detail (migration 058): both languages side by side, icons shared.
//   { image, tagline_en, tagline_th,
//     services: [{ icon, title_en, title_th, items_en, items_th }],
//     benefits: [{ icon, text_en, text_th, desc_en, desc_th }] }

/** The built-in page text (translations.js) in the stored shape, or null if the slug has none. */
export function builtInSolutionDetail(slug) {
  const en = translations.en.automationSolution.details?.[slug];
  const th = translations.th.automationSolution.details?.[slug];
  if (!en && !th) return null;
  const base = en || th;
  return {
    image: base.image || "",
    tagline_en: en?.tagline || "",
    tagline_th: th?.tagline || "",
    services: (base.services || []).map((s, i) => ({
      icon: s.icon,
      title_en: en?.services?.[i]?.title || "",
      title_th: th?.services?.[i]?.title || "",
      items_en: en?.services?.[i]?.items || [],
      items_th: th?.services?.[i]?.items || [],
    })),
    benefits: (base.benefits || []).map((b, i) => ({
      icon: b.icon,
      text_en: en?.benefits?.[i]?.text || "",
      text_th: th?.benefits?.[i]?.text || "",
      desc_en: en?.benefits?.[i]?.desc || "",
      desc_th: th?.benefits?.[i]?.desc || "",
    })),
  };
}

/** One language of a stored detail; an empty field or list falls back to the other language. */
export function localizeSolutionDetail(detail, lang) {
  if (!detail) return null;
  const other = lang === "th" ? "en" : "th";
  const pick = (o, field) => {
    const v = o[`${field}_${lang}`];
    return (Array.isArray(v) ? v.length : v) ? v : o[`${field}_${other}`];
  };
  return {
    image: detail.image || "",
    tagline: pick(detail, "tagline") || "",
    services: (detail.services || []).map((s) => ({ icon: s.icon, title: pick(s, "title") || "", items: pick(s, "items") || [] })),
    benefits: (detail.benefits || []).map((b) => ({ icon: b.icon, text: pick(b, "text") || "", desc: pick(b, "desc") || "" })),
  };
}
