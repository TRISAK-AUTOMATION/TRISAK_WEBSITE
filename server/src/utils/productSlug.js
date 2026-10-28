// ITEM NO -> product URL slug.
//
// Rules (the only transformation applied):
//   1. trim leading / trailing whitespace
//   2. every run of whitespace becomes a single hyphen
// Everything else is kept exactly as entered, including letter case:
//   "CIMR JT2A0010BAA"  ->  "CIMR-JT2A0010BAA"
//   "  AB   12 "        ->  "AB-12"
//
// An ITEM NO that would still not be URL-safe (anything other than letters,
// numbers, spaces and hyphens) is rejected rather than silently altered.
// Keep in sync with client/src/utils/productSlug.js.

export const ITEM_NO_MAX_LENGTH = 150; // products.item_no / products.slug are VARCHAR(150)
const SLUG_RE = /^(?=.*[A-Za-z0-9])[A-Za-z0-9-]+$/;

export function normalizeItemNo(value) {
  return (value ?? "").toString().trim();
}

export function generateSlugFromItemNo(itemNo) {
  return normalizeItemNo(itemNo).replace(/\s+/g, "-");
}

/** Returns an error message, or null when the ITEM NO can be used. */
export function validateItemNo(itemNo) {
  const value = normalizeItemNo(itemNo);
  if (!value) return "ITEM NO is required";
  if (value.length > ITEM_NO_MAX_LENGTH) {
    return `ITEM NO is too long (${value.length} characters, maximum ${ITEM_NO_MAX_LENGTH})`;
  }
  const slug = generateSlugFromItemNo(value);
  if (slug.length > ITEM_NO_MAX_LENGTH) {
    return `The URL slug generated from this ITEM NO is too long (maximum ${ITEM_NO_MAX_LENGTH} characters)`;
  }
  if (!SLUG_RE.test(slug)) {
    return `ITEM NO "${value}" can contain only letters, numbers, spaces and hyphens (spaces become hyphens in the URL slug; other characters are not changed, so it cannot be used)`;
  }
  return null;
}
