import { useLanguage } from "../i18n/LanguageContext.jsx";

// Checkbox whose "some but not all" state is shown as indeterminate.
function Check({ checked, indeterminate, onChange, label }) {
  return (
    <label className="filter-check">
      <input
        type="checkbox"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = !checked && !!indeterminate;
        }}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

function CategoryNode({ node, depth, selected, expanded, onToggleCat, onToggleExpand, subtreeState, t }) {
  const hasKids = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const { checked, partial } = subtreeState(node);

  return (
    <li className="filter-tree__item">
      <div className="filter-tree__row" style={{ paddingLeft: depth * 16 }}>
        {hasKids ? (
          <button
            type="button"
            className={`filter-tree__toggle ${isOpen ? "is-open" : ""}`}
            onClick={() => onToggleExpand(node.id)}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? t("products.filterCollapse") : t("products.filterExpand")} ${node.name}`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="filter-tree__spacer" aria-hidden="true" />
        )}
        <Check checked={checked} indeterminate={partial} onChange={() => onToggleCat(node)} label={node.name} />
      </div>
      {hasKids && isOpen && (
        <ul className="filter-tree">
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selected={selected}
              expanded={expanded}
              onToggleCat={onToggleCat}
              onToggleExpand={onToggleExpand}
              subtreeState={subtreeState}
              t={t}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ProductFilterSidebar({
  query,
  onQuery,
  roots,
  selectedCats,
  expanded,
  onToggleCat,
  onToggleExpand,
  subtreeState,
  brands,
  selectedBrands,
  onToggleBrand,
  onClear,
  activeCount,
  open,
  onToggleOpen,
}) {
  const { t } = useLanguage();

  return (
    <aside className={`filter-sidebar ${open ? "is-open" : ""}`}>
      <button type="button" className="filter-sidebar__toggle" onClick={onToggleOpen} aria-expanded={open}>
        <span>{t("products.filterShow")}</span>
        {activeCount > 0 && <span className="filter-sidebar__badge">{activeCount}</span>}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="filter-sidebar__chev">
          <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="filter-sidebar__body">
        <div className="filter-sidebar__top">
          <input
            type="search"
            className="filter-search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={t("products.filterSearchPlaceholder")}
            aria-label={t("products.filterSearchPlaceholder")}
          />
          {activeCount > 0 && (
            <button type="button" className="filter-clear" onClick={onClear}>
              {t("products.filterClearAll")}
            </button>
          )}
        </div>

        {roots.length > 0 && (
          <div className="filter-section">
            <h3 className="filter-section__title">{t("products.filterCategories")}</h3>
            <ul className="filter-tree filter-tree--root">
              {roots.map((node) => (
                <CategoryNode
                  key={node.id}
                  node={node}
                  depth={0}
                  selected={selectedCats}
                  expanded={expanded}
                  onToggleCat={onToggleCat}
                  onToggleExpand={onToggleExpand}
                  subtreeState={subtreeState}
                  t={t}
                />
              ))}
            </ul>
          </div>
        )}

        {brands.length > 0 && (
          <div className="filter-section">
            <h3 className="filter-section__title">{t("products.filterBrands")}</h3>
            <ul className="filter-tree filter-tree--root">
              {brands.map((b) => (
                <li key={b.slug} className="filter-tree__item">
                  <div className="filter-tree__row">
                    <Check checked={selectedBrands.has(b.slug)} onChange={() => onToggleBrand(b.slug)} label={b.name} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
