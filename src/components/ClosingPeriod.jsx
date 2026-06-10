import { useState } from 'react';
import { formatRp, formatDate, MONTH_NAMES } from '../App';
import { Lock, Unlock, Calendar, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export default function ClosingPeriod({ state, actions }) {
  const { closingPeriods, user } = state;
  const { closePeriod } = actions;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Role validation
  const userRole = user?.role || 'staff';
  const isOwner = userRole === 'owner';

  const handleClosePeriod = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Execute period closing
      await closePeriod(Number(month), Number(year));
      setSuccess(`Sukses menutup buku untuk periode ${MONTH_NAMES[month - 1]} ${year}!`);
    } catch (err) {
      setError(err.message || 'Gagal menutup buku untuk periode tersebut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ margin: 0 }}>Tutup Buku Bulanan (Period Closing)</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
          Tutup buku mengunci pencatatan transaksi pada periode tertentu dan memposting pemindahan laba bersih ke modal.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Closing Control Panel */}
        <div className="card glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={18} style={{ color: 'var(--color-primary-light)' }} />
            Eksekusi Tutup Buku
          </h4>

          {!isOwner ? (
            <div className="alert alert-danger" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <ShieldAlert size={20} style={{ flexShrink: 0 }} />
              <span>
                <strong>Akses Terbatas:</strong> Anda masuk sebagai <strong>{userRole.toUpperCase()}</strong>. Hanya pengguna dengan peran <strong>OWNER</strong> yang dapat melakukan tutup buku.
              </span>
            </div>
          ) : (
            <form onSubmit={handleClosePeriod} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {error && <div className="alert alert-danger">⚠️ {error}</div>}
              {success && <div className="alert alert-success">✅ {success}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Pilih Bulan Periode</label>
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                    {MONTH_NAMES.map((mName, i) => (
                      <option key={i} value={i + 1}>{mName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pilih Tahun</label>
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong style={{ color: 'var(--color-warning)' }}>⚠️ PENTING UNTUK DIPERHATIKAN:</strong>
                <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Seluruh transaksi dan jurnal pada periode ini akan <strong>dikunci secara permanen</strong> (tidak dapat diedit/ditambah).</li>
                  <li>Sistem akan menghitung laba bersih bulanan dan otomatis memposting jurnal penutup:
                    <br />
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      Debit 303 (Ikhtisar Laba Rugi) & Kredit 302 (Saldo Laba Ditahan)
                    </span>.
                  </li>
                  <li>Periode bulan sebelumnya <strong>harus sudah ditutup</strong> terlebih dahulu secara berurutan.</li>
                </ol>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Mengunci Periode...' : 'Kunci & Tutup Buku'}
              </button>
            </form>
          )}
        </div>

        {/* Closed Periods Timeline */}
        <div className="card glass-panel" style={{ padding: '1.5rem', minHeight: '344px' }}>
          <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={18} />
            Histori Periode Terkunci
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '310px', overflowY: 'auto' }}>
            {closingPeriods.length > 0 ? (
              closingPeriods.map(period => (
                <div 
                  key={period.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(52,211,153,0.2)',
                    background: 'rgba(52,211,153,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ padding: '6px', borderRadius: '6px', background: 'rgba(52,211,153,0.1)', color: 'var(--color-success)', display: 'flex' }}>
                      <Lock size={16} />
                    </span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700' }}>
                        {MONTH_NAMES[period.period_month - 1]} {period.period_year}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        Oleh: {period.closed_by} pada {formatDate(period.closed_at || period.created_at)}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Laba Bersih</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: period.net_income >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {formatRp(period.net_income)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--color-text-muted)' }}>
                <Unlock size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '12px' }}>Belum ada periode akuntansi yang ditutup buku.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
