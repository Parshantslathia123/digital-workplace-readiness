import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { ErrorBanner, SuccessBanner } from '../components/Loader';
import StatusBadge from '../components/StatusBadge';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Profile = () => {
  const { user, updateUserLocal } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
    workMode: user?.workMode || 'Hybrid',
    weeklySchedule: user?.weeklySchedule || {}
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleScheduleChange = (day, value) => {
    setForm({ ...form, weeklySchedule: { ...form.weeklySchedule, [day]: value } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUserLocal(data.user);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <DashboardLayout title="My Profile">
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 22 }}>{initials}</div>
            <div>
              <h2 style={{ margin: 0 }}>{user?.name}</h2>
              <div style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
              <StatusBadge label={user?.status} />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input name="jobTitle" className="form-control" value={form.jobTitle} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input name="department" className="form-control" value={form.department} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Work Mode</label>
              <select name="workMode" className="form-control" value={form.workMode} onChange={handleChange}>
                <option value="Remote">Remote</option>
                <option value="Office">Office</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>

        <div className="card">
          <h3 className="section-title">Weekly Work Schedule</h3>
          {days.map((day) => (
            <div key={day} className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>{day}</label>
              <select
                className="form-control"
                style={{ width: 140 }}
                value={form.weeklySchedule[day] || 'Office'}
                onChange={(e) => handleScheduleChange(day, e.target.value)}
              >
                <option value="Remote">Remote</option>
                <option value="Office">Office</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Off">Off</option>
              </select>
            </div>
          ))}
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
