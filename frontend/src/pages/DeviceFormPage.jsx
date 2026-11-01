/**
 * pages/DeviceFormPage.jsx — Add / Edit device form
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

const TYPES       = ['Computer','Laptop','Printer','Scanner','Photocopier','Network Equipment','Other'];
const DEPARTMENTS = ['ICT','Finance and Accounts','Legal Services','Human Resources','Public Affairs','Privatisation and Commercialisation'];
const CONDITIONS  = ['Excellent','Good','Fair','Faulty','Under Repair','Retired'];
const STATUSES    = ['Available','In Use','In Repair','Retired'];

const EMPTY = {
  device_name: '', asset_tag: '', device_type: 'Computer', brand: '', model: '',
  serial_number: '', department: 'ICT', location: '', assigned_to: '',
  condition: 'Good', status: 'Available', date_acquired: '', notes: ''
};

export default function DeviceFormPage() {
  const { id }  = useParams();
  const isEdit  = !!id;
  const navigate = useNavigate();

  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/devices/${id}`)
      .then(r => {
        const d = r.data.device;
        setForm({
          device_name:   d.device_name   || '',
          asset_tag:     d.asset_tag     || '',
          device_type:   d.device_type   || 'Computer',
          brand:         d.brand         || '',
          model:         d.model         || '',
          serial_number: d.serial_number || '',
          department:    d.department    || 'ICT',
          location:      d.location      || '',
          assigned_to:   d.assigned_to   || '',
          condition:     d.condition     || 'Good',
          status:        d.status        || 'Available',
          date_acquired: d.date_acquired ? d.date_acquired.split('T')[0] : '',
          notes:         d.notes         || ''
        });
      })
      .catch(() => { toast.error('Failed to load device.'); navigate('/devices'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  function set(field) {
    return e => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setErrors(er => ({ ...er, [field]: '' }));
    };
  }

  function validate() {
    const e = {};
    if (!form.device_name.trim()) e.device_name = 'Device name is required.';
    if (!form.asset_tag.trim())   e.asset_tag   = 'Asset tag is required.';
    if (!form.device_type)        e.device_type = 'Device type is required.';
    if (!form.department)         e.department  = 'Department is required.';
    if (!form.condition)          e.condition   = 'Condition is required.';
    if (!form.status)             e.status      = 'Status is required.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the highlighted errors.'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/devices/${id}`, form);
        toast.success('Device updated successfully!');
        navigate(`/devices/${id}`);
      } else {
        const { data } = await api.post('/devices', form);
        toast.success(`Device "${data.device_name}" added!`);
        navigate(`/devices/${data.id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Save failed. Please try again.';
      toast.error(msg);
      if (msg.toLowerCase().includes('asset tag')) {
        setErrors(er => ({ ...er, asset_tag: msg }));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-loading">Loading device…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? '✏️ Edit Device' : '➕ Add New Device'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update device information' : 'Register a new device in the system'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="device-form" noValidate>
        <div className="form-section">
          <h3 className="form-section-title">Basic Information</h3>
          <div className="form-grid">
            <Field label="Device Name *" error={errors.device_name}>
              <input type="text" value={form.device_name} onChange={set('device_name')} placeholder="e.g. ICT Manager Desktop" className={errors.device_name ? 'error' : ''} />
            </Field>
            <Field label="Asset Tag *" error={errors.asset_tag}>
              <input type="text" value={form.asset_tag} onChange={set('asset_tag')} placeholder="e.g. BPE-ICT-001" className={errors.asset_tag ? 'error' : ''} />
            </Field>
            <Field label="Device Type *" error={errors.device_type}>
              <select value={form.device_type} onChange={set('device_type')} className={errors.device_type ? 'error' : ''}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Brand">
              <input type="text" value={form.brand} onChange={set('brand')} placeholder="e.g. Dell, HP, Cisco" />
            </Field>
            <Field label="Model">
              <input type="text" value={form.model} onChange={set('model')} placeholder="e.g. OptiPlex 7090" />
            </Field>
            <Field label="Serial Number">
              <input type="text" value={form.serial_number} onChange={set('serial_number')} placeholder="Manufacturer serial number" />
            </Field>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Location & Assignment</h3>
          <div className="form-grid">
            <Field label="Department *" error={errors.department}>
              <select value={form.department} onChange={set('department')} className={errors.department ? 'error' : ''}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Location / Room">
              <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Office 201, 2nd Floor" />
            </Field>
            <Field label="Assigned To">
              <input type="text" value={form.assigned_to} onChange={set('assigned_to')} placeholder="Staff name (leave blank if unassigned)" />
            </Field>
            <Field label="Date Acquired">
              <input type="date" value={form.date_acquired} onChange={set('date_acquired')} />
            </Field>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Condition & Status</h3>
          <div className="form-grid">
            <Field label="Condition *" error={errors.condition}>
              <select value={form.condition} onChange={set('condition')} className={errors.condition ? 'error' : ''}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status *" error={errors.status}>
              <select value={form.status} onChange={set('status')} className={errors.status ? 'error' : ''}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Additional Notes</h3>
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={set('notes')}
              placeholder="Any additional information about this device…"
              rows={4}
            />
          </Field>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (isEdit ? 'Saving…' : 'Adding…') : (isEdit ? '💾 Save Changes' : '➕ Add Device')}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className={`form-group${error ? ' has-error' : ''}`}>
      <label>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

