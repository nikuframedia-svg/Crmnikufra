create or replace function public.request_profile_id() returns uuid as $$
declare
  headers jsonb;
  profile_raw text;
begin
  begin
    headers := current_setting('request.headers', true)::jsonb;
  exception when others then
    return null;
  end;

  profile_raw := headers ->> 'x-nikufra-profile-id';
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
