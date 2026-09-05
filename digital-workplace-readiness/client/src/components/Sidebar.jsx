import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const employeeLinks = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/tasks', icon: '✅', label: 'My Tasks' },
  { to: '/attendance', icon: '🕒', label: 'Attendance' },
  { to: '/teams', icon: '👥', label: 'My Team' },
  { to: '/meetings', icon: '📅', label: 'Meetings' },
  { to: '/documents', icon: '📁', label: 'Documents' },
  { to: '/chat', icon: '💬', label: 'Chat' },
  { to: '/readiness', icon: '📊', label: 'Readiness Score' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/profile', icon: '👤', label: 'Profile' },
  { to: '/settings', icon: '⚙️', label: 'Settings' }
];

const adminExtraLinks = [
  { to: '/employees', icon: '🧑‍💼', label: 'Employees' },
  { to: '/admin/reports', icon: '📈', label: 'Reports' }
];

const Sidebar = ({ open, onNavigate }) => {
  const { user } = useAuth();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        Workplace<span>Readi</span>
      </div>
      <nav className="sidebar-nav">
        {user?.role === 'admin' && (
          <div className="sidebar-section-label">Admin</div>
        )}
        {user?.role === 'admin' &&
          adminExtraLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onNavigate}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span>{link.icon}</span> {link.label}
            </NavLink>
          ))}
        <div className="sidebar-section-label">Workspace</div>
        {employeeLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span>{link.icon}</span> {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
