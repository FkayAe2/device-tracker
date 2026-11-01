/**
 * pages/DashboardPage.jsx — Summary stats with charts
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../api';
import toast from 'react-hot-toast';

const STATUS_COLORS  = { 'In Use': '#166534', 'Available': '#22c55e', 'In Repair': '#f59e0b', 'Retired': '#6b7280' };
const CONDITION_COLORS = { 'Excellent': '#166534', 'Good': '#22c55e', 'Fair': '#f59e0b', 'Faulty': '#ef4444', 'Under Repair': '#f97316', 'Retired': '#6b7280' };
const COLORS = ['#166534','#22c55e','#4ade80','#86efac','#bbf7d0','#f0fdf4','#f59e0b','#ef4444'];

function StatCard({ label, value, color, icon }) {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/devices/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard…</div>;
  if (!data)   return <div className="page-error">Failed to load dashboard.</div>;

  const statusData    = data.byStatus.map(d => ({ name: d.status, value: d.count, fill: STATUS_COLORS[d.status] || '#22c55e' }));
  const conditionData = data.byCondition.map(d => ({ name: d.condition, value: d.count }));
  const deptData      = data.byDepartment.map(d => ({ name: d.department.replace(' and ', ' & '), count: d.count }));
  const typeData      = data.byType.map(d => ({ name: d.device_type, value: d.count }));

  const inUse      = data.byStatus.find(s => s.status === 'In Use')?.count || 0;
  const available  = data.byStatus.find(s => s.status === 'Available')?.count || 0;
  const inRepair   = data.byStatus.find(s => s.status === 'In Repair')?.count || 0;
  const retired    = data.byStatus.find(s => s.status === 'Retired')?.count || 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📊 Dashboard</h1>
        <p className="page-subtitle">Bureau of Public Enterprises — ICT Device Overview</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard label="Total Devices" value={data.total} color="#166534" icon="💻" />
        <StatCard label="In Use"        value={inUse}      color="#166534" icon="✅" />
        <StatCard label="Available"     value={available}  color="#22c55e" icon="🟢" />
        <StatCard label="In Repair"     value={inRepair}   color="#f59e0b" icon="🔧" />
        <StatCard label="Retired"       value={retired}    color="#6b7280" icon="🗄️" />
        <StatCard label="Need Attention" value={data.needsAttention.length} color="#ef4444" icon="⚠️" />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Devices by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, value}) => `${name} (${value})`}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.fill || COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Devices by Condition</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={conditionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, value}) => `${name} (${value})`}>
                {conditionData.map((entry, i) => <Cell key={i} fill={CONDITION_COLORS[entry.name] || COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card chart-card--wide">
          <h3 className="chart-title">Devices by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#166534" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Devices by Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Needs Attention */}
      {data.needsAttention.length > 0 && (
        <div className="attention-section">
          <h3 className="section-title">⚠️ Devices Needing Attention</h3>
          <div className="attention-list">
            {data.needsAttention.map(d => (
              <div key={d.id} className="attention-card" onClick={() => navigate(`/devices/${d.id}`)}>
                <div className="attention-name">{d.device_name}</div>
                <div className="attention-meta">
                  <span className="badge badge-asset">{d.asset_tag}</span>
                  <span className={`badge badge-condition badge-${d.condition.toLowerCase().replace(' ','-')}`}>{d.condition}</span>
                  <span className="attention-dept">{d.department}</span>
                </div>
                {d.notes && <div className="attention-notes">{d.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {data.recentActivity.length > 0 && (
        <div className="activity-section">
          <h3 className="section-title">🕐 Recent Activity</h3>
          <div className="activity-list">
            {data.recentActivity.map(h => (
              <div key={h.id} className="activity-item" onClick={() => navigate(`/devices/${h.device_id}`)}>
                <div className="activity-icon">{h.action === 'CREATE' ? '➕' : '✏️'}</div>
                <div className="activity-body">
                  <span className="activity-device">{h.device_name}</span>
                  {h.action === 'CREATE'
                    ? <span> was added</span>
                    : <span> — <strong>{h.field_name}</strong> changed from <em>{h.old_value || '—'}</em> to <em>{h.new_value}</em></span>
                  }
                  <span className="activity-by"> by {h.performed_by}</span>
                </div>
                <div className="activity-time">{new Date(h.performed_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

