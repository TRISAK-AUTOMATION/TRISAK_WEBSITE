import { Link } from "react-router-dom";

// variant="split" → horizontal card: model + short description on the left,
// product image on the right (used by the Products page "Latest Products"
// carousel). Default variant is unchanged.
export default function ProductCard({ product, variant }) {
  const href = `/products/${product.brand_slug}/${product.category_slug}${
    product.series_slug ? `/${product.series_slug}` : ""
  }/${product.slug}`;

  if (variant === "split") {
    const title = product.model || product.name;
    const desc = product.short_description || (product.model ? product.name : "");
    return (
      <Link to={href} className="product-card-split">
        <div className="product-card-split__text">
          <h3 className="product-card-split__model">{title}</h3>
          {desc && <p className="product-card-split__desc">{desc}</p>}
        </div>
        <div className="product-card-split__image">
          {product.image_url ? (
            <img src={product.image_url} alt={title} loading="lazy" draggable="false" />
          ) : (
            <span className="product-card__image-placeholder">{title}</span>
          )}
          {product.is_new && <span className="badge-new">NEW</span>}
        </div>
      </Link>
    );
  }

  return (
    <Link to={href} className="grid-cell product-card">
      <div className="product-card__image" aria-hidden="true">
        {product.image_url ? (
          <img src={product.image_url} alt="" />
        ) : (
          <span className="product-card__image-placeholder">{product.model || product.name}</span>
        )}
        {product.is_new && <span className="badge-new">NEW</span>}
      </div>
      <span className="product-card__brand">{product.brand}</span>
      <h3>{product.name}</h3>
      {(product.series || product.model) && (
        <span className="product-card__model">
          {product.series ? `${product.series} · ` : ""}
          {product.model}
        </span>
      )}
    </Link>
  );
}
