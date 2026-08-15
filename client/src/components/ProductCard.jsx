import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const href = `/products/${product.brand_slug}/${product.category_slug}${
    product.series_slug ? `/${product.series_slug}` : ""
  }/${product.slug}`;

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
