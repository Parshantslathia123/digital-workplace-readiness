import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Loader, ErrorBanner } from '../components/Loader';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend
} from 'recharts';

const COLORS = ['#4f46e5', '#0ea5e9', '#16a34a', '#d97706'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/users/stats/dashboard');
        setStats(data.stats);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader />;
  if (error) return <ErrorBanner message={error} />;
  if (!stats) return null;

  const workModeData = [
    { name: 'Remote', value: stats.workModeBreakdown.remote },
    { name: 'Office', value: stats.workModeBreakdown.office },
    { name: 'Hybrid', value: stats.workModeBreakdown.hybrid }
  ];

  const taskData = [
    { name: 'Pending', value: stats.tasks.pendingTasks },
    { name: 'In Progress', value: stats.tasks.inProgressTasks },
    { name: 'Completed', value: stats.tasks.completedTasks }
  ];

  return (
    <>
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-card-label">Total Employees</div>
          <div className="stat-card-value">{stats.totalEmployees}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-label">Online Now</div>
          <div className="stat-card-value" style={{ color: '#16a34a' }}>{stats.onlineEmployees}</div>
          <div className="stat-card-sub">{stats.offlineEmployees} offline</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-label">Present Today</div>
          <div className="stat-card-value">{stats.attendance.presentToday}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-label">Avg. Readiness Score</div>
          <div className="stat-card-value">{stats.avgReadiness}</div>
          <ProgressBar value={stats.avgReadiness} />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">Work Mode Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={workModeData} dataKey="value" nameKey="name" outerRadius={80} label>
                {workModeData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="section-title">Task Statistics</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={taskData}>
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="section-title">Quick Links</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/employees" className="btn btn-secondary">Manage Employees</Link>
          <Link to="/tasks" className="btn btn-secondary">Manage Tasks</Link>
          <Link to="/meetings" className="btn btn-secondary">Schedule Meeting</Link>
          <Link to="/admin/reports" className="btn btn-secondary">View Reports</Link>
        </div>
      </div>
    </>
  );
};

const EmployeeDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [taskRes, readinessRes, meetingRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/readiness/me'),
          api.get('/meetings')
        ]);
        setTasks(taskRes.data.tasks);
        setReadiness(readinessRes.data.readiness);
        setMeetings(meetingRes.data.meetings.slice(0, 3));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader />;
  if (error) return <ErrorBanner message={error} />;

  const pending = tasks.filter((t) => t.status !== 'Completed').length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;

  return (
    <>
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-card-label">Active Tasks</div>
          <div className="stat-card-value">{pending}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-label">Completed Tasks</div>
          <div className="stat-card-value" style={{ color: '#16a34a' }}>{completed}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card-label">Readiness Score</div>
          <div className="stat-card-value">{readiness?.score ?? '-'}</div>
          {readiness && <ProgressBar value={readiness.score} />}
        </div>
        <div className="card stat-card">
          <div className="stat-card-label">Upcoming Meetings</div>
          <div className="stat-card-value">{meetings.length}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">My Recent Tasks</h3>
          {tasks.length === 0 && <div className="empty-state">No tasks assigned yet</div>}
          {tasks.slice(0, 5).map((t) => (
            <div key={t._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{t.title}</strong>
                <StatusBadge label={t.status} />
              </div>
              <ProgressBar value={t.progress} />
            </div>
          ))}
          <Link to="/tasks" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>View All Tasks</Link>
        </div>

        <div className="card">
          <h3 className="section-title">Upcoming Meetings</h3>
          {meetings.length === 0 && <div className="empty-state">No upcoming meetings</div>}
          {meetings.map((m) => (
            <div key={m._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <strong>{m.title}</strong>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {new Date(m.date).toDateString()} at {m.time}
              </div>
            </div>
          ))}
          <Link to="/meetings" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>View All Meetings</Link>
        </div>
      </div>
    </>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <DashboardLayout title={`Welcome, ${user?.name?.split(' ')[0] || ''}`}>
      {user?.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
    </DashboardLayout>
  );
};

export default Dashboard;
