import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Loader, ErrorBanner, SuccessBanner, EmptyState } from '../components/Loader';
import StatusBadge from '../components/StatusBadge';

const Attendance = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [workMode, setWorkMode] = useState(user?.workMode || 'Office');
  const [filters, setFilters] = useState({ status: '', workMode: '', date: '' });
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.workMode) params.workMode = filters.workMode;
      if (filters.date) params.date = filters.date;

      const [recRes, statsRes] = await Promise.all([
        api.get('/attendance', { params }),
        api.get('/attendance/stats')
      ]);
      setRecords(recRes.data.records);
      setStats(statsRes.data.stats);

      const today = new Date().toDateString();
      const marked = recRes.data.records.some(
        (r) => new Date(r.date).toDateString() === today && String(r.employee._id || r.employee) === String(user._id)
      );
      setAlreadyMarked(marked);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const handleMark = async () => {
    setError('');
    setSuccess('');
    try {
      await api.post('/attendance', { workMode });
      setSuccess('Attendance marked successfully for today');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  return (
    <DashboardLayout title="Attendance">
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {!isAdmin && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="section-title">Mark Today's Attendance</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Work Mode Today</label>
              <select className="form-control" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                <option value="Remote">Remote</option>
                <option value="Office">Office</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleMark} disabled={alreadyMarked}>
              {alreadyMarked ? 'Already Marked Today' : 'Mark Attendance'}
            </button>
          </div>
        </div>
      )}

      {stats && (
        <div className="stat-grid">
          <div className="card stat-card"><div className="stat-card-label">Total Records</div><div className="stat-card-value">{stats.total}</div></div>
          <div className="card stat-card"><div className="stat-card-label">Present</div><div className="stat-card-value" style={{ color: '#16a34a' }}>{stats.present}</div></div>
          <div className="card stat-card"><div className="stat-card-label">Absent</div><div className="stat-card-value" style={{ color: '#dc2626' }}>{stats.absent}</div></div>
          <div className="card stat-card"><div className="stat-card-label">Leave / Half Day</div><div className="stat-card-value">{stats.leave + stats.halfDay}</div></div>
        </div>
      )}

      {isAdmin && (
        <div className="filters-bar">
          <input type="date" className="form-control" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
          <select className="form-control" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
            <option value="Leave">Leave</option>
          </select>
          <select className="form-control" value={filters.workMode} onChange={(e) => setFilters({ ...filters, workMode: e.target.value })}>
            <option value="">All Work Modes</option>
            <option value="Remote">Remote</option>
            <option value="Office">Office</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
      )}

      {loading ? <Loader /> : records.length === 0 ? <EmptyState message="No attendance records found" /> : (
        <div className="card table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {isAdmin && <th>Employee</th>}
                <th>Date</th>
                <th>Status</th>
                <th>Work Mode</th>
                <th>Check-in Time</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  {isAdmin && <td>{r.employee?.name}</td>}
                  <td>{new Date(r.date).toDateString()}</td>
                  <td><StatusBadge label={r.status} /></td>
                  <td><StatusBadge label={r.workMode} /></td>
                  <td>{new Date(r.checkInTime).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Attendance;
