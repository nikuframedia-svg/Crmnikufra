alter table public.tasks
  add column if not exists assignee_profile_ids text[] default '{}'::text[];

update public.tasks
set assignee_profile_ids = array_remove(array[assigned_to], null)
where (assignee_profile_ids is null or array_length(assignee_profile_ids, 1) is null)
  and assigned_to is not null;

create index if not exists idx_tasks_assignee_profile_ids on public.tasks using gin (assignee_profile_ids);
