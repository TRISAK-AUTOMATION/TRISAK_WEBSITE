import { NavLink } from "react-router-dom";

function isExternal(url) {
  return /^(https?:)?\/\//.test(url) || /^(mailto|tel):/.test(url);
}

/** Renders a menu item's url as an internal NavLink (react-router) or,
 *  for external/mailto/tel links, a plain anchor that opens in a new tab. */
export default function MenuLink({ url, className, activeClassName, end, onClick, children }) {
  if (isExternal(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <NavLink
      to={url}
      end={end}
      onClick={onClick}
      className={
        activeClassName
          ? ({ isActive }) => `${className} ${isActive ? activeClassName : ""}`
          : className
      }
    >
      {children}
    </NavLink>
  );
}
