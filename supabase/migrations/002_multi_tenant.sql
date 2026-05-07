-- ============================================================
-- 002_multi_tenant.sql
-- Run this in the Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create salons table
create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  phone text,
  address text,
  status text not null default 'active',
  owner_id uuid references auth.users(id) on delete cascade
);

-- 2. Create salon_users table (links users to salons with a role)
create table if not exists public.salon_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff',  -- owner | manager | staff
  status text not null default 'pending',  -- pending | active | suspended
  full_name text,
  email text,
  unique(salon_id, user_id)
);

-- 3. Add salon_id to existing tables (safe: won't error if column exists)
alter table public.revenue_entries add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.expense_entries add column if not exists salon_id uuid references public.salons(id) on delete cascade;
alter table public.appointments add column if not exists salon_id uuid references public.salons(id) on delete cascade;

-- 4. Enable RLS on new tables
alter table public.salons enable row level security;
alter table public.salon_users enable row level security;

-- 5. RLS policies for salons
create policy "salon members can view their salon" on public.salons
  for select using (
    exists (
      select 1 from public.salon_users
      where salon_users.salon_id = salons.id
        and salon_users.user_id = auth.uid()
        and salon_users.status = 'active'
    )
  );

create policy "owners can update their salon" on public.salons
  for update using (
    exists (
      select 1 from public.salon_users
      where salon_users.salon_id = salons.id
        and salon_users.user_id = auth.uid()
        and salon_users.role = 'owner'
        and salon_users.status = 'active'
    )
  );

create policy "authenticated users can create salons" on public.salons
  for insert with check (auth.uid() is not null);

-- 6. RLS policies for salon_users
create policy "users can view salon members in their salon" on public.salon_users
  for select using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid()
    )
    or user_id = auth.uid()
  );

create policy "users can insert their own salon_users row" on public.salon_users
  for insert with check (auth.uid() = user_id);

create policy "owners and managers can update salon_users" on public.salon_users
  for update using (
    exists (
      select 1 from public.salon_users su2
      where su2.salon_id = salon_users.salon_id
        and su2.user_id = auth.uid()
        and su2.role in ('owner', 'manager')
        and su2.status = 'active'
    )
    or auth.uid() = user_id
  );

create policy "owners can delete salon_users" on public.salon_users
  for delete using (
    exists (
      select 1 from public.salon_users su2
      where su2.salon_id = salon_users.salon_id
        and su2.user_id = auth.uid()
        and su2.role = 'owner'
        and su2.status = 'active'
    )
  );

-- 7. Drop old user_id-based RLS policies on revenue_entries
drop policy if exists "Users can only access their own revenue entries" on public.revenue_entries;
drop policy if exists "Users can insert their own revenue entries" on public.revenue_entries;
drop policy if exists "Users can update their own revenue entries" on public.revenue_entries;
drop policy if exists "Users can delete their own revenue entries" on public.revenue_entries;

-- 8. New salon_id-based RLS for revenue_entries
create policy "salon members can view revenue" on public.revenue_entries
  for select using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "salon members can insert revenue" on public.revenue_entries
  for insert with check (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "salon members can update revenue" on public.revenue_entries
  for update using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "owners and managers can delete revenue" on public.revenue_entries
  for delete using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and role in ('owner', 'manager') and status = 'active'
    )
  );

-- 9. Drop old policies on expense_entries
drop policy if exists "Users can only access their own expense entries" on public.expense_entries;
drop policy if exists "Users can insert their own expense entries" on public.expense_entries;
drop policy if exists "Users can update their own expense entries" on public.expense_entries;
drop policy if exists "Users can delete their own expense entries" on public.expense_entries;

-- 10. New policies for expense_entries
create policy "salon members can view expenses" on public.expense_entries
  for select using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "owners and managers can insert expenses" on public.expense_entries
  for insert with check (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and role in ('owner', 'manager') and status = 'active'
    )
  );

create policy "owners and managers can update expenses" on public.expense_entries
  for update using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and role in ('owner', 'manager') and status = 'active'
    )
  );

create policy "owners and managers can delete expenses" on public.expense_entries
  for delete using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and role in ('owner', 'manager') and status = 'active'
    )
  );

-- 11. Drop old policies on appointments
drop policy if exists "Users can only access their own appointments" on public.appointments;
drop policy if exists "Users can insert their own appointments" on public.appointments;
drop policy if exists "Users can update their own appointments" on public.appointments;
drop policy if exists "Users can delete their own appointments" on public.appointments;

-- 12. New policies for appointments
create policy "salon members can view appointments" on public.appointments
  for select using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "salon members can insert appointments" on public.appointments
  for insert with check (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "salon members can update appointments" on public.appointments
  for update using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "owners and managers can delete appointments" on public.appointments
  for delete using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and role in ('owner', 'manager') and status = 'active'
    )
  );
