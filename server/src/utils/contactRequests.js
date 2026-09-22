// Shared constants for Contact Requests (public form + admin panel).

export const CONTACT_STATUSES = ["new", "in_progress", "completed"];

// Values the public contact form can send for "Interested In".
export const VALID_INTERESTS = ["products", "automation_solution", "technical_support"];

// Display labels for those values, shown in the admin panel.
export const INTEREST_LABELS = {
  products: "สินค้า",
  automation_solution: "โซลูชันระบบอัตโนมัติ",
  technical_support: "ทีมสนับสนุนด้านเทคนิค",
};

export function interestLabel(value) {
  return INTEREST_LABELS[value] || value || "—";
}
