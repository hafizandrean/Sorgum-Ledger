import { useState, useEffect } from 'react';
import { formatRp, MONTH_NAMES } from '../App';
import { FileSpreadsheet, Printer, CheckCircle, BarChart2, ShieldAlert } from 'lucide-react';

export default function FinancialReports({ state, actions }) {
  const { coa, journalEntries, journalItems, transactions } = state;

  const [activeReport, setActiveReport] = useState(() => localStorage.getItem('sl_sub_tab_reports') || 'labarugi'); // 'labarugi' | 'neracasaldo' | 'neraca'
  
  useEffect(() => {
    if (state.activeTab === 'reports') {
      const storedReport = localStorage.getItem('sl_sub_tab_reports');
      if (storedReport && storedReport !== activeReport) {
        setActiveReport(storedReport);
      }
    }
  }, [state.activeTab]);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [compareMoM, setCompareMoM] = useState(true);

  // ── Accounting Period Helpers ─────────────────────────────────────────────
  const getPostedJournalItems = () => {
    return journalItems.filter(ji => {
      const je = journalEntries.find(e => e.id === ji.journal_entry_id);
      if (!je) return false;
      if (je.transaction_id) {
        const tx = transactions.find(t => t.id === je.transaction_id);
        return tx && tx.status === 'posted';
      }
      return true; // depreciation, period closing, etc.
    });
  };

  const getPriorPeriod = (m, y) => {
    let pm = m - 1;
    let py = y;
    if (pm === 0) {
      pm = 12;
      py = y - 1;
    }
    return { month: pm, year: py };
  };

  const priorPeriod = getPriorPeriod(selectedMonth, selectedYear);

  // ── Calculate Account Balance for specific month/year (Period flow - e.g. for Laba Rugi) ──
  const getAccountPeriodBalance = (code, m, y) => {
    const coaItem = coa.find(c => c.code === code);
    if (!coaItem) return 0;

    const posted = getPostedJournalItems().filter(ji => {
      const je = journalEntries.find(e => e.id === ji.journal_entry_id);
      if (!je || !je.date) return false;
      const parts = je.date.split('-');
      if (parts.length < 2) return false;
      const jeYear = Number(parts[0]);
      const jeMonth = Number(parts[1]);
      return jeMonth === m && jeYear === y;
    });

    const items = posted.filter(ji => ji.account_code === code);
    const debitSum = items.reduce((sum, item) => sum + Number(item.debit || 0), 0);
    const creditSum = items.reduce((sum, item) => sum + Number(item.credit || 0), 0);

    if (coaItem.normal_balance === 'Debit') {
      return debitSum - creditSum;
    } else {
      return creditSum - debitSum;
    }
  };

  // ── Calculate Cumulative Account Balance up to selected month/year (Position - e.g. for Neraca/Neraca Saldo) ──
  const getAccountCumulativeBalance = (code, m, y) => {
    const coaItem = coa.find(c => c.code === code);
    if (!coaItem) return 0;

    const posted = getPostedJournalItems().filter(ji => {
      const je = journalEntries.find(e => e.id === ji.journal_entry_id);
      if (!je || !je.date) return false;
      const parts = je.date.split('-');
      if (parts.length < 2) return false;
      
      const jeYear = Number(parts[0]);
      const jeMonth = Number(parts[1]);

      if (jeYear < y) return true;
      if (jeYear === y && jeMonth <= m) return true;
      return false;
    });

    const items = posted.filter(ji => ji.account_code === code);
    const debitSum = items.reduce((sum, item) => sum + Number(item.debit || 0), 0);
    const creditSum = items.reduce((sum, item) => sum + Number(item.credit || 0), 0);

    if (coaItem.normal_balance === 'Debit') {
      return debitSum - creditSum;
    } else {
      return creditSum - debitSum;
    }
  };

  // ── Calculate Net Income of all Open (unclosed) periods up to selected month/year ──
  const getOpenPeriodNetIncome = (m, y) => {
    const revenues = coa.filter(c => (c.account_class || '').toLowerCase() === 'revenue');
    const expenses = coa.filter(c => (c.account_class || '').toLowerCase() === 'expense');

    const totalRev = revenues.reduce((sum, r) => sum + getAccountCumulativeBalance(r.code, m, y), 0);
    const totalExp = expenses.reduce((sum, e) => sum + getAccountCumulativeBalance(e.code, m, y), 0);

    return totalRev - totalExp;
  };

  // ── Growth Calculator ─────────────────────────────────────────────────────
  const getGrowth = (curr, prev) => {
    if (prev === 0) {
      if (curr === 0) return '0%';
      return curr > 0 ? '+100%' : '-100%';
    }
    const val = ((curr - prev) / Math.abs(prev)) * 100;
    return (val >= 0 ? '+' : '') + val.toFixed(1) + '%';
  };

  // ── Laba Rugi Calculations ────────────────────────────────────────────────
  const getIncomeStatementData = (m, y) => {
    const revenues = coa.filter(c => (c.account_class || '').toLowerCase() === 'revenue');
    const expenses = coa.filter(c => (c.account_class || '').toLowerCase() === 'expense');

    const revList = revenues.map(r => ({ ...r, val: getAccountPeriodBalance(r.code, m, y) }));
    const expList = expenses.map(e => ({ ...e, val: getAccountPeriodBalance(e.code, m, y) }));

    const totalRev = revList.reduce((sum, r) => sum + r.val, 0);
    const totalExp = expList.reduce((sum, e) => sum + e.val, 0);

    return { revList, expList, totalRev, totalExp, netIncome: totalRev - totalExp };
  };

  const currIS = getIncomeStatementData(selectedMonth, selectedYear);
  const priorIS = getIncomeStatementData(priorPeriod.month, priorPeriod.year);

  // ── Neraca Saldo Calculations ─────────────────────────────────────────────
  const getTrialBalanceData = (m, y) => {
    const list = coa.map(c => {
      const bal = getAccountCumulativeBalance(c.code, m, y);
      return {
        ...c,
        debit: c.normal_balance === 'Debit' ? Math.max(0, bal) : Math.max(0, -bal),
        credit: c.normal_balance === 'Credit' ? Math.max(0, bal) : Math.max(0, -bal),
      };
    });
    const totalDeb = list.reduce((sum, c) => sum + c.debit, 0);
    const totalCred = list.reduce((sum, c) => sum + c.credit, 0);
    return { list, totalDeb, totalCred, balanced: Math.abs(totalDeb - totalCred) < 0.01 };
  };

  const currTB = getTrialBalanceData(selectedMonth, selectedYear);

  // ── Neraca Calculations ───────────────────────────────────────────────────
  const getBalanceSheetData = (m, y, netIncomeFromIS) => {
    // 1. Current Assets
    const currentAssetsList = coa
      .filter(c => c.account_class === 'asset' && (c.sub_classification === 'Current Asset' || c.sub_classification === 'Tax'))
      .map(c => ({
        code: c.code,
        name: c.name,
        val: getAccountCumulativeBalance(c.code, m, y)
      }));
    const totalCurrentAssets = currentAssetsList.reduce((sum, a) => sum + a.val, 0);

    // 2. Fixed Assets
    const fixedAssetsList = coa.filter(c => c.account_class === 'asset' && c.sub_classification === 'Fixed Asset');
    const fixedAssetVal = fixedAssetsList.reduce((sum, a) => sum + getAccountCumulativeBalance(a.code, m, y), 0);

    // 3. Contra Assets (Accumulated Depreciation)
    const contraAssetsList = coa.filter(c => c.account_class === 'asset' && c.sub_classification === 'Contra Asset');
    const accumDepVal = contraAssetsList.reduce((sum, a) => sum + getAccountCumulativeBalance(a.code, m, y), 0);

    const bookValue = fixedAssetVal - accumDepVal;
    const totalAssets = totalCurrentAssets + bookValue;

    // 4. Liabilities
    const liabilitiesList = coa
      .filter(c => c.account_class === 'liability')
      .map(c => ({
        code: c.code,
        name: c.name,
        val: getAccountCumulativeBalance(c.code, m, y)
      }));
    const totalLiabilities = liabilitiesList.reduce((sum, l) => sum + l.val, 0);

    // 5. Equity
    const retainedEarningsCode = coa.find(c => c.system_role === 'default_retained_earnings')?.code || '3020';
    const retainedEarningsVal = getAccountCumulativeBalance(retainedEarningsCode, m, y);
    const currentNetIncomeVal = netIncomeFromIS - retainedEarningsVal;

    const equityList = coa
      .filter(c => c.account_class === 'equity' && c.system_role !== 'default_retained_earnings' && c.system_role !== 'default_income_summary')
      .map(c => ({
        code: c.code,
        name: c.name,
        val: getAccountCumulativeBalance(c.code, m, y)
      }));
    const ownerEquityVal = equityList.reduce((sum, e) => sum + e.val, 0);

    const totalEquity = ownerEquityVal + retainedEarningsVal + currentNetIncomeVal;

    return {
      currentAssetsList,
      totalCurrentAssets,
      fixedAssetVal,
      accumDepVal,
      bookValue,
      totalAssets,
      liabilitiesList,
      totalLiabilities,
      ownerEquityVal,
      equityList,
      retainedEarningsVal,
      currentNetIncomeVal,
      totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    };
  };

  const currBS = getBalanceSheetData(selectedMonth, selectedYear, getOpenPeriodNetIncome(selectedMonth, selectedYear));
  const priorBS = getBalanceSheetData(priorPeriod.month, priorPeriod.year, getOpenPeriodNetIncome(priorPeriod.month, priorPeriod.year));

  // ── CSV Export Handler ────────────────────────────────────────────────────
  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    const periodName = `${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}`;

    if (activeReport === 'labarugi') {
      csvContent += 'LAPORAN LABA RUGI\n';
      csvContent += `Periode: ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}\n\n`;
      csvContent += 'Kategori,Kode Akun,Nama Akun,Saldo Terkini,Saldo Sebelumnya,Pertumbuhan\n';
      
      csvContent += 'PENDAPATAN\n';
      currIS.revList.forEach((r, i) => {
        const pr = priorIS.revList[i];
        csvContent += `Pendapatan,${r.code},${r.name},${r.val},${pr?.val || 0},"${getGrowth(r.val, pr?.val || 0)}"\n`;
      });
      csvContent += `Total Pendapatan,,,${currIS.totalRev},${priorIS.totalRev},"${getGrowth(currIS.totalRev, priorIS.totalRev)}"\n\n`;

      csvContent += 'BEBAN OPERASIONAL\n';
      currIS.expList.forEach((e, i) => {
        const pe = priorIS.expList[i];
        csvContent += `Beban,${e.code},${e.name},${e.val},${pe?.val || 0},"${getGrowth(e.val, pe?.val || 0)}"\n`;
      });
      csvContent += `Total Beban,,,${currIS.totalExp},${priorIS.totalExp},"${getGrowth(currIS.totalExp, priorIS.totalExp)}"\n\n`;
      csvContent += `LABA BERSIH,,,${currIS.netIncome},${priorIS.netIncome},"${getGrowth(currIS.netIncome, priorIS.netIncome)}"\n`;

    } else if (activeReport === 'neracasaldo') {
      csvContent += 'LAPORAN NERACA SALDO\n';
      csvContent += `Periode: ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}\n\n`;
      csvContent += 'Kode Akun,Nama Akun,Klasifikasi,Debit,Kredit\n';
      currTB.list.forEach(c => {
        csvContent += `${c.code},${c.name},${c.sub_classification},${c.debit},${c.credit}\n`;
      });
      csvContent += `TOTAL,,,${currTB.totalDeb},${currTB.totalCred}\n`;

    } else if (activeReport === 'neraca') {
      csvContent += 'LAPORAN NERACA\n';
      csvContent += `Periode: ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}\n\n`;
      csvContent += 'Sisi,Akun/Keterangan,Nilai Terkini,Nilai Sebelumnya,Pertumbuhan\n';
      
      csvContent += 'ASET LANCAR\n';
      currBS.currentAssetsList.forEach((a, i) => {
        const pa = priorBS?.currentAssetsList?.[i];
        csvContent += `Aset Lancar,${a.name},${a.val},${pa?.val || 0},"${getGrowth(a.val, pa?.val || 0)}"\n`;
      });
      csvContent += `Total Aset Lancar,,${currBS.totalCurrentAssets},${priorBS.totalCurrentAssets},"${getGrowth(currBS.totalCurrentAssets, priorBS.totalCurrentAssets)}"\n\n`;

      csvContent += 'ASET TETAP\n';
      csvContent += `Aset Tetap,Nilai Aset Tetap,${currBS.fixedAssetVal},${priorBS.fixedAssetVal},"${getGrowth(currBS.fixedAssetVal, priorBS.fixedAssetVal)}"\n`;
      csvContent += `Aset Tetap,Akumulasi Penyusutan,${-currBS.accumDepVal},${-priorBS.accumDepVal},"${getGrowth(-currBS.accumDepVal, -priorBS.accumDepVal)}"\n`;
      csvContent += `Nilai Buku Aset,,${currBS.bookValue},${priorBS.bookValue},"${getGrowth(currBS.bookValue, priorBS.bookValue)}"\n`;
      csvContent += `TOTAL ASET,,${currBS.totalAssets},${priorBS.totalAssets},"${getGrowth(currBS.totalAssets, priorBS.totalAssets)}"\n\n`;

      csvContent += 'LIABILITAS\n';
      currBS.liabilitiesList.forEach((l, i) => {
        const pl = priorBS?.liabilitiesList?.[i];
        csvContent += `Liabilitas,${l.name},${l.val},${pl?.val || 0},"${getGrowth(l.val, pl?.val || 0)}"\n`;
      });
      csvContent += `Total Liabilitas,,${currBS.totalLiabilities},${priorBS.totalLiabilities},"${getGrowth(currBS.totalLiabilities, priorBS.totalLiabilities)}"\n\n`;

      csvContent += 'EKUITAS\n';
      currBS.equityList.forEach((e, i) => {
        const pe = priorBS?.equityList?.[i];
        csvContent += `Ekuitas,${e.name},${e.val},${pe?.val || 0},"${getGrowth(e.val, pe?.val || 0)}"\n`;
      });
      csvContent += `Ekuitas,Saldo Laba ditahan,${currBS.retainedEarningsVal},${priorBS.retainedEarningsVal},"${getGrowth(currBS.retainedEarningsVal, priorBS.retainedEarningsVal)}"\n`;
      csvContent += `Ekuitas,Laba Periode Berjalan,${currBS.currentNetIncomeVal},${priorBS.currentNetIncomeVal},"${getGrowth(currBS.currentNetIncomeVal, priorBS.currentNetIncomeVal)}"\n`;
      csvContent += `Total Ekuitas,,${currBS.totalEquity},${priorBS.totalEquity},"${getGrowth(currBS.totalEquity, priorBS.totalEquity)}"\n`;
      csvContent += `TOTAL PASIVA,,${currBS.totalLiabilities + currBS.totalEquity},${priorBS.totalLiabilities + priorBS.totalEquity},"${getGrowth(currBS.totalLiabilities + currBS.totalEquity, priorBS.totalLiabilities + priorBS.totalEquity)}"\n`;
    }

    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_${activeReport.toUpperCase()}_${periodName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Filters Header (Hidden on print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Laporan Keuangan UMKM</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
            Pantau performa usaha dengan Laba Rugi, Neraca Saldo, dan Neraca terintegrasi MoM.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={{ fontSize: '13px', padding: '6px 8px' }}>
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>

            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ fontSize: '13px', padding: '6px 8px' }}>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text)', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <input type="checkbox" checked={compareMoM} onChange={(e) => setCompareMoM(e.target.checked)} />
            Bandingkan MoM
          </label>

          <button className="btn btn-outline" onClick={exportToCSV} style={{ padding: '6px 12px', fontSize: '13px' }}>
            <FileSpreadsheet size={14} style={{ marginRight: '6px' }} /> Ekspor CSV
          </button>

          <button className="btn btn-primary" onClick={() => window.print()} style={{ padding: '6px 12px', fontSize: '13px' }}>
            <Printer size={14} style={{ marginRight: '6px' }} /> Cetak PDF
          </button>
        </div>
      </div>

      {/* Tabs Selector (Hidden on print) */}
      <div className="tab-group no-print" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <button className={`tab-btn ${activeReport === 'labarugi' ? 'active' : ''}`} onClick={() => { setActiveReport('labarugi'); localStorage.setItem('sl_sub_tab_reports', 'labarugi'); }}>
          Laporan Laba Rugi
        </button>
        <button className={`tab-btn ${activeReport === 'neracasaldo' ? 'active' : ''}`} onClick={() => { setActiveReport('neracasaldo'); localStorage.setItem('sl_sub_tab_reports', 'neracasaldo'); }}>
          Neraca Saldo
        </button>
        <button className={`tab-btn ${activeReport === 'neraca' ? 'active' : ''}`} onClick={() => { setActiveReport('neraca'); localStorage.setItem('sl_sub_tab_reports', 'neraca'); }}>
          Neraca Keuangan
        </button>
      </div>

      {/* ── Print Header (Only visible on print) ── */}
      <div className="print-only" style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '24px' }}>Sorgumology</h1>
        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '18px' }}>
          {activeReport === 'labarugi' && 'LAPORAN LABA RUGI'}
          {activeReport === 'neracasaldo' && 'LAPORAN NERACA SALDO'}
          {activeReport === 'neraca' && 'LAPORAN NERACA'}
        </h2>
        <p style={{ margin: 0, fontSize: '12px' }}>
          Periode Bulan: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </p>
      </div>

      {/* ── REPORT CONTENT ── */}
      <div className="print-section">
        {activeReport === 'labarugi' && (
          /* ──────────────── LABA RUGI REPORT ──────────────── */
          <div className="card glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Laporan Laba Rugi</h3>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear} {compareMoM && `vs ${MONTH_NAMES[priorPeriod.month - 1]} ${priorPeriod.year}`}
              </span>
            </div>

            <table className="table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Keterangan Rekening</th>
                  <th style={{ width: '15%' }}>Kode Akun</th>
                  <th style={{ textAlign: 'right', width: '22%' }}>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</th>
                  {compareMoM && (
                    <>
                      <th style={{ textAlign: 'right', width: '22%' }}>{MONTH_NAMES[priorPeriod.month - 1]} {priorPeriod.year}</th>
                      <th style={{ textAlign: 'right', width: '12%' }}>Pertumbuhan</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* 1. Revenues */}
                <tr style={{ fontWeight: 'bold', background: 'rgba(255,255,255,0.01)' }}>
                  <td colSpan={compareMoM ? 5 : 3}>PENDAPATAN OPERASIONAL</td>
                </tr>
                {currIS.revList.map((r, i) => {
                  const pr = priorIS.revList[i];
                  return (
                    <tr key={r.code}>
                      <td style={{ paddingLeft: '1.5rem' }}>{r.name}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{r.code}</td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatRp(r.val)}</td>
                      {compareMoM && (
                        <>
                          <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>{formatRp(pr?.val || 0)}</td>
                          <td style={{ textAlign: 'right', color: r.val >= (pr?.val || 0) ? 'var(--color-success-light)' : 'var(--color-danger-light)', fontWeight: '600' }}>
                            {getGrowth(r.val, pr?.val || 0)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ paddingLeft: '1rem' }}>TOTAL PENDAPATAN</td>
                  <td></td>
                  <td style={{ textAlign: 'right', color: 'var(--color-success-light)' }}>{formatRp(currIS.totalRev)}</td>
                  {compareMoM && (
                    <>
                      <td style={{ textAlign: 'right' }}>{formatRp(priorIS.totalRev)}</td>
                      <td style={{ textAlign: 'right', color: currIS.totalRev >= priorIS.totalRev ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {getGrowth(currIS.totalRev, priorIS.totalRev)}
                      </td>
                    </>
                  )}
                </tr>

                <tr style={{ height: '15px', border: 'none' }}><td colSpan={compareMoM ? 5 : 3}></td></tr>

                {/* 2. Expenses */}
                <tr style={{ fontWeight: 'bold', background: 'rgba(255,255,255,0.01)' }}>
                  <td colSpan={compareMoM ? 5 : 3}>BEBAN OPERASIONAL & HPP</td>
                </tr>
                {currIS.expList.map((e, i) => {
                  const pe = priorIS.expList[i];
                  return (
                    <tr key={e.code}>
                      <td style={{ paddingLeft: '1.5rem' }}>{e.name}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{e.code}</td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatRp(e.val)}</td>
                      {compareMoM && (
                        <>
                          <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>{formatRp(pe?.val || 0)}</td>
                          <td style={{ textAlign: 'right', color: e.val <= (pe?.val || 0) ? 'var(--color-success-light)' : 'var(--color-danger-light)', fontWeight: '600' }}>
                            {getGrowth(e.val, pe?.val || 0)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ paddingLeft: '1rem' }}>TOTAL BEBAN OPERASIONAL</td>
                  <td></td>
                  <td style={{ textAlign: 'right', color: 'var(--color-primary-light)' }}>{formatRp(currIS.totalExp)}</td>
                  {compareMoM && (
                    <>
                      <td style={{ textAlign: 'right' }}>{formatRp(priorIS.totalExp)}</td>
                      <td style={{ textAlign: 'right', color: currIS.totalExp <= priorIS.totalExp ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {getGrowth(currIS.totalExp, priorIS.totalExp)}
                      </td>
                    </>
                  )}
                </tr>

                <tr style={{ height: '20px', border: 'none' }}><td colSpan={compareMoM ? 5 : 3}></td></tr>

                {/* 3. Net Income */}
                <tr style={{ fontWeight: '800', background: 'rgba(255,255,255,0.03)', fontSize: '14px', borderTop: '2px solid rgba(255,255,255,0.15)' }}>
                  <td>LABA (RUGI) BERSIH</td>
                  <td></td>
                  <td style={{ textAlign: 'right', color: currIS.netIncome >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {formatRp(currIS.netIncome)}
                  </td>
                  {compareMoM && (
                    <>
                      <td style={{ textAlign: 'right', color: priorIS.netIncome >= 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)' }}>
                        {formatRp(priorIS.netIncome)}
                      </td>
                      <td style={{ textAlign: 'right', color: currIS.netIncome >= priorIS.netIncome ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {getGrowth(currIS.netIncome, priorIS.netIncome)}
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'neracasaldo' && (
          /* ──────────────── NERACA SALDO REPORT ──────────────── */
          <div className="card glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Laporan Neraca Saldo</h3>
              {currTB.balanced ? (
                <span className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontSize: '12px', fontWeight: 'bold' }}>
                  <CheckCircle size={16} /> Saldo Seimbang (Balanced)
                </span>
              ) : (
                <span className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 'bold' }}>
                  <ShieldAlert size={16} /> Saldo Tidak Seimbang
                </span>
              )}
            </div>

            <table className="table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Kode Akun</th>
                  <th style={{ width: '40%' }}>Nama Akun Perkiraan</th>
                  <th style={{ width: '25%' }}>Klasifikasi Akun</th>
                  <th style={{ textAlign: 'right', width: '20%' }}>Debit (Dr)</th>
                  <th style={{ textAlign: 'right', width: '20%' }}>Kredit (Cr)</th>
                </tr>
              </thead>
              <tbody>
                {currTB.list.map(c => {
                  if (c.debit === 0 && c.credit === 0) return null; // hide accounts with no transactions this period
                  return (
                    <tr key={c.code}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{c.code}</td>
                      <td>{c.name}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{c.sub_classification}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-success-light)' }}>
                        {c.debit > 0 ? formatRp(c.debit) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--color-primary-light)' }}>
                        {c.credit > 0 ? formatRp(c.credit) : '-'}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: '800', background: 'rgba(255,255,255,0.03)', fontSize: '14px', borderTop: '2px solid rgba(255,255,255,0.15)' }}>
                  <td colSpan="3">TOTAL NERACA SALDO</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>{formatRp(currTB.totalDeb)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-primary)' }}>{formatRp(currTB.totalCred)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'neraca' && (
          /* ──────────────── NERACA REPORT ──────────────── */
          <div className="card glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Laporan Posisi Keuangan (Neraca)</h3>
              {currBS.balanced ? (
                <span className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontSize: '12px', fontWeight: 'bold' }}>
                  <CheckCircle size={16} /> Neraca Seimbang
                </span>
              ) : (
                <span className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 'bold' }}>
                  <ShieldAlert size={16} /> Neraca Tidak Seimbang
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* SISI AKTIVA (ASSETS) */}
              <div>
                <h4 style={{ color: 'var(--color-success-light)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', margin: '0 0 1rem 0' }}>
                  AKTIVA (ASET)
                </h4>
                <table className="table" style={{ fontSize: '12.5px' }}>
                  <thead>
                    <tr>
                      <th>Nama Perkiraan</th>
                      <th style={{ textAlign: 'right' }}>Nilai (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ fontWeight: '600', fontStyle: 'italic' }}>
                      <td colSpan="2">Aset Lancar</td>
                    </tr>
                    {currBS.currentAssetsList.map(a => (
                      <tr key={a.code}>
                        <td style={{ paddingLeft: '1rem' }}>{a.name} ({a.code})</td>
                        <td style={{ textAlign: 'right' }}>{formatRp(a.val)}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: '700', background: 'rgba(255,255,255,0.01)' }}>
                      <td style={{ paddingLeft: '0.5rem' }}>Total Aset Lancar</td>
                      <td style={{ textAlign: 'right' }}>{formatRp(currBS.totalCurrentAssets)}</td>
                    </tr>

                    <tr style={{ height: '8px', border: 'none' }}><td colSpan="2"></td></tr>

                    <tr style={{ fontWeight: '600', fontStyle: 'italic' }}>
                      <td colSpan="2">Aset Tetap</td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '1rem' }}>Nilai Aset Tetap</td>
                      <td style={{ textAlign: 'right' }}>{formatRp(currBS.fixedAssetVal)}</td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '1rem' }}>Akumulasi Penyusutan</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-danger-light)' }}>
                        -{formatRp(currBS.accumDepVal)}
                      </td>
                    </tr>
                    <tr style={{ fontWeight: '700', background: 'rgba(255,255,255,0.01)' }}>
                      <td style={{ paddingLeft: '0.5rem' }}>Nilai Buku Bersih</td>
                      <td style={{ textAlign: 'right' }}>{formatRp(currBS.bookValue)}</td>
                    </tr>

                    <tr style={{ height: '12px', border: 'none' }}><td colSpan="2"></td></tr>

                    <tr style={{ fontWeight: '800', background: 'rgba(52,211,153,0.05)', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                      <td>TOTAL ASET (AKTIVA)</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>{formatRp(currBS.totalAssets)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SISI PASIVA (LIABILITIES & EQUITY) */}
              <div>
                <h4 style={{ color: 'var(--color-primary-light)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', margin: '0 0 1rem 0' }}>
                  PASIVA (KEWAJIBAN & EKUITAS)
                </h4>
                <table className="table" style={{ fontSize: '12.5px' }}>
                  <thead>
                    <tr>
                      <th>Nama Perkiraan</th>
                      <th style={{ textAlign: 'right' }}>Nilai (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ fontWeight: '600', fontStyle: 'italic' }}>
                      <td colSpan="2">Liabilitas (Kewajiban)</td>
                    </tr>
                    {currBS.liabilitiesList.map(l => (
                      <tr key={l.code}>
                        <td style={{ paddingLeft: '1rem' }}>{l.name} ({l.code})</td>
                        <td style={{ textAlign: 'right' }}>{formatRp(l.val)}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: '700', background: 'rgba(255,255,255,0.01)' }}>
                      <td style={{ paddingLeft: '0.5rem' }}>Total Kewajiban Lancar</td>
                      <td style={{ textAlign: 'right' }}>{formatRp(currBS.totalLiabilities)}</td>
                    </tr>

                    <tr style={{ height: '8px', border: 'none' }}><td colSpan="2"></td></tr>

                    <tr style={{ fontWeight: '600', fontStyle: 'italic' }}>
                      <td colSpan="2">Ekuitas (Modal)</td>
                    </tr>
                    {currBS.equityList.map(e => (
                      <tr key={e.code}>
                        <td style={{ paddingLeft: '1rem' }}>{e.name} ({e.code})</td>
                        <td style={{ textAlign: 'right' }}>{formatRp(e.val)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ paddingLeft: '1rem' }}>Saldo Laba Ditahan</td>
                      <td style={{ textAlign: 'right' }}>{formatRp(currBS.retainedEarningsVal)}</td>
                    </tr>
                    <tr>
                      <td style={{ paddingLeft: '1rem', fontStyle: 'italic' }}>Laba Bersih Periode Berjalan</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-success-light)' }}>
                        {formatRp(currBS.currentNetIncomeVal)}
                      </td>
                    </tr>
                    <tr style={{ fontWeight: '700', background: 'rgba(255,255,255,0.01)' }}>
                      <td style={{ paddingLeft: '0.5rem' }}>Total Ekuitas</td>
                      <td style={{ textAlign: 'right' }}>{formatRp(currBS.totalEquity)}</td>
                    </tr>

                    <tr style={{ height: '12px', border: 'none' }}><td colSpan="2"></td></tr>

                    <tr style={{ fontWeight: '800', background: 'rgba(96,165,250,0.05)', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                      <td>TOTAL KEWAJIBAN & EKUITAS</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-primary)' }}>
                        {formatRp(currBS.totalLiabilities + currBS.totalEquity)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
