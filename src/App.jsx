import { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import { db, isDemoMode } from './supabaseClient';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import JournalLedger from './components/JournalLedger';
import Inventory from './components/Inventory';
import Assets from './components/Assets';
import FinancialReports from './components/FinancialReports';
import ClosingPeriod from './components/ClosingPeriod';
import Settings from './components/Settings';

// ─── Helpers ────────────────────────────────────────────────────────────────
export const formatRp = (v) =>
  'Rp ' + Math.round(Number(v) || 0).toLocaleString('id-ID');

export const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni',
                     'Juli','Agustus','September','Oktober','November','Desember'];
export { MONTH_NAMES };

export const getCoaByRole = (coa, role) => coa.find(c => c?.system_role === role)?.code || '';
export const getCoaByClass = (coa, cls) => coa.filter(c => c?.account_class === cls);
export const getCoaByBehavior = (coa, key) => coa.filter(c => c?.behaviors?.[key] === true);

// ─── Initial State ───────────────────────────────────────────────────────────
const initState = {
  coa:                 [],
  transactions:        [],
  journalEntries:      [],
  journalItems:        [],
  inventory:           [],
  fixedAssets:         [],
  depreciationRecords: [],
  closingPeriods:      [],
  auditLogs:           [],
  users:               [],
  invitations:         [],
  companySettings:     {},
  user:                null,
  loading:             true,
  activeTab:           localStorage.getItem('sl_active_tab') || 'dashboard',
};

