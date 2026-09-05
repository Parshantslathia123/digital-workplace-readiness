import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Loader, ErrorBanner, EmptyState } from '../components/Loader';
import Modal from '../components/Modal';

const Meetings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [meetings, setMeetings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', date: '', time: '', duration: 30, meetingLink: '', teams: [], attendees: []
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/meetings');
      setMeetings(data.meetings);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const loadRefs = async () => {
    if (!isAdmin) return;
    try {
      const [teamRes, userRes] = await Promise.all([api.get('/teams'), api.get('/users')]);
      setTeams(teamRes.data.teams);
      setEmployees(userRes.data.users.filter((u) => u.role === 'employee'));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); loadRefs(); }, []);

  const openCreate = () => {
    setEditingMeeting(null);
    setForm({ title: '', description: '', date: '', time: '', duration: 30, meetingLink: '', teams: [], attendees: [] });
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditingMeeting(m);
    setForm({
      title: m.title,
      description: m.description,
      date: m.date?.slice(0, 10),
      time: m.time,
      duration: m.duration,
      meetingLink: m.meetingLink,
      teams: m.teams.map((t) => t._id),
      attendees: m.attendees.map((a) => a._id)
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingMeeting) {
        await api.put(`/meetings/${editingMeeting._id}`, form);
      } else {
        await api.post('/meetings', form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save meeting');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meeting?')) return;
    try {
      await api.delete(`/meetings/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete meeting');
    }
  };

  return (
    <DashboardLayout title="Meetings">
      <div className="page-header">
        <p className="page-subtitle">{isAdmin ? 'Schedule and manage meetings' : 'View your upcoming meetings'}</p>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}>+ Schedule Meeting</button>}
      </div>

      <ErrorBanner message={error} />

      {loading ? <Loader /> : meetings.length === 0 ? <EmptyState message="No meetings scheduled" /> : (
        <div className="grid-2">
          {meetings.map((m) => (
            <div className="card" key={m._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: '0 0 4px' }}>{m.title}</h3>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m._id)}>Delete</button>
                  </div>
                )}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.description}</p>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                📅 {new Date(m.date).toDateString()} &nbsp; 🕒 {m.time} ({m.duration} min)
              </div>
              <a href={m.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Join Meeting</a>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title={editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editingMeeting ? 'Update' : 'Schedule'}</button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <input type="time" className="form-control" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input type="number" className="form-control" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Meeting Link</label>
                <input className="form-control" value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Teams</label>
              <select multiple className="form-control" style={{ height: 90 }} value={form.teams}
                onChange={(e) => setForm({ ...form, teams: Array.from(e.target.selectedOptions, (o) => o.value) })}>
                {teams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Individual Attendees</label>
              <select multiple className="form-control" style={{ height: 90 }} value={form.attendees}
                onChange={(e) => setForm({ ...form, attendees: Array.from(e.target.selectedOptions, (o) => o.value) })}>
                {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Meetings;
