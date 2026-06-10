import { useState } from 'react';
import { formatRp, formatDate, MONTH_NAMES } from '../App';
import { Plus, X, Landmark, Calculator, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Assets({ state, actions }) {
  const { fixedAssets, depreciationRecords, user } = state;
  const { addAsset, postDepreciation, isPeriodClosed } = actions;

  // Modal Visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDepreciateModal, setShowDepreciateModal] = useState(false);

  // Add Asset State
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [usefulLifeMonths, setUsefulLifeMonths] = useState('12');
  const [salvageValue, setSalvageValue] = useState('0');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Depreciate State
  const [depAssetId, setDepAssetId] = useState('');
  const [depDate, setDepDate] = useState(new Date().toISOString().split('T')[0]);

  // Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Role check
  const userRole = user?.role || 'staff';
  const isStaff = userRole === 'staff';

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await addAsset({
        name: name.trim(),
        cost: Number(cost),
        useful_life_months: Number(usefulLifeMonths),
        salvage_value: Number(salvageValue),
        purchase_date: purchaseDate,
      });

      setSuccess('Aset tetap berhasil ditambahkan!');
      setName('');
      setCost('');
      setUsefulLifeMonths('12');
      setSalvageValue('0');
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || 'Gagal menambahkan aset.');
    }
  };

  const handlePostDepreciation = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!depAssetId) {
      setError('Pilih aset terlebih dahulu.');
      return;
    }

    const asset = fixedAssets.find(a => a.id === depAssetId);
    if (!asset) return;

    if (isPeriodClosed(depDate)) {
      setError('Periode ini sudah ditutup. Tidak dapat memposting penyusutan.');
      return;
    }

    const accum = getAccumulatedDep(asset.id);
    const bookVal = Number(asset.cost) - accum;
    const maxDepreciable = Math.max(0, bookVal - Number(asset.salvage_value));
    const monthlyDep = Math.min(maxDepreciable, (Number(asset.cost) - Number(asset.salvage_value)) / Number(asset.useful_life_months));

    if (monthlyDep <= 0) {
      setError('Aset ini sudah sepenuhnya disusutkan (mencapai nilai sisa).');
      return;
    }

    try {
      await postDepreciation(depAssetId, depDate, monthlyDep);
      setSuccess(`Berhasil memposting beban penyusutan untuk ${asset.name} senilai ${formatRp(monthlyDep)}!`);
      setShowDepreciateModal(false);
    } catch (err) {
      setError(err.message || 'Gagal memposting penyusutan.');
    }
  };

  // Helper calculation for accumulated depreciation
  const getAccumulatedDep = (assetId) => {
    return depreciationRecords
      .filter(r => r.asset_id === assetId)
      .reduce((sum, r) => sum + Number(r.nominal || 0), 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Pencatatan Aset Tetap & Depresiasi</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
            Pantau nilai buku mesin produksi dan lakukan posting beban penyusutan bulanan (Straight-Line).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => { setError(''); setSuccess(''); setShowDepreciateModal(true); }}
            disabled={isStaff}
            title={isStaff ? "Hanya Owner/Manager yang dapat memposting penyusutan" : ""}
          >
            <Calculator size={14} style={{ marginRight: '6px' }} /> Susutkan Aset
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => { setError(''); setSuccess(''); setShowAddModal(true); }}
            disabled={isStaff}
            title={isStaff ? "Hanya Owner/Manager yang dapat mendaftarkan aset baru" : ""}
          >
            <Plus size={14} style={{ marginRight: '6px' }} /> Aset Baru
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">⚠️ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Assets Registry Table */}
      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--color-primary-light)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Landmark size={18} />
          Register Aset Tetap (Fixed Assets Registry)
        </h3>

        <div className="table-responsive">
          <table className="table" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th>Nama Aset</th>
                <th>Tanggal Beli</th>
                <th>Harga Perolehan</th>
                <th>Umur Manfaat</th>
                <th>Nilai Sisa (Salvage)</th>
                <th>Penyusutan Bulanan</th>
                <th>Akumulasi Susut</th>
                <th>Nilai Buku (Book Value)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fixedAssets.length > 0 ? (
                fixedAssets.map(asset => {
                  const accum = getAccumulatedDep(asset.id);
                  const bookVal = Number(asset.cost) - accum;
                  const monthly = (Number(asset.cost) - Number(asset.salvage_value)) / Number(asset.useful_life_months);

                  return (
                    <tr key={asset.id}>
                      <td style={{ fontWeight: '600' }}>{asset.name}</td>
                      <td>{formatDate(asset.purchase_date)}</td>
                      <td>{formatRp(asset.cost)}</td>
                      <td>{asset.useful_life_months} bulan</td>
                      <td>{formatRp(asset.salvage_value)}</td>
                      <td style={{ color: 'var(--color-primary-light)' }}>{formatRp(monthly)} / bln</td>
                      <td style={{ color: 'var(--color-warning)' }}>{formatRp(accum)}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>{formatRp(bookVal)}</td>
                      <td>
                        <span 
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            backgroundColor: bookVal <= Number(asset.salvage_value) ? 'rgba(156,163,175,0.1)' : 'rgba(52,211,153,0.1)',
                            color: bookVal <= Number(asset.salvage_value) ? 'var(--color-text-muted)' : 'var(--color-success)',
                          }}
                        >
                          {bookVal <= Number(asset.salvage_value) ? 'DEPRECIATED' : 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
                    Belum ada aset tetap yang terdaftar. Klik "Aset Baru" untuk menambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Depreciation History */}
      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem' }}>
          ⏳ Histori Jurnal Penyusutan Aset
        </h3>
        
        <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
          <table className="table" style={{ fontSize: '12px' }}>
            <thead>
              <tr>
                <th>Tanggal Jurnal</th>
                <th>Nama Aset</th>
                <th>Periode Susut</th>
                <th>Nominal Penyusutan</th>
                <th>Status Posting</th>
              </tr>
            </thead>
            <tbody>
              {depreciationRecords.length > 0 ? (
                depreciationRecords.map(rec => {
                  const asset = fixedAssets.find(a => a.id === rec.asset_id);
                  return (
                    <tr key={rec.id}>
                      <td>{formatDate(rec.date)}</td>
                      <td>{asset?.name || 'Aset Tidak Dikenal'}</td>
                      <td style={{ fontWeight: '500' }}>
                        {MONTH_NAMES[rec.period_month - 1]} {rec.period_year}
                      </td>
                      <td style={{ color: 'var(--color-primary-light)', fontWeight: 'bold' }}>
                        {formatRp(rec.nominal)}
                      </td>
                      <td style={{ color: 'var(--color-success)', fontWeight: '600' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={14} /> Jurnal Diposting (Akun 505 / 112)
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                    Belum ada riwayat beban penyusutan yang dibukukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add Asset */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '485px', padding: '2.2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Register Aset Baru</h4>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="form-group">
                <label>Nama Aset Tetap</label>
                <input type="text" placeholder="Contoh: Mesin Giling Tepung Sorgum" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Tanggal Pembelian</label>
                  <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Masa Manfaat (Bulan)</label>
                  <input type="number" min="1" value={usefulLifeMonths} onChange={(e) => setUsefulLifeMonths(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Harga Perolehan (Rp)</label>
                  <input type="number" placeholder="Harga Beli" value={cost} onChange={(e) => setCost(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Nilai Sisa (Salvage Value)</label>
                  <input type="number" placeholder="Nilai Akhir Aset" value={salvageValue} onChange={(e) => setSalvageValue(e.target.value)} required />
                </div>
              </div>

              <div className="alert alert-warning" style={{ fontSize: '11px', margin: 0, padding: '0.6rem' }}>
                <AlertTriangle size={14} style={{ float: 'left', marginRight: '6px' }} />
                Pembelian aset akan memicu jurnal ganda otomatis: <strong>Debit 111 (Mesin) & Kredit 101 (Kas)</strong> senilai harga perolehan.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Simpan & Daftarkan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Post Depreciation */}
      {showDepreciateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '425px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Posting Beban Penyusutan Aset</h4>
              <button onClick={() => setShowDepreciateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostDepreciation} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Pilih Aset Tetap</label>
                <select value={depAssetId} onChange={(e) => setDepAssetId(e.target.value)} required>
                  <option value="">-- Pilih Aset --</option>
                  {fixedAssets.map(a => {
                    const accum = getAccumulatedDep(a.id);
                    const bookVal = Number(a.cost) - accum;
                    return (
                      <option key={a.id} value={a.id} disabled={bookVal <= Number(a.salvage_value)}>
                        {a.name} (Sisa Buku: {formatRp(bookVal)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Tanggal Depresiasi (Pilih Bulan)</label>
                <input type="date" value={depDate} onChange={(e) => setDepDate(e.target.value)} required />
              </div>

              <div className="alert alert-warning" style={{ fontSize: '11px', margin: 0, padding: '0.6rem' }}>
                Penyusutan per bulan otomatis dihitung menggunakan metode Garis Lurus (Straight Line) dan akan memposting: <strong>Debit Beban Penyusutan (505) & Kredit Akumulasi Penyusutan (112)</strong>.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowDepreciateModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Posting Jurnal Beban</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
