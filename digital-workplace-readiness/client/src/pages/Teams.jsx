import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Loader, ErrorBanner, EmptyState } from '../components/Loader';
import Modal from '../components/Modal';

const Teams = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', leader: '', members: [] });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/teams');
      setTeams(data.teams);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/users');
      setEmployees(data.users.filter((u) => u.role === 'employee'));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); loadEmployees(); }, []);

  const openCreate = () => {
    setEditingTeam(null);
    setForm({ name: '', description: '', leader: '', members: [] });
    setShowModal(true);
  };

  const openEdit = (team) => {
    setEditingTeam(team);
    setForm({
      name: team.name,
      description: team.description,
      leader: team.leader?._id || '',
      members: team.members.map((m) => m._id)
    });
    setShowModal(true);
  };

  const toggleMember = (id) => {
    setForm((f) => ({
      ...f,
      members: f.members.includes(id) ? f.members.filter((m) => m !== id) : [...f.members, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingTeam) {
        await api.put(`/teams/${editingTeam._id}`, form);
      } else {
        await api.post('/teams', form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save team');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this team?')) return;
    try {
      await api.delete(`/teams/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete team');
    }
  };

  return (
    <DashboardLayout title={isAdmin ? 'Team Management' : 'My Team'}>
      <div className="page-header">
        <p className="page-subtitle">{isAdmin ? 'Create and manage teams across the organization' : 'View your team and members'}</p>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ New Team</button>}
      </div>

      <ErrorBanner message={error} />

      {loading ? <Loader /> : teams.length === 0 ? <EmptyState message="No teams found" /> : (
        <div className="grid-2">
          {teams.map((t) => (
            <div className="card" key={t._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{t.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{t.description}</p>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id)}>Delete</button>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 10, fontSize: 13 }}>
                <strong>Leader:</strong> {t.leader?.name || 'Not assigned'}
              </div>
              <div style={{ marginTop: 10 }}>
                <strong style={{ fontSize: 13 }}>Members ({t.members.length}):</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {t.members.map((m) => (
                    <span key={m._id} className="badge badge-info">{m.name}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title={editingTeam ? 'Edit Team' : 'Create New Team'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editingTeam ? 'Update' : 'Create'}</button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Team Name</label>
              <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Team Leader</label>
              <select className="form-control" value={form.leader} onChange={(e) => setForm({ ...form, leader: e.target.value })}>
                <option value="">Select leader</option>
                {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Members</label>
              <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
                {employees.map((e) => (
                  <label key={e._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13 }}>
                    <input type="checkbox" checked={form.members.includes(e._id)} onChange={() => toggleMember(e._id)} />
                    {e.name}
                  </label>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Teams;
