import { useEffect, useRef, useState } from "react";

// Fades + slides its content up the first time it scrolls into view.
// Renders a plain element (div by default) so it can stand in for a
// `.container` wrapper without changing layout.
export default function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // trigger once the top of the block is ~10% above the bottom edge
      { rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
