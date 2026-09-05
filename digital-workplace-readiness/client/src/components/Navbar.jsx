import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Navbar = ({ title, onMenuClick }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (user?.name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="navbar-icon-btn"
          onClick={onMenuClick}
          style={{ display: 'none' }}
          id="mobile-menu-btn"
        >
          ☰
        </button>
        <div className="navbar-title">{title}</div>
      </div>
      <div className="navbar-right">
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="navbar-icon-btn" onClick={() => setShowNotif((s) => !s)}>
            🔔
            {unreadCount > 0 && <span className="badge-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {showNotif && (
            <div className="notif-panel">
              <div className="notif-panel-header">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={markAllAsRead}>
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 && (
                <div className="empty-state" style={{ padding: 20 }}>No notifications yet</div>
              )}
              {notifications.slice(0, 15).map((n) => (
                <div
                  key={n._id}
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => !n.isRead && markAsRead(n._id)}
                >
                  <div className="notif-item-title">{n.title}</div>
                  <div>{n.message}</div>
                  <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="user-menu" ref={userRef} onClick={() => setShowUserMenu((s) => !s)}>
          <div className="avatar">{initials}</div>
          <div>
            <div className="user-menu-name">{user?.name}</div>
            <div className="user-menu-role">{user?.role}</div>
          </div>
          {showUserMenu && (
            <div className="dropdown">
              <div className="dropdown-header">
                <div className="user-menu-name">{user?.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{user?.email}</div>
              </div>
              <div className="dropdown-item" onClick={() => navigate('/profile')}>My Profile</div>
              <div className="dropdown-item" onClick={() => navigate('/settings')}>Settings</div>
              <div className="dropdown-item" onClick={handleLogout} style={{ color: '#dc2626' }}>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
