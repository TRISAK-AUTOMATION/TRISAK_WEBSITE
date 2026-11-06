// Product status. "Item Status" (Excel import / admin form) is the only status
// value an admin sets; the database derives availability_status from it plus
// the replacement link:
//   Active                                   -> available
//   Discontinued, replacement product linked -> replacement_available
//   Discontinued, no replacement             -> discontinued
// Labels shown to visitors come from the i18n keys products.availability.*.

// Item Status choices, as stored and sent to the API
export const ITEM_STATUS_OPTIONS = [
  { value: "Active", label: "Available" },
  { value: "Discontinued", label: "Discontinued" },
];

// Derived website statuses (availability_status)
export const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "discontinued", label: "Discontinued" },
  { value: "replacement_available", label: "Replacement Available" },
];

export function availabilityLabel(status) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label || "";
}

export function productHref(p) {
  return `/products/${p.brand_slug}/${p.category_slug}${p.series_slug ? `/${p.series_slug}` : ""}/${p.slug}`;
}
