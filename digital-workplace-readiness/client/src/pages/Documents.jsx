import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Loader, ErrorBanner, SuccessBanner, EmptyState } from '../components/Loader';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents', { params: search ? { search } : {} });
      setDocuments(data.documents);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file to upload');
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Document uploaded successfully');
      setTitle('');
      setFile(null);
      e.target.reset();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await api.get(`/documents/${doc._id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download document');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document');
    }
  };

  return (
    <DashboardLayout title="Documents">
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="section-title">Upload Document</h3>
        <form onSubmit={handleUpload} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
            <label className="form-label">Title (optional)</label>
            <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
            <label className="form-label">File</label>
            <input type="file" className="form-control" onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.zip" />
          </div>
          <button className="btn btn-primary" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
        </form>
      </div>

      <div className="filters-bar">
        <input className="form-control" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <Loader /> : documents.length === 0 ? <EmptyState message="No documents uploaded yet" /> : (
        <div className="card table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>File Name</th>
                <th>Size</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d._id}>
                  <td><strong>{d.title}</strong></td>
                  <td>{d.originalName}</td>
                  <td>{formatSize(d.fileSize)}</td>
                  <td>{d.uploadedBy?.name}</td>
                  <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(d)}>Download</button>
                      {(user.role === 'admin' || d.uploadedBy?._id === user._id) && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d._id)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Documents;
