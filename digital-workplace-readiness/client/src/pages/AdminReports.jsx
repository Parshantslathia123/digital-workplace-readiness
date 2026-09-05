import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { Loader, ErrorBanner } from '../components/Loader';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid
} from 'recharts';

const COLORS = ['#4f46e5', '#0ea5e9', '#16a34a', '#d97706', '#dc2626'];

const AdminReports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/reports');
        setReports(data.reports);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <DashboardLayout title="Reports"><Loader /></DashboardLayout>;
  if (error) return <DashboardLayout title="Reports"><ErrorBanner message={error} /></DashboardLayout>;
  if (!reports) return null;

  const taskStatusData = reports.tasksByStatus.map((t) => ({ name: t._id, value: t.count }));
  const taskPriorityData = reports.tasksByPriority.map((t) => ({ name: t._id, value: t.count }));
  const deptData = reports.employeesByDepartment.map((d) => ({ name: d._id || 'Unspecified', value: d.count }));
  const workModeData = reports.employeesByWorkMode.map((w) => ({ name: w._id, value: w.count }));
  const readinessData = Object.entries(reports.readinessBuckets).map(([name, value]) => ({ name, value }));

  // Aggregate attendance by date for a line chart
  const attendanceMap = {};
  reports.attendanceByDate.forEach((a) => {
    const date = a._id.date;
    if (!attendanceMap[date]) attendanceMap[date] = { date };
    attendanceMap[date][a._id.status] = a.count;
  });
  const attendanceData = Object.values(attendanceMap).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <DashboardLayout title="Admin Reports">
      <p className="page-subtitle" style={{ marginBottom: 20 }}>
        Organization-wide analytics on tasks, attendance, employees and readiness
      </p>

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={taskStatusData}>
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={taskPriorityData} dataKey="value" nameKey="name" outerRadius={80} label>
                {taskPriorityData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">Employees by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData}>
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">Employees by Work Mode</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={workModeData} dataKey="value" nameKey="name" outerRadius={80} label>
                {workModeData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">Readiness Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={readinessData}>
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">Attendance Trend (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={10} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Present" stroke="#16a34a" strokeWidth={2} />
              <Line type="monotone" dataKey="Absent" stroke="#dc2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
