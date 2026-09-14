import { useCallback, useEffect, useRef, useState } from "react";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Drag-to-position tool for an already-uploaded image.
 *
 * The frame below is rendered at the exact aspect ratio used on the
 * public Solution Block (`aspectRatio`, default 4:3) and the image
 * inside it uses the same `object-fit: cover` the public site uses —
 * so whatever the admin sees here is pixel-for-pixel what visitors
 * will see. The image is auto-scaled to fill the frame; if it's
 * larger than the frame in one direction, the admin can drag it to
 * choose which part is visible. Nothing about the source file is
 * changed — only the resulting crop point (0–100%, from the left/top,
 * matching CSS `object-position`) is reported via `onChange`.
 */
export default function ImagePositionField({
  imageUrl,
  positionX = 50,
  positionY = 50,
  onChange,
  aspectRatio = 4 / 3,
}) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [overflow, setOverflow] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    // Same math as `object-fit: cover`: scale so the image fully
    // covers the frame, then whatever's left over in the larger
    // dimension is how far the image can be dragged.
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const renderedW = img.naturalWidth * scale;
    const renderedH = img.naturalHeight * scale;
    setOverflow({
      x: Math.max(0, renderedW - cw),
      y: Math.max(0, renderedH - ch),
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, imageUrl]);

  const draggableX = overflow.x > 0;
  const draggableY = overflow.y > 0;
  const draggable = draggableX || draggableY;

  const handlePointerDown = (e) => {
    if (!draggable) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: positionX,
      startY: positionY,
    };
    setDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    const { startClientX, startClientY, startX, startY } = dragRef.current;
    const dx = e.clientX - startClientX;
    const dy = e.clientY - startClientY;
    // Dragging the image right reveals more of its left side, so the
    // crop point (object-position) moves the opposite way from the
    // pointer — this is what makes it feel like you're moving the
    // picture itself, not a selection box.
    const nextX = draggableX ? clamp(startX - (dx / overflow.x) * 100, 0, 100) : 50;
    const nextY = draggableY ? clamp(startY - (dy / overflow.y) * 100, 0, 100) : 50;
    onChange({ x: Math.round(nextX), y: Math.round(nextY) });
  };

  const endDrag = (e) => {
    dragRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer capture may already be released — safe to ignore */
    }
  };

  return (
    <div className="image-position-field">
      <div
        ref={containerRef}
        className={`image-position-field__frame ${draggable ? "is-draggable" : ""} ${
          dragging ? "is-dragging" : ""
        }`}
        style={{ aspectRatio: `${aspectRatio}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt=""
          className="image-position-field__image"
          style={{ objectPosition: `${positionX}% ${positionY}%` }}
          onLoad={measure}
          draggable={false}
        />
        {draggable && <div className="image-position-field__hint-badge">✥ ลากเพื่อจัดตำแหน่ง</div>}
      </div>
      <p className="image-position-field__caption">
        กรอบนี้คือขนาด/สัดส่วนเดียวกับที่จะแสดงบนเว็บไซต์จริง
        {draggable ? " — ลากรูปเพื่อเลือกส่วนที่ต้องการให้แสดง" : ""}
      </p>
    </div>
  );
}
