/**
 * pages/DeviceDetailPage.jsx — Device detail view with history log
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function conditionClass(c) {
  const m = { Excellent:'excellent', Good:'good', Fair:'fair', Faulty:'faulty', 'Under Repair':'repair', Retired:'retired' };
  return m[c] || 'good';
}
function statusClass(s) {
  const m = { Available:'available', 'In Use':'in-use', 'In Repair':'in-repair', Retired:'retired-status' };
  return m[s] || 'available';
}
function actionIcon(action) {
  return action === 'CREATE' ? '➕' : '✏️';
}
function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-NG', { dateStyle: 'medium' });
}

export default function DeviceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [device, setDevice]   = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => {
    api.get(`/devices/${id}`)
      .then(r => { setDevice(r.data.device); setHistory(r.data.history); })
      .catch(() => { toast.error('Device not found.'); navigate('/devices'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/devices/${id}`);
      toast.success(`"${device.device_name}" deleted.`);
      navigate('/devices');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed.');
      setDeleting(false);
    }
  }

  if (loading) return <div className="page-loading">Loading device…</div>;
  if (!device) return null;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <button className="btn btn-ghost back-btn" onClick={() => navigate('/devices')}>← Back to Devices</button>
          <h1 className="page-title">{device.device_name}</h1>
          <div className="detail-meta">
            <code className="asset-tag">{device.asset_tag}</code>
            <span className={`badge badge-condition badge-${conditionClass(device.condition)}`}>{device.condition}</span>
            <span className={`badge badge-status badge-${statusClass(device.status)}`}>{device.status}</span>
          </div>
        </div>
        <div className="page-actions">
          <Link to={`/devices/${id}/edit`} className="btn btn-secondary">✏️ Edit</Link>
          {isAdmin && (
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>🗑️ Delete</button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        {/* Left: Device Info */}
        <div className="detail-card">
          <h3 className="detail-card-title">Device Information</h3>
          <dl className="detail-list">
            <Row label="Device Type"   value={device.device_type} />
            <Row label="Brand"         value={device.brand} />
            <Row label="Model"         value={device.model} />
            <Row label="Serial Number" value={device.serial_number} />
            <Row label="Date Acquired" value={fmtDate(device.date_acquired)} />
          </dl>
        </div>

        <div className="detail-card">
          <h3 className="detail-card-title">Location & Assignment</h3>
          <dl className="detail-list">
            <Row label="Department"  value={device.department} />
            <Row label="Location"    value={device.location} />
            <Row label="Assigned To" value={device.assigned_to} />
          </dl>
        </div>

        <div className="detail-card">
          <h3 className="detail-card-title">Status</h3>
          <dl className="detail-list">
            <Row label="Condition" value={<span className={`badge badge-condition badge-${conditionClass(device.condition)}`}>{device.condition}</span>} />
            <Row label="Status"    value={<span className={`badge badge-status badge-${statusClass(device.status)}`}>{device.status}</span>} />
            <Row label="Added"     value={fmt(device.created_at)} />
            <Row label="Last Updated" value={fmt(device.updated_at)} />
          </dl>
        </div>

        {device.notes && (
          <div className="detail-card">
            <h3 className="detail-card-title">Notes</h3>
            <p className="detail-notes">{device.notes}</p>
          </div>
        )}
      </div>

      {/* History Log */}
      <div className="history-section">
        <h3 className="section-title">📋 History Log ({history.length} entries)</h3>
        {history.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No history yet</div></div>
        ) : (
          <div className="history-list">
            {history.map(h => (
              <div key={h.id} className="history-item">
                <div className="history-icon">{actionIcon(h.action)}</div>
                <div className="history-body">
                  {h.action === 'CREATE' ? (
                    <span className="history-text">Device <strong>created</strong> in system</span>
                  ) : (
                    <span className="history-text">
                      <strong>{h.field_name}</strong> changed from{' '}
                      <span className="history-old">"{h.old_value || '—'}"</span>
                      {' '}→{' '}
                      <span className="history-new">"{h.new_value}"</span>
                    </span>
                  )}
                  <div className="history-by">by <strong>{h.performed_by}</strong></div>
                </div>
                <div className="history-time">{fmt(h.performed_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">🗑️ Confirm Deletion</h3>
            <p>Permanently delete <strong>{device.device_name}</strong> ({device.asset_tag})?</p>
            <p className="modal-warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <>
      <dt className="detail-label">{label}</dt>
      <dd className="detail-value">{value || <span className="none-label">—</span>}</dd>
    </>
  );
}

