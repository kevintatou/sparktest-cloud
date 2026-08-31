-- Read-only report for the legacy shared project.
-- Run with: psql "$DATABASE_URL" -f scripts/audit-legacy-project.sql

select
  'legacy_default_project' as report,
  p.id as project_id,
  p.slug,
  count(distinct m.profile_id) as member_count,
  (select count(*) from test_definitions d where d.project_id = p.id) as definition_count,
  (select count(*) from test_runs r where r.project_id = p.id) as run_count
from projects p
left join project_members m on m.project_id = p.id
where p.slug = 'default'
group by p.id, p.slug;

select
  p.id as profile_id,
  p.email,
  m.role,
  m.created_at as membership_created_at
from profiles p
join project_members m on m.profile_id = p.id
join projects project on project.id = m.project_id
where project.slug = 'default'
order by p.email;

-- There is no safe automatic row-to-user mapping for shared resources.
-- Do not move default-project resources until an owner mapping is supplied.