export default function App() {
  const [state, setState] = useState(initState);
  const patch = (updates) => setState(s => ({ ...s, ...updates }));
  const activeUpdates = useRef(new Set());

  // ── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    db.auth.getSession().then(({ data }) => {
      const user = data?.session?.user ?? null;
      patch({ user, loading: false });
    });
    const { data: { subscription } } = db.auth.onAuthStateChange((_ev, session) => {
      patch({ user: session?.user ?? null });
    });
    return () => subscription?.unsubscribe();
  }, []);

  // ── Load data on login ───────────────────────────────────────────────────
  useEffect(() => {
    if (!state.user?.id) return;
    loadAll();
  }, [state.user?.id]);

  const loadAll = useCallback(async () => {
    const [coa, transactions, journalEntries, journalItems,
           inventory, fixedAssets, depreciationRecords,
           closingPeriods, auditLogs, settings, users, invitations] = await Promise.all([
      db.getAll('coa'),
      db.getAll('transactions'),
      db.getAll('journal_entries'),
      db.getAll('journal_items'),
      db.getAll('inventory'),
      db.getAll('fixed_assets'),
      db.getAll('depreciation_records'),
      db.getAll('closing_periods'),
      db.getAll('audit_logs'),
      db.getSettings(),
      db.getAll('users'),
      db.getAll('invitations'),
    ]);

    setState(s => {
      const dbUsers = users.data || [];
      let updatedUser = s.user;
      if (s.user) {
        const found = dbUsers.find(u => u.email.toLowerCase() === s.user.email.toLowerCase() || u.id === s.user.id);
        if (found) {
          updatedUser = { ...s.user, role: found.role, status: found.status || 'active', company_id: found.company_id };
        } else if (!s.user.role) {
          updatedUser = { ...s.user, role: 'staff', status: 'pending' };
        }
      }
      return {
        ...s,
        coa:                 coa.data   || [],
        transactions:        transactions.data || [],
        journalEntries:      journalEntries.data || [],
        journalItems:        journalItems.data || [],
        inventory:           inventory.data || [],
        fixedAssets:         fixedAssets.data || [],
        depreciationRecords: depreciationRecords.data || [],
        closingPeriods:      closingPeriods.data || [],
        auditLogs:           auditLogs.data || [],
        companySettings:     settings.data || {},
        users:               dbUsers,
        invitations:         invitations.data || [],
        user:                updatedUser,
        loading:             false,
      };
    });
  }, []);

  // ── Audit Logger ─────────────────────────────────────────────────────────
  const addAuditLog = useCallback(async (action, tableName = '', recordId = '', oldValue = null, newValue = null) => {
    const sanitizeObj = (obj) => {
      if (!obj) return obj;
      if (typeof obj !== 'object') return obj;
      const cleaned = Array.isArray(obj) ? [...obj] : { ...obj };
      for (const key in cleaned) {
        if (typeof cleaned[key] === 'string' && cleaned[key].startsWith('data:') && cleaned[key].length > 100) {
          cleaned[key] = '[Data Gambar Base64]';
        } else if (typeof cleaned[key] === 'object' && cleaned[key] !== null) {
          cleaned[key] = sanitizeObj(cleaned[key]);
        }
      }
      return cleaned;
    };

    const cleanOld = sanitizeObj(oldValue);
    const cleanNew = sanitizeObj(newValue);

    const log = {
      user_id:    state.user?.id    || 'demo',
      user_email: state.user?.email || 'demo@sorgum.local',
      action,
      table_name: tableName,
      record_id:  String(recordId),
      old_value:  cleanOld,
      new_value:  cleanNew,
      created_at: new Date().toISOString(),
    };
    const { data } = await db.insert('audit_logs', log);
    setState(s => ({ ...s, auditLogs: [data || log, ...s.auditLogs] }));
  }, [state.user]);

  // ── Check period lock ─────────────────────────────────────────────────────
  const isPeriodClosed = useCallback((dateStr) => {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length < 2) return false;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    return state.closingPeriods.some(
      cp => cp.period_month === month && cp.period_year === year
    );
  }, [state.closingPeriods]);

  // ── Add Transaction (with HPP & Inventory trigger on 'posted') ───────────
  const addTransaction = useCallback(async (form) => {
    const {
      date, type, category_code, nominal, description,
      product_sku, quantity, status = 'draft',
    } = form;

    if (isPeriodClosed(date)) throw new Error('Periode ini sudah ditutup. Tidak dapat menambah transaksi.');

    const creatorId = state.user?.id || 'demo-user';
    const txFields = {
      date, type, category_code, nominal: Number(nominal),
      description, product_sku: product_sku || null,
      quantity: Number(quantity) || 0, status,
      created_by: creatorId,
      user_id: state.user?.id,
    };

    if (status === 'posted') {
      txFields.posted_by = creatorId;
      txFields.posted_at = new Date().toISOString();
    }

    // 1. Save transaction
    const { data: tx } = await db.insert('transactions', txFields);
    const finalTx = tx || { ...txFields, id: crypto.randomUUID(), created_at: new Date().toISOString() };

    let savedJe = null;
    let savedItems = [];
    let updatedInventory = state.inventory;

    // 2. Only post to Jurnal/Buku Besar and deduct/add stock if status is 'posted'
    if (status === 'posted') {
      if (product_sku && quantity && type === 'Pemasukan') {
        const item = state.inventory.find(i => i.sku === product_sku);
        if (item && item.stock < Number(quantity)) {
          throw new Error(`Stok ${item.name} tidak mencukupi (Tersedia: ${item.stock}, Diperlukan: ${quantity}).`);
        }
      }

      const lines = buildJournalLines(finalTx, state.inventory, state.coa);

      // Double-entry validation
      const debitSum = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
      const creditSum = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
      if (Math.abs(debitSum - creditSum) > 0.01) {
        throw new Error(`Jurnal tidak seimbang (Debit: ${formatRp(debitSum)}, Kredit: ${formatRp(creditSum)}). Transaksi ditolak.`);
      }

      // Save journal entry
      const { data: je } = await db.insert('journal_entries', {
        transaction_id: finalTx.id,
        date,
        description: description || `${type} - ${category_code}`,
        is_closed: false,
        user_id: state.user?.id,
      });
      savedJe = je;

      // Save journal items
      for (const line of lines) {
        const { data: ji } = await db.insert('journal_items', { ...line, journal_entry_id: je.id });
        savedItems.push(ji || line);
      }

      // Update inventory stock if product sale or purchase
      if (product_sku && quantity) {
        const item = state.inventory.find(i => i.sku === product_sku);
        if (item) {
          const isSale = type === 'Pemasukan';
          const newStock = isSale 
            ? Math.max(0, item.stock - Number(quantity))
            : item.stock + Number(quantity);
          await db.updateStock(product_sku, newStock);
          updatedInventory = state.inventory.map(i => i.sku === product_sku ? { ...i, stock: newStock } : i);
        }
      }
    }

    // 3. Audit Log
    await addAuditLog(
      `Menambahkan transaksi: ${description || type} (${status}) ${formatRp(nominal)}`,
      'transactions', finalTx.id,
      null,
      { status }
    );

    setState(s => ({
      ...s,
      transactions:   [finalTx, ...s.transactions],
      journalEntries: savedJe ? [savedJe, ...s.journalEntries] : s.journalEntries,
      journalItems:   savedItems.length ? [...savedItems, ...s.journalItems] : s.journalItems,
      inventory:      updatedInventory,
    }));

    return finalTx;
  }, [state, isPeriodClosed, addAuditLog]);

  // ── Update Transaction Status & Audit Log & Posting ─────────────────────
  const updateTransactionStatus = useCallback(async (id, newStatus) => {
    if (activeUpdates.current.has(id)) {
      console.warn('Update transaction status already in progress for:', id);
      return;
    }
    activeUpdates.current.add(id);

    try {
      const tx = state.transactions.find(t => t.id === id);
      if (!tx) return;

      if (isPeriodClosed(tx.date)) {
        throw new Error('Periode ini sudah ditutup. Tidak dapat mengubah status transaksi.');
      }

      const oldStatus = tx.status;
      if (oldStatus === 'posted') {
        throw new Error('Transaksi yang sudah diposting (posted) tidak dapat diubah statusnya.');
      }

      const updates = { status: newStatus };
      const updaterId = state.user?.id || 'demo-user';

      if (newStatus === 'approved') {
        updates.approved_by = updaterId;
        updates.approved_at = new Date().toISOString();
      } else if (newStatus === 'posted') {
        updates.posted_by = updaterId;
        updates.posted_at = new Date().toISOString();
        if (!tx.approved_by) {
          updates.approved_by = updaterId;
          updates.approved_at = new Date().toISOString();
        }
      }

      // Update in database
      const { data: updatedTx } = await db.update('transactions', id, updates);
      const finalTx = updatedTx || { ...tx, ...updates };

      let savedJe = null;
      let savedItems = [];
      let updatedInventory = state.inventory;

      // Trigger double-entry posting logic if transitioning to posted
      if (newStatus === 'posted' && oldStatus !== 'posted') {
        if (finalTx.product_sku && finalTx.quantity && finalTx.type === 'Pemasukan') {
          const item = state.inventory.find(i => i.sku === finalTx.product_sku);
          if (item && item.stock < Number(finalTx.quantity)) {
            throw new Error(`Stok ${item.name} tidak mencukupi (Tersedia: ${item.stock}, Diperlukan: ${finalTx.quantity}).`);
          }
        }

        const lines = buildJournalLines(finalTx, state.inventory, state.coa);

        // Double-entry validation
        const debitSum = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
        const creditSum = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
        if (Math.abs(debitSum - creditSum) > 0.01) {
          throw new Error(`Jurnal tidak seimbang (Debit: ${formatRp(debitSum)}, Kredit: ${formatRp(creditSum)}). Transaksi ditolak.`);
        }

        // Save journal entry
        const { data: je } = await db.insert('journal_entries', {
          transaction_id: finalTx.id,
          date: finalTx.date,
          description: finalTx.description || `${finalTx.type} - ${finalTx.category_code}`,
          is_closed: false,
          user_id: state.user?.id,
        });
        savedJe = je;

        // Save journal items
        for (const line of lines) {
          const { data: ji } = await db.insert('journal_items', { ...line, journal_entry_id: je.id });
          savedItems.push(ji || line);
        }

        // Update inventory stock if product sale or purchase
        if (finalTx.product_sku && finalTx.quantity) {
          const item = state.inventory.find(i => i.sku === finalTx.product_sku);
          if (item) {
            const isSale = finalTx.type === 'Pemasukan';
            const newStock = isSale 
              ? Math.max(0, item.stock - Number(finalTx.quantity))
              : item.stock + Number(finalTx.quantity);
            await db.updateStock(finalTx.product_sku, newStock);
            updatedInventory = state.inventory.map(i => i.sku === finalTx.product_sku ? { ...i, stock: newStock } : i);
          }
        }
      }

      // Add Audit Log with old & new values
      await addAuditLog(
        `Mengubah status transaksi ${finalTx.description || finalTx.type} menjadi ${newStatus}`,
        'transactions',
        id,
        { status: oldStatus },
        { status: newStatus }
      );

      setState(s => ({
        ...s,
        transactions: s.transactions.map(t => t.id === id ? finalTx : t),
        journalEntries: savedJe ? [savedJe, ...s.journalEntries] : s.journalEntries,
        journalItems: savedItems.length ? [...savedItems, ...s.journalItems] : s.journalItems,
        inventory: updatedInventory,
      }));
    } finally {
      activeUpdates.current.delete(id);
    }
  }, [state, isPeriodClosed, addAuditLog]);

  // ── Demo Role Switcher ──────────────────────────────────────────────────
  const changeDemoRole = useCallback(async (role) => {
    if (!isDemoMode) return;
    setState(s => {
      const email = `${role}@sorgum.local`;
      const updatedUser = { id: `u-${role}`, email, role };
      localStorage.setItem('sl_session', JSON.stringify(updatedUser));
      return { ...s, user: updatedUser };
    });
  }, []);

  // ── Add Inventory Item ────────────────────────────────────────────────────
  const addInventoryItem = useCallback(async (item) => {
    const { data, error } = await db.insert('inventory', { ...item, user_id: state.user?.id });
    if (error) {
      throw new Error(error.message || 'Gagal menambahkan barang ke database.');
    }
    await addAuditLog(`Menambahkan item inventori: ${item.name}`, 'inventory', item.sku, null, item);
    setState(s => ({ ...s, inventory: [data || item, ...s.inventory] }));
  }, [state.user, addAuditLog]);

  const adjustStock = useCallback(async (sku, delta, reason) => {
    const item = state.inventory.find(i => i.sku === sku);
    if (!item) {
      throw new Error('Barang tidak ditemukan di inventori.');
    }
    const currentStock = Number(item.stock) || 0;
    const newStock = Math.max(0, currentStock + Number(delta));
    
    const { error: updateError } = await db.updateStock(sku, newStock);
    if (updateError) {
      throw new Error(updateError.message || 'Gagal memperbarui stok di database.');
    }

    await addAuditLog(
      `Penyesuaian stok ${item.name}: ${delta > 0 ? '+' : ''}${delta} (${reason})`,
      'inventory', sku,
      { stock: currentStock },
      { stock: newStock }
    );
    setState(s => ({ ...s, inventory: s.inventory.map(i => i.sku === sku ? { ...i, stock: newStock } : i) }));
  }, [state.inventory, addAuditLog]);

  // ── Add Fixed Asset ───────────────────────────────────────────────────────
  const addAsset = useCallback(async (form) => {
    const { data: asset } = await db.insert('fixed_assets', { ...form, status: 'Active', user_id: state.user?.id });

    // Journal: Debit Mesin Produksi (fixed_asset_primary), Credit Kas (cash_primary)
    const { data: je } = await db.insert('journal_entries', {
      transaction_id: null,
      date: form.purchase_date,
      description: `Pembelian Aset: ${form.name}`,
      is_closed: false,
      user_id: state.user?.id,
    });
    const items = [
      { journal_entry_id: je.id, account_code: getCoaByRole(state.coa, 'default_fixed_asset_account'), debit: Number(form.cost), credit: 0 },
      { journal_entry_id: je.id, account_code: getCoaByRole(state.coa, 'default_cash_account'), debit: 0, credit: Number(form.cost) },
    ];
    const savedItems = [];
    for (const it of items) { const { data: ji } = await db.insert('journal_items', it); savedItems.push(ji || it); }

    await addAuditLog(`Menambahkan aset tetap: ${form.name} ${formatRp(form.cost)}`, 'fixed_assets', asset.id, null, asset);
    setState(s => ({
      ...s,
      fixedAssets:    [asset, ...s.fixedAssets],
      journalEntries: [je, ...s.journalEntries],
      journalItems:   [...savedItems, ...s.journalItems],
    }));
    return asset;
  }, [state.user, addAuditLog]);

  // ── Post Depreciation (with anti-double validation) ─────────────────────
  const postDepreciation = useCallback(async (assetId, date, nominal) => {
    if (isPeriodClosed(date)) throw new Error('Periode ini sudah ditutup.');
    const asset = state.fixedAssets.find(a => a.id === assetId);
    if (!asset) return;

    // Extract month and year
    const d = new Date(date);
    const periodMonth = d.getMonth() + 1;
    const periodYear = d.getFullYear();

    // Prevent double depreciation check
    const exists = state.depreciationRecords.some(
      r => r.asset_id === assetId && r.period_month === periodMonth && r.period_year === periodYear
    );
    if (exists) {
      throw new Error(`Penyusutan untuk aset ini pada bulan ${MONTH_NAMES[periodMonth - 1]} ${periodYear} sudah pernah diposting.`);
    }

    const { data: je } = await db.insert('journal_entries', {
      transaction_id: null,
      date,
      description: `Penyusutan Aset: ${asset.name}`,
      is_closed: false,
      user_id: state.user?.id,
    });
    const items = [
      { journal_entry_id: je.id, account_code: getCoaByRole(state.coa, 'default_depr_expense_account'), debit: nominal, credit: 0 },
      { journal_entry_id: je.id, account_code: getCoaByRole(state.coa, 'default_accum_depr_account'), debit: 0, credit: nominal },
    ];
    const savedItems = [];
    for (const it of items) { const { data: ji } = await db.insert('journal_items', it); savedItems.push(ji || it); }

    const { data: dr } = await db.insert('depreciation_records', {
      asset_id: assetId, date, nominal, period_month: periodMonth, period_year: periodYear, journal_entry_id: je.id, user_id: state.user?.id,
    });

    await addAuditLog(`Posting penyusutan aset: ${asset.name} ${formatRp(nominal)}`, 'depreciation_records', dr.id, null, dr);
    setState(s => ({
      ...s,
      depreciationRecords: [dr || {}, ...s.depreciationRecords],
      journalEntries:      [je, ...s.journalEntries],
      journalItems:        [...savedItems, ...s.journalItems],
    }));
  }, [state, isPeriodClosed, addAuditLog]);

  // ── Close Period (with sequential validation) ───────────────────────────
  const closePeriod = useCallback(async (month, year) => {
    // Sequential closing check
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    if (state.closingPeriods.length > 0) {
      const prevClosed = state.closingPeriods.some(
        cp => cp.period_month === prevMonth && cp.period_year === prevYear
      );
      if (!prevClosed) {
        throw new Error(`Anda tidak dapat menutup periode ini sebelum periode sebelumnya (${MONTH_NAMES[prevMonth - 1]} ${prevYear}) ditutup.`);
      }
    }

    // Unposted transactions check
    const hasUnposted = state.transactions.some(tx => {
      if (!tx.date) return false;
      const parts = tx.date.split('-');
      if (parts.length < 2) return false;
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      return m === month && y === year && tx.status !== 'posted';
    });
    if (hasUnposted) {
      throw new Error(`Tidak dapat menutup periode. Masih ada transaksi yang belum diposting (berstatus selain POSTED) pada periode ini.`);
    }

    // 1. Calculate net income for period
    const periodItems = state.journalItems.filter(ji => {
      const je = state.journalEntries.find(e => e.id === ji.journal_entry_id);
      if (!je || !je.date) return false;
      const parts = je.date.split('-');
      if (parts.length < 2) return false;
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      return m === month && y === year;
    });
    const { coa } = state;
    let revenue = 0, expenses = 0;
    periodItems.forEach(ji => {
      const acct = coa.find(a => a.code === ji.account_code);
      if (!acct) return;
      if (acct.account_class === 'revenue')  revenue  += (ji.credit - ji.debit);
      if (acct.account_class === 'expense')  expenses += (ji.debit - ji.credit);
    });
    const netIncome = revenue - expenses;

    // 2. Post closing entry: Ikhtisar Laba Rugi → Saldo Laba
    const closeDate = `${year}-${String(month).padStart(2,'0')}-28`;
    const { data: je } = await db.insert('journal_entries', {
      transaction_id: null,
      date: closeDate,
      description: `Tutup Buku - ${MONTH_NAMES[month-1]} ${year}`,
      is_closed: true,
      user_id: state.user?.id,
    });
    const incomeSummaryCode = getCoaByRole(coa, 'default_income_summary');
    const retainedEarningsCode = getCoaByRole(coa, 'default_retained_earnings');
    const closingItems = netIncome >= 0
      ? [
          { journal_entry_id: je.id, account_code: incomeSummaryCode, debit: netIncome, credit: 0 },
          { journal_entry_id: je.id, account_code: retainedEarningsCode, debit: 0, credit: netIncome },
        ]
      : [
          { journal_entry_id: je.id, account_code: retainedEarningsCode, debit: Math.abs(netIncome), credit: 0 },
          { journal_entry_id: je.id, account_code: incomeSummaryCode, debit: 0, credit: Math.abs(netIncome) },
        ];
    for (const it of closingItems) await db.insert('journal_items', it);

    // 3. Mark all period transactions as closed
    for (const tx of state.transactions) {
      if (tx.date) {
        const parts = tx.date.split('-');
        if (parts.length >= 2) {
          const y = Number(parts[0]);
          const m = Number(parts[1]);
          if (m === month && y === year) {
            await db.update('transactions', tx.id, { is_closed: true });
          }
        }
      }
    }
    for (const je2 of state.journalEntries) {
      if (je2.date) {
        const parts = je2.date.split('-');
        if (parts.length >= 2) {
          const y = Number(parts[0]);
          const m = Number(parts[1]);
          if (m === month && y === year) {
            await db.update('journal_entries', je2.id, { is_closed: true });
          }
        }
      }
    }

    // 4. Save closing period record
    const { data: cp } = await db.insert('closing_periods', {
      period_month: month,
      period_year:  year,
      net_income:   netIncome,
      closed_by:    state.user?.email || 'demo',
      user_id:      state.user?.id,
    });

    await addAuditLog(
      `Tutup buku ${MONTH_NAMES[month-1]} ${year} — Laba Bersih: ${formatRp(netIncome)}`,
      'closing_periods', cp.id,
      null,
      cp
    );

    await loadAll(); // Full reload for accuracy
  }, [state, addAuditLog, loadAll]);

  // ── Update Company Settings ───────────────────────────────────────────────
  const updateCompanySettings = useCallback(async (settings) => {
    const oldSet = state.companySettings;
    const merged = { ...state.companySettings, ...settings, user_id: state.user?.id };
    await db.upsertSettings(merged);
    await addAuditLog('Mengubah pengaturan perusahaan', 'company_settings', '', oldSet, merged);
    setState(s => ({ ...s, companySettings: merged }));
  }, [state.companySettings, state.user, addAuditLog]);

  const inviteUser = useCallback(async (email, role) => {
    if (state.user?.role !== 'owner') {
      throw new Error('Hanya Owner yang dapat mengundang pengguna baru.');
    }
    const companyId = state.user?.company_id || 'c-sorgum';
    const inviteData = {
      email,
      role,
      company_id: companyId,
    };
    const { data, error } = await db.insert('invitations', inviteData);
    if (error) {
      throw new Error(error.message || 'Gagal mengirim undangan.');
    }
    const finalInvite = data || { ...inviteData, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    
    await addAuditLog(
      `Mengundang pengguna baru: ${email} sebagai ${role}`,
      'invitations',
      finalInvite.id,
      null,
      finalInvite
    );
    
    setState(s => ({
      ...s,
      invitations: [finalInvite, ...s.invitations]
    }));
    return finalInvite;
  }, [state.user, addAuditLog]);

  const cancelInvite = useCallback(async (id) => {
    if (state.user?.role !== 'owner') {
      throw new Error('Hanya Owner yang dapat membatalkan undangan.');
    }
    const invite = state.invitations.find(inv => inv.id === id);
    if (!invite) return;

    const { error } = await db.delete('invitations', id);
    if (error) {
      throw new Error(error.message || 'Gagal membatalkan undangan.');
    }

    await addAuditLog(
      `Membatalkan undangan untuk: ${invite.email}`,
      'invitations',
      id,
      invite,
      null
    );

    setState(s => ({
      ...s,
      invitations: s.invitations.filter(inv => inv.id !== id)
    }));
  }, [state.user, state.invitations, addAuditLog]);

  const changeUserRole = useCallback(async (userId, newRole) => {
    if (state.user?.role !== 'owner') {
      throw new Error('Hanya Owner yang dapat mengubah peran pengguna.');
    }
    const targetUser = state.users.find(u => u.id === userId);
    if (!targetUser) return;

    const oldRole = targetUser.role;

    if (oldRole === 'owner' && newRole !== 'owner') {
      const activeOwners = state.users.filter(u => u.role === 'owner' && u.status === 'active' && u.company_id === targetUser.company_id);
      if (activeOwners.length <= 1) {
        throw new Error('Tidak dapat mengubah peran. Perusahaan harus memiliki setidaknya satu Owner yang aktif.');
      }
    }

    const { error } = await db.update('users', userId, { role: newRole });
    if (error) {
      throw new Error(error.message || 'Gagal mengubah peran pengguna.');
    }

    await addAuditLog(
      `Mengubah peran pengguna ${targetUser.email} dari ${oldRole} menjadi ${newRole}`,
      'users', userId,
      { role: oldRole },
      { role: newRole }
    );

    setState(s => ({
      ...s,
      users: s.users.map(u => u.id === userId ? { ...u, role: newRole } : u)
    }));
  }, [state.users, state.user, addAuditLog]);

  const updateUserStatus = useCallback(async (userId, newStatus) => {
    if (state.user?.role !== 'owner') {
      throw new Error('Hanya Owner yang dapat mengubah status pengguna.');
    }
    const targetUser = state.users.find(u => u.id === userId);
    if (!targetUser) return;
    
    const oldStatus = targetUser.status || 'pending';

    if (targetUser.role === 'owner') {
      const activeOwners = state.users.filter(u => u.role === 'owner' && u.status === 'active' && u.company_id === targetUser.company_id);
      if (activeOwners.length <= 1 && newStatus !== 'active') {
        throw new Error('Tidak dapat mengubah status. Perusahaan harus memiliki setidaknya satu Owner yang aktif.');
      }
    }

    await db.update('users', userId, { status: newStatus });

    let logAction = `Mengubah status pengguna ${targetUser.email} menjadi ${newStatus}`;
    if (oldStatus === 'pending' && newStatus === 'active') {
      logAction = `USER_APPROVED: Menyetujui akses pengguna ${targetUser.email}`;
    } else if (oldStatus === 'pending' && newStatus === 'rejected') {
      logAction = `USER_REJECTED: Menolak akses pengguna ${targetUser.email}`;
    } else if (newStatus === 'suspended') {
      logAction = `USER_SUSPENDED: Menangguhkan akun pengguna ${targetUser.email}`;
    }

    await addAuditLog(
      logAction,
      'users', userId,
      { status: oldStatus },
      { status: newStatus }
    );
    setState(s => ({
      ...s,
      users: s.users.map(u => u.id === userId ? { ...u, status: newStatus } : u)
    }));
  }, [state.users, state.user, addAuditLog]);

  // ── Add COA Account (with contract validation) ──────────────────────────
  const addCoaAccount = useCallback(async (form) => {
    const { code, name, account_class, sub_classification, normal_balance, system_role = null, account_purpose = 'operational', account_tag = null, behaviors = {} } = form;

    if (state.coa.some(c => c.code === code)) {
      throw new Error(`Kode akun ${code} sudah digunakan.`);
    }

    if (system_role && state.coa.some(c => c.system_role === system_role)) {
      throw new Error(`Sistem role ${system_role} sudah digunakan oleh akun lain.`);
    }

    const validClasses = ['asset', 'liability', 'equity', 'revenue', 'expense'];
    if (!validClasses.includes(account_class)) {
      throw new Error(`Kelas akun tidak valid: ${account_class}`);
    }

    const validSubClasses = [
      'Current Asset', 'Fixed Asset', 'Contra Asset',
      'Current Liability', 'Long-Term Liability',
      'Equity', 'Revenue', 'Cost of Goods Sold',
      'Expense', 'Tax'
    ];
    if (!validSubClasses.includes(sub_classification)) {
      throw new Error(`Sub-klasifikasi tidak valid: ${sub_classification}`);
    }

    const validPurposes = ['operational', 'closing', 'adjustment'];
    if (!validPurposes.includes(account_purpose)) {
      throw new Error(`Tujuan akun tidak valid: ${account_purpose}`);
    }

    const requiredBehaviorKeys = ['can_pay', 'affects_stock', 'default_payment', 'closing_account'];
    const validatedBehaviors = { schema_version: "1.0" };
    for (const key of requiredBehaviorKeys) {
      if (behaviors[key] !== undefined) {
        validatedBehaviors[key] = Boolean(behaviors[key]);
      } else {
        validatedBehaviors[key] = false;
      }
    }

    const newAccount = {
      code,
      name,
      account_class,
      sub_classification,
      normal_balance,
      system_role: system_role || null,
      account_purpose,
      account_tag: account_tag || null,
      behaviors: validatedBehaviors,
      created_at: new Date().toISOString()
    };

    const { data, error } = await db.insert('coa', newAccount);
    if (error) {
      throw new Error(error.message || 'Gagal menambahkan akun ke database.');
    }

    await addAuditLog(`Menambahkan akun COA: ${code} - ${name}`, 'coa', code, null, newAccount);
    setState(s => ({ ...s, coa: [...s.coa, data || newAccount] }));
    return data || newAccount;
  }, [state.coa, addAuditLog]);

  const signOut = useCallback(async () => {
    await db.auth.signOut();
    localStorage.removeItem('sl_force_demo');
    localStorage.removeItem('sl_session');
    localStorage.removeItem('sl_active_tab');
    patch({ user: null });
    window.location.reload();
  }, []);

  // Session timeout hook (15 minutes idle)
  useEffect(() => {
    if (!state.user) return;

    let timeoutId;
    const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        localStorage.setItem('sl_timeout_alert', 'true');
        signOut();
      }, TIMEOUT_DURATION);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [state.user, signOut]);

  // ── Actions bundle ────────────────────────────────────────────────────────
  const actions = {
    addTransaction, addInventoryItem, adjustStock,
    addAsset, postDepreciation, closePeriod,
    updateCompanySettings, updateUserStatus, addAuditLog, signOut, loadAll,
    isPeriodClosed, updateTransactionStatus, changeDemoRole,
    inviteUser, cancelInvite, changeUserRole, addCoaAccount,
    setActiveTab: (tab, subTab = null, extra = null) => {
      localStorage.setItem('sl_active_tab', tab);
      if (subTab) {
        localStorage.setItem(`sl_sub_tab_${tab}`, subTab);
      }
      if (extra) {
        if (tab === 'journal' && extra.account) {
          localStorage.setItem('sl_selected_account_journal', extra.account);
        }
      }
      patch({ activeTab: tab });
    },
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (state.loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
        <div className="spinner" style={{ width:36, height:36 }} />
      </div>
    );
  }

  if (!state.user) {
    return <Auth onAuth={() => loadAll()} db={db} />;
  }

  if (state.user && (state.user.status === 'pending' || state.user.status === 'suspended' || state.user.status === 'rejected')) {
    return (
      <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
        <div className="auth-card glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <span style={{ fontSize: '3rem' }}>🔒</span>
          {state.user.status === 'pending' && (
            <>
              <h2 style={{ margin: 0, fontWeight: 700 }}>Akun Menunggu Persetujuan</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
                Akun Anda (<strong>{state.user.email}</strong>) sedang menunggu persetujuan Owner.
                <br /><br />
                Silakan hubungi <strong>Owner</strong> perusahaan untuk mengaktifkan akun Anda agar dapat masuk ke dashboard.
              </p>
            </>
          )}
          {state.user.status === 'suspended' && (
            <>
              <h2 style={{ margin: 0, fontWeight: 700, color: 'var(--color-danger)' }}>Akun Ditangguhkan</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
                Akun Anda telah dinonaktifkan. Hubungi administrator.
                <br /><br />
                Silakan hubungi <strong>Owner</strong> perusahaan untuk informasi lebih lanjut.
              </p>
            </>
          )}
          {state.user.status === 'rejected' && (
            <>
              <h2 style={{ margin: 0, fontWeight: 700, color: 'var(--color-danger)' }}>Akses Ditolak</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
                Permohonan akses ditolak.
                <br /><br />
                Hubungi administrator jika Anda merasa ini adalah kesalahan.
              </p>
            </>
          )}
          <button className="btn btn-outline" onClick={signOut} style={{ marginTop: '0.5rem', width: '100%' }}>
            Keluar dari Sistem
          </button>
        </div>
      </div>
    );
  }

  const tabMap = {
    dashboard:  <Dashboard         state={state} actions={actions} />,
    transactions: <Transactions    state={state} actions={actions} />,
    journal:    <JournalLedger     state={state} actions={actions} />,
    inventory:  <Inventory         state={state} actions={actions} />,
    assets:     <Assets            state={state} actions={actions} />,
    reports:    <FinancialReports  state={state} actions={actions} />,
    closing:    <ClosingPeriod     state={state} actions={actions} />,
    settings:   <Settings          state={state} actions={actions} />,
  };

  // Low-stock count for sidebar badge
  const lowStockCount = state.inventory.filter(i => i.stock <= i.min_stock).length;

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={state.activeTab}
        setActiveTab={actions.setActiveTab}
        user={state.user}
        isDemoMode={isDemoMode}
        signOut={signOut}
        lowStockCount={lowStockCount}
        changeDemoRole={changeDemoRole}
        companySettings={state.companySettings}
      />
      <main className="main-content">
        <div className="page-wrapper fade-in">
          {tabMap[state.activeTab] || tabMap.dashboard}
        </div>
      </main>
    </div>
  );
}

