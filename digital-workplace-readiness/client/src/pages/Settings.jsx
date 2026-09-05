import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner, SuccessBanner } from '../components/Loader';

const Settings = () => {
  const { user, logout } = useAuth();
  const [notifPrefs, setNotifPrefs] = useState({
    taskUpdates: true,
    meetingReminders: true,
    documentAlerts: true,
    chatMessages: true,
    announcements: true
  });
  const [success, setSuccess] = useState('');

  const togglePref = (key) => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    localStorage.setItem('dwr_notif_prefs', JSON.stringify(notifPrefs));
    setSuccess('Preferences saved locally on this device');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <DashboardLayout title="Settings">
      <SuccessBanner message={success} />

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">Account Information</h3>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-control" value={user?.name} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" value={user?.email} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <input className="form-control" value={user?.role} disabled style={{ textTransform: 'capitalize' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            To update your name, job title or department, go to the <strong>Profile</strong> page.
          </p>
        </div>

        <div className="card">
          <h3 className="section-title">Notification Preferences</h3>
          {Object.entries({
            taskUpdates: 'Task assignments & updates',
            meetingReminders: 'Meeting reminders',
            documentAlerts: 'New document alerts',
            chatMessages: 'Chat message notifications',
            announcements: 'Company announcements'
          }).map(([key, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
              {label}
              <input type="checkbox" checked={notifPrefs[key]} onChange={() => togglePref(key)} />
            </label>
          ))}
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleSave}>Save Preferences</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="section-title">Session</h3>
        <button className="btn btn-danger" onClick={logout}>Logout from this device</button>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
