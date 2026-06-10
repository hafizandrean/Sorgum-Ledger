-- ============================================================
-- SorgumLedger — Database Schema (Refined with Multi-Tenancy)
-- Paste this into the Supabase SQL Editor to initialize your DB.
-- ============================================================

create extension if not exists "uuid-ossp";

-- 1. COMPANIES (Multi-Tenancy)
create table public.companies (
    id          uuid default gen_random_uuid() primary key,
    name        varchar(255) not null,
    created_at  timestamp with time zone default timezone('utc', now()) not null
);

-- Seed Default Company
insert into public.companies (id, name) values 
('c0000000-0000-0000-0000-000000000000', 'Sorgumology')
on conflict (id) do nothing;

-- 2. CHART OF ACCOUNTS (COA - Global)
create table public.coa (
    code        varchar(10) primary key,
    name        varchar(100) not null,
    account_class varchar(50) not null
        check (account_class in ('asset', 'liability', 'equity', 'revenue', 'expense')),
    sub_classification varchar(50) not null check (sub_classification in (
        'Current Asset', 'Fixed Asset', 'Contra Asset',
        'Current Liability', 'Long-Term Liability',
        'Equity', 'Revenue', 'Cost of Goods Sold',
        'Expense', 'Tax'
    )),
    normal_balance varchar(10) not null check (normal_balance in ('Debit', 'Credit')),
    system_role varchar(50) null unique,
    account_purpose varchar(50) not null check (account_purpose in ('operational', 'closing', 'adjustment')),
    account_tag varchar(50) null,
    behaviors jsonb not null,
    created_at  timestamp with time zone default timezone('utc', now()) not null
);

