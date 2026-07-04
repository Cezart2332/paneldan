import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiAlertCircle, FiBarChart2, FiCalendar, FiFileText, FiHelpCircle, FiLayers, FiLogOut, FiMenu, FiUsers, FiVideo, FiTarget, FiBell, FiX } from 'react-icons/fi';
import { clearToken } from '../api';

const links = [
  { to: '/', icon: FiBarChart2, label: 'Dashboard' },
  { to: '/users', icon: FiUsers, label: 'Utilizatori' },
  { to: '/entries', icon: FiFileText, label: 'Jurnale' },
  { to: '/questions', icon: FiHelpCircle, label: 'Întrebări' },
  { to: '/bug-reports', icon: FiAlertCircle, label: 'Bug Reports' },
  { to: '/meetings', icon: FiCalendar, label: 'Calendar' },
  { to: '/webinars', icon: FiVideo, label: 'Webinarii' },
  { to: '/videos', icon: FiLayers, label: 'Videoclipuri' },
  { to: '/challenges', icon: FiTarget, label: 'Provocări' },
  { to: '/announcements', icon: FiBell, label: 'Anunțuri' },
];

export default function Sidebar({ onLogout }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const handleLogout = () => {
    clearToken();
    onLogout();
  };

  return (
    <>
      {/* Bara de sus, vizibilă doar pe mobil */}
      <header className="mobile-topbar">
        <img src="/brandmark.png" alt="Dan fost anxios" className="mobile-topbar__logo" />
        <button
          type="button"
          className="mobile-topbar__menu"
          onClick={() => setOpen(true)}
          aria-label="Deschide meniul"
        >
          <FiMenu />
        </button>
      </header>

      {open ? <div className="sidebar-backdrop" onClick={close} /> : null}

      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <img src="/brandmark.png" alt="Dan fost anxios" className="sidebar__logo-img" />
          <span className="sidebar__overline">Panou de administrare</span>
          <button
            type="button"
            className="sidebar__close"
            onClick={close}
            aria-label="Închide meniul"
          >
            <FiX />
          </button>
        </div>
        <nav className="sidebar__nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={close}
              className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
            >
              <span className="sidebar__link-icon"><l.icon /></span>
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
