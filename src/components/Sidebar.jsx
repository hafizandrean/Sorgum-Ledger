import { LayoutDashboard, Receipt, BookOpen, Package, HardDrive, FileSpreadsheet, Lock, Settings, LogOut, User } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, isDemoMode, signOut, lowStockCount, changeDemoRole, companySettings }) {
  const menuItems = [
    { id: 'dashboard',    label: 'Dashboard',         icon: <LayoutDashboard size={20} /> },
    { id: 'transactions', label: 'Transaksi',         icon: <Receipt size={20} /> },
    { id: 'journal',      label: 'Jurnal & Buku Besar',icon: <BookOpen size={20} /> },
    { id: 'inventory',    label: 'Inventori',         icon: <Package size={20} />, badge: lowStockCount > 0 ? lowStockCount : null },
    { id: 'assets',       label: 'Aset Tetap',        icon: <HardDrive size={20} /> },
    { id: 'reports',      label: 'Laporan Keuangan',  icon: <FileSpreadsheet size={20} /> },
    { id: 'closing',      label: 'Tutup Buku',        icon: <Lock size={20} /> },
    { id: 'settings',     label: 'Pengaturan',        icon: <Settings size={20} /> },
  ];

  const roleLabels = {
    owner: 'Owner',
    manager: 'Manager',
    staff: 'Staff Keuangan',
  };

  const roleColors = {
    owner: 'var(--color-danger)',
    manager: 'var(--color-primary)',
    staff: 'var(--color-success)',
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        {companySettings?.logo_url ? (
          <img src={companySettings.logo_url} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px', marginRight: '8px' }} />
        ) : (
          <span className="brand-logo" style={{ marginRight: '8px' }}>🌾</span>
        )}
        <span className="brand-title">SorgumLedger</span>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.filter(item => {
            if (item.id === 'closing' && user?.role !== 'owner') return false;
            return true;
          }).map(item => (
            <li key={item.id}>
              <button
                className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge !== null && (
                  <span className="nav-badge pulse">{item.badge}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            <User size={16} />
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name" title={user?.email || 'demo@sorgum.local'}>
              {user?.email || 'demo@sorgum.local'}
            </span>
            <span
              className="sidebar-user-role"
              style={{
                backgroundColor: roleColors[user?.role] || 'var(--color-muted)',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: '600',
                fontSize: '9px',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginTop: '3px',
                width: 'fit-content'
              }}
            >
              {roleLabels[user?.role] || 'Staff'}
            </span>
          </div>
        </div>

        {isDemoMode && (
          <div className="demo-role-switcher" style={{ marginTop: '1rem', padding: '0 0.5rem' }}>
            <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Mode Demo — Ganti Peran:
            </label>
            <select
              value={user?.role || 'staff'}
              onChange={(e) => changeDemoRole(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="owner">Owner (Semua Akses)</option>
              <option value="manager">Manager (Approve & Post)</option>
              <option value="staff">Staff Keuangan (Input & Draft)</option>
            </select>
          </div>
        )}

        <button className="btn btn-outline btn-block" onClick={signOut} style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
