import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiAlertCircle,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiHelpCircle,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiUsers,
  FiVideo,
  FiTarget,
  FiBell,
  FiX,
} from "react-icons/fi";
import { clearToken } from "../api";

const links = [
  { to: "/", icon: FiBarChart2, label: "Dashboard" },
  { to: "/users", icon: FiUsers, label: "Utilizatori" },
  { to: "/subscriptions", icon: FiCreditCard, label: "Abonamente" },
  { to: "/entries", icon: FiFileText, label: "Progres" },
  { to: "/questions", icon: FiHelpCircle, label: "Întrebări" },
  { to: "/bug-reports", icon: FiAlertCircle, label: "Sesizări" },
  { to: "/meetings", icon: FiCalendar, label: "Calendar" },
  { to: "/webinars", icon: FiVideo, label: "Webinarii" },
  { to: "/videos", icon: FiLayers, label: "Videoclipuri" },
  { to: "/challenges", icon: FiTarget, label: "Provocări" },
  { to: "/announcements", icon: FiBell, label: "Anunțuri" },
  { to: "/books", icon: FiBookOpen, label: "Cărți PDF" },
];

export default function Sidebar({ onLogout }) {
  const [open, setOpen] = useState(false);
  const menu = useRef(null),
    closeButton = useRef(null),
    nav = useRef(null);
  const close = () => {
    setOpen(false);
    menu.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [open]);

  const handleLogout = () => {
    clearToken();
    onLogout();
  };

  return (
    <>
      {/* Bara de sus, vizibilă doar pe mobil */}
      <header className="mobile-topbar">
        <img
          src="/brandmark.png"
          alt="Dan fost anxios"
          className="mobile-topbar__logo"
        />
        <button
          type="button"
          className="mobile-topbar__menu"
          ref={menu}
          onClick={() => setOpen(true)}
          aria-label="Deschide meniul"
          aria-expanded={open}
          aria-controls="panel-navigation"
        >
          <FiMenu />
        </button>
      </header>

      {open ? (
        <button
          type="button"
          aria-label="Închide meniul"
          className="sidebar-backdrop"
          onClick={close}
        />
      ) : null}

      <aside
        id="panel-navigation"
        ref={nav}
        className={`sidebar${open ? " sidebar--open" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) close();
          if (event.key === "Tab" && open) {
            const focusable = [
              ...nav.current.querySelectorAll("a,button"),
            ].filter((el) => el.getClientRects().length);
            const first = focusable[0],
              last = focusable.at(-1);
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div className="sidebar__brand">
          <img
            src="/brandmark.png"
            alt="Dan fost anxios"
            className="sidebar__logo-img"
          />
          <div className="sidebar__brand-copy">
            <strong>Dan fost anxios</strong>
            <span>Panou de administrare</span>
          </div>
          <button
            type="button"
            className="sidebar__close"
            ref={closeButton}
            onClick={close}
            aria-label="Închide meniul"
          >
            <FiX />
          </button>
        </div>
        <nav className="sidebar__nav" aria-label="Navigație principală">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              title={l.label}
              onClick={close}
              className={({ isActive }) =>
                `sidebar__link${isActive ? " sidebar__link--active" : ""}`
              }
            >
              <span className="sidebar__link-icon">
                <l.icon />
              </span>
              <span className="sidebar__link-label">{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <button className="sidebar__logout" onClick={handleLogout}>
            <FiLogOut /> Deconectare
          </button>
        </div>
      </aside>
    </>
  );
}
