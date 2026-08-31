import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const MenuContext = createContext(null);

export function MenuProvider({ children }) {
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    api
      .getMenu()
      .then(setMenu)
      .catch(() => setMenu(null));
  }, []);

  return <MenuContext.Provider value={menu}>{children}</MenuContext.Provider>;
}

/** Returns { header: [...], footer: [...] } | null while loading / if the fetch failed. */
export function useMenu() {
  return useContext(MenuContext);
}
