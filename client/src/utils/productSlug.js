// ITEM NO -> product URL slug. Mirrors server/src/utils/productSlug.js (the
// server is the authority; this only powers the live preview in the admin form).
//   "CIMR JT2A0010BAA" -> "CIMR-JT2A0010BAA"  (trim, whitespace runs -> one hyphen)
export function generateSlugFromItemNo(itemNo) {
  return (itemNo ?? "").toString().trim().replace(/\s+/g, "-");
}
