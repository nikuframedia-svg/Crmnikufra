-- Harden RLS by requiring a valid profile header

create table if not exists public.profile_access (
  profile_id uuid primary key,
  can_backend boolean not null default false
);

insert into public.profile_access (profile_id, can_backend)
values
  ('d0d54648-1002-4002-a002-000000000002', true), -- Luis Nicolau
  ('d0d54648-1001-4001-a001-000000000001', false),
  ('d0d54648-1003-4003-a003-000000000003', false),
  ('d0d54648-1004-4004-a004-000000000004', false)
on conflict (profile_id) do update set can_backend = excluded.can_backend;

create or replace function public.request_profile_id() returns uuid as $$
declare
  profile_raw text;
begin
  profile_raw := request.headers ->> 'x-nikufra-profile-id';
  if profile_raw is null or profile_raw = '' then
    return null;
  end if;
  begin
    return profile_raw::uuid;
  exception when others then
    return null;
  end;
end;
$$ language plpgsql stable;

create or replace function public.profile_request_allowed() returns boolean as $$
declare
  pid uuid;
begin
  pid := public.request_profile_id();
  if pid is null then
    return false;
  end if;
  return exists (select 1 from public.profile_access pa where pa.profile_id = pid);
end;
$$ language plpgsql stable;

-- helper to drop policies by name if they exist
create or replace function public.drop_policy_if_exists(tbl regclass, policy text) returns void as $$
begin
  if exists (select 1 from pg_policies where schemaname = split_part(tbl::text, '.', 1)
    and tablename = split_part(tbl::text, '.', 2)
    and policyname = policy) then
    execute format('drop policy "%s" on %s', policy, tbl);
  end if;
end;
$$ language plpgsql;

select public.drop_policy_if_exists('public.tasks', 'Dev anon select tasks');
select public.drop_policy_if_exists('public.tasks', 'Dev anon insert tasks');
select public.drop_policy_if_exists('public.tasks', 'Dev anon update tasks');
select public.drop_policy_if_exists('public.projects', 'Dev anon select projects');
select public.drop_policy_if_exists('public.projects', 'Dev anon insert projects');
select public.drop_policy_if_exists('public.projects', 'Dev anon update projects');
select public.drop_policy_if_exists('public.leads', 'Dev anon select leads');
select public.drop_policy_if_exists('public.leads', 'Dev anon insert leads');
select public.drop_policy_if_exists('public.leads', 'Dev anon update leads');
select public.drop_policy_if_exists('public.contacts', 'Dev anon select contacts');
select public.drop_policy_if_exists('public.contacts', 'Dev anon insert contacts');
select public.drop_policy_if_exists('public.contacts', 'Dev anon update contacts');
select public.drop_policy_if_exists('public.companies', 'Dev anon select companies');
select public.drop_policy_if_exists('public.companies', 'Dev anon insert companies');
select public.drop_policy_if_exists('public.companies', 'Dev anon update companies');
select public.drop_policy_if_exists('public.documents', 'Dev anon select documents');
select public.drop_policy_if_exists('public.documents', 'Dev anon insert documents');
select public.drop_policy_if_exists('public.documents', 'Dev anon update documents');
select public.drop_policy_if_exists('public.entity_activities', 'Dev anon select entity activities');
select public.drop_policy_if_exists('public.entity_activities', 'Dev anon insert entity activities');
select public.drop_policy_if_exists('public.notes', 'Dev anon select notes');
select public.drop_policy_if_exists('public.notes', 'Dev anon insert notes');
select public.drop_policy_if_exists('public.chat_channels', 'Dev anon select chat channels');
select public.drop_policy_if_exists('public.chat_channels', 'Dev anon insert chat channels');
select public.drop_policy_if_exists('public.chat_messages', 'Dev anon select chat messages');
select public.drop_policy_if_exists('public.chat_messages', 'Dev anon insert chat messages');
select public.drop_policy_if_exists('public.chat_channel_members', 'Dev anon select chat channel members');
select public.drop_policy_if_exists('public.chat_channel_members', 'Dev anon insert chat channel members');
select public.drop_policy_if_exists('public.automation_rules', 'Dev anon select automation_rules');

