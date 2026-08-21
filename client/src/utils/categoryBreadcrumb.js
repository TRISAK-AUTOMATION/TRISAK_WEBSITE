/**
 * Given the ancestor chain returned by /api/categories/:id/breadcrumb
 * (root -> ... -> current, each {id, name, slug}), build the correct URL
 * for the category at position `index` in that chain.
 *
 * The root level uses its own slug directly in the URL
 * (/products/:brand/:rootSlug); every level below that is addressed by
 * id under /cat/ (/products/:brand/:rootSlug/cat/<id>/<id>/...), since
 * slugs below the root aren't guaranteed to be unique in isolation and
 * arbitrary depth can't be expressed as fixed route segments.
 */
export function categoryLevelHref(brandSlug, crumb, index) {
  if (index === 0) return `/products/${brandSlug}/${crumb[0].slug}`;
  const chain = crumb
    .slice(1, index + 1)
    .map((c) => c.id)
    .join("/");
  return `/products/${brandSlug}/${crumb[0].slug}/cat/${chain}`;
}

/** Breadcrumb items (label + to) for the full ancestor chain. */
export function categoryBreadcrumbItems(brandSlug, crumb) {
  return crumb.map((c, i) => ({
    label: c.name,
    to: categoryLevelHref(brandSlug, crumb, i),
  }));
}