// ─── Build Journal Lines (Double-Entry Logic) ─────────────────────────────────
function buildJournalLines(form, inventory, coa) {
  const { type, category_code, nominal, product_sku, quantity } = form;
  const nom = Number(nominal);
  const qty = Number(quantity) || 0;
  const lines = [];

  const salesPrimary = getCoaByRole(coa, 'default_sales_account');
  const cashPrimary = getCoaByRole(coa, 'default_cash_account');
  const cogsPrimary = getCoaByRole(coa, 'default_cogs_account');
  const inventoryRaw = getCoaByRole(coa, 'default_inventory_raw_account');
  const inventoryFinished = getCoaByRole(coa, 'default_inventory_finished_account');

  if (type === 'Pemasukan') {
    if (category_code === salesPrimary && product_sku) {
      // Sales with HPP
      const item = inventory.find(i => i.sku === product_sku);
      const hpp = item ? item.cost_price * qty : 0;
      lines.push({ account_code: cashPrimary, debit: nom,  credit: 0 });
      lines.push({ account_code: salesPrimary, debit: 0,    credit: nom });
      if (hpp > 0) {
        lines.push({ account_code: cogsPrimary, debit: hpp, credit: 0 });
        lines.push({ account_code: item?.type === 'Bahan Baku' ? inventoryRaw : inventoryFinished, debit: 0, credit: hpp });
      }
    } else {
      // Generic income
      lines.push({ account_code: cashPrimary,          debit: nom, credit: 0   });
      lines.push({ account_code: category_code,  debit: 0,   credit: nom });
    }
  } else {
    // Expense — Kredit Kas, Debit expense account
    lines.push({ account_code: category_code, debit: nom, credit: 0   });
    lines.push({ account_code: cashPrimary,         debit: 0,   credit: nom });
  }

  return lines;
}
