/**
 * components/Layout.jsx — App shell with sidebar navigation
 */
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-mark">📡</div>
          <div>
            <div className="logo-title">BPE Device</div>
            <div className="logo-subtitle">Tracker — ICT Unit</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>
          <NavLink to="/devices" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">💻</span> Devices
          </NavLink>
          <NavLink to="/devices/new" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">➕</span> Add Device
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.username}</div>
              <div className="user-role badge-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

