import { useState } from 'react';
import { formatRp } from '../App';
import { Plus, RefreshCw, AlertTriangle, X, Check } from 'lucide-react';

export default function Inventory({ state, actions }) {
  const { inventory, user } = state;
  const { addInventoryItem, adjustStock } = actions;
  const userRole = user?.role || 'staff';
  const isStaff = userRole === 'staff';

  // Modals Visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Add Item Form State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Bahan Baku');
  const [stock, setStock] = useState('0');
  const [unit, setUnit] = useState('kg');
  const [minStock, setMinStock] = useState('10');
  const [unitPrice, setUnitPrice] = useState('0');
  const [costPrice, setCostPrice] = useState('0');
  
  // Adjust Stock Form State
  const [adjustSku, setAdjustSku] = useState('');
  const [adjustType, setAdjustType] = useState('IN'); // 'IN' | 'OUT'
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Error/Success States
  const [modalError, setModalError] = useState('');

  const handleAddItem = async (e) => {
    e.preventDefault();
    setModalError('');

    if (inventory.some(i => i.sku.toLowerCase() === sku.toLowerCase())) {
      setModalError('SKU ini sudah digunakan oleh barang lain.');
      return;
    }

    try {
      await addInventoryItem({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        type,
        stock: Number(stock) || 0,
        unit: unit.trim(),
        min_stock: Number(minStock) || 0,
        unit_price: type === 'Produk Jadi' ? Number(unitPrice) : 0,
        cost_price: Number(costPrice) || 0,
      });

      // Clear & Close
      setSku('');
      setName('');
      setStock('0');
      setMinStock('10');
      setUnitPrice('0');
      setCostPrice('0');
      setShowAddModal(false);
    } catch (err) {
      setModalError(err.message || 'Gagal menambahkan barang.');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!adjustSku) {
      setModalError('Silakan pilih barang terlebih dahulu.');
      return;
    }

    const item = inventory.find(i => i.sku === adjustSku);
    if (!item) {
      setModalError('Barang tidak ditemukan.');
      return;
    }

    if (!adjustQty || Number(adjustQty) <= 0) {
      setModalError('Jumlah kuantitas harus diisi dengan angka positif.');
      return;
    }

    if (!adjustReason.trim()) {
      setModalError('Alasan penyesuaian harus diisi.');
      return;
    }

    const delta = adjustType === 'IN' ? Number(adjustQty) : -Number(adjustQty);

    if (adjustType === 'OUT' && Number(item.stock) < Number(adjustQty)) {
      setModalError('Stok tidak mencukupi untuk pengurangan ini.');
      return;
    }

    try {
      await adjustStock(adjustSku, delta, adjustReason.trim());
      
      // Clear & Close
      setAdjustQty('');
      setAdjustReason('');
      setShowAdjustModal(false);
    } catch (err) {
      setModalError(err.message || 'Gagal menyesuaikan stok.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Gudang & Inventori Barang</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
            Manajemen stok bahan baku produksi dan hasil produk jadi siap jual Sorgumology.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => { setModalError(''); setShowAdjustModal(true); }}
            disabled={isStaff}
            title={isStaff ? "Hanya Owner/Manager yang dapat menyesuaikan stok manual" : ""}
          >
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Penyesuaian Stok
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => { setModalError(''); setShowAddModal(true); }}
            disabled={isStaff}
            title={isStaff ? "Hanya Owner/Manager yang dapat menambahkan barang baru" : ""}
          >
            <Plus size={14} style={{ marginRight: '6px' }} /> Barang Baru
          </button>
        </div>
      </div>

      {/* Bahan Baku Section */}
      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--color-primary-light)', fontSize: '1.1rem' }}>
          🌾 Stok Bahan Baku (Raw Materials)
        </h3>

        <div className="table-responsive">
          <table className="table" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nama Barang</th>
                <th style={{ width: '30%' }}>Level Stok</th>
                <th>Min. Stok</th>
                <th>Harga Pokok (HPP)</th>
                <th>Nilai Asset Persediaan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.filter(i => i.type === 'Bahan Baku').map(item => {
                const isWarning = item.stock <= item.min_stock;
                const ratio = Math.min(100, (item.stock / (item.min_stock * 2 || 1)) * 100);
                const assetVal = item.stock * item.cost_price;

                return (
                  <tr key={item.sku}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.sku}</td>
                    <td>{item.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ minWidth: '70px', fontWeight: '600' }}>
                          {item.stock} {item.unit}
                        </span>
                        <div style={{ flexGrow: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: `${ratio}%`, 
                              background: isWarning ? 'var(--color-danger)' : 'var(--color-success)',
                              borderRadius: '4px'
                            }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td>{item.min_stock} {item.unit}</td>
                    <td>{formatRp(item.cost_price)}</td>
                    <td style={{ fontWeight: '600' }}>{formatRp(assetVal)}</td>
                    <td>
                      {isWarning ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontSize: '11px', fontWeight: 'bold' }}>
                          <AlertTriangle size={14} /> RE-ORDER
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontSize: '11px', fontWeight: 'bold' }}>
                          <Check size={14} /> AMAN
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Produk Jadi Section */}
      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--color-success-light)', fontSize: '1.1rem' }}>
          📦 Stok Produk Jadi (Finished Goods)
        </h3>

        <div className="table-responsive">
          <table className="table" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nama Produk</th>
                <th style={{ width: '30%' }}>Level Stok</th>
                <th>Min. Stok</th>
                <th>Harga Pokok HPP</th>
                <th>Harga Jual (Pouch)</th>
                <th>Nilai Asset Persediaan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.filter(i => i.type === 'Produk Jadi').map(item => {
                const isWarning = item.stock <= item.min_stock;
                const ratio = Math.min(100, (item.stock / (item.min_stock * 2 || 1)) * 100);
                const assetVal = item.stock * item.cost_price;

                return (
                  <tr key={item.sku}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.sku}</td>
                    <td>{item.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ minWidth: '70px', fontWeight: '600' }}>
                          {item.stock} {item.unit}
                        </span>
                        <div style={{ flexGrow: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: `${ratio}%`, 
                              background: isWarning ? 'var(--color-danger)' : 'var(--color-success)',
                              borderRadius: '4px'
                            }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td>{item.min_stock} {item.unit}</td>
                    <td>{formatRp(item.cost_price)}</td>
                    <td style={{ color: 'var(--color-primary-light)', fontWeight: '600' }}>{formatRp(item.unit_price)}</td>
                    <td style={{ fontWeight: '600' }}>{formatRp(assetVal)}</td>
                    <td>
                      {isWarning ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontSize: '11px', fontWeight: 'bold' }}>
                          <AlertTriangle size={14} /> RE-ORDER
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontSize: '11px', fontWeight: 'bold' }}>
                          <Check size={14} /> AMAN
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add New Item */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Daftarkan Barang Baru</h4>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {modalError && <div className="alert alert-danger" style={{ fontSize: '12px' }}>⚠️ {modalError}</div>}

            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Kode SKU</label>
                  <input type="text" placeholder="BB-004 / PJ-003" value={sku} onChange={(e) => setSku(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Tipe Barang</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Bahan Baku">Bahan Baku (Raw Material)</option>
                    <option value="Produk Jadi">Produk Jadi (Finished Good)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Nama Barang</label>
                <input type="text" placeholder="Gula Sorgum Cair" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Stok Awal</label>
                  <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Satuan</label>
                  <input type="text" placeholder="kg / pcs" value={unit} onChange={(e) => setUnit(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Batas Minimum</label>
                  <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Harga Pokok (HPP)</label>
                  <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required />
                </div>
                
                {type === 'Produk Jadi' && (
                  <div className="form-group">
                    <label>Harga Jual (Rp)</label>
                    <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Simpan Inventori</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Adjust Stock */}
      {showAdjustModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Penyesuaian Stok Manual</h4>
              <button onClick={() => setShowAdjustModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {modalError && <div className="alert alert-danger" style={{ fontSize: '12px' }}>⚠️ {modalError}</div>}

            <form onSubmit={handleAdjustStock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Pilih Barang Gudang</label>
                <select value={adjustSku} onChange={(e) => setAdjustSku(e.target.value)}>
                  <option value="">-- Pilih Barang --</option>
                  {inventory.map(i => (
                    <option key={i.sku} value={i.sku}>
                      {i.sku} - {i.name} (Stok: {i.stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Jenis Penyesuaian</label>
                  <select value={adjustType} onChange={(e) => setAdjustType(e.target.value)}>
                    <option value="IN">Stok Masuk (+)</option>
                    <option value="OUT">Stok Keluar (-)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Jumlah Kuantitas</label>
                  <input type="number" min="1" placeholder="10" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Alasan Penyesuaian</label>
                <input type="text" placeholder="Contoh: Barang cacat, barang hilang, dll." value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAdjustModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Simpan Penyesuaian</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
