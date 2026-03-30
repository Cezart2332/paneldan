import { NavLink } from 'react-router-dom';
import { FiAlertCircle, FiBarChart2, FiCalendar, FiFileText, FiHelpCircle, FiLogOut, FiShield, FiUsers } from 'react-icons/fi';
import { clearToken } from '../api';

const links = [
  { to: '/', icon: FiBarChart2, label: 'Dashboard' },
  { to: '/users', icon: FiUsers, label: 'Utilizatori' },
  { to: '/entries', icon: FiFileText, label: 'Jurnale' },
  { to: '/questions', icon: FiHelpCircle, label: 'Întrebări' },
  { to: '/bug-reports', icon: FiAlertCircle, label: 'Bug Reports' },
  { to: '/meetings', icon: FiCalendar, label: 'Calendar' },
];

export default function Sidebar({ onLogout }) {
  const handleLogout = () => {
    clearToken();
    onLogout();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo"><FiShield /></div>
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
  );
}
