// Availability statuses. The values are what the API stores and validates;
// labels shown to visitors come from the i18n keys products.availability.*.
export const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Unavailable" },
  { value: "discontinued", label: "Discontinued" },
  { value: "replacement_available", label: "Replacement Available" },
];

// statuses an admin may attach a replacement product to
export const REPLACEMENT_STATUSES = ["discontinued", "replacement_available"];

export function availabilityLabel(value) {
  return AVAILABILITY_OPTIONS.find((o) => o.value === value)?.label || "";
}

export function productHref(p) {
  return `/products/${p.brand_slug}/${p.category_slug}${p.series_slug ? `/${p.series_slug}` : ""}/${p.slug}`;
}
