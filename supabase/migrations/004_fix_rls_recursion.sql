-- ============================================================
-- 004_fix_rls_recursion.sql
-- Run this in the Supabase Dashboard → SQL Editor
-- This fixes the "infinite recursion" error on salon_users
-- ============================================================

-- 1. Create a helper function to securely fetch a user's salons bypassing RLS
create or replace function public.get_auth_user_salons()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select salon_id from public.salon_users where user_id = auth.uid();
$$;

-- 2. Create a helper function to securely check a user's role bypassing RLS
create or replace function public.has_role_in_salon(check_salon_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.salon_users 
    where user_id = auth.uid() 
      and salon_id = check_salon_id 
      and role = any(allowed_roles) 
      and status = 'active'
  );
$$;

-- 3. Fix the SELECT policy on salon_users
drop policy if exists "users can view salon members in their salon" on public.salon_users;
create policy "users can view salon members in their salon" on public.salon_users
  for select using (
    salon_id in (select public.get_auth_user_salons())
    or user_id = auth.uid()
  );

-- 4. Fix the UPDATE policy on salon_users
drop policy if exists "owners and managers can update salon_users" on public.salon_users;
create policy "owners and managers can update salon_users" on public.salon_users
  for update using (
    public.has_role_in_salon(salon_id, array['owner', 'manager'])
    or auth.uid() = user_id
  );

-- 5. Fix the DELETE policy on salon_users
drop policy if exists "owners can delete salon_users" on public.salon_users;
create policy "owners can delete salon_users" on public.salon_users
  for delete using (
    public.has_role_in_salon(salon_id, array['owner'])
  );
