import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNotifications } from '../context/NotificationContext';
import { EmptyState } from '../components/Loader';

const typeIcon = {
  task: '✅',
  meeting: '📅',
  document: '📁',
  message: '💬',
  announcement: '📢',
  attendance: '🕒'
};

const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <DashboardLayout title="Notifications">
      <div className="page-header">
        <p className="page-subtitle">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        {unreadCount > 0 && <button className="btn btn-secondary" onClick={markAllAsRead}>Mark all as read</button>}
      </div>

      {notifications.length === 0 ? (
        <EmptyState message="You have no notifications yet" />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`notif-item ${!n.isRead ? 'unread' : ''}`}
              style={{ cursor: 'pointer', display: 'flex', gap: 12 }}
              onClick={() => !n.isRead && markAsRead(n._id)}
            >
              <div style={{ fontSize: 20 }}>{typeIcon[n.type] || '🔔'}</div>
              <div style={{ flex: 1 }}>
                <div className="notif-item-title">{n.title}</div>
                <div>{n.message}</div>
                <div className="notif-item-time">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              {!n.isRead && <span className="badge badge-info">New</span>}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Notifications;
