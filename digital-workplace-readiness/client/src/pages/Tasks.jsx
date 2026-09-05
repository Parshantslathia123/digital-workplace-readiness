import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Loader, ErrorBanner, EmptyState } from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';

const Tasks = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'Medium', deadline: '' });

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      const { data } = await api.get('/tasks', { params });
      setTasks(data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/users');
      setEmployees(data.users.filter((u) => u.role === 'employee'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadTasks(); }, [filters]);
  useEffect(() => { loadEmployees(); }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', assignedTo: employees[0]?._id || '', priority: 'Medium', deadline: '' });
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo._id,
      priority: task.priority,
      deadline: task.deadline?.slice(0, 10) || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, form);
      } else {
        await api.post('/tasks', form);
      }
      setShowModal(false);
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleStatusUpdate = async (task, status) => {
    try {
      const progress = status === 'Completed' ? 100 : status === 'In Progress' ? Math.max(task.progress, 10) : task.progress;
      await api.put(`/tasks/${task._id}`, { status, progress });
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  return (
    <DashboardLayout title={isAdmin ? 'Task Management' : 'My Tasks'}>
      <div className="page-header">
        <div>
          <p className="page-subtitle">{isAdmin ? 'Create, assign and monitor tasks across employees' : 'View and update your assigned tasks'}</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openCreateModal}>+ New Task</button>}
      </div>

      <ErrorBanner message={error} />

      <div className="filters-bar">
        <input
          className="form-control"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select className="form-control" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select className="form-control" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>

      {loading ? <Loader /> : tasks.length === 0 ? <EmptyState message="No tasks found" /> : (
        <div className="card table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                {isAdmin && <th>Assigned To</th>}
                <th>Priority</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t._id}>
                  <td><strong>{t.title}</strong><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.description}</div></td>
                  {isAdmin && <td>{t.assignedTo?.name}</td>}
                  <td><StatusBadge label={t.priority} /></td>
                  <td>
                    <select
                      className="form-control"
                      style={{ width: 130, padding: '4px 8px' }}
                      value={t.status}
                      onChange={(e) => handleStatusUpdate(t, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td style={{ width: 120 }}><ProgressBar value={t.progress} /></td>
                  <td>{new Date(t.deadline).toLocaleDateString()}</td>
                  <td>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(t)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal
          title={editingTask ? 'Edit Task' : 'Create New Task'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editingTask ? 'Update' : 'Create'}</button>
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
              <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-control" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} required>
                  <option value="">Select employee</option>
                  {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input type="date" className="form-control" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Tasks;
