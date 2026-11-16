import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

// Show the button once the visitor has scrolled this far down.
const SHOW_AFTER = 480;

/**
 * Floating "back to top" button, bottom-right. Appears after scrolling down,
 * and its ring fills with how far down the page the visitor is.
 */
export default function BackToTop() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(y > SHOW_AFTER);
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const toTop = () => {
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  };

  return (
    <button
      type="button"
      className={`back-to-top${visible ? " is-visible" : ""}`}
      onClick={toTop}
      aria-label={t("footer.backToTop")}
      title={t("footer.backToTop")}
      tabIndex={visible ? 0 : -1}
      style={{ "--p": progress }}
    >
      <svg className="back-to-top__ring" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" pathLength="1" />
      </svg>
      <svg className="back-to-top__arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
      </svg>
    </button>
  );
}
