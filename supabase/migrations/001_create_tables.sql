-- Revenue entries table
create table if not exists revenue_entries (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  date          date not null,
  source        text not null,
  service       text not null,
  amount        numeric(10,2) not null,
  tip           numeric(10,2) default 0,
  tip_payment   text,
  payment       text not null,
  staff         text,
  notes         text,
  user_id       uuid references auth.users(id)
);

-- Expense entries table
create table if not exists expense_entries (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  date          date not null,
  category      text not null,
  description   text not null,
  amount        numeric(10,2) default 0,
  ref           text,
  notes         text,
  user_id       uuid references auth.users(id)
);

-- Enable RLS
alter table revenue_entries enable row level security;
alter table expense_entries enable row level security;

-- RLS policies for revenue_entries
create policy "revenue_select" on revenue_entries for select using (auth.uid() = user_id);
create policy "revenue_insert" on revenue_entries for insert with check (auth.uid() = user_id);
create policy "revenue_update" on revenue_entries for update using (auth.uid() = user_id);
create policy "revenue_delete" on revenue_entries for delete using (auth.uid() = user_id);

-- RLS policies for expense_entries
create policy "expense_select" on expense_entries for select using (auth.uid() = user_id);
create policy "expense_insert" on expense_entries for insert with check (auth.uid() = user_id);
create policy "expense_update" on expense_entries for update using (auth.uid() = user_id);
create policy "expense_delete" on expense_entries for delete using (auth.uid() = user_id);
