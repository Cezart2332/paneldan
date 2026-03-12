import { NavLink } from 'react-router-dom';
import { clearToken } from '../api';

const links = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/users', icon: '👥', label: 'Utilizatori' },
  { to: '/entries', icon: '📝', label: 'Jurnale' },
  { to: '/questions', icon: '❓', label: 'Întrebări' },
  { to: '/meetings', icon: '📅', label: 'Ședințe' },
];

export default function Sidebar({ onLogout }) {
  const handleLogout = () => {
    clearToken();
    onLogout();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">🛡️</div>
        <span className="sidebar__title">Panel Dan</span>
      </div>
      <nav className="sidebar__nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
          >
            <span className="sidebar__link-icon">{l.icon}</span>
            <span className="sidebar__link-label">{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__footer">
        <button className="sidebar__logout" onClick={handleLogout}>
          🚪 Deconectare
        </button>
      </div>
    </aside>
  );
}
