import { formatRp, MONTH_NAMES, getCoaByRole } from '../App';
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, ShoppingBag, Landmark, ShieldAlert, CheckCircle } from 'lucide-react';

export default function Dashboard({ state, actions }) {
  // Helpers
  const getPostedJournalItems = () => {
    return state.journalItems.filter(ji => {
      const je = state.journalEntries.find(e => e.id === ji.journal_entry_id);
      if (!je) return false;
      if (je.transaction_id) {
        const tx = state.transactions.find(t => t.id === je.transaction_id);
        return tx && tx.status === 'posted';
      }
      return true; // depreciation, period closing, etc.
    });
  };

  const getAccountBalance = (code) => {
    const coaItem = state.coa.find(c => c.code === code);
    const items = getPostedJournalItems().filter(ji => ji.account_code === code);
    const debitSum = items.reduce((sum, item) => sum + Number(item.debit || 0), 0);
    const creditSum = items.reduce((sum, item) => sum + Number(item.credit || 0), 0);
    if (!coaItem) return debitSum - creditSum;
    return coaItem.normal_balance === 'Debit' ? (debitSum - creditSum) : (creditSum - debitSum);
  };

  // ── Calculate KPIs ────────────────────────────────────────────────────────
  const salesPrimaryCode = getCoaByRole(state.coa, 'default_sales_account');
  const cashPrimaryCode = getCoaByRole(state.coa, 'default_cash_account') || '1010';

  // 1. Total Penjualan (Posted)
  const totalSales = state.transactions
    .filter(t => t.type === 'Pemasukan' && t.category_code === salesPrimaryCode && t.status === 'posted')
    .reduce((sum, t) => sum + Number(t.nominal || 0), 0);

  // 2. Total Pengeluaran (Posted)
  const totalExpensesTx = state.transactions
    .filter(t => t.type === 'Pengeluaran' && t.status === 'posted')
    .reduce((sum, t) => sum + Number(t.nominal || 0), 0);

  // 3. Laba/Rugi Bersih (from COA Classification)
  const postedItems = getPostedJournalItems();
  let totalRevenue = 0;
  let totalExpense = 0;
  postedItems.forEach(ji => {
    const coaItem = state.coa.find(c => c.code === ji.account_code);
    if (!coaItem) return;
    const cls = (coaItem.account_class || '').toLowerCase();
    if (cls === 'revenue') {
      totalRevenue += (ji.credit - ji.debit);
    } else if (cls === 'expense') {
      totalExpense += (ji.debit - ji.credit);
    }
  });
  const netProfit = totalRevenue - totalExpense;

  // 4. Saldo Kas
  const cashBalance = getAccountBalance(cashPrimaryCode);

  // 5. Working Capital (Modal Kerja) = Current Assets - Current Liabilities
  // Sum dynamically using sub_classification
  const currentAssets = state.coa
    .filter(c => c.sub_classification === 'Current Asset')
    .reduce((sum, c) => sum + getAccountBalance(c.code), 0);
  const currentLiabilities = state.coa
    .filter(c => c.sub_classification === 'Current Liability')
    .reduce((sum, c) => sum + getAccountBalance(c.code), 0);
  const workingCapital = currentAssets - currentLiabilities;

  // ── Low Stock Items ───────────────────────────────────────────────────────
  const lowStockItems = state.inventory.filter(item => item.stock <= item.min_stock);

  // ── Prepare MoM Chart Data ────────────────────────────────────────────────
  const getMonthlyData = () => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      data.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        name: MONTH_NAMES[d.getMonth()].slice(0, 3) + ' ' + String(d.getFullYear()).slice(-2),
        income: 0,
        expense: 0,
      });
    }

    postedItems.forEach(ji => {
      const je = state.journalEntries.find(e => e.id === ji.journal_entry_id);
      if (!je || !je.date) return;
      const parts = je.date.split('-');
      if (parts.length < 2) return;
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const bucket = data.find(b => b.month === m && b.year === y);
      if (bucket) {
        const coaItem = state.coa.find(c => c.code === ji.account_code);
        if (coaItem) {
          const cls = (coaItem.account_class || '').toLowerCase();
          if (cls === 'revenue') {
             bucket.income += (ji.credit - ji.debit);
          } else if (cls === 'expense') {
             bucket.expense += (ji.debit - ji.credit);
          }
        }
      }
    });
    return data;
  };

  const chartData = getMonthlyData();
  const maxVal = Math.max(...chartData.flatMap(d => [d.income, d.expense, 1000000]));

  // SVG dimensions
  const svgW = 600;
  const svgH = 220;
  const padding = 40;
  const graphH = svgH - padding * 2;
  const graphW = svgW - padding * 2;
  const barWidth = 15;
  const gap = 30;

  return (
    <div className="dashboard-view" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ margin: 0 }}>Dashboard Keuangan</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
          Selamat datang di panel SorgumLedger. Berikut adalah ringkasan finansial Sorgumology.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Total Sales */}
        <div className="kpi-card glass-panel" onClick={() => actions.setActiveTab('reports', 'labarugi')} style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease' }}>
          <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Penjualan Produk</span>
            <span style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(52,211,153,0.1)', color: 'var(--color-success)', display: 'flex' }}>
              <ShoppingBag size={18} />
            </span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>{formatRp(totalSales)}</h3>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Akumulasi transaksi disetujui & diposting</span>
        </div>

        {/* Card 2: Laba Rugi */}
        <div className="kpi-card glass-panel" onClick={() => actions.setActiveTab('reports', 'labarugi')} style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
          <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Laba (Rugi) Bersih</span>
            <span style={{ 
              padding: '0.5rem', 
              borderRadius: '8px', 
              background: netProfit >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', 
              color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', 
              display: 'flex' 
            }}>
              {netProfit >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            </span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {formatRp(netProfit)}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Pemasukan bersih setelah dikurangi HPP & beban</span>
        </div>

        {/* Card 3: Saldo Kas */}
        <div className="kpi-card glass-panel" onClick={() => actions.setActiveTab('journal', 'ledger', { account: cashPrimaryCode })} style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
          <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Saldo Kas & Setara</span>
            <span style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(96,165,250,0.1)', color: 'var(--color-primary)', display: 'flex' }}>
              <Wallet size={18} />
            </span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>{formatRp(cashBalance)}</h3>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Kas tersedia ({cashPrimaryCode}) saat ini</span>
        </div>

        {/* Card 4: Modal Kerja (Working Capital) */}
        <div className="kpi-card glass-panel" onClick={() => actions.setActiveTab('reports', 'neraca')} style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
          <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Modal Kerja (Working Cap.)</span>
            <span style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex' }}>
              <Landmark size={18} />
            </span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: workingCapital >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
            {formatRp(workingCapital)}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Aset Lancar - Liabilitas Lancar</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Chart Card */}
        <div className="card glass-panel dashboard-clickable-card" onClick={() => actions.setActiveTab('reports', 'labarugi')} style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: 0 }}>Grafik Arus Kinerja MoM</h4>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--color-success)', borderRadius: '3px', display: 'inline-block' }}></span>
                <span>Pendapatan</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--color-danger)', borderRadius: '3px', display: 'inline-block' }}></span>
                <span>Beban Operasional</span>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
            <svg width={svgW} height={svgH} style={{ overflow: 'visible' }}>
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                const y = padding + graphH * (1 - r);
                return (
                  <g key={i}>
                    <line x1={padding} y1={y} x2={svgW - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <text x={padding - 8} y={y + 4} fill="var(--color-text-muted)" fontSize="9px" textAnchor="end">
                      {formatRp(maxVal * r).replace('Rp ', '')}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {chartData.map((d, index) => {
                const groupWidth = barWidth * 2 + 10;
                const totalGroupGap = (graphW - groupWidth * chartData.length) / (chartData.length - 1);
                const x = padding + index * (groupWidth + totalGroupGap);

                const incHeight = (d.income / maxVal) * graphH;
                const expHeight = (d.expense / maxVal) * graphH;

                const incY = padding + graphH - incHeight;
                const expY = padding + graphH - expHeight;

                return (
                  <g key={index}>
                    {/* Income Bar */}
                    <rect
                      x={x}
                      y={incY}
                      width={barWidth}
                      height={incHeight}
                      fill="var(--color-success)"
                      opacity="0.85"
                      rx="3"
                    />
                    {/* Expense Bar */}
                    <rect
                      x={x + barWidth + 5}
                      y={expY}
                      width={barWidth}
                      height={expHeight}
                      fill="var(--color-danger)"
                      opacity="0.85"
                      rx="3"
                    />
                    {/* Month Label */}
                    <text x={x + barWidth} y={svgH - padding + 16} fill="var(--color-text)" fontSize="10px" textAnchor="middle">
                      {d.name}
                    </text>
                  </g>
                );
              })}

              {/* Base line */}
              <line x1={padding} y1={svgH - padding} x2={svgW - padding} y2={svgH - padding} stroke="rgba(255,255,255,0.15)" />
            </svg>
          </div>
        </div>

        {/* Alerts & Stock Card */}
        <div className="card glass-panel dashboard-clickable-card" onClick={() => actions.setActiveTab('inventory')} style={{ padding: '1.5rem', minHeight: '272px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
          <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} />
            Peringatan Stok & Info
          </h4>

          {lowStockItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="alert alert-warning" style={{ margin: 0, padding: '0.75rem', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                <span>Ada {lowStockItems.length} barang di bawah stok minimum!</span>
              </div>
              <div className="table-responsive" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <table className="table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Nama Barang</th>
                      <th>Stok</th>
                      <th>Min</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map(item => (
                      <tr key={item.sku}>
                        <td>{item.name}</td>
                        <td style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>{item.stock} {item.unit}</td>
                        <td>{item.min_stock} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '170px', gap: '0.75rem' }}>
              <CheckCircle size={40} style={{ color: 'var(--color-success)' }} />
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-success)' }}>Semua Stok Aman!</span>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', margin: '0 1rem' }}>
                Jumlah stok semua bahan baku dan produk jadi berada di atas batas minimum.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
