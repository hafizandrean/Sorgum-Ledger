import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isDemoMode = !SUPABASE_URL || !SUPABASE_ANON_KEY || localStorage.getItem('sl_force_demo') === 'true';

export const supabase = isDemoMode
  ? null
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Demo Mode Seed Data ────────────────
const SEED_COA = [
  // Aset Lancar
  {
    code: '1010',
    name: 'Kas',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: 'default_cash_account',
    account_purpose: 'operational',
    account_tag: 'cash',
    behaviors: { can_pay: true, affects_stock: false, default_payment: true, closing_account: false }
  },
  {
    code: '1020',
    name: 'Bank',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'bank',
    behaviors: { can_pay: true, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1030',
    name: 'Piutang Usaha',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: 'default_receivable_account',
    account_purpose: 'operational',
    account_tag: 'receivable',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1040',
    name: 'Piutang Lain-lain',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1050',
    name: 'Persediaan Barang Dagang',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: 'default_inventory_finished_account',
    account_purpose: 'operational',
    account_tag: 'inventory',
    behaviors: { can_pay: false, affects_stock: true, default_payment: false, closing_account: false }
  },
  {
    code: '1060',
    name: 'Persediaan Bahan Baku',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: 'default_inventory_raw_account',
    account_purpose: 'operational',
    account_tag: 'inventory',
    behaviors: { can_pay: false, affects_stock: true, default_payment: false, closing_account: false }
  },
  {
    code: '1070',
    name: 'Persediaan Barang Dalam Proses (WIP)',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'inventory',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1080',
    name: 'Beban Dibayar di Muka',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1090',
    name: 'Pajak Dibayar di Muka',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  // Aset Tetap
  {
    code: '1210',
    name: 'Tanah',
    account_class: 'asset',
    sub_classification: 'Fixed Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1220',
    name: 'Bangunan',
    account_class: 'asset',
    sub_classification: 'Fixed Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1230',
    name: 'Mesin & Peralatan',
    account_class: 'asset',
    sub_classification: 'Fixed Asset',
    normal_balance: 'Debit',
    system_role: 'default_fixed_asset_account',
    account_purpose: 'operational',
    account_tag: 'fixed_asset',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1240',
    name: 'Kendaraan',
    account_class: 'asset',
    sub_classification: 'Fixed Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1250',
    name: 'Peralatan Kantor',
    account_class: 'asset',
    sub_classification: 'Fixed Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1260',
    name: 'Akumulasi Penyusutan Mesin',
    account_class: 'asset',
    sub_classification: 'Contra Asset',
    normal_balance: 'Credit',
    system_role: 'default_accum_depr_account',
    account_purpose: 'adjustment',
    account_tag: 'contra_asset',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  // Aset Lain-lain
  {
    code: '1310',
    name: 'Investasi Jangka Panjang',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1320',
    name: 'Hak Paten / Lisensi',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1330',
    name: 'Aset Tidak Berwujud',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '1340',
    name: 'Uang Jaminan',
    account_class: 'asset',
    sub_classification: 'Current Asset',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  // Kewajiban Lancar
  {
    code: '2010',
    name: 'Utang Usaha',
    account_class: 'liability',
    sub_classification: 'Current Liability',
    normal_balance: 'Credit',
    system_role: 'default_payable_account',
    account_purpose: 'operational',
    account_tag: 'payable',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '2020',
    name: 'Utang Bank Jangka Pendek',
    account_class: 'liability',
    sub_classification: 'Current Liability',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '2030',
    name: 'Beban yang Masih Harus Dibayar',
    account_class: 'liability',
    sub_classification: 'Current Liability',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '2040',
    name: 'Utang Pajak',
    account_class: 'liability',
    sub_classification: 'Current Liability',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '2050',
    name: 'Uang Muka Pelanggan',
    account_class: 'liability',
    sub_classification: 'Current Liability',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '2060',
    name: 'Utang Gaji',
    account_class: 'liability',
    sub_classification: 'Current Liability',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  // Kewajiban Jangka Panjang
  {
    code: '2210',
    name: 'Utang Bank Jangka Panjang',
    account_class: 'liability',
    sub_classification: 'Long-Term Liability',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '2220',
    name: 'Utang Leasing',
    account_class: 'liability',
    sub_classification: 'Long-Term Liability',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '2230',
    name: 'Obligasi',
    account_class: 'liability',
    sub_classification: 'Long-Term Liability',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '2240',
    name: 'Kewajiban Imbalan Kerja',
    account_class: 'liability',
    sub_classification: 'Long-Term Liability',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: null,
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  // Ekuitas
  {
    code: '3010',
    name: 'Modal Disetor',
    account_class: 'equity',
    sub_classification: 'Equity',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'equity',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '3020',
    name: 'Laba Ditahan',
    account_class: 'equity',
    sub_classification: 'Equity',
    normal_balance: 'Credit',
    system_role: 'default_retained_earnings',
    account_purpose: 'closing',
    account_tag: 'equity',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '3030',
    name: 'Laba Tahun Berjalan',
    account_class: 'equity',
    sub_classification: 'Equity',
    normal_balance: 'Credit',
    system_role: 'default_income_summary',
    account_purpose: 'closing',
    account_tag: 'equity',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: true }
  },
  {
    code: '3040',
    name: 'Prive / Penarikan Pemilik',
    account_class: 'equity',
    sub_classification: 'Equity',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'equity',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '3050',
    name: 'Cadangan Modal',
    account_class: 'equity',
    sub_classification: 'Equity',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'equity',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  // Pendapatan
  {
    code: '4010',
    name: 'Penjualan Produk',
    account_class: 'revenue',
    sub_classification: 'Revenue',
    normal_balance: 'Credit',
    system_role: 'default_sales_account',
    account_purpose: 'operational',
    account_tag: 'revenue',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '4020',
    name: 'Penjualan Jasa',
    account_class: 'revenue',
    sub_classification: 'Revenue',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'revenue',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '4030',
    name: 'Diskon Penjualan',
    account_class: 'revenue',
    sub_classification: 'Revenue',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'revenue',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '4040',
    name: 'Retur Penjualan',
    account_class: 'revenue',
    sub_classification: 'Revenue',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'revenue',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '4050',
    name: 'Pendapatan Lain-lain',
    account_class: 'revenue',
    sub_classification: 'Revenue',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'revenue',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '4060',
    name: 'Pendapatan Ekspor',
    account_class: 'revenue',
    sub_classification: 'Revenue',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'revenue',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  // HPP
  {
    code: '5010',
    name: 'Harga Pokok Penjualan (HPP)',
    account_class: 'expense',
    sub_classification: 'Cost of Goods Sold',
    normal_balance: 'Debit',
    system_role: 'default_cogs_account',
    account_purpose: 'operational',
    account_tag: 'cogs',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '5020',
    name: 'Biaya Tenaga Kerja Langsung',
    account_class: 'expense',
    sub_classification: 'Cost of Goods Sold',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'cogs',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '5030',
    name: 'Overhead Produksi',
    account_class: 'expense',
    sub_classification: 'Cost of Goods Sold',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'cogs',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '5040',
    name: 'Persediaan Awal',
    account_class: 'expense',
    sub_classification: 'Cost of Goods Sold',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'cogs',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '5050',
    name: 'Persediaan Akhir',
    account_class: 'expense',
    sub_classification: 'Cost of Goods Sold',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'cogs',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '5060',
    name: 'Biaya Pengiriman Barang Masuk',
    account_class: 'expense',
    sub_classification: 'Cost of Goods Sold',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'cogs',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  // Beban Penjualan
  {
    code: '6010',
    name: 'Beban Marketing',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '6020',
    name: 'Beban Distribusi',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '6030',
    name: 'Beban Komisi',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '6040',
    name: 'Beban Promosi',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  // Beban Administrasi & Umum
  {
    code: '6110',
    name: 'Gaji Karyawan',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: 'default_salary_account',
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '6120',
    name: 'Listrik, Air, Internet',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '6130',
    name: 'Sewa Kantor',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: 'default_rent_account',
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '6140',
    name: 'ATK & Perlengkapan',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: 'default_office_supplies_account',
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '6150',
    name: 'Beban Penyusutan',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: 'default_depr_expense_account',
    account_purpose: 'adjustment',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '6160',
    name: 'Beban Pemeliharaan',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '6170',
    name: 'Biaya Legal & Perizinan',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  // Beban Lain-lain
  {
    code: '6210',
    name: 'Beban Bunga',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '6220',
    name: 'Kerugian Selisih Kurs',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '6230',
    name: 'Beban Tak Terduga',
    account_class: 'expense',
    sub_classification: 'Expense',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'expense',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  // Pajak
  {
    code: '7010',
    name: 'PPN Keluaran',
    account_class: 'liability',
    sub_classification: 'Tax',
    normal_balance: 'Credit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'tax',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '7020',
    name: 'PPN Masukan',
    account_class: 'asset',
    sub_classification: 'Tax',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'tax',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '7030',
    name: 'PPh Badan',
    account_class: 'expense',
    sub_classification: 'Tax',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'tax',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  },
  {
    code: '7040',
    name: 'Pajak Lain-lain',
    account_class: 'expense',
    sub_classification: 'Tax',
    normal_balance: 'Debit',
    system_role: null,
    account_purpose: 'operational',
    account_tag: 'tax',
    behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false }
  }
];

const SEED_INVENTORY = [
  { sku: 'BB-001', name: 'Biji Sorgum',           type: 'Bahan Baku',  stock: 150, unit: 'kg',  min_stock: 50,  unit_price: 0,     cost_price: 8000  },
  { sku: 'BB-002', name: 'Gula Sorgum',           type: 'Bahan Baku',  stock: 100, unit: 'kg',  min_stock: 30,  unit_price: 0,     cost_price: 15000 },
  { sku: 'BB-003', name: 'Kemasan Pouch',         type: 'Bahan Baku',  stock: 500, unit: 'pcs', min_stock: 100, unit_price: 0,     cost_price: 1500  },
  { sku: 'PJ-001', name: 'Tepung Sorgum Organik', type: 'Produk Jadi', stock: 80,  unit: 'pcs', min_stock: 20,  unit_price: 25000, cost_price: 12000 },
  { sku: 'PJ-002', name: 'Sirup Gula Sorgum',     type: 'Produk Jadi', stock: 50,  unit: 'pcs', min_stock: 15,  unit_price: 35000, cost_price: 18000 },
];

const SEED_USERS = [
  { id: 'u-owner', email: 'owner@sorgum.local', role: 'owner', status: 'active', company_id: 'c-sorgum' },
  { id: 'u-manager', email: 'manager@sorgum.local', role: 'manager', status: 'active', company_id: 'c-sorgum' },
  { id: 'u-staff', email: 'staff@sorgum.local', role: 'staff', status: 'active', company_id: 'c-sorgum' },
];

const SEED_COMPANY = {
  id: 'demo-settings',
  company_name: 'Sorgumology',
  address: 'Jl. Sorgum Raya No. 1, Indonesia',
  npwp: '-',
  logo_url: '',
  currency: 'IDR',
  depreciation_method: 'Straight-Line',
  fiscal_year_start: 1,
  company_id: 'c-sorgum',
};

// ─── LocalStorage Demo DB ───────────────────────────────────────────────────
function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem('sl_' + key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function lsSet(key, value) {
  try {
    localStorage.setItem('sl_' + key, JSON.stringify(value));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
      console.warn('LocalStorage quota exceeded. Pruning old audit logs to free space.');
      try {
        const logsVal = localStorage.getItem('sl_audit_logs');
        if (logsVal) {
          const logs = JSON.parse(logsVal);
          if (logs.length > 15) {
            localStorage.setItem('sl_audit_logs', JSON.stringify(logs.slice(0, 15)));
            localStorage.setItem('sl_' + key, JSON.stringify(value));
            return;
          }
        }
      } catch (pruneError) {
        console.error('Failed to prune audit logs during quota recovery:', pruneError);
      }
    }
    throw e;
  }
}

export function runDbMigrationToV3() {
  const currentVersion = localStorage.getItem('sl_db_version');
  if (currentVersion === '3') return;

  const init = lsGet('init', false);
  if (!init) {
    localStorage.setItem('sl_db_version', '3');
    return;
  }

  console.log('Running database migration to version 3 (ERP COA Upgrade)...');

  const snapshot = {
    coa: lsGet('coa', []),
    transactions: lsGet('transactions', []),
    journal_entries: lsGet('journal_entries', []),
    journal_items: lsGet('journal_items', []),
    fixed_assets: lsGet('fixed_assets', []),
    depreciation_records: lsGet('depreciation_records', []),
    closing_periods: lsGet('closing_periods', []),
    company_settings: lsGet('company_settings', {}),
    audit_logs: lsGet('audit_logs', [])
  };

  try {
    const MAPPING_3_TO_4 = {
      '101': '1010',
      '102': '1030',
      '103': '1060',
      '104': '1050',
      '111': '1230',
      '112': '1260',
      '201': '2010',
      '301': '3010',
      '302': '3020',
      '303': '3030',
      '401': '4010',
      '501': '5010',
      '502': '6110',
      '503': '6130',
      '504': '6140',
      '505': '6150',
    };

    const upgradeCode = (c) => {
      if (!c) return c;
      if (MAPPING_3_TO_4[c]) return MAPPING_3_TO_4[c];
      if (c.length === 3) return c + '0';
      return c;
    };

    const newCoaCodes = new Set(SEED_COA.map(a => a.code));
    const migratedUserCoa = snapshot.coa
      .map(oldAcc => {
        const newCode = upgradeCode(oldAcc.code);
        if (newCoaCodes.has(newCode)) return null;

        let accountClass = oldAcc.classification ? oldAcc.classification.toLowerCase() : 'expense';
        if (accountClass === 'contra asset') accountClass = 'asset';
        
        let subClassification = 'Expense';
        if (oldAcc.classification === 'Asset') subClassification = 'Current Asset';
        else if (oldAcc.classification === 'Contra Asset') subClassification = 'Contra Asset';
        else if (oldAcc.classification === 'Liability') subClassification = 'Current Liability';
        else if (oldAcc.classification === 'Equity') subClassification = 'Equity';
        else if (oldAcc.classification === 'Revenue') subClassification = 'Revenue';
        else if (oldAcc.classification === 'Expense') subClassification = 'Expense';

        return {
          code: newCode,
          name: oldAcc.name,
          account_class: accountClass,
          sub_classification: subClassification,
          normal_balance: oldAcc.normal_balance || 'Debit',
          system_role: null,
          business_role: null,
          behaviors: { can_pay: false, affects_stock: false, default_payment: false, closing_account: false },
          created_at: oldAcc.created_at || new Date().toISOString()
        };
      })
      .filter(Boolean);

    const finalCoaList = [...SEED_COA, ...migratedUserCoa];

    const migratedTransactions = snapshot.transactions.map(tx => ({
      ...tx,
      category_code: upgradeCode(tx.category_code)
    }));

    const migratedJournalItems = snapshot.journal_items.map(item => ({
      ...item,
      account_code: upgradeCode(item.account_code)
    }));

    lsSet('coa', finalCoaList);
    lsSet('transactions', migratedTransactions);
    lsSet('journal_items', migratedJournalItems);

    const newLog = {
      id: crypto.randomUUID(),
      user_id: 'system',
      user_email: 'system@sorgum.local',
      action: 'MIGRATION_SUCCESS: Database successfully upgraded to v3 (ERP 4-digit COA structure)',
      table_name: 'coa',
      record_id: 'v3',
      old_value: { version: '2' },
      new_value: { version: '3', coaCount: finalCoaList.length, txCount: migratedTransactions.length },
      created_at: new Date().toISOString()
    };
    lsSet('audit_logs', [newLog, ...snapshot.audit_logs]);

    localStorage.setItem('sl_db_version', '3');
    console.log('Migration to v3 finished successfully!');

  } catch (error) {
    console.error('Migration to v3 failed. Rolling back...', error);
    lsSet('coa', snapshot.coa);
    lsSet('transactions', snapshot.transactions);
    lsSet('journal_entries', snapshot.journal_entries);
    lsSet('journal_items', snapshot.journal_items);
    lsSet('fixed_assets', snapshot.fixed_assets);
    lsSet('depreciation_records', snapshot.depreciation_records);
    lsSet('closing_periods', snapshot.closing_periods);
    lsSet('company_settings', snapshot.company_settings);
    lsSet('audit_logs', snapshot.audit_logs);
    
    const failLog = {
      id: crypto.randomUUID(),
      user_id: 'system',
      user_email: 'system@sorgum.local',
      action: 'MIGRATION_FAILED: Database migration to v3 failed. Restored to snapshot.',
      table_name: 'coa',
      record_id: 'v3',
      old_value: { error: error.message || String(error) },
      new_value: null,
      created_at: new Date().toISOString()
    };
    lsSet('audit_logs', [failLog, ...snapshot.audit_logs]);
    throw error;
  }
}

export function runDbMigrationToV4() {
  const currentVersion = localStorage.getItem('sl_db_version');
  if (currentVersion === '4') return;

  const init = lsGet('init', false);
  if (!init) {
    localStorage.setItem('sl_db_version', '4');
    return;
  }

  console.log('Running database migration to version 4 (SAP-like COA system_role splitting)...');

  const snapshot = {
    coa: lsGet('coa', []),
    transactions: lsGet('transactions', []),
    journal_entries: lsGet('journal_entries', []),
    journal_items: lsGet('journal_items', []),
    fixed_assets: lsGet('fixed_assets', []),
    depreciation_records: lsGet('depreciation_records', []),
    closing_periods: lsGet('closing_periods', []),
    company_settings: lsGet('company_settings', {}),
    audit_logs: lsGet('audit_logs', [])
  };

  try {
    const ROLE_MAPPING = {
      'cash_primary': 'default_cash_account',
      'receivable_primary': 'default_receivable_account',
      'inventory_finished': 'default_inventory_finished_account',
      'inventory_raw': 'default_inventory_raw_account',
      'fixed_asset_primary': 'default_fixed_asset_account',
      'accum_depr_primary': 'default_accum_depr_account',
      'payable_primary': 'default_payable_account',
      'retained_earnings': 'default_retained_earnings',
      'income_summary': 'default_income_summary',
      'sales_primary': 'default_sales_account',
      'cogs_primary': 'default_cogs_account',
      'depr_expense_primary': 'default_depr_expense_account',
      'default_salary': 'default_salary_account',
      'default_rent': 'default_rent_account',
      'default_office_supplies': 'default_office_supplies_account'
    };

    const migratedCoa = snapshot.coa.map(acc => {
      const oldRole = acc.system_role;
      const newRole = oldRole ? (ROLE_MAPPING[oldRole] || oldRole) : null;

      // Extract purpose
      let purpose = 'operational';
      if (newRole === 'default_retained_earnings' || newRole === 'default_income_summary') {
        purpose = 'closing';
      } else if (newRole === 'default_accum_depr_account' || newRole === 'default_depr_expense_account') {
        purpose = 'adjustment';
      }

      // Extract tag (convert business_role to account_tag)
      const tag = acc.business_role || null;

      const { business_role, ...rest } = acc;
      return {
        ...rest,
        system_role: newRole,
        account_purpose: purpose,
        account_tag: tag,
        behaviors: { schema_version: "1.0", ...(acc.behaviors || {}) }
      };
    });

    lsSet('coa', migratedCoa);

    const newLog = {
      id: crypto.randomUUID(),
      user_id: 'system',
      user_email: 'system@sorgum.local',
      action: 'MIGRATION_SUCCESS: Database successfully upgraded to v4 (SAP-like COA system_role splitting)',
      table_name: 'coa',
      record_id: 'v4',
      old_value: { version: '3' },
      new_value: { version: '4', coaCount: migratedCoa.length },
      created_at: new Date().toISOString()
    };
    lsSet('audit_logs', [newLog, ...snapshot.audit_logs]);

    localStorage.setItem('sl_db_version', '4');
    console.log('Migration to v4 finished successfully!');

  } catch (error) {
    console.error('Migration to v4 failed. Rolling back...', error);
    lsSet('coa', snapshot.coa);
    lsSet('transactions', snapshot.transactions);
    lsSet('journal_entries', snapshot.journal_entries);
    lsSet('journal_items', snapshot.journal_items);
    lsSet('fixed_assets', snapshot.fixed_assets);
    lsSet('depreciation_records', snapshot.depreciation_records);
    lsSet('closing_periods', snapshot.closing_periods);
    lsSet('company_settings', snapshot.company_settings);
    lsSet('audit_logs', snapshot.audit_logs);

    const failLog = {
      id: crypto.randomUUID(),
      user_id: 'system',
      user_email: 'system@sorgum.local',
      action: 'MIGRATION_FAILED: Database migration to v4 failed. Restored to snapshot.',
      table_name: 'coa',
      record_id: 'v4',
      old_value: { error: error.message || String(error) },
      new_value: null,
      created_at: new Date().toISOString()
    };
    lsSet('audit_logs', [failLog, ...snapshot.audit_logs]);
    throw error;
  }
}

function initDemo() {
  if (!lsGet('init', false)) {
    const coaWithSchema = SEED_COA.map(acc => ({
      ...acc,
      behaviors: { schema_version: "1.0", ...(acc.behaviors || {}) }
    }));
    lsSet('coa',              coaWithSchema);
    lsSet('inventory',        SEED_INVENTORY.map(i => ({ ...i, company_id: 'c-sorgum' })));
    lsSet('transactions',     []);
    lsSet('journal_entries',  []);
    lsSet('journal_items',    []);
    lsSet('fixed_assets',     []);
    lsSet('depreciation_records', []);
    lsSet('closing_periods',  []);
    lsSet('audit_logs',       []);
    lsSet('users',            SEED_USERS);
    lsSet('company_settings', SEED_COMPANY);
    lsSet('invitations',      []);
    lsSet('init',             true);
    localStorage.setItem('sl_db_version', '4');
  }
}

if (isDemoMode) {
  runDbMigrationToV3();
  runDbMigrationToV4();
  initDemo();
}

// ─── Unified DB abstraction ─────────────────────────────────────────────────
// Every method returns { data, error } mirroring Supabase client.

export const db = {
  // Generic select
  async from(table) {
    if (isDemoMode) {
      return {
        select: async () => ({ data: lsGet(table, []), error: null }),
        insert: async (rows) => {
          const arr = lsGet(table, []);
          const newRows = Array.isArray(rows) ? rows : [rows];
          newRows.forEach(r => { if (!r.id) r.id = crypto.randomUUID(); if (!r.created_at) r.created_at = new Date().toISOString(); });
          lsSet(table, [...arr, ...newRows]);
          return { data: newRows, error: null };
        },
        update: async (updates, matchKey, matchVal) => {
          const arr = lsGet(table, []);
          const updated = arr.map(r => r[matchKey] === matchVal ? { ...r, ...updates } : r);
          lsSet(table, updated);
          return { data: updated.filter(r => r[matchKey] === matchVal), error: null };
        },
        delete: async (matchKey, matchVal) => {
          const arr = lsGet(table, []);
          lsSet(table, arr.filter(r => r[matchKey] !== matchVal));
          return { data: null, error: null };
        },
      };
    }
    // Real Supabase — return the query builder
    return supabase.from(table);
  },

  // Shorthand helpers used by App.jsx
  async getAll(table) {
    if (isDemoMode) return { data: lsGet(table, []), error: null };
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    return { data, error };
  },

  async insert(table, row) {
    if (isDemoMode) {
      const arr = lsGet(table, []);
      const newRow = { ...row, id: row.id || crypto.randomUUID(), created_at: new Date().toISOString() };
      lsSet(table, [newRow, ...arr]);
      return { data: newRow, error: null };
    }
    const { data, error } = await supabase.from(table).insert(row).select().single();
    return { data, error };
  },

  async update(table, id, updates) {
    if (isDemoMode) {
      const arr = lsGet(table, []);
      const updated = arr.map(r => r.id === id ? { ...r, ...updates } : r);
      lsSet(table, updated);
      return { data: updated.find(r => r.id === id), error: null };
    }
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
    return { data, error };
  },

  async delete(table, id) {
    if (isDemoMode) {
      const arr = lsGet(table, []);
      lsSet(table, arr.filter(r => r.id !== id));
      return { data: null, error: null };
    }
    const { error } = await supabase.from(table).delete().eq('id', id);
    return { data: null, error };
  },

  async updateWhere(table, field, value, updates) {
    if (isDemoMode) {
      const arr = lsGet(table, []);
      const updated = arr.map(r => r[field] === value ? { ...r, ...updates } : r);
      lsSet(table, updated);
      return { data: null, error: null };
    }
    const { error } = await supabase.from(table).update(updates).eq(field, value);
    return { data: null, error };
  },

  // Inventory stock update by SKU
  async updateStock(sku, newStock) {
    if (isDemoMode) {
      const arr = lsGet('inventory', []);
      lsSet('inventory', arr.map(i => i.sku === sku ? { ...i, stock: newStock } : i));
      return { error: null };
    }
    const { error } = await supabase.from('inventory').update({ stock: newStock }).eq('sku', sku);
    return { error };
  },

  // Get company settings (single row)
  async getSettings() {
    if (isDemoMode) return { data: lsGet('company_settings', SEED_COMPANY), error: null };
    const { data, error } = await supabase.from('company_settings').select('*').single();
    return { data: data || SEED_COMPANY, error };
  },

  async upsertSettings(settings) {
    if (isDemoMode) {
      lsSet('company_settings', settings);
      return { data: settings, error: null };
    }
    const { data, error } = await supabase.from('company_settings').upsert(settings).select().single();
    return { data, error };
  },

  // Auth helpers
  auth: {
    async signIn(email, password) {
      if (isDemoMode) {
        const users = lsGet('users', SEED_USERS);
        let u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
        if (!u) {
          return { data: { user: null }, error: { message: 'Email tidak ditemukan. Hubungi Owner untuk mendapatkan undangan.' } };
        }
        lsSet('session', u);
        return { data: { user: u }, error: null };
      }
      return supabase.auth.signInWithPassword({ email, password });
    },
    async signUp(email, password, fullName, role = 'staff') {
      if (isDemoMode) {
        const users = lsGet('users', SEED_USERS);
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          return {
            data: { user: null },
            error: { message: 'Email ini sudah terdaftar sebagai pengguna.' }
          };
        }

        // If owner email, register directly as active
        if (email.toLowerCase() === 'owner@sorgum.local') {
          let u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
          if (!u) {
            u = { id: 'u-' + crypto.randomUUID().slice(0, 8), email, role: 'owner', status: 'active', company_id: 'c-sorgum' };
            lsSet('users', [...users, u]);
          }
          lsSet('session', u);
          return { data: { user: u }, error: null };
        }

        // Check invitations list
        const invitations = lsGet('invitations', []);
        const inviteIndex = invitations.findIndex(inv => inv.email.toLowerCase() === email.toLowerCase());
        if (inviteIndex === -1) {
          return { 
            data: { user: null }, 
            error: { message: 'Email ini tidak terdaftar dalam undangan perusahaan. Silakan hubungi Owner.' } 
          };
        }

        const invitation = invitations[inviteIndex];
        const newUser = {
          id: 'u-' + crypto.randomUUID().slice(0, 8),
          email,
          role: invitation.role,
          status: 'pending', // Signups start as pending
          company_id: invitation.company_id || 'c-sorgum'
        };

        // Add to users
        lsSet('users', [...users, newUser]);

        // Remove from invitations
        invitations.splice(inviteIndex, 1);
        lsSet('invitations', invitations);

        // In demo mode, log the user session
        lsSet('session', newUser);
        return { data: { user: newUser }, error: null };
      }
      return supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } });
    },
    async signOut() {
      if (isDemoMode) { lsSet('session', null); return { error: null }; }
      return supabase.auth.signOut();
    },
    async getSession() {
      if (isDemoMode) {
        const u = lsGet('session', null);
        return { data: { session: u ? { user: u } : null }, error: null };
      }
      return supabase.auth.getSession();
    },
    onAuthStateChange(cb) {
      if (isDemoMode) return { data: { subscription: { unsubscribe: () => {} } } };
      return supabase.auth.onAuthStateChange(cb);
    },
  },
};