-- Seed Chart of Accounts
insert into public.coa (code, name, account_class, sub_classification, normal_balance, system_role, account_purpose, account_tag, behaviors) values
-- Aset Lancar
('1010', 'Kas', 'asset', 'Current Asset', 'Debit', 'default_cash_account', 'operational', 'cash', '{"can_pay": true, "affects_stock": false, "default_payment": true, "closing_account": false}'),
('1020', 'Bank', 'asset', 'Current Asset', 'Debit', null, 'operational', 'bank', '{"can_pay": true, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1030', 'Piutang Usaha', 'asset', 'Current Asset', 'Debit', 'default_receivable_account', 'operational', 'receivable', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1040', 'Piutang Lain-lain', 'asset', 'Current Asset', 'Debit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1050', 'Persediaan Barang Dagang', 'asset', 'Current Asset', 'Debit', 'default_inventory_finished_account', 'operational', 'inventory', '{"can_pay": false, "affects_stock": true, "default_payment": false, "closing_account": false}'),
('1060', 'Persediaan Bahan Baku', 'asset', 'Current Asset', 'Debit', 'default_inventory_raw_account', 'operational', 'inventory', '{"can_pay": false, "affects_stock": true, "default_payment": false, "closing_account": false}'),
('1070', 'Persediaan Barang Dalam Proses (WIP)', 'asset', 'Current Asset', 'Debit', null, 'operational', 'inventory', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1080', 'Beban Dibayar di Muka', 'asset', 'Current Asset', 'Debit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1090', 'Pajak Dibayar di Muka', 'asset', 'Current Asset', 'Debit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
-- Aset Tetap
('1210', 'Tanah', 'asset', 'Fixed Asset', 'Debit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1220', 'Bangunan', 'asset', 'Fixed Asset', 'Debit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1230', 'Mesin & Peralatan', 'asset', 'Fixed Asset', 'Debit', 'default_fixed_asset_account', 'operational', 'fixed_asset', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1240', 'Kendaraan', 'asset', 'Fixed Asset', 'Debit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1250', 'Peralatan Kantor', 'asset', 'Fixed Asset', 'Debit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1260', 'Akumulasi Penyusutan Mesin', 'asset', 'Contra Asset', 'Credit', 'default_accum_depr_account', 'adjustment', 'contra_asset', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
-- Aset Lain-lain
('1310', 'Investasi Jangka Panjang', 'asset', 'Current Asset', 'Debit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1320', 'Hak Paten / Lisensi', 'asset', 'Current Asset', 'Debit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1330', 'Aset Tidak Berwujud', 'asset', 'Current Asset', 'Debit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('1340', 'Uang Jaminan', 'asset', 'Current Asset', 'Debit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
-- Kewajiban Lancar
('2010', 'Utang Usaha', 'liability', 'Current Liability', 'Credit', 'default_payable_account', 'operational', 'payable', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('2020', 'Utang Bank Jangka Pendek', 'liability', 'Current Liability', 'Credit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('2030', 'Beban yang Masih Harus Dibayar', 'liability', 'Current Liability', 'Credit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('2040', 'Utang Pajak', 'liability', 'Current Liability', 'Credit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('2050', 'Uang Muka Pelanggan', 'liability', 'Current Liability', 'Credit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('2060', 'Utang Gaji', 'liability', 'Current Liability', 'Credit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
-- Kewajiban Jangka Panjang
('2210', 'Utang Bank Jangka Panjang', 'liability', 'Long-Term Liability', 'Credit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('2220', 'Utang Leasing', 'liability', 'Long-Term Liability', 'Credit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('2230', 'Obligasi', 'liability', 'Long-Term Liability', 'Credit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('2240', 'Kewajiban Imbalan Kerja', 'liability', 'Long-Term Liability', 'Credit', null, 'operational', null, '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
-- Ekuitas
('3010', 'Modal Disetor', 'equity', 'Equity', 'Credit', null, 'operational', 'equity', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('3020', 'Laba Ditahan', 'equity', 'Equity', 'Credit', 'default_retained_earnings', 'closing', 'equity', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('3030', 'Laba Tahun Berjalan', 'equity', 'Equity', 'Credit', 'default_income_summary', 'closing', 'equity', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": true}'),
('3040', 'Prive / Penarikan Pemilik', 'equity', 'Equity', 'Credit', null, 'operational', 'equity', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('3050', 'Cadangan Modal', 'equity', 'Equity', 'Credit', null, 'operational', 'equity', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
-- Pendapatan
('4010', 'Penjualan Produk', 'revenue', 'Revenue', 'Credit', 'default_sales_account', 'operational', 'revenue', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('4020', 'Penjualan Jasa', 'revenue', 'Revenue', 'Credit', null, 'operational', 'revenue', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('4030', 'Diskon Penjualan', 'revenue', 'Revenue', 'Debit', null, 'operational', 'revenue', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('4040', 'Retur Penjualan', 'revenue', 'Revenue', 'Debit', null, 'operational', 'revenue', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('4050', 'Pendapatan Lain-lain', 'revenue', 'Revenue', 'Credit', null, 'operational', 'revenue', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('4060', 'Pendapatan Ekspor', 'revenue', 'Revenue', 'Credit', null, 'operational', 'revenue', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
-- HPP
('5010', 'Harga Pokok Penjualan (HPP)', 'expense', 'Cost of Goods Sold', 'Debit', 'default_cogs_account', 'operational', 'cogs', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('5020', 'Biaya Tenaga Kerja Langsung', 'expense', 'Cost of Goods Sold', 'Debit', null, 'operational', 'cogs', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('5030', 'Overhead Produksi', 'expense', 'Cost of Goods Sold', 'Debit', null, 'operational', 'cogs', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('5040', 'Persediaan Awal', 'expense', 'Cost of Goods Sold', 'Debit', null, 'operational', 'cogs', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('5050', 'Persediaan Akhir', 'expense', 'Cost of Goods Sold', 'Credit', null, 'operational', 'cogs', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('5060', 'Biaya Pengiriman Barang Masuk', 'expense', 'Cost of Goods Sold', 'Debit', null, 'operational', 'cogs', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
-- Beban Penjualan
('6010', 'Beban Marketing', 'expense', 'Expense', 'Debit', null, 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('6020', 'Beban Distribusi', 'expense', 'Expense', 'Debit', null, 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('6030', 'Beban Komisi', 'expense', 'Expense', 'Debit', null, 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('6040', 'Beban Promosi', 'expense', 'Expense', 'Debit', null, 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
-- Beban Administrasi & Umum
('6110', 'Gaji Karyawan', 'expense', 'Expense', 'Debit', 'default_salary_account', 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('6120', 'Listrik, Air, Internet', 'expense', 'Expense', 'Debit', null, 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('6130', 'Sewa Kantor', 'expense', 'Expense', 'Debit', 'default_rent_account', 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('6140', 'ATK & Perlengkapan', 'expense', 'Expense', 'Debit', 'default_office_supplies_account', 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('6150', 'Beban Penyusutan', 'expense', 'Expense', 'Debit', 'default_depr_expense_account', 'adjustment', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('6160', 'Beban Pemeliharaan', 'expense', 'Expense', 'Debit', null, 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('6170', 'Biaya Legal & Perizinan', 'expense', 'Expense', 'Debit', null, 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
-- Beban Lain-lain
('6210', 'Beban Bunga', 'expense', 'Expense', 'Debit', null, 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('6220', 'Kerugian Selisih Kurs', 'expense', 'Expense', 'Debit', null, 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('6230', 'Beban Tak Terduga', 'expense', 'Expense', 'Debit', null, 'operational', 'expense', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
-- Pajak
('7010', 'PPN Keluaran', 'liability', 'Tax', 'Credit', null, 'operational', 'tax', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('7020', 'PPN Masukan', 'asset', 'Tax', 'Debit', null, 'operational', 'tax', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('7030', 'PPh Badan', 'expense', 'Tax', 'Debit', null, 'operational', 'tax', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}'),
('7040', 'Pajak Lain-lain', 'expense', 'Tax', 'Debit', null, 'operational', 'tax', '{"can_pay": false, "affects_stock": false, "default_payment": false, "closing_account": false}')
on conflict (code) do nothing;


-- 3. USERS (Role-Based Access Control)
create table public.users (
    id          uuid references auth.users(id) on delete cascade primary key,
    email       varchar(255) not null unique,
    role        varchar(20) not null check (role in ('owner', 'manager', 'staff')),
    status      varchar(20) not null default 'pending' check (status in ('pending', 'active', 'suspended')),
    company_id  uuid references public.companies(id) on delete cascade default 'c0000000-0000-0000-0000-000000000000' not null,
    created_at  timestamp with time zone default timezone('utc', now()) not null
);

-- Invitations Table
create table public.invitations (
    id          uuid primary key default gen_random_uuid(),
    email       varchar(255) not null unique,
    role        varchar(20) not null check (role in ('manager', 'staff')),
    company_id  uuid references public.companies(id) on delete cascade default 'c0000000-0000-0000-0000-000000000000' not null,
    created_at  timestamp with time zone default timezone('utc', now()) not null
);

-- Trigger to handle new auth signups and verify invitations
create or replace function public.handle_new_user()
returns trigger as $$
declare
  invited_role varchar(20);
  invited_company_id uuid;
begin
  -- Check if this email is the owner
  if new.email = 'owner@sorgum.local' then
    insert into public.users (id, email, role, status, company_id)
    values (new.id, new.email, 'owner', 'active', 'c0000000-0000-0000-0000-000000000000');
    return new;
  end if;

  -- Check if email is invited
  select role, company_id into invited_role, invited_company_id 
  from public.invitations where email = new.email;
  
  if invited_role is null then
    raise exception 'Email ini tidak terdaftar dalam undangan perusahaan. Silakan hubungi Owner.';
  end if;

  -- Insert user with invited role and status pending
  insert into public.users (id, email, role, status, company_id)
  values (new.id, new.email, invited_role, 'pending', invited_company_id);

  -- Delete invitation row
  delete from public.invitations where email = new.email;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 4. INVENTORY
create table public.inventory (
    sku         varchar(50) primary key,
    name        varchar(255) not null,
    type        varchar(50) not null check (type in ('Bahan Baku', 'Produk Jadi')),
    stock       decimal(12,2) default 0.00 not null,
    unit        varchar(20) not null,
    min_stock   decimal(12,2) default 0.00 not null,
    unit_price  decimal(12,2) default 0.00 not null,   -- Harga Jual
    cost_price  decimal(12,2) default 0.00 not null,   -- Harga Pokok per unit (HPP)
    user_id     uuid references public.users(id) on delete set null,
    company_id  uuid references public.companies(id) on delete cascade default 'c0000000-0000-0000-0000-000000000000' not null,
    created_at  timestamp with time zone default timezone('utc', now()) not null
);

insert into public.inventory (sku, name, type, stock, unit, min_stock, unit_price, cost_price, company_id) values
('BB-001', 'Biji Sorgum',            'Bahan Baku',  150.00, 'kg',  50.00,     0.00,  8000.00, 'c0000000-0000-0000-0000-000000000000'),
('BB-002', 'Gula Sorgum',            'Bahan Baku',  100.00, 'kg',  30.00,     0.00, 15000.00, 'c0000000-0000-0000-0000-000000000000'),
('BB-003', 'Kemasan Pouch',          'Bahan Baku',  500.00, 'pcs', 100.00,    0.00,  1500.00, 'c0000000-0000-0000-0000-000000000000'),
('PJ-001', 'Tepung Sorgum Organik',  'Produk Jadi',  80.00, 'pcs',  20.00, 25000.00, 12000.00, 'c0000000-0000-0000-0000-000000000000'),
('PJ-002', 'Sirup Gula Sorgum',      'Produk Jadi',  50.00, 'pcs',  15.00, 35000.00, 18000.00, 'c0000000-0000-0000-0000-000000000000')
on conflict (sku) do nothing;


-- 5. TRANSACTIONS
create table public.transactions (
    id           uuid default gen_random_uuid() primary key,
    date         date not null,
    type         varchar(20) not null check (type in ('Pemasukan', 'Pengeluaran')),
    category_code varchar(10) references public.coa(code),
    nominal      decimal(12,2) not null,
    description  text,
    product_sku  varchar(50) references public.inventory(sku),
    quantity     decimal(12,2) default 0.00,
    is_closed    boolean default false not null,
    status       varchar(20) default 'draft' not null check (status in ('draft', 'pending', 'approved', 'posted')),
    created_by   uuid references public.users(id) on delete set null,
    approved_by  uuid references public.users(id) on delete set null,
    approved_at  timestamp with time zone,
    posted_by    uuid references public.users(id) on delete set null,
    posted_at    timestamp with time zone,
    user_id      uuid references public.users(id) on delete set null,
    company_id   uuid references public.companies(id) on delete cascade default 'c0000000-0000-0000-0000-000000000000' not null,
    created_at   timestamp with time zone default timezone('utc', now()) not null
);


-- 6. JOURNAL ENTRIES
create table public.journal_entries (
    id             uuid default gen_random_uuid() primary key,
    transaction_id uuid references public.transactions(id) on delete cascade,
    date           date not null,
    description    text,
    is_closed      boolean default false not null,
    user_id        uuid references public.users(id) on delete set null,
    company_id     uuid references public.companies(id) on delete cascade default 'c0000000-0000-0000-0000-000000000000' not null,
    created_at     timestamp with time zone default timezone('utc', now()) not null
);


-- 7. JOURNAL ITEMS (double-entry lines)
create table public.journal_items (
    id               uuid default gen_random_uuid() primary key,
    journal_entry_id uuid references public.journal_entries(id) on delete cascade not null,
    account_code     varchar(10) references public.coa(code) not null,
    debit            decimal(12,2) default 0.00 not null,
    credit           decimal(12,2) default 0.00 not null,
    constraint check_debit_credit check (
        (debit > 0 and credit = 0) or (credit > 0 and debit = 0)
    )
);


-- 8. FIXED ASSETS
create table public.fixed_assets (
    id                 uuid default gen_random_uuid() primary key,
    name               varchar(255) not null,
    cost               decimal(12,2) not null,
    useful_life_months int not null,
    salvage_value      decimal(12,2) default 0.00 not null,
    purchase_date      date not null,
    status             varchar(50) default 'Active' not null
        check (status in ('Active', 'Disposed', 'Fully Depreciated')),
    user_id            uuid references public.users(id) on delete set null,
    company_id         uuid references public.companies(id) on delete cascade default 'c0000000-0000-0000-0000-000000000000' not null,
    created_at         timestamp with time zone default timezone('utc', now()) not null
);


-- 9. DEPRECIATION RECORDS
create table public.depreciation_records (
    id               uuid default gen_random_uuid() primary key,
    asset_id         uuid references public.fixed_assets(id) on delete cascade not null,
    date             date not null,
    nominal          decimal(12,2) not null,
    period_month     int not null check (period_month between 1 and 12),
    period_year      int not null,
    journal_entry_id uuid references public.journal_entries(id) on delete set null,
    user_id          uuid references public.users(id) on delete set null,
    company_id       uuid references public.companies(id) on delete cascade default 'c0000000-0000-0000-0000-000000000000' not null,
    created_at       timestamp with time zone default timezone('utc', now()) not null,
    constraint unique_asset_period unique (asset_id, period_month, period_year)
);


-- 10. CLOSING PERIODS
create table public.closing_periods (
    id           uuid default gen_random_uuid() primary key,
    period_month int not null check (period_month between 1 and 12),
    period_year  int not null,
    net_income   decimal(12,2) default 0.00,
    closed_by    varchar(255),
    closed_at    timestamp with time zone default timezone('utc', now()) not null,
    user_id      uuid references public.users(id) on delete set null,
    company_id   uuid references public.companies(id) on delete cascade default 'c0000000-0000-0000-0000-000000000000' not null,
    constraint unique_period unique (period_month, period_year, user_id)
);


-- 11. AUDIT LOGS
create table public.audit_logs (
    id          uuid default gen_random_uuid() primary key,
    user_id     uuid references public.users(id) on delete set null,
    user_email  varchar(255),
    action      text not null,
    table_name  varchar(100),
    record_id   varchar(100),
    old_value   jsonb,
    new_value   jsonb,
    company_id  uuid references public.companies(id) on delete cascade default 'c0000000-0000-0000-0000-000000000000' not null,
    created_at  timestamp with time zone default timezone('utc', now()) not null
);


-- 12. COMPANY SETTINGS (for Settings module)
create table public.company_settings (
    id                   uuid default gen_random_uuid() primary key,
    company_name         varchar(255) default 'Sorgumology',
    address              text,
    npwp                 varchar(50),
    logo_url             text,
    currency             varchar(10) default 'IDR',
    depreciation_method  varchar(50) default 'Straight-Line',
    fiscal_year_start    int default 1,
    user_id              uuid references public.users(id) on delete cascade unique,
    company_id           uuid references public.companies(id) on delete cascade default 'c0000000-0000-0000-0000-000000000000' not null,
    updated_at           timestamp with time zone default timezone('utc', now()) not null
);


-- Enable RLS for all tables
alter table public.coa               enable row level security;
alter table public.inventory         enable row level security;
alter table public.journal_entries   enable row level security;
alter table public.journal_items     enable row level security;
alter table public.fixed_assets      enable row level security;
alter table public.depreciation_records enable row level security;
alter table public.closing_periods   enable row level security;
alter table public.company_settings  enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- Multi-Tenant Security Helper Functions (Definer Context to Prevent RLS Recursion)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_user_company_id()
returns uuid as $$
    select company_id from public.users where id = auth.uid();
$$ language sql security definer;

create or replace function public.get_user_role()
returns varchar as $$
    select role from public.users where id = auth.uid();
$$ language sql security definer;


-- Row Level Security (RLS) configuration for public.users
alter table public.users enable row level security;

-- Policy 1: Users can view profiles in the same company
create policy users_read_all on public.users
    for select to authenticated
    using (company_id = public.get_user_company_id());

-- Policy 2: Only Owner can manage user profiles in their company
create policy owner_manage_users on public.users
    for all to authenticated
    using (
        public.get_user_role() = 'owner'
        and company_id = public.get_user_company_id()
    );


-- Row Level Security (RLS) configuration for public.invitations
alter table public.invitations enable row level security;

-- Policy 1: Only Owners can manage invitations for their company
create policy owner_manage_invitations on public.invitations
    for all to authenticated
    using (
        public.get_user_role() = 'owner'
        and company_id = public.get_user_company_id()
    );


-- Row Level Security (RLS) configuration for public.transactions
alter table public.transactions enable row level security;

-- Policy 1: Owner and Manager have full control over all transaction operations in their company
create policy owner_manager_all on public.transactions
    for all to authenticated
    using (
        public.get_user_role() in ('owner', 'manager')
        and company_id = public.get_user_company_id()
    );

-- Policy 2: Staff members can read transactions in their company
create policy staff_read_all on public.transactions
    for select to authenticated
    using (
        public.get_user_role() = 'staff'
        and company_id = public.get_user_company_id()
    );

-- Policy 3: Staff members can insert new transactions in their company
create policy staff_insert_new on public.transactions
    for insert to authenticated
    with check (
        public.get_user_role() = 'staff'
        and company_id = public.get_user_company_id()
        and status in ('draft', 'pending')
        and created_by = auth.uid()
    );

-- Policy 4: Staff members can update only their own draft transactions in their company
create policy staff_update_own_draft on public.transactions
    for update to authenticated
    using (
        created_by = auth.uid()
        and status = 'draft'
        and company_id = public.get_user_company_id()
    )
    with check (
        created_by = auth.uid()
        and status in ('draft', 'pending')
    );


-- Row Level Security (RLS) configuration for public.audit_logs
alter table public.audit_logs enable row level security;

-- Policy 1: Only Owner and Manager can select/read audit logs in their company
create policy manager_owner_read_audit on public.audit_logs
    for select to authenticated
    using (
        public.get_user_role() in ('owner', 'manager')
        and company_id = public.get_user_company_id()
    );

-- Policy 2: Anyone who is authenticated can insert audit logs of their own user session matching their company
create policy anyone_insert_audit on public.audit_logs
    for insert to authenticated
    with check (
        user_id = auth.uid()
        and company_id = public.get_user_company_id()
    );


-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS) policies for remaining tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Policies for coa
create policy coa_read_all on public.coa 
    for select to authenticated 
    using (company_id = 'c0000000-0000-0000-0000-000000000000'); -- Global read access for standard COA

create policy coa_write_owner_manager on public.coa 
    for all to authenticated 
    using (public.get_user_role() in ('owner', 'manager'));

-- Policies for inventory
create policy inventory_read_all on public.inventory 
    for select to authenticated 
    using (company_id = public.get_user_company_id());

create policy inventory_write_all on public.inventory 
    for all to authenticated 
    using (company_id = public.get_user_company_id());

-- Policies for journal_entries
create policy je_read_all on public.journal_entries 
    for select to authenticated 
    using (company_id = public.get_user_company_id());

create policy je_write_all on public.journal_entries 
    for all to authenticated 
    using (company_id = public.get_user_company_id());

-- Policies for journal_items
create policy ji_read_all on public.journal_items 
    for select to authenticated 
    using (exists (
        select 1 from public.journal_entries je 
        where je.id = journal_entry_id 
        and je.company_id = public.get_user_company_id()
    ));

create policy ji_write_all on public.journal_items 
    for all to authenticated 
    using (exists (
        select 1 from public.journal_entries je 
        where je.id = journal_entry_id 
        and je.company_id = public.get_user_company_id()
    ));

-- Policies for fixed_assets
create policy fa_read_all on public.fixed_assets 
    for select to authenticated 
    using (company_id = public.get_user_company_id());

create policy fa_write_all on public.fixed_assets 
    for all to authenticated 
    using (company_id = public.get_user_company_id());

-- Policies for depreciation_records
create policy dr_read_all on public.depreciation_records 
    for select to authenticated 
    using (company_id = public.get_user_company_id());

create policy dr_write_all on public.depreciation_records 
    for all to authenticated 
    using (company_id = public.get_user_company_id());

-- Policies for closing_periods
create policy cp_read_all on public.closing_periods 
    for select to authenticated 
    using (company_id = public.get_user_company_id());

create policy cp_write_all on public.closing_periods 
    for all to authenticated 
    using (company_id = public.get_user_company_id());

-- Policies for company_settings
create policy cs_read_all on public.company_settings 
    for select to authenticated 
    using (company_id = public.get_user_company_id());

create policy cs_write_all on public.company_settings 
    for all to authenticated 
    using (company_id = public.get_user_company_id());


-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers and DB Constraints
-- ─────────────────────────────────────────────────────────────────────────────

-- Trigger to prevent double posting transactions
create or replace function public.prevent_double_posting()
returns trigger as $$
begin
    if old.status = 'posted' then
        -- Allow setting is_closed, but raise error for other updates
        if new.status <> 'posted' or
           new.nominal <> old.nominal or
           new.date <> old.date or
           new.category_code <> old.category_code or
           new.type <> old.type or
           new.quantity <> old.quantity or
           new.product_sku <> old.product_sku then
            raise exception 'Transaction is already posted and cannot be modified';
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_double_posting on public.transactions;

create trigger trg_prevent_double_posting
    before update on public.transactions
    for each row execute procedure public.prevent_double_posting();


-- Trigger to prevent modification on closed journal entries (Immutability contract)
create or replace function public.prevent_modification_on_closed_journal()
returns trigger as $$
begin
    if TG_OP = 'DELETE' then
        if old.is_closed = true then
            raise exception 'Closed journal entry cannot be deleted.';
        end if;
        return old;
    else
        if old.is_closed = true then
            raise exception 'Closed journal entry cannot be modified.';
        end if;
        return new;
    end if;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_modification_on_closed_journal on public.journal_entries;

create trigger trg_prevent_modification_on_closed_journal
    before update or delete on public.journal_entries
    for each row execute procedure public.prevent_modification_on_closed_journal();


-- Trigger to prevent modification on closed journal items
create or replace function public.prevent_modification_on_closed_item()
returns trigger as $$
declare
    v_is_closed boolean;
begin
    if TG_OP = 'DELETE' then
        select is_closed into v_is_closed from public.journal_entries where id = old.journal_entry_id;
        if v_is_closed = true then
            raise exception 'Items of a closed journal entry cannot be deleted.';
        end if;
        return old;
    else
        select is_closed into v_is_closed from public.journal_entries where id = old.journal_entry_id;
        if v_is_closed = true then
            raise exception 'Items of a closed journal entry cannot be modified.';
        end if;
        return new;
    end if;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_modification_on_closed_item on public.journal_items;

create trigger trg_prevent_modification_on_closed_item
    before update or delete on public.journal_items
    for each row execute procedure public.prevent_modification_on_closed_item();


-- ─────────────────────────────────────────────────────────────────────────────
-- Database Indexing Strategy
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists idx_journal_items_account_code_entry on public.journal_items(account_code, journal_entry_id);
create index if not exists idx_journal_entries_company_date on public.journal_entries(company_id, date);
create index if not exists idx_coa_company_role on public.coa(company_id, system_role);
create index if not exists idx_transactions_company_status on public.transactions(company_id, status);
create index if not exists idx_inventory_company_sku on public.inventory(company_id, sku);


-- ─────────────────────────────────────────────────────────────────────────────
-- Financial Reporting Views (DB Single Source of Truth)
-- ─────────────────────────────────────────────────────────────────────────────

-- Income Statement View (Revenue and Expenses balance sheet calculations)
create or replace view public.income_statement_view as
select
    c.company_id,
    c.code as account_code,
    c.name as account_name,
    c.account_class,
    c.sub_classification,
    coalesce(sum(ji.debit), 0) as total_debit,
    coalesce(sum(ji.credit), 0) as total_credit,
    case
        when c.normal_balance = 'Debit' then coalesce(sum(ji.debit - ji.credit), 0)
        else coalesce(sum(ji.credit - ji.debit), 0)
    end as balance
from public.coa c
left join public.journal_items ji on ji.account_code = c.code
left join public.journal_entries je on je.id = ji.journal_entry_id
where c.account_class in ('revenue', 'expense')
group by c.company_id, c.code, c.name, c.account_class, c.sub_classification, c.normal_balance;


-- Balance Sheet View (Assets, Liabilities and Equities)
create or replace view public.balance_sheet_view as
select
    c.company_id,
    c.code as account_code,
    c.name as account_name,
    c.account_class,
    c.sub_classification,
    c.normal_balance,
    coalesce(sum(ji.debit), 0) as total_debit,
    coalesce(sum(ji.credit), 0) as total_credit,
    case
        when c.normal_balance = 'Debit' then coalesce(sum(ji.debit - ji.credit), 0)
        else coalesce(sum(ji.credit - ji.debit), 0)
    end as balance
from public.coa c
left join public.journal_items ji on ji.account_code = c.code
left join public.journal_entries je on je.id = ji.journal_entry_id
where c.account_class in ('asset', 'liability', 'equity')
group by c.company_id, c.code, c.name, c.account_class, c.sub_classification, c.normal_balance;


-- Trial Balance View (Unified listing of all balances)
create or replace view public.trial_balance_view as
select
    c.company_id,
    c.code as account_code,
    c.name as account_name,
    c.account_class,
    c.sub_classification,
    coalesce(sum(ji.debit), 0) as total_debit,
    coalesce(sum(ji.credit), 0) as total_credit,
    coalesce(sum(ji.debit - ji.credit), 0) as net_debit,
    coalesce(sum(ji.credit - ji.debit), 0) as net_credit
from public.coa c
left join public.journal_items ji on ji.account_code = c.code
left join public.journal_entries je on je.id = ji.journal_entry_id
group by c.company_id, c.code, c.name, c.account_class, c.sub_classification;


-- ─────────────────────────────────────────────────────────────────────────────
-- Transactional RPC double-entry posting function
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.create_journal_entry_transactional(
    p_date date,
    p_description text,
    p_company_id uuid,
    p_user_id uuid,
    p_items jsonb
)
returns uuid as $$
declare
    v_journal_entry_id uuid;
    v_item jsonb;
    v_total_debit decimal(12,2) := 0;
    v_total_credit decimal(12,2) := 0;
    v_debit decimal(12,2);
    v_credit decimal(12,2);
    v_account_code varchar(10);
begin
    -- 1. Validate items length
    if jsonb_array_length(p_items) < 2 then
        raise exception 'Journal entry must have at least two items.';
    end if;

    -- 2. Validate balance
    for v_item in select * from jsonb_array_elements(p_items) loop
        v_debit := coalesce((v_item->>'debit')::decimal(12,2), 0.00);
        v_credit := coalesce((v_item->>'credit')::decimal(12,2), 0.00);
        v_account_code := v_item->>'account_code';

        -- Validate account exists
        if not exists (select 1 from public.coa where code = v_account_code) then
            raise exception 'Account code % does not exist in COA.', v_account_code;
        end if;

        -- Validate line values
        if v_debit < 0 or v_credit < 0 then
            raise exception 'Debit/credit cannot be negative.';
        end if;
        if v_debit > 0 and v_credit > 0 then
            raise exception 'Line cannot have both debit and credit values.';
        end if;
        if v_debit = 0 and v_credit = 0 then
            raise exception 'Line must have either a debit or credit value.';
        end if;

        v_total_debit := v_total_debit + v_debit;
        v_total_credit := v_total_credit + v_credit;
    end loop;

    if v_total_debit <> v_total_credit then
        raise exception 'Journal entry is unbalanced. Debit: %, Credit: %', v_total_debit, v_total_credit;
    end if;

    -- 3. Insert Journal Entry
    insert into public.journal_entries (date, description, company_id, user_id)
    values (p_date, p_description, p_company_id, p_user_id)
    returning id into v_journal_entry_id;

    -- 4. Insert Journal Items
    for v_item in select * from jsonb_array_elements(p_items) loop
        v_debit := coalesce((v_item->>'debit')::decimal(12,2), 0.00);
        v_credit := coalesce((v_item->>'credit')::decimal(12,2), 0.00);
        v_account_code := v_item->>'account_code';

        insert into public.journal_items (journal_entry_id, account_code, debit, credit)
        values (v_journal_entry_id, v_account_code, v_debit, v_credit);
    end loop;

    return v_journal_entry_id;
end;
$$ language plpgsql security definer;
