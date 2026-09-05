import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { Loader, ErrorBanner, SuccessBanner, EmptyState } from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ProgressBar from '../components/ProgressBar';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ search: '', department: '', workMode: '', status: '' });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState({});
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [announceForm, setAnnounceForm] = useState({ title: '', message: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await api.get('/users', { params });
      setEmployees(data.users.filter((u) => u.role === 'employee'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const { data } = await api.get('/teams');
      setTeams(data.teams);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, [filters]);
  useEffect(() => { loadTeams(); }, []);

  const openEdit = (emp) => {
    setEditingEmployee(emp);
    setForm({
      department: emp.department || '',
      jobTitle: emp.jobTitle || '',
      team: emp.team?._id || emp.team || '',
      workMode: emp.workMode,
      status: emp.status
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put(`/users/${editingEmployee._id}`, form);
      setSuccess('Employee updated successfully');
      setEditingEmployee(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this employee? This cannot be undone.')) return;
    try {
      await api.delete(`/users/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove employee');
    }
  };

  const handleAnnounce = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/notifications/announcement', announceForm);
      setSuccess('Announcement sent to all employees');
      setShowAnnounce(false);
      setAnnounceForm({ title: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send announcement');
    }
  };

  return (
    <DashboardLayout title="Employee Management">
      <div className="page-header">
        <p className="page-subtitle">View, search, filter and manage all employees</p>
        <button className="btn btn-primary" onClick={() => setShowAnnounce(true)}>📢 Send Announcement</button>
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div className="filters-bar">
        <input className="form-control" placeholder="Search by name, email, job title..." value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select className="form-control" value={filters.workMode} onChange={(e) => setFilters({ ...filters, workMode: e.target.value })}>
          <option value="">All Work Modes</option>
          <option value="Remote">Remote</option>
          <option value="Office">Office</option>
          <option value="Hybrid">Hybrid</option>
        </select>
        <select className="form-control" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
        </select>
      </div>

      {loading ? <Loader /> : employees.length === 0 ? <EmptyState message="No employees found" /> : (
        <div className="card table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Team</th>
                <th>Work Mode</th>
                <th>Status</th>
                <th>Readiness</th>
                <th>Online</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const r = emp.readiness || {};
                const score = Math.round(((r.connectivity || 0) + (r.equipment || 0) + (r.scheduleSync || 0)) / 3);
                return (
                  <tr key={emp._id}>
                    <td>
                      <strong>{emp.name}</strong>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.email}</div>
                    </td>
                    <td>{emp.department || '-'}</td>
                    <td>{emp.team?.name || '-'}</td>
                    <td><StatusBadge label={emp.workMode} /></td>
                    <td><StatusBadge label={emp.status} /></td>
                    <td style={{ width: 100 }}><ProgressBar value={score} /></td>
                    <td>{emp.isOnline ? <span className="badge badge-success">Online</span> : <span className="badge badge-gray">Offline</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(emp)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp._id)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingEmployee && (
        <Modal
          title={`Edit ${editingEmployee.name}`}
          onClose={() => setEditingEmployee(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditingEmployee(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
            </>
          }
        >
          <form onSubmit={handleUpdate}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input className="form-control" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-control" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Team</label>
              <select className="form-control" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })}>
                <option value="">No team</option>
                {teams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Work Mode</label>
                <select className="form-control" value={form.workMode} onChange={(e) => setForm({ ...form, workMode: e.target.value })}>
                  <option value="Remote">Remote</option>
                  <option value="Office">Office</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {showAnnounce && (
        <Modal
          title="Send Announcement to All Employees"
          onClose={() => setShowAnnounce(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAnnounce(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAnnounce}>Send</button>
            </>
          }
        >
          <form onSubmit={handleAnnounce}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-control" value={announceForm.title} onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-control" rows={4} value={announceForm.message} onChange={(e) => setAnnounceForm({ ...announceForm, message: e.target.value })} required />
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Employees;
