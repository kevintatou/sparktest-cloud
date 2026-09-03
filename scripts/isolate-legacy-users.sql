-- Move every user out of the shared legacy project without guessing ownership
-- of its definitions, runs, tokens, or agents.
--
-- Run once with:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f scripts/isolate-legacy-users.sql
--
-- The legacy project's resources are intentionally left in place. They are
-- inaccessible to normal users after this migration and can be assigned later
-- after an explicit owner mapping is approved.

begin;

do $$
declare
  legacy_project_id uuid;
  member record;
  private_project_id uuid;
  private_slug text;
begin
  select id
    into legacy_project_id
    from projects
   where slug = 'default'
   for update;

  if legacy_project_id is null then
    raise notice 'No legacy default project found; nothing to migrate.';
    return;
  end if;

  for member in
    select p.id as profile_id, p.email, p.name
      from profiles p
      join project_members pm on pm.profile_id = p.id
     where pm.project_id = legacy_project_id
  loop
    -- UUID-derived slugs are stable and cannot collide across users.
    private_slug := 'user-' || replace(member.profile_id::text, '-', '');

    select id
      into private_project_id
      from projects
     where slug = private_slug
     for update;

    if private_project_id is null then
      insert into projects (name, slug)
      values (
        coalesce(nullif(member.name, ''), split_part(member.email, '@', 1)) || '''s Project',
        private_slug
      )
      returning id into private_project_id;
    end if;

    insert into project_members (project_id, profile_id, role)
    values (private_project_id, member.profile_id, 'owner')
    on conflict (project_id, profile_id) do update set role = 'owner';

    delete from project_members
     where project_id = legacy_project_id
       and profile_id = member.profile_id;
  end loop;
end $$;

commit;

select
  p.slug,
  count(pm.profile_id) as member_count,
  (select count(*) from test_definitions d where d.project_id = p.id) as definition_count,
  (select count(*) from test_runs r where r.project_id = p.id) as run_count
from projects p
left join project_members pm on pm.project_id = p.id
where p.slug = 'default'
group by p.id, p.slug;
