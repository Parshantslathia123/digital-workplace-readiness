import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { Loader, ErrorBanner, SuccessBanner } from '../components/Loader';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';

const Readiness = () => {
  const [readiness, setReadiness] = useState(null);
  const [form, setForm] = useState({ connectivity: 70, equipment: 70, scheduleSync: 70 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/readiness/me');
      setReadiness(data.readiness);
      setForm({
        connectivity: data.readiness.connectivity,
        equipment: data.readiness.equipment,
        scheduleSync: data.readiness.scheduleSync
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load readiness data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.put('/readiness/me', form);
      setReadiness(data.readiness);
      setSuccess('Readiness score updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update readiness');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout title="Workplace Readiness"><Loader /></DashboardLayout>;

  return (
    <DashboardLayout title="Workplace Readiness Score">
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">Your Overall Readiness</h3>
          <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--primary)' }}>{readiness?.score}</div>
            <StatusBadge label={readiness?.category} />
          </div>
          <ProgressBar value={readiness?.score} />

          <div style={{ marginTop: 24 }}>
            <div className="readiness-metric">
              <div className="readiness-metric-label"><span>Connectivity</span><span>{readiness?.connectivity}</span></div>
              <ProgressBar value={readiness?.connectivity} />
            </div>
            <div className="readiness-metric">
              <div className="readiness-metric-label"><span>Equipment</span><span>{readiness?.equipment}</span></div>
              <ProgressBar value={readiness?.equipment} />
            </div>
            <div className="readiness-metric">
              <div className="readiness-metric-label"><span>Schedule Sync</span><span>{readiness?.scheduleSync}</span></div>
              <ProgressBar value={readiness?.scheduleSync} />
            </div>
          </div>

          <h4 style={{ marginTop: 20 }}>Improvement Suggestions</h4>
          {readiness?.suggestions.map((s, i) => (
            <div key={i} className="suggestion-item">{s}</div>
          ))}
        </div>

        <div className="card">
          <h3 className="section-title">Update Your Readiness Inputs</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Rate each factor from 0 to 100 based on your current hybrid work setup.
          </p>

          <div className="form-group">
            <label className="form-label">Connectivity: {form.connectivity}</label>
            <input type="range" min="0" max="100" className="form-control" value={form.connectivity}
              onChange={(e) => setForm({ ...form, connectivity: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">Equipment: {form.equipment}</label>
            <input type="range" min="0" max="100" className="form-control" value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">Schedule Sync: {form.scheduleSync}</label>
            <input type="range" min="0" max="100" className="form-control" value={form.scheduleSync}
              onChange={(e) => setForm({ ...form, scheduleSync: Number(e.target.value) })} />
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            Projected Score: <strong>{Math.round((form.connectivity + form.equipment + form.scheduleSync) / 3)}</strong>
          </div>

          <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>
            {saving ? 'Saving...' : 'Update Readiness'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Readiness;
