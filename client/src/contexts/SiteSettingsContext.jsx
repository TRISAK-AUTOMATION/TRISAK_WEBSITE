import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api
      .getSiteSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  // Keep the browser tab's favicon in sync with the admin-configured
  // image. Falls back to whatever favicon the document already
  // declares (i.e. does nothing) when no favicon has been set.
  useEffect(() => {
    if (!settings?.favicon_url) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = settings.favicon_url;
  }, [settings]);

  return (
    <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
  );
}

/** Returns the current site_settings row, or null while loading / if none is set. */
export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
