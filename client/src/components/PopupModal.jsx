import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api/client.js";

/**
 * Home-page welcome pop-up. Shows every time the Home page loads —
 * a hard refresh, a fresh session, or navigating away and back all
 * count as "loading the Home page" and bring it back. No
 * localStorage/sessionStorage/cookie is used to suppress it; the
 * only thing that hides it is the Admin "Enable / Disable" toggle
 * (or having no image uploaded).
 */
export default function PopupModal() {
  const { pathname } = useLocation();
  const [imageUrl, setImageUrl] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      setVisible(false);
      return;
    }
    api
      .getActivePopup()
      .then((data) => {
        if (data && data.image_url) {
          setImageUrl(data.image_url);
          setVisible(true);
        } else {
          setVisible(false);
        }
      })
      .catch(() => {
        // silent — a popup failing to load should never block the site
      });
  }, [pathname]);

  const close = () => setVisible(false);

  if (!visible || !imageUrl) return null;

  return (
    <div className="vp-popup-overlay" role="dialog" aria-modal="true" onClick={close}>
      <div className="vp-popup-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="vp-popup-close" onClick={close} aria-label="ปิด">
          ×
        </button>
        <img src={imageUrl} alt="" className="vp-popup-image" />
      </div>
    </div>
  );
}
