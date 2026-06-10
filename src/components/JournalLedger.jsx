import { useState, Fragment, useEffect } from 'react';
import { formatRp, formatDate, getCoaByRole } from '../App';
import { Book, Columns } from 'lucide-react';

export default function JournalLedger({ state, actions }) {
  const { coa, journalEntries, journalItems, transactions } = state;
  const [activeSubTab, setActiveSubTab] = useState(() => localStorage.getItem('sl_sub_tab_journal') || 'journal'); // 'journal' | 'ledger'
  
  // State for Ledger account selection
  const [selectedAccount, setSelectedAccount] = useState(() => localStorage.getItem('sl_selected_account_journal') || ''); // default lazy Kas

  useEffect(() => {
    if (!selectedAccount && coa.length > 0) {
      const cashCode = getCoaByRole(coa, 'default_cash_account') || coa[0]?.code || '1010';
      setSelectedAccount(cashCode);
    }
  }, [coa, selectedAccount]);

  useEffect(() => {
    if (state.activeTab === 'journal') {
      const storedSubTab = localStorage.getItem('sl_sub_tab_journal');
      const storedAccount = localStorage.getItem('sl_selected_account_journal');
      if (storedSubTab && storedSubTab !== activeSubTab) {
        setActiveSubTab(storedSubTab);
      }
      if (storedAccount && storedAccount !== selectedAccount) {
        setSelectedAccount(storedAccount);
      }
    }
  }, [state.activeTab]);

  // Filter posted journal entries only
  const getPostedEntries = () => {
    return journalEntries.filter(je => {
      if (je.transaction_id) {
        const tx = transactions.find(t => t.id === je.transaction_id);
        return tx && tx.status === 'posted';
      }
      return true; // depreciation or period closing
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const postedEntries = getPostedEntries();
  const postedJeIds = new Set(postedEntries.map(e => e.id));
  
  // Filter journal items belonging to posted entries
  const postedItems = journalItems.filter(ji => postedJeIds.has(ji.journal_entry_id));

  // Get account details
  const currentCoa = coa.find(c => c.code === selectedAccount) || coa[0];

  // Calculate Ledger details
  const getLedgerRows = () => {
    if (!currentCoa) return [];
    
    // Filter items for this account
    const items = postedItems.filter(ji => ji.account_code === selectedAccount);
    
    // Sort items chronologically (ascending) for running balance
    const sorted = [...items].sort((a, b) => {
      const jeA = journalEntries.find(e => e.id === a.journal_entry_id);
      const jeB = journalEntries.find(e => e.id === b.journal_entry_id);
      return new Date(jeA?.date) - new Date(jeB?.date);
    });

    let balance = 0;
    return sorted.map(item => {
      const je = journalEntries.find(e => e.id === item.journal_entry_id);
      const deb = Number(item.debit || 0);
      const cred = Number(item.credit || 0);
      
      if (currentCoa.normal_balance === 'Debit') {
        balance += (deb - cred);
      } else {
        balance += (cred - deb);
      }

      return {
        id: item.id,
        date: je?.date || '-',
        description: je?.description || '-',
        debit: deb,
        credit: cred,
        runningBalance: balance,
      };
    });
  };

  const ledgerRows = getLedgerRows();
  const totalDebitLedger = ledgerRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCreditLedger = ledgerRows.reduce((sum, r) => sum + r.credit, 0);
  const currentBalance = ledgerRows.length > 0 ? ledgerRows[ledgerRows.length - 1].runningBalance : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Pencatatan Buku Ganda</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
            Lihat buku jurnal umum harian dan riwayat buku besar setiap perkiraan akun.
          </p>
        </div>

        <div className="tab-group" style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            className={`btn ${activeSubTab === 'journal' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 16px', fontSize: '13px' }}
            onClick={() => { setActiveSubTab('journal'); localStorage.setItem('sl_sub_tab_journal', 'journal'); }}
          >
            <Book size={14} style={{ marginRight: '6px' }} /> Jurnal Umum
          </button>
          <button
            className={`btn ${activeSubTab === 'ledger' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 16px', fontSize: '13px' }}
            onClick={() => { setActiveSubTab('ledger'); localStorage.setItem('sl_sub_tab_journal', 'ledger'); }}
          >
            <Columns size={14} style={{ marginRight: '6px' }} /> Buku Besar
          </button>
        </div>
      </div>

      {activeSubTab === 'journal' ? (
        /* ── Jurnal Umum View ── */
        <div className="card glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1.5rem 0' }}>Jurnal Umum Historis (Posted Only)</h4>

          <div className="table-responsive">
            <table className="table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Tanggal</th>
                  <th style={{ width: '35%' }}>Keterangan / Deskripsi</th>
                  <th style={{ width: '15%' }}>Kode Akun</th>
                  <th style={{ width: '20%' }}>Perkiraan Akun</th>
                  <th style={{ width: '15%' }}>Debit (Dr)</th>
                  <th style={{ width: '15%' }}>Kredit (Cr)</th>
                </tr>
              </thead>
              <tbody>
                {postedEntries.length > 0 ? (
                  postedEntries.map(entry => {
                    const items = journalItems.filter(ji => ji.journal_entry_id === entry.id);
                    return (
                      <Fragment key={entry.id}>
                        {/* Entry Header row (Date + Description) */}
                        <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: 'none' }}>
                          <td style={{ fontWeight: '600' }}>{formatDate(entry.date)}</td>
                          <td colSpan="5" style={{ fontWeight: '600', color: 'var(--color-primary-light)' }}>
                            {entry.description}
                          </td>
                        </tr>
                        {/* Account rows */}
                        {items.map(item => {
                          const account = coa.find(c => c.code === item.account_code);
                          return (
                            <tr key={item.id} style={{ borderTop: 'none' }}>
                              <td></td>
                              <td></td>
                              <td style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                {item.account_code}
                              </td>
                              <td style={{ paddingLeft: item.credit > 0 ? '1.5rem' : '0.5rem' }}>
                                <span style={{ fontWeight: item.debit > 0 ? '500' : 'normal' }}>
                                  {account?.name || 'Akun'}
                                </span>
                              </td>
                              <td style={{ color: 'var(--color-success)', textAlign: 'right' }}>
                                {item.debit > 0 ? formatRp(item.debit) : '-'}
                              </td>
                              <td style={{ color: 'var(--color-primary)', textAlign: 'right' }}>
                                {item.credit > 0 ? formatRp(item.credit) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Spacer separator */}
                        <tr style={{ height: '8px', border: 'none' }}><td colSpan="6" style={{ padding: 0 }}></td></tr>
                      </Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
                      Belum ada entri jurnal yang dibukukan (posted).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Buku Besar View ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0, minWidth: '280px' }}>
                <label style={{ marginBottom: '0.4rem' }}>Pilih Akun Perkiraan</label>
                <select 
                  value={selectedAccount} 
                  onChange={(e) => { setSelectedAccount(e.target.value); localStorage.setItem('sl_selected_account_journal', e.target.value); }}
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  {coa.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name} ({c.sub_classification})
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Quick Specs */}
              {currentCoa && (
                <div style={{ display: 'flex', gap: '2rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Klasifikasi</div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{currentCoa?.sub_classification}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Saldo Normal</div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{currentCoa.normal_balance}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Saldo Akhir</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-success)' }}>
                      {formatRp(currentBalance)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>Buku Besar: {currentCoa?.name} ({selectedAccount})</h4>
            
            <div className="table-responsive">
              <table className="table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Keterangan / Transaksi</th>
                    <th>Debit (Dr)</th>
                    <th>Kredit (Cr)</th>
                    <th style={{ textAlign: 'right' }}>Saldo Kumulatif</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.length > 0 ? (
                    <>
                      {/* Opening Balance Row */}
                      <tr style={{ fontStyle: 'italic', background: 'rgba(255,255,255,0.01)' }}>
                        <td>-</td>
                        <td>Saldo Awal Perkiraan</td>
                        <td>-</td>
                        <td>-</td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatRp(0)}</td>
                      </tr>
                      {/* Transaction Rows */}
                      {ledgerRows.map(row => (
                        <tr key={row.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(row.date)}</td>
                          <td>{row.description}</td>
                          <td style={{ color: 'var(--color-success)' }}>{row.debit > 0 ? formatRp(row.debit) : '-'}</td>
                          <td style={{ color: 'var(--color-primary)' }}>{row.credit > 0 ? formatRp(row.credit) : '-'}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--color-success-light)' }}>
                            {formatRp(row.runningBalance)}
                          </td>
                        </tr>
                      ))}
                      {/* Summary Row */}
                      <tr style={{ fontWeight: '700', background: 'rgba(255,255,255,0.03)' }}>
                        <td colSpan="2">TOTAL MUTASI / SALDO AKHIR</td>
                        <td style={{ color: 'var(--color-success)' }}>{formatRp(totalDebitLedger)}</td>
                        <td style={{ color: 'var(--color-primary)' }}>{formatRp(totalCreditLedger)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--color-success)', fontSize: '14px' }}>
                          {formatRp(currentBalance)}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
                        Tidak ada transaksi mutasi untuk akun ini pada sistem.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
