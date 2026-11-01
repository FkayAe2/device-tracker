/**
 * pages/DevicesPage.jsx — Device list with search, filter, sort, pagination, CSV export
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TYPES       = ['Computer','Laptop','Printer','Scanner','Photocopier','Network Equipment','Other'];
const DEPARTMENTS = ['ICT','Finance and Accounts','Legal Services','Human Resources','Public Affairs','Privatisation and Commercialisation'];
const CONDITIONS  = ['Excellent','Good','Fair','Faulty','Under Repair','Retired'];
const STATUSES    = ['Available','In Use','In Repair','Retired'];

function conditionClass(c) {
  const map = { Excellent:'excellent', Good:'good', Fair:'fair', Faulty:'faulty', 'Under Repair':'repair', Retired:'retired' };
  return map[c] || 'good';
}

function statusClass(s) {
  const map = { Available:'available', 'In Use':'in-use', 'In Repair':'in-repair', Retired:'retired-status' };
  return map[s] || 'available';
}

export default function DevicesPage() {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();

  const [devices, setDevices] = useState([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  // Filters & search
  const [q, setQ]               = useState('');
  const [deviceType, setDevType] = useState('');
  const [department, setDept]    = useState('');
  const [condition, setCond]     = useState('');
  const [status, setStat]        = useState('');
  const [sort, setSort]          = useState('created_at');
  const [order, setOrder]        = useState('desc');
  const [page, setPage]          = useState(1);
  const [limit] = useState(15);

  // Confirm delete modal
  const [confirmDevice, setConfirmDevice] = useState(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { q, device_type: deviceType, department, condition, status, sort, order, page, limit };
      const { data } = await api.get('/devices', { params });
      setDevices(data.devices);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load devices.');
    } finally {
      setLoading(false);
    }
  }, [q, deviceType, department, condition, status, sort, order, page, limit]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [q, deviceType, department, condition, status]);

  function toggleSort(col) {
    if (sort === col) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setOrder('asc'); }
  }

  function SortIcon({ col }) {
    if (sort !== col) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{order === 'asc' ? '↑' : '↓'}</span>;
  }

  async function handleDelete(device) {
    setDeleting(device.id);
    try {
      await api.delete(`/devices/${device.id}`);
      toast.success(`"${device.device_name}" deleted.`);
      setConfirmDevice(null);
      fetchDevices();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  }

  async function handleExportCSV() {
    try {
      const params = new URLSearchParams({ q, device_type: deviceType, department, condition, status, sort, order, export: 'csv' });
      const res = await fetch(`/api/devices?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('bpe_token')}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'bpe_devices.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully!');
    } catch {
      toast.error('CSV export failed.');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💻 Devices</h1>
          <p className="page-subtitle">{total} device{total !== 1 ? 's' : ''} found</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCSV}>📥 Export CSV</button>
          <Link to="/devices/new" className="btn btn-primary">➕ Add Device</Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="filters-bar">
        <input
          className="search-input"
          type="text"
          placeholder="🔍 Search by name, asset tag, serial no., or person…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select value={deviceType} onChange={e => setDevType(e.target.value)} className="filter-select">
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={department} onChange={e => setDept(e.target.value)} className="filter-select">
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={condition} onChange={e => setCond(e.target.value)} className="filter-select">
          <option value="">All Conditions</option>
          {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={status} onChange={e => setStat(e.target.value)} className="filter-select">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(q || deviceType || department || condition || status) && (
          <button className="btn btn-ghost" onClick={() => { setQ(''); setDevType(''); setDept(''); setCond(''); setStat(''); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-loading">Loading devices…</div>
      ) : devices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No devices found</div>
          <div className="empty-sub">Try adjusting your search or filters.</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('device_name')} className="sortable">Device Name <SortIcon col="device_name" /></th>
                <th onClick={() => toggleSort('asset_tag')}   className="sortable">Asset Tag <SortIcon col="asset_tag" /></th>
                <th onClick={() => toggleSort('device_type')} className="sortable">Type <SortIcon col="device_type" /></th>
                <th onClick={() => toggleSort('department')}  className="sortable">Department <SortIcon col="department" /></th>
                <th onClick={() => toggleSort('assigned_to')} className="sortable">Assigned To <SortIcon col="assigned_to" /></th>
                <th onClick={() => toggleSort('condition')}   className="sortable">Condition <SortIcon col="condition" /></th>
                <th onClick={() => toggleSort('status')}      className="sortable">Status <SortIcon col="status" /></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <tr key={d.id} className="data-row" onClick={() => navigate(`/devices/${d.id}`)}>
                  <td>
                    <div className="device-name">{d.device_name}</div>
                    {d.brand && <div className="device-meta">{d.brand} {d.model}</div>}
                  </td>
                  <td><code className="asset-tag">{d.asset_tag}</code></td>
                  <td>{d.device_type}</td>
                  <td><span className="dept-label">{d.department}</span></td>
                  <td>{d.assigned_to || <span className="none-label">—</span>}</td>
                  <td><span className={`badge badge-condition badge-${conditionClass(d.condition)}`}>{d.condition}</span></td>
                  <td><span className={`badge badge-status badge-${statusClass(d.status)}`}>{d.status}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="action-btns">
                      <Link to={`/devices/${d.id}`}      className="btn btn-xs btn-ghost">View</Link>
                      <Link to={`/devices/${d.id}/edit`} className="btn btn-xs btn-secondary">Edit</Link>
                      {isAdmin && (
                        <button
                          className="btn btn-xs btn-danger"
                          onClick={() => setConfirmDevice(d)}
                        >Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="page-info">Page {page} of {pages}</span>
          <button className="btn btn-ghost" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDevice && (
        <div className="modal-overlay" onClick={() => setConfirmDevice(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">🗑️ Confirm Deletion</h3>
            <p>Are you sure you want to permanently delete:</p>
            <p><strong>{confirmDevice.device_name}</strong> ({confirmDevice.asset_tag})</p>
            <p className="modal-warning">This action cannot be undone. All history for this device will also be deleted.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDevice(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                disabled={deleting === confirmDevice.id}
                onClick={() => handleDelete(confirmDevice)}
              >
                {deleting === confirmDevice.id ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

