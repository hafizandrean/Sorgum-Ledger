import { useState } from 'react';

export default function Auth({ onAuth, db }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showTimeoutNotice] = useState(() => {
    const val = localStorage.getItem('sl_timeout_alert');
    if (val === 'true') {
      localStorage.removeItem('sl_timeout_alert');
      return true;
    }
    return false;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Sign up with email, password, and fullName (role and company are verified/copied from invitation)
        const { error: err } = await db.auth.signUp(email, password, fullName);
        if (err) throw err;
      } else {
        const { error: err } = await db.auth.signIn(email, password);
        if (err) throw err;
      }
      onAuth();
    } catch (err) {
      setError(err.message || 'Gagal autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      const demoEmails = {
        owner: 'owner@sorgum.local',
        manager: 'manager@sorgum.local',
        staff: 'staff@sorgum.local',
      };
      localStorage.setItem('sl_force_demo', 'true');
      const user = { id: 'u-' + role, email: demoEmails[role], role, status: 'active', company_id: 'c-sorgum' };
      localStorage.setItem('sl_session', JSON.stringify(user));
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Gagal masuk demo.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="auth-card glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', borderRadius: '16px' }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '3rem' }}>🌾</span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0.5rem 0' }}>SorgumLedger</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Sistem Informasi Akuntansi Sorgumology
          </p>
        </div>

        {showTimeoutNotice && (
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            ⏳ Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit. Silakan masuk kembali.
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isRegister && (
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input
                type="text"
                placeholder="Masukkan nama lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Alamat Email</label>
            <input
              type="email"
              placeholder="nama@perusahaan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Kata Sandi</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Memproses...' : isRegister ? 'Aktivasi Akun' : 'Masuk Sistem'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            className="link-btn"
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            {isRegister ? 'Sudah punya akun? Masuk di sini' : 'Punya undangan? Aktivasi Akun di sini'}
          </button>
        </div>

        <div style={{ margin: '2rem 0 1rem 0', position: 'relative', textAlign: 'center' }}>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-surface)', padding: '0 10px', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Uji Coba Cepat
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>
            Masuk instan menggunakan Peran Demo (Bypass Auth):
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <button className="btn btn-outline" style={{ fontSize: '11px', padding: '8px 4px' }} onClick={() => handleDemoLogin('owner')}>
              🔑 Owner
            </button>
            <button className="btn btn-outline" style={{ fontSize: '11px', padding: '8px 4px' }} onClick={() => handleDemoLogin('manager')}>
              🛡️ Manager
            </button>
            <button className="btn btn-outline" style={{ fontSize: '11px', padding: '8px 4px' }} onClick={() => handleDemoLogin('staff')}>
              📝 Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
