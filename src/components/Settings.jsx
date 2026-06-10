import { useState } from 'react';
import { formatDate } from '../App';
import { Settings as SettingsIcon, Users, List, Save, Shield, Search, Plus } from 'lucide-react';

export default function Settings({ state, actions }) {
  const { companySettings, users, invitations = [], auditLogs, user } = state;
  const { updateCompanySettings } = actions;

  const [activeSubTab, setActiveSubTab] = useState(() => localStorage.getItem('sl_sub_tab_settings') || 'profile'); // 'profile' | 'coa' | 'users' | 'audit'

  // COA Form State
  const [coaCode, setCoaCode] = useState('');
  const [coaName, setCoaName] = useState('');
  const [coaClass, setCoaClass] = useState('expense');
  const [coaSubClass, setCoaSubClass] = useState('Expense');
  const [coaNormalBalance, setCoaNormalBalance] = useState('Debit');
  const [coaSystemRole, setCoaSystemRole] = useState('');
  const [coaPurpose, setCoaPurpose] = useState('operational');
  const [coaTag, setCoaTag] = useState('');
  const [coaCanPay, setCoaCanPay] = useState(false);
  const [coaAffectsStock, setCoaAffectsStock] = useState(false);
  const [coaDefaultPayment, setCoaDefaultPayment] = useState(false);
  const [coaClosingAccount, setCoaClosingAccount] = useState(false);
  const [coaSuccess, setCoaSuccess] = useState('');
  const [coaError, setCoaError] = useState('');
  const [coaSearch, setCoaSearch] = useState('');

  // Invitation Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Profile Form State
  const [companyName, setCompanyName] = useState(companySettings.company_name || '');
  const [address, setAddress] = useState(companySettings.address || '');
  const [npwp, setNpwp] = useState(companySettings.npwp || '');
  const [logoUrl, setLogoUrl] = useState(companySettings.logo_url || '');
  const [currency, setCurrency] = useState(companySettings.currency || 'IDR');
  const [depreciationMethod, setDepreciationMethod] = useState(companySettings.depreciation_method || 'Straight-Line');

  // Audit Log Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Messages
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Role check
  const isOwner = user?.role === 'owner';

  const handleAddCoaAccount = async (e) => {
    e.preventDefault();
    setCoaSuccess('');
    setCoaError('');

    if (!isOwner && user?.role !== 'manager') {
      setCoaError('Hanya Owner atau Manager yang dapat menambahkan akun COA baru.');
      return;
    }

    try {
      await actions.addCoaAccount({
        code: coaCode.trim(),
        name: coaName.trim(),
        account_class: coaClass,
        sub_classification: coaSubClass,
        normal_balance: coaNormalBalance,
        system_role: coaSystemRole.trim() || null,
        account_purpose: coaPurpose,
        account_tag: coaTag.trim() || null,
        behaviors: {
          can_pay: coaCanPay,
          affects_stock: coaAffectsStock,
          default_payment: coaDefaultPayment,
          closing_account: coaClosingAccount
        }
      });
      setCoaSuccess(`Akun ${coaCode} - ${coaName} berhasil ditambahkan!`);
      setCoaCode('');
      setCoaName('');
      setCoaClass('expense');
      setCoaSubClass('Expense');
      setCoaNormalBalance('Debit');
      setCoaSystemRole('');
      setCoaPurpose('operational');
      setCoaTag('');
      setCoaCanPay(false);
      setCoaAffectsStock(false);
      setCoaDefaultPayment(false);
      setCoaClosingAccount(false);
    } catch (err) {
      setCoaError(err.message || 'Gagal menambahkan akun.');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!isOwner) {
      setError('Hanya Owner yang dapat mengubah konfigurasi profil perusahaan.');
      return;
    }

    try {
      await updateCompanySettings({
        company_name: companyName.trim(),
        address: address.trim(),
        npwp: npwp.trim(),
        logo_url: logoUrl.trim(),
        currency,
        depreciation_method: depreciationMethod,
      });
      setSuccess('Profil perusahaan berhasil diperbarui!');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan konfigurasi.');
    }
  };

  // Helper to format JSON values in audit log
  const renderAuditValue = (val) => {
    if (!val) return '-';
    try {
      const obj = typeof val === 'string' ? JSON.parse(val) : val;
      return (
        <div className="audit-value-box">
          {Object.entries(obj).map(([key, value]) => {
            let displayVal = String(value);
            if (key === 'cost' || key === 'nominal' || key === 'net_income') {
              displayVal = typeof value === 'number' ? 'Rp ' + Math.round(value).toLocaleString('id-ID') : String(value);
            }
            return (
              <div key={key} className="audit-value-row">
                <span className="audit-value-key">{key}</span>
                <span className="audit-value-val">{displayVal}</span>
              </div>
            );
          })}
        </div>
      );
    } catch {
      return <span className="audit-value-val" style={{ fontFamily: 'monospace' }}>{String(val)}</span>;
    }
  };

  // Filter audit logs
  const filteredLogs = auditLogs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      (log.user_email && log.user_email.toLowerCase().includes(query)) ||
      (log.table_name && log.table_name.toLowerCase().includes(query)) ||
      (log.record_id && log.record_id.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Pengaturan & Log Audit</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
            Konfigurasi profil UMKM, hak akses pengguna, serta pencatatan audit log aktivitas.
          </p>
        </div>

        <div className="tab-group" style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            className={`btn ${activeSubTab === 'profile' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '13px' }}
            onClick={() => { setActiveSubTab('profile'); localStorage.setItem('sl_sub_tab_settings', 'profile'); }}
          >
            <SettingsIcon size={14} style={{ marginRight: '6px' }} /> Profil Perusahaan
          </button>
          <button
            className={`btn ${activeSubTab === 'coa' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '13px' }}
            onClick={() => { setActiveSubTab('coa'); localStorage.setItem('sl_sub_tab_settings', 'coa'); }}
          >
            <List size={14} style={{ marginRight: '6px' }} /> Daftar Akun (COA)
          </button>
          {isOwner && (
            <button
              className={`btn ${activeSubTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => { setActiveSubTab('users'); localStorage.setItem('sl_sub_tab_settings', 'users'); }}
            >
              <Users size={14} style={{ marginRight: '6px' }} /> Manajemen Pengguna
            </button>
          )}
          {(isOwner || user?.role === 'manager') && (
            <button
              className={`btn ${activeSubTab === 'audit' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => { setActiveSubTab('audit'); localStorage.setItem('sl_sub_tab_settings', 'audit'); }}
            >
              <List size={14} style={{ marginRight: '6px' }} /> Log Audit Sistem
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'profile' && (
        /* ── Profile Configuration Tab ── */
        <div className="card glass-panel" style={{ padding: '1.5rem', maxWidth: '700px' }}>
          <h4 style={{ margin: '0 0 1.25rem 0' }}>Profil & Preferensi Akuntansi</h4>
          
          {error && <div className="alert alert-danger">⚠️ {error}</div>}
          {success && <div className="alert alert-success">✅ {success}</div>}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Nama Perusahaan / UMKM</label>
              <input 
                type="text" 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)} 
                required 
                disabled={!isOwner}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Nomor NPWP Badan Usaha</label>
                <input 
                  type="text" 
                  value={npwp} 
                  onChange={(e) => setNpwp(e.target.value)} 
                  disabled={!isOwner}
                />
              </div>
              <div className="form-group">
                <label>Mata Uang Acuan</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={!isOwner}>
                  <option value="IDR">Rupiah (IDR)</option>
                  <option value="USD">Dollar (USD)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Alamat Lengkap Perusahaan</label>
              <textarea 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                rows={3} 
                required
                disabled={!isOwner}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group">
                <label>Logo Perusahaan</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-base)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '6px', border: '1px dashed var(--border-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', overflow: 'hidden', flexShrink: 0 }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '20px' }}>🌾</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                        onClick={() => document.getElementById('logo-file-input').click()}
                        disabled={!isOwner}
                      >
                        Unggah Foto
                      </button>
                      {logoUrl && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--danger)', borderColor: 'rgba(220,38,38,0.2)' }}
                          onClick={() => setLogoUrl('')}
                          disabled={!isOwner}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      id="logo-file-input"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 1.5 * 1024 * 1024) {
                            setError('Ukuran gambar logo tidak boleh melebihi 1.5 MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setLogoUrl(event.target?.result || '');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <input
                      type="url"
                      placeholder={logoUrl && logoUrl.startsWith('data:') ? '✓ Gambar diunggah' : 'Atau tempel URL gambar...'}
                      value={logoUrl && logoUrl.startsWith('data:') ? '' : logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      disabled={!isOwner}
                      style={{ fontSize: '10px', padding: '4px 8px', marginTop: '2px' }}
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Metode Penyusutan Aset</label>
                <select value={depreciationMethod} onChange={(e) => setDepreciationMethod(e.target.value)} disabled={!isOwner}>
                  <option value="Straight-Line">Straight Line (Garis Lurus)</option>
                </select>
              </div>
            </div>

            {isOwner ? (
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Save size={16} /> Simpan Pengaturan
              </button>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', margin: 0 }}>
                *Akses Sunting Dikunci: Hanya pengguna dengan peran Owner yang dapat menyimpan modifikasi ini.
              </p>
            )}
          </form>
        </div>
      )}

      {activeSubTab === 'users' && isOwner && (
        /* ── Users Management Tab ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1: Send Invitation Form */}
          <div className="card glass-panel" style={{ padding: '1.5rem', maxWidth: '600px' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>Undang Pengguna Baru</h4>
            {inviteError && <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>⚠️ {inviteError}</div>}
            {inviteSuccess && <div className="alert alert-success" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>✅ {inviteSuccess}</div>}
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setInviteSuccess('');
              setInviteError('');
              try {
                await actions.inviteUser(inviteEmail.trim(), inviteRole);
                setInviteSuccess(`Undangan berhasil dikirim ke ${inviteEmail}!`);
                setInviteEmail('');
                setInviteRole('staff');
              } catch (err) {
                setInviteError(err.message || 'Gagal mengirim undangan.');
              }
            }} style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 2, minWidth: '200px', margin: 0 }}>
                <label>Alamat Email</label>
                <input 
                  type="email" 
                  placeholder="nama@perusahaan.com" 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '150px', margin: 0 }}>
                <label>Peran (Role)</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="staff">Staff Keuangan</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 20px' }}>
                Kirim Undangan
              </button>
            </form>
          </div>

          {/* Section 2: Active Invitations Tracker */}
          {invitations.length > 0 && (
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Undang yang Sedang Aktif ({invitations.length})</h4>
              <div className="table-responsive">
                <table className="table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Alamat Email</th>
                      <th>Peran Diundang</th>
                      <th>Tanggal Kirim</th>
                      <th>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: '600' }}>{inv.email}</td>
                        <td>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>
                            {inv.role.toUpperCase()}
                          </span>
                        </td>
                        <td>{formatDate(inv.created_at)}</td>
                        <td>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '3px 8px', fontSize: '11px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                            onClick={() => actions.cancelInvite(inv.id)}
                          >
                            Batalkan Undangan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 3: User List Table */}
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1.25rem 0' }}>Daftar Pengguna & Hak Akses</h4>

            <div className="table-responsive">
              <table className="table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Alamat Email</th>
                    <th>ID Pengguna</th>
                    <th>Peran Sistem (Role)</th>
                    <th>Status Akun</th>
                    <th>Hak Akses / Deskripsi</th>
                    <th>Tanggal Terdaftar</th>
                    <th>Tindakan / Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const isSelf = u.id === user?.id || u.email.toLowerCase() === user?.email?.toLowerCase();
                    const activeOwners = users.filter(o => o.role === 'owner' && o.status === 'active' && o.company_id === u.company_id);
                    const isLastOwner = u.role === 'owner' && activeOwners.length <= 1;

                    // Status style mapping
                    const statusColors = {
                      active: { bg: 'rgba(52,211,153,0.1)', text: 'var(--color-success)' },
                      pending: { bg: 'rgba(245,158,11,0.1)', text: 'var(--color-warning)' },
                      suspended: { bg: 'rgba(239,68,68,0.1)', text: 'var(--color-danger)' },
                      rejected: { bg: 'rgba(156,163,175,0.1)', text: 'var(--color-text-muted)' },
                    };
                    const statusStyle = statusColors[u.status?.toLowerCase()] || statusColors.pending;

                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: '600' }}>{u.email}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{u.id}</td>
                        <td>
                          <span 
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: u.role === 'owner' ? 'rgba(239,68,68,0.1)' : u.role === 'manager' ? 'rgba(59,130,246,0.1)' : 'rgba(52,211,153,0.1)',
                              color: u.role === 'owner' ? 'var(--color-danger)' : u.role === 'manager' ? 'var(--color-primary-light)' : 'var(--color-success)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Shield size={12} />
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span 
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '600',
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.text,
                            }}
                          >
                            {(u.status || 'active').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {u.role === 'owner' && 'Akses Penuh: Pengaturan, Audit Logs, Tutup Buku, approval transaksi'}
                          {u.role === 'manager' && 'Akses Manager: Menyetujui (Approve) & Membukukan (Post) Transaksi'}
                          {u.role === 'staff' && 'Akses Staff: Menulis Transaksi Draft & Mengajukan Persetujuan'}
                        </td>
                        <td>{formatDate(u.created_at)}</td>
                        <td>
                          {!isSelf && (
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {u.status === 'pending' && (
                                <>
                                  <button 
                                    className="btn btn-outline" 
                                    style={{ padding: '3px 8px', fontSize: '11px', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                                    onClick={() => actions.updateUserStatus(u.id, 'active')}
                                  >
                                    Setujui
                                  </button>
                                  <button 
                                    className="btn btn-outline" 
                                    style={{ padding: '3px 8px', fontSize: '11px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                                    onClick={() => actions.updateUserStatus(u.id, 'rejected')}
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}
                              
                              {u.status === 'active' && !isLastOwner && (
                                <button 
                                  className="btn btn-outline" 
                                  style={{ padding: '3px 8px', fontSize: '11px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                                  onClick={() => actions.updateUserStatus(u.id, 'suspended')}
                                >
                                  Tangguhkan
                                </button>
                              )}

                              {u.status === 'suspended' && (
                                <button 
                                  className="btn btn-outline" 
                                  style={{ padding: '3px 8px', fontSize: '11px', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                                  onClick={() => actions.updateUserStatus(u.id, 'active')}
                                >
                                  Aktifkan
                                </button>
                              )}

                              {u.role === 'manager' && u.status === 'active' && (
                                <button 
                                  className="btn btn-outline" 
                                  style={{ padding: '3px 8px', fontSize: '11px', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                                  onClick={() => actions.changeUserRole(u.id, 'owner')}
                                >
                                  Jadikan Owner
                                </button>
                              )}

                              {isLastOwner && (
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Owner Terakhir</span>
                              )}
                            </div>
                          )}
                          {isSelf && <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Akun Anda</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'audit' && (isOwner || user?.role === 'manager') && (
        /* ── Audit Logs Tab ── */
        <div className="card glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: 0 }}>Log Audit Aktivitas Sistem</h4>
            
            <div className="form-group" style={{ margin: 0, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Cari aktivitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '30px', fontSize: '12px', width: '220px', margin: 0 }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ fontSize: '12px', minWidth: '1100px' }}>
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Waktu</th>
                  <th style={{ width: '15%' }}>Email Pengguna</th>
                  <th style={{ width: '20%' }}>Detail Aktivitas</th>
                  <th style={{ width: '10%' }}>Tabel</th>
                  <th style={{ width: '13%' }}>ID Record</th>
                  <th style={{ width: '15%' }}>Nilai Lama</th>
                  <th style={{ width: '15%' }}>Nilai Baru</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td style={{ fontWeight: '500' }}>{log.user_email}</td>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{log.action}</td>
                      <td style={{ fontFamily: 'monospace' }}>{log.table_name || '-'}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                        {log.record_id || '-'}
                      </td>
                      <td>{renderAuditValue(log.old_value)}</td>
                      <td>{renderAuditValue(log.new_value)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                      Tidak ditemukan log aktivitas yang sesuai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'coa' && (
        /* ── Chart of Accounts (COA) Tab ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Add Account Form (Owners/Managers only) */}
          {(isOwner || user?.role === 'manager') && (
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Tambah Akun Baru (COA Registry)</h4>
              {coaError && <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>⚠️ {coaError}</div>}
              {coaSuccess && <div className="alert alert-success" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>✅ {coaSuccess}</div>}
              
              <form onSubmit={handleAddCoaAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Kode Akun (4 Digit)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 6180" 
                      maxLength="10"
                      value={coaCode} 
                      onChange={(e) => setCoaCode(e.target.value.replace(/\D/g, ''))}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Nama Akun Perkiraan</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Beban Konsumsi" 
                      value={coaName} 
                      onChange={(e) => setCoaName(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Kelas Akun (Account Class)</label>
                    <select value={coaClass} onChange={(e) => setCoaClass(e.target.value)}>
                      <option value="asset">Asset (Aset)</option>
                      <option value="liability">Liability (Kewajiban)</option>
                      <option value="equity">Equity (Modal)</option>
                      <option value="revenue">Revenue (Pendapatan)</option>
                      <option value="expense">Expense (Beban)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Sub-Klasifikasi Pelaporan</label>
                    <select value={coaSubClass} onChange={(e) => setCoaSubClass(e.target.value)}>
                      <option value="Current Asset">Current Asset (Aset Lancar)</option>
                      <option value="Fixed Asset">Fixed Asset (Aset Tetap)</option>
                      <option value="Contra Asset">Contra Asset (Kontra Aset)</option>
                      <option value="Current Liability">Current Liability (Liabilitas Lancar)</option>
                      <option value="Long-Term Liability">Long-Term Liability (Liabilitas Jangka Panjang)</option>
                      <option value="Equity">Equity (Ekuitas)</option>
                      <option value="Revenue">Revenue (Pendapatan)</option>
                      <option value="Cost of Goods Sold">Cost of Goods Sold (HPP)</option>
                      <option value="Expense">Expense (Beban Operasional)</option>
                      <option value="Tax">Tax (Pajak)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Saldo Normal</label>
                    <select value={coaNormalBalance} onChange={(e) => setCoaNormalBalance(e.target.value)}>
                      <option value="Debit">Debit</option>
                      <option value="Credit">Credit</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>System Role (Automation Anchor - Opsional)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: default_cash_account (nullable)" 
                      value={coaSystemRole} 
                      onChange={(e) => setCoaSystemRole(e.target.value)} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                  <div className="form-group">
                    <label>Tujuan Akun (Purpose)</label>
                    <select value={coaPurpose} onChange={(e) => setCoaPurpose(e.target.value)}>
                      <option value="operational">Operational</option>
                      <option value="closing">Closing</option>
                      <option value="adjustment">Adjustment</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tag Akun (Tagging metadata - Opsional)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: cash, bank, inventory" 
                      value={coaTag} 
                      onChange={(e) => setCoaTag(e.target.value)} 
                    />
                  </div>

                  {/* Behavior Contract Checklist */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ marginBottom: '0.5rem' }}>Perilaku Runtime (Behavior Schema Contract)</label>
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={coaCanPay} onChange={(e) => setCoaCanPay(e.target.checked)} />
                        Bisa Bayar (offset method)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={coaAffectsStock} onChange={(e) => setCoaAffectsStock(e.target.checked)} />
                        Mempengaruhi Stok (inventory link)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={coaDefaultPayment} onChange={(e) => setCoaDefaultPayment(e.target.checked)} />
                        Kas Utama (default_payment)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={coaClosingAccount} onChange={(e) => setCoaClosingAccount(e.target.checked)} />
                        Akun Penutupan Buku (closing_account)
                      </label>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                  <Plus size={16} style={{ marginRight: '4px' }} /> Daftarkan Akun Baru
                </button>
              </form>
            </div>
          )}

          {/* COA List Table */}
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <h4 style={{ margin: 0 }}>Daftar Rekening Akun Perkiraan</h4>
              
              <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Cari kode atau nama akun..."
                  value={coaSearch}
                  onChange={(e) => setCoaSearch(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '12px', width: '220px', margin: 0 }}
                />
              </div>
            </div>

            <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <table className="table" style={{ fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                    <th>Kode</th>
                    <th>Nama Akun</th>
                    <th>Kelas</th>
                    <th>Klasifikasi Pelaporan</th>
                    <th>Saldo Normal</th>
                    <th>System Role / Tujuan / Tag</th>
                    <th>Runtime Behaviors</th>
                  </tr>
                </thead>
                <tbody>
                  {state.coa
                    .filter(c => {
                      if (!coaSearch) return true;
                      const q = coaSearch.toLowerCase();
                      return c.code.includes(q) || c.name.toLowerCase().includes(q) || c.sub_classification.toLowerCase().includes(q);
                    })
                    .sort((a, b) => a.code.localeCompare(b.code))
                    .map(c => {
                      const behaviorsList = [];
                      if (c.behaviors?.can_pay) behaviorsList.push('can_pay');
                      if (c.behaviors?.affects_stock) behaviorsList.push('affects_stock');
                      if (c.behaviors?.default_payment) behaviorsList.push('default_payment');
                      if (c.behaviors?.closing_account) behaviorsList.push('closing_account');
                      
                      return (
                        <tr key={c.code}>
                          <td style={{ fontFamily: 'monospace', fontWeight: '700' }}>{c.code}</td>
                          <td style={{ fontWeight: '500' }}>{c.name}</td>
                          <td>
                            <span style={{ 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '10px', 
                              fontWeight: '600',
                              backgroundColor: c.account_class === 'asset' ? 'rgba(52,211,153,0.1)' : c.account_class === 'liability' ? 'rgba(59,130,246,0.1)' : c.account_class === 'equity' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                              color: c.account_class === 'asset' ? 'var(--color-success)' : c.account_class === 'liability' ? 'var(--color-primary-light)' : c.account_class === 'equity' ? 'var(--color-danger)' : 'var(--color-warning)'
                            }}>
                              {c.account_class?.toUpperCase()}
                            </span>
                          </td>
                          <td>{c.sub_classification}</td>
                          <td>{c.normal_balance}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {c.system_role && (
                                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 4px', borderRadius: '4px', width: 'fit-content' }}>
                                  role: {c.system_role}
                                </span>
                              )}
                              <span style={{ fontSize: '10.5px', color: c.account_purpose === 'closing' ? 'var(--color-warning)' : c.account_purpose === 'adjustment' ? 'var(--color-primary-light)' : 'var(--color-text-muted)' }}>
                                purpose: {c.account_purpose || 'operational'}
                              </span>
                              {c.account_tag && (
                                <span style={{ fontSize: '10px', color: '#93c5fd' }}>
                                  tag: {c.account_tag}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                              {behaviorsList.length > 0 ? (
                                behaviorsList.map(b => (
                                  <span key={b} style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {b}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
