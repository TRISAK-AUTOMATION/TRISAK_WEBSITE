import { useLanguage } from "../i18n/LanguageContext.jsx";

// Products per page on listing pages: 3 columns × 10 rows on desktop.
export const PRODUCTS_PER_PAGE = 30;

// [1, "…", 4, 5, 6, "…", 12] — always first, last and current ±1.
function pageItems(page, total) {
  const keep = new Set([1, total, page - 1, page, page + 1]);
  const nums = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

/** Previous / page numbers / Next, plus "Page X of Y". Hidden when there is only one page. */
export default function Pagination({ page, totalPages, onChange }) {
  const { t } = useLanguage();
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label={t("products.paginationLabel")}>
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        ← {t("products.prevPage")}
      </button>

      <div className="pagination__pages">
        {pageItems(page, totalPages).map((item) =>
          typeof item === "string" ? (
            <span key={item} className="pagination__gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`pagination__btn pagination__num${item === page ? " is-current" : ""}`}
              onClick={() => onChange(item)}
              aria-current={item === page ? "page" : undefined}
              aria-label={`${t("products.pageWord")} ${item}`}
            >
              {item}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        className="pagination__btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        {t("products.nextPage")} →
      </button>

      <span className="pagination__status">
        {t("products.pageWord")} {page} / {totalPages}
      </span>
    </nav>
  );
}
