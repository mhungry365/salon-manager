-- ============================================================
-- 003_clients_services.sql
-- ============================================================

-- 1. Create clients table
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  user_id uuid references auth.users(id)
);

-- 2. Create services table
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  duration integer not null default 60,
  price numeric(10,2) not null default 0,
  category text,
  user_id uuid references auth.users(id)
);

-- 3. Update existing tables
alter table public.appointments add column if not exists client_id uuid references public.clients(id) on delete set null;
alter table public.appointments add column if not exists service_id uuid references public.services(id) on delete set null;

alter table public.revenue_entries add column if not exists client_id uuid references public.clients(id) on delete set null;
alter table public.revenue_entries add column if not exists service_id uuid references public.services(id) on delete set null;

-- 4. Enable RLS
alter table public.clients enable row level security;
alter table public.services enable row level security;

-- 5. RLS policies for clients
create policy "salon members can view clients" on public.clients
  for select using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "salon members can insert clients" on public.clients
  for insert with check (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "salon members can update clients" on public.clients
  for update using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "owners and managers can delete clients" on public.clients
  for delete using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and role in ('owner', 'manager') and status = 'active'
    )
  );

-- 6. RLS policies for services
create policy "salon members can view services" on public.services
  for select using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "owners and managers can insert services" on public.services
  for insert with check (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and role in ('owner', 'manager') and status = 'active'
    )
  );

create policy "owners and managers can update services" on public.services
  for update using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and role in ('owner', 'manager') and status = 'active'
    )
  );

create policy "owners and managers can delete services" on public.services
  for delete using (
    salon_id in (
      select salon_id from public.salon_users
      where user_id = auth.uid() and role in ('owner', 'manager') and status = 'active'
    )
  );
