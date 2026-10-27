import ImageUploadField from "./ImageUploadField.jsx";

/**
 * Controlled multi-image field built on ImageUploadField (same upload API).
 * `value` is an ordered array of image URLs; the slideshow plays them in
 * this order. Each item can be moved or removed; the empty uploader at the
 * end appends a new image.
 */
export default function ImageListField({ value, onChange, max = 10 }) {
  const images = Array.isArray(value) ? value : [];

  const move = (from, to) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="image-list">
      {images.length > 0 && (
        <ul className="image-list__items">
          {images.map((src, i) => (
            <li className="image-list__item" key={`${src}-${i}`}>
              <img src={src} alt="" className="image-list__thumb" />
              <span className="image-list__order">{i + 1}</span>
              <div className="image-list__actions">
                <button type="button" className="btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier">
                  ←
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => move(i, i + 1)}
                  disabled={i === images.length - 1}
                  aria-label="Move later"
                >
                  →
                </button>
                <button type="button" className="btn" onClick={() => onChange(images.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {images.length < max ? (
        <ImageUploadField value="" onChange={(url) => url && onChange([...images, url])} />
      ) : (
        <p className="image-list__max">Maximum {max} images.</p>
      )}
    </div>
  );
}
