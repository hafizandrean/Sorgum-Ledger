import { useState, useEffect } from 'react';
import { formatRp, formatDate, getCoaByRole } from '../App';
import { Plus, Check, ShieldAlert, ArrowRight, Edit, FileText, Lock } from 'lucide-react';

export default function Transactions({ state, actions }) {
  const { coa, inventory, transactions, user } = state;
  const { addTransaction, updateTransactionStatus, isPeriodClosed } = actions;

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Pemasukan');
  const [categoryCode, setCategoryCode] = useState('');
  const [nominal, setNominal] = useState('');
  const [description, setDescription] = useState('');
  const [productSku, setProductSku] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState('posted'); // default for manager/owner
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  const handleUpdateStatus = async (txId, newStatus) => {
    setLoadingId(txId);
    setError('');
    setSuccess('');
    try {
      await updateTransactionStatus(txId, newStatus);
      setSuccess(`Status transaksi berhasil diperbarui.`);
    } catch (err) {
      setError(err.message || 'Gagal mengubah status transaksi.');
    } finally {
      setLoadingId(null);
    }
  };

  // Table Filters State
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Role management
  const userRole = user?.role || 'staff';
  const isStaff = userRole === 'staff';
  const isManagerOrOwner = userRole === 'manager' || userRole === 'owner';

  // Adjust default form status on component load or role change
  useEffect(() => {
    if (isStaff) {
      setStatus('draft');
    } else {
      setStatus('posted');
    }
  }, [userRole]);

  // Resolve dynamic COA codes
  const cashPrimaryCode = getCoaByRole(coa, 'default_cash_account') || '1010';
  const salesPrimaryCode = getCoaByRole(coa, 'default_sales_account') || '4010';
  const inventoryRawCode = getCoaByRole(coa, 'default_inventory_raw_account') || '1060';
  const inventoryFinishedCode = getCoaByRole(coa, 'default_inventory_finished_account') || '1050';
  const payablePrimaryCode = getCoaByRole(coa, 'default_payable_account') || '2010';
  const receivablePrimaryCode = getCoaByRole(coa, 'default_receivable_account') || '1030';

  // Handle category changes and set default code
  const categoryOptions = coa.filter(item => {
    if (item.behaviors?.can_pay === true) return false;
    if (type === 'Pemasukan') {
      return item.account_class === 'revenue' || item.account_class === 'equity' || item.code === receivablePrimaryCode;
    } else {
      return item.account_class === 'expense' || item.behaviors?.affects_stock === true || item.code === payablePrimaryCode;
    }
  });

  useEffect(() => {
    if (categoryOptions.length > 0) {
      setCategoryCode(categoryOptions[0].code);
    }
  }, [type]);

  // Auto-calculate nominal on sale or purchase selection
  useEffect(() => {
    const isSales = categoryCode === salesPrimaryCode;
    const isPurchase = categoryCode === inventoryRawCode || categoryCode === inventoryFinishedCode;
    if ((isSales || isPurchase) && productSku && quantity) {
      const prod = inventory.find(i => i.sku === productSku);
      if (prod) {
        const price = isSales ? prod.unit_price : prod.cost_price;
        setNominal(String(price * Number(quantity)));
      }
    }
  }, [categoryCode, productSku, quantity, salesPrimaryCode, inventoryRawCode, inventoryFinishedCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isPeriodClosed(date)) {
      setError('Periode ini sudah ditutup. Tidak dapat memposting transaksi.');
      return;
    }

    try {
      await addTransaction({
        date,
        type,
        category_code: categoryCode,
        nominal: Number(nominal),
        description,
        product_sku: (categoryCode === salesPrimaryCode || categoryCode === inventoryRawCode || categoryCode === inventoryFinishedCode) ? productSku : '',
        quantity: (categoryCode === salesPrimaryCode || categoryCode === inventoryRawCode || categoryCode === inventoryFinishedCode) ? Number(quantity) : 0,
        status: isStaff ? (status === 'posted' || status === 'approved' ? 'draft' : status) : status,
      });

      setSuccess('Transaksi berhasil disimpan!');
      // Reset fields
      setNominal('');
      setDescription('');
      setProductSku('');
      setQuantity('');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan transaksi.');
    }
  };

  // ── Real-Time Journal Preview ─────────────────────────────────────────────
  const getJournalPreview = () => {
    if (!nominal || isNaN(Number(nominal))) return [];
    const nom = Number(nominal);
    const qty = Number(quantity) || 0;
    const preview = [];

    const catName = coa.find(c => c.code === categoryCode)?.name || 'Akun';
    const cashPrimaryName = coa.find(c => c.code === cashPrimaryCode)?.name || 'Kas';
    const cogsPrimaryCode = getCoaByRole(coa, 'default_cogs_account') || '5010';
    const cogsPrimaryName = coa.find(c => c.code === cogsPrimaryCode)?.name || 'Harga Pokok Penjualan (HPP)';

    if (type === 'Pemasukan') {
      if (categoryCode === salesPrimaryCode && productSku) {
        const prod = inventory.find(i => i.sku === productSku);
        const hpp = prod ? prod.cost_price * qty : 0;
        preview.push({ code: cashPrimaryCode, name: cashPrimaryName, debit: nom, credit: 0 });
        preview.push({ code: salesPrimaryCode, name: catName, debit: 0, credit: nom });
        if (hpp > 0) {
          const invCode = prod.type === 'Bahan Baku' ? inventoryRawCode : inventoryFinishedCode;
          const invName = coa.find(c => c.code === invCode)?.name || 'Persediaan';
          preview.push({ code: cogsPrimaryCode, name: cogsPrimaryName, debit: hpp, credit: 0 });
          preview.push({ 
            code: invCode, 
            name: invName, 
            debit: 0, 
            credit: hpp 
          });
        }
      } else {
        preview.push({ code: cashPrimaryCode, name: cashPrimaryName, debit: nom, credit: 0 });
        preview.push({ code: categoryCode, name: catName, debit: 0, credit: nom });
      }
    } else {
      preview.push({ code: categoryCode, name: catName, debit: nom, credit: 0 });
      preview.push({ code: cashPrimaryCode, name: cashPrimaryName, debit: 0, credit: nom });
    }
    return preview;
  };

  const previewLines = getJournalPreview();

  // ── Filters & Search ──────────────────────────────────────────────────────
  const filteredTx = transactions.filter(t => {
    if (filterType !== 'All' && t.type !== filterType) return false;
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ margin: 0 }}>Input Transaksi Keuangan</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
          Gunakan formulir ini untuk merekam transaksi dan memantau status persetujuan internal.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form Card */}
        <div className="card glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1.25rem 0' }}>Formulir Pencatatan</h4>
          
          {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>✅ {success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Tanggal Transaksi</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Jenis Transaksi</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Pemasukan">Pemasukan (Kas Masuk)</option>
                  <option value="Pengeluaran">Pengeluaran (Kas Keluar)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Kategori Akun COA</label>
                <select value={categoryCode} onChange={(e) => setCategoryCode(e.target.value)} required>
                  {categoryOptions.map(cat => (
                    <option key={cat.code} value={cat.code}>
                      {cat.code} - {cat.name} ({cat.classification})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Status Persetujuan</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isStaff && (status === 'posted' || status === 'approved')}
                >
                  {isStaff ? (
                    <>
                      <option value="draft">Draft</option>
                      <option value="pending">Pending Approval</option>
                    </>
                  ) : (
                    <>
                      <option value="draft">Draft</option>
                      <option value="pending">Pending Approval</option>
                      <option value="approved">Approved</option>
                      <option value="posted">Posted (Buku Besar)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Sale / Purchase specific fields */}
            {(categoryCode === salesPrimaryCode || categoryCode === inventoryRawCode || categoryCode === inventoryFinishedCode) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="form-group">
                  <label>Pilih Barang / Produk</label>
                  <select value={productSku} onChange={(e) => setProductSku(e.target.value)} required>
                    <option value="">-- Pilih Barang --</option>
                    {inventory
                      .filter(i => {
                        if (categoryCode === inventoryRawCode) return i.type === 'Bahan Baku';
                        if (categoryCode === inventoryFinishedCode) return i.type === 'Produk Jadi';
                        return i.type === 'Produk Jadi';
                      })
                      .map(prod => (
                        <option key={prod.sku} value={prod.sku}>
                          {prod.sku} - {prod.name} ({formatRp(categoryCode === salesPrimaryCode ? prod.unit_price : prod.cost_price)})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Kuantitas (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Nominal Rupiah (Rp)</label>
              <input
                type="number"
                placeholder="Contoh: 150000"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Keterangan</label>
              <textarea
                placeholder="Keterangan singkat detail transaksi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '0.5rem' }}>
              <Plus size={16} /> Simpan Transaksi
            </button>
          </form>
        </div>

        {/* Real-time Preview Card */}
        <div className="card glass-panel" style={{ padding: '1.5rem', minHeight: '416px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={18} />
            Pratinjau Jurnal Ganda (Real-time)
          </h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', margin: '0 0 1.5rem 0' }}>
            Visualisasi baris akuntansi debet/kredit yang otomatis dihitung oleh sistem.
          </p>

          {previewLines.length > 0 ? (
            <div className="table-responsive">
              <table className="table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Akun COA</th>
                    <th>Debit</th>
                    <th>Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {previewLines.map((line, idx) => (
                    <tr key={idx}>
                      <td style={{ paddingLeft: line.credit > 0 ? '1.5rem' : '0.5rem' }}>
                        <span style={{ fontWeight: '600', color: line.debit > 0 ? '#fff' : 'var(--color-text-muted)' }}>
                          {line.code} - {line.name}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-success)', fontWeight: line.debit > 0 ? '700' : 'normal' }}>
                        {line.debit > 0 ? formatRp(line.debit) : '-'}
                      </td>
                      <td style={{ color: 'var(--color-primary)', fontWeight: line.credit > 0 ? '700' : 'normal' }}>
                        {line.credit > 0 ? formatRp(line.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {status !== 'posted' && (
                <div className="alert alert-warning" style={{ fontSize: '11px', marginTop: '1.5rem', padding: '0.5rem' }}>
                  ℹ️ Status transaksi saat ini adalah <strong>{status.toUpperCase()}</strong>. Transaksi ini tidak akan masuk ke Jurnal/Buku Besar sampai manajer mengubah statusnya menjadi <strong>POSTED</strong>.
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--color-text-muted)' }}>
              <ArrowRight size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '12px' }}>Masukkan jenis, kategori, dan nominal untuk melihat pratinjau jurnal.</span>
            </div>
          )}
        </div>
      </div>

      {/* History Registry Table */}
      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: 0 }}>Histori & Kontrol Transaksi</h4>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ fontSize: '12px', padding: '4px 8px' }}>
              <option value="All">Semua Tipe</option>
              <option value="Pemasukan">Pemasukan</option>
              <option value="Pengeluaran">Pengeluaran</option>
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ fontSize: '12px', padding: '4px 8px' }}>
              <option value="All">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="posted">Posted</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Tipe</th>
                <th>Kategori COA</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Detail Audit</th>
                <th>Tindakan / Kontrol</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.length > 0 ? (
                filteredTx.map(t => {
                  const closed = isPeriodClosed(t.date);
                  
                  // Status Color Styles
                  const statusColors = {
                    draft: { bg: 'rgba(156,163,175,0.1)', fg: 'var(--color-text-muted)' },
                    pending: { bg: 'rgba(245,158,11,0.1)', fg: 'var(--color-warning)' },
                    approved: { bg: 'rgba(59,130,246,0.1)', fg: '#3b82f6' },
                    posted: { bg: 'rgba(52,211,153,0.1)', fg: 'var(--color-success)' },
                  };
                  const colorStyle = statusColors[t.status] || statusColors.draft;

                  // Audit details compilation
                  const creatorEmail = state.users.find(u => u.id === t.created_by)?.email || 'demo@sorgum.local';
                  const approverEmail = t.approved_by ? (state.users.find(u => u.id === t.approved_by)?.email || 'manager@sorgum.local') : '';
                  const posterEmail = t.posted_by ? (state.users.find(u => u.id === t.posted_by)?.email || 'manager@sorgum.local') : '';

                  return (
                    <tr key={t.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(t.date)}</td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{t.description}</div>
                        {t.product_sku && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            Barang: {t.product_sku} — Qty: {t.quantity}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ color: t.type === 'Pemasukan' ? 'var(--color-success)' : 'var(--color-primary)', fontWeight: '600' }}>
                          {t.type}
                        </span>
                      </td>
                      <td>{t.category_code}</td>
                      <td style={{ fontWeight: '700' }}>{formatRp(t.nominal)}</td>
                      <td>
                        <span 
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: colorStyle.bg,
                            color: colorStyle.fg,
                          }}
                        >
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span>Pembuat: {creatorEmail}</span>
                          {t.approved_by && <span>Penyetuju: {approverEmail}</span>}
                          {t.posted_by && <span>Poster: {posterEmail}</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {closed ? (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Lock size={12} /> Terkunci (Closed)
                            </span>
                          ) : (
                            <>
                              {t.status === 'draft' && (!isStaff || t.created_by === user?.id) && (
                                <button 
                                  className="btn btn-outline" 
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
                                  onClick={() => handleUpdateStatus(t.id, 'pending')}
                                  disabled={loadingId !== null}
                                >
                                  {loadingId === t.id ? 'Memproses...' : 'Ajukan (Pending)'}
                                </button>
                              )}
                              {t.status === 'pending' && isManagerOrOwner && (
                                <button 
                                  className="btn btn-outline" 
                                  style={{ padding: '4px 8px', fontSize: '11px', borderColor: '#3b82f6', color: '#3b82f6' }}
                                  onClick={() => handleUpdateStatus(t.id, 'approved')}
                                  disabled={loadingId !== null}
                                >
                                  {loadingId === t.id ? 'Memproses...' : 'Setujui (Approve)'}
                                </button>
                              )}
                              {t.status === 'approved' && isManagerOrOwner && (
                                <button 
                                  className="btn btn-outline" 
                                  style={{ padding: '4px 8px', fontSize: '11px', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                                  onClick={() => handleUpdateStatus(t.id, 'posted')}
                                  disabled={loadingId !== null}
                                >
                                  {loadingId === t.id ? 'Memproses...' : 'Posting (Buku Besar)'}
                                </button>
                              )}
                              {t.status === 'posted' && (
                                <span style={{ color: 'var(--color-success)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Check size={14} /> Selesai Dibukukan
                                </span>
                              )}
                              {t.status === 'draft' && isStaff && (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Edit size={12} /> Menunggu Diajukan
                                </span>
                              )}
                              {t.status === 'pending' && isStaff && (
                                <span style={{ color: 'var(--color-warning)', fontSize: '11px' }}>
                                  Menunggu Persetujuan
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                    Belum ada data transaksi yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
