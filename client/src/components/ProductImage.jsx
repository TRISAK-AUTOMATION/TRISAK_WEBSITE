import { useEffect, useState } from "react";

// Product image with one consistent placeholder. The placeholder shows when
// `src` is null/empty OR the file fails to load, so products stay visible
// (and clickable) with or without an image.
export default function ProductImage({ src, alt = "", loading = "lazy" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (src && !failed) {
    return <img src={src} alt={alt} loading={loading} draggable="false" onError={() => setFailed(true)} />;
  }

  return (
    <div className="product-image-placeholder" role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : "true"}>
      <svg viewBox="0 0 64 64" width="44%" height="44%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <path d="M32 6 54 18.5v27L32 58 10 45.5v-27z" />
        <path d="M10 18.5 32 31l22-12.5M32 31v27" />
      </svg>
    </div>
  );
}