create policy "Profiles select tasks" on public.tasks for select to anon using (public.profile_request_allowed());
create policy "Profiles insert tasks" on public.tasks for insert to anon with check (public.profile_request_allowed());
create policy "Profiles update tasks" on public.tasks for update to anon using (public.profile_request_allowed()) with check (public.profile_request_allowed());
create policy "Profiles delete tasks" on public.tasks for delete to anon using (public.profile_request_allowed());

create policy "Profiles select projects" on public.projects for select to anon using (public.profile_request_allowed());
create policy "Profiles insert projects" on public.projects for insert to anon with check (public.profile_request_allowed());
create policy "Profiles update projects" on public.projects for update to anon using (public.profile_request_allowed()) with check (public.profile_request_allowed());
create policy "Profiles delete projects" on public.projects for delete to anon using (public.profile_request_allowed());

create policy "Profiles select leads" on public.leads for select to anon using (public.profile_request_allowed());
create policy "Profiles insert leads" on public.leads for insert to anon with check (public.profile_request_allowed());
create policy "Profiles update leads" on public.leads for update to anon using (public.profile_request_allowed()) with check (public.profile_request_allowed());
create policy "Profiles delete leads" on public.leads for delete to anon using (public.profile_request_allowed());

create policy "Profiles select contacts" on public.contacts for select to anon using (public.profile_request_allowed());
create policy "Profiles insert contacts" on public.contacts for insert to anon with check (public.profile_request_allowed());
create policy "Profiles update contacts" on public.contacts for update to anon using (public.profile_request_allowed()) with check (public.profile_request_allowed());
create policy "Profiles delete contacts" on public.contacts for delete to anon using (public.profile_request_allowed());

create policy "Profiles select companies" on public.companies for select to anon using (public.profile_request_allowed());
create policy "Profiles insert companies" on public.companies for insert to anon with check (public.profile_request_allowed());
create policy "Profiles update companies" on public.companies for update to anon using (public.profile_request_allowed()) with check (public.profile_request_allowed());
create policy "Profiles delete companies" on public.companies for delete to anon using (public.profile_request_allowed());

create policy "Profiles select documents" on public.documents for select to anon using (public.profile_request_allowed());
create policy "Profiles insert documents" on public.documents for insert to anon with check (public.profile_request_allowed());
create policy "Profiles update documents" on public.documents for update to anon using (public.profile_request_allowed()) with check (public.profile_request_allowed());
create policy "Profiles delete documents" on public.documents for delete to anon using (public.profile_request_allowed());

create policy "Profiles select entity activities" on public.entity_activities for select to anon using (public.profile_request_allowed());
create policy "Profiles insert entity activities" on public.entity_activities for insert to anon with check (public.profile_request_allowed());

create policy "Profiles select notes" on public.notes for select to anon using (public.profile_request_allowed());
create policy "Profiles insert notes" on public.notes for insert to anon with check (public.profile_request_allowed());

create policy "Profiles select chat channels" on public.chat_channels for select to anon using (public.profile_request_allowed());
create policy "Profiles insert chat channels" on public.chat_channels for insert to anon with check (public.profile_request_allowed());
create policy "Profiles delete chat channels" on public.chat_channels for delete to anon using (public.profile_request_allowed());

create policy "Profiles select chat messages" on public.chat_messages for select to anon using (public.profile_request_allowed());
create policy "Profiles insert chat messages" on public.chat_messages for insert to anon with check (public.profile_request_allowed());

create policy "Profiles select chat channel members" on public.chat_channel_members for select to anon using (public.profile_request_allowed());
create policy "Profiles insert chat channel members" on public.chat_channel_members for insert to anon with check (public.profile_request_allowed());
create policy "Profiles delete chat channel members" on public.chat_channel_members for delete to anon using (public.profile_request_allowed());

create policy "Profiles select automation_rules" on public.automation_rules for select to anon using (public.profile_request_allowed());

