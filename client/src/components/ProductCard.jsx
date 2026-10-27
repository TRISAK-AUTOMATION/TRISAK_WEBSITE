import { Link } from "react-router-dom";
import ProductImage from "./ProductImage.jsx";
import AvailabilityBadge from "./AvailabilityBadge.jsx";

// variant="split" → horizontal card: model + short description on the left,
// product image on the right (used by the Products page "Latest Products"
// carousel). variant="plain" → borderless catalog tile (image, category label,
// blue model name, short description) used by the Category page grid.
// Default variant is unchanged.
export default function ProductCard({ product, variant }) {
  const href = `/products/${product.brand_slug}/${product.category_slug}${
    product.series_slug ? `/${product.series_slug}` : ""
  }/${product.slug}`;

  if (variant === "plain") {
    const title = product.model || product.name;
    const desc = product.short_description || (product.model ? product.name : "");
    return (
      <Link to={href} className="product-tile">
        <div className="product-tile__image">
          <ProductImage src={product.image_url} alt={title} />
          {product.is_new && <span className="badge-new">NEW</span>}
        </div>
        {(product.brand || product.category) && (
          <span className="product-tile__type">
            {[product.brand, product.category].filter(Boolean).join(" · ")}
          </span>
        )}
        <h3 className="product-tile__model">{title}</h3>
        {desc && <p className="product-tile__desc">{desc}</p>}
        <AvailabilityBadge status={product.availability_status} />
      </Link>
    );
  }

  if (variant === "split") {
    const title = product.model || product.name;
    const desc = product.short_description || (product.model ? product.name : "");
    return (
      <Link to={href} className="product-card-split">
        <div className="product-card-split__text">
          <h3 className="product-card-split__model">{title}</h3>
          {desc && <p className="product-card-split__desc">{desc}</p>}
          <AvailabilityBadge status={product.availability_status} />
        </div>
        <div className="product-card-split__image">
          <ProductImage src={product.image_url} alt={title} />
          {product.is_new && <span className="badge-new">NEW</span>}
        </div>
      </Link>
    );
  }

  return (
    <Link to={href} className="grid-cell product-card">
      <div className="product-card__image" aria-hidden="true">
        <ProductImage src={product.image_url} />
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
      <AvailabilityBadge status={product.availability_status} />
    </Link>
  );
}
