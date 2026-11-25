-- FINPRO production compatibility check for migrations 006-008.
-- READ ONLY: run the complete file in the Supabase SQL Editor before applying
-- any change. It reads PostgreSQL catalogs only and excludes migration 009.

-- 1. PostgreSQL version, expected relations, columns and RLS flags.
select current_setting('server_version') as server_version,
       c.relname as object_name,
       case c.relkind when 'r' then 'table' when 'v' then 'view' else c.relkind::text end as object_type,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = any (array[
    'profiles', 'households', 'household_members', 'family_members',
    'categories', 'incomes', 'expenses', 'budgets', 'transactions'
  ])
order by c.relname;

select table_name, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = any (array[
    'profiles', 'households', 'household_members', 'family_members',
    'categories', 'incomes', 'expenses', 'budgets', 'transactions'
  ])
order by table_name, ordinal_position;

-- 2. Full constraints and indexes, with particular attention to the
--    household_id foreign keys that migration 007 would change.
select rel.relname as table_name, con.conname as constraint_name,
       con.contype as constraint_type, con.convalidated as validated,
       pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace n on n.oid = rel.relnamespace
where n.nspname = 'public'
  and rel.relname = any (array[
    'profiles', 'households', 'household_members', 'family_members',
    'categories', 'incomes', 'expenses', 'budgets'
  ])
order by rel.relname, con.conname;

select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = any (array[
    'profiles', 'households', 'household_members', 'family_members',
    'categories', 'incomes', 'expenses', 'budgets'
  ])
order by tablename, indexname;

-- 3. Complete RLS policy definitions on all eight main tables.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = any (array[
    'budgets', 'categories', 'expenses', 'incomes', 'family_members',
    'household_members', 'households', 'profiles'
  ])
order by tablename, policyname;

-- 4. Complete definitions and effective EXECUTE for the functions involved
--    in 006-008, including names whose absence is already known.
with wanted(name) as (
  values ('is_household_member'), ('can_manage_household'),
         ('can_manage_household_user'), ('delete_own_account'),
         ('update_transaction'), ('manage_household_member'),
         ('prevent_movement_household_change'), ('prevent_movement_attribution_change')
), routines as (
  select p.oid, p.proname, p.proowner, p.prosecdef, p.proconfig,
         pg_get_function_identity_arguments(p.oid) as identity_arguments,
         pg_get_functiondef(p.oid) as definition, p.proacl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in (select name from wanted)
)
select w.name as requested_name,
       r.identity_arguments,
       r.definition,
       r.proowner::regrole::text as owner,
       r.prosecdef as security_definer,
       r.proconfig as function_settings,
       roles.rolname as checked_role,
       case when r.oid is null then null
            else has_function_privilege(roles.rolname, r.oid, 'EXECUTE') end as effective_execute,
       case when acl.grantee = 0 then 'PUBLIC'
            when acl.grantee is null then null
            else acl.grantee::regrole::text end as explicit_grantee,
       acl.privilege_type as explicit_privilege,
       acl.is_grantable as explicit_grantable
from wanted w
cross join (values ('anon'), ('authenticated'), ('service_role')) as roles(rolname)
left join routines r on r.proname = w.name
left join lateral aclexplode(
  case when r.oid is null then null::aclitem[]
       else coalesce(r.proacl, acldefault('f', r.proowner)) end
) acl on true
order by w.name, r.identity_arguments, roles.rolname, explicit_grantee;

-- 5. Table-level grants/effective privileges (including TRUNCATE) and any
--    separate column grants that a table-level REVOKE would not remove.
select c.relname as table_name, roles.rolname as checked_role,
       has_table_privilege(roles.rolname, c.oid, 'SELECT') as can_select,
       has_table_privilege(roles.rolname, c.oid, 'INSERT') as can_insert,
       has_table_privilege(roles.rolname, c.oid, 'UPDATE') as can_update,
       has_table_privilege(roles.rolname, c.oid, 'DELETE') as can_delete,
       has_table_privilege(roles.rolname, c.oid, 'TRUNCATE') as can_truncate,
       has_table_privilege(roles.rolname, c.oid, 'REFERENCES') as can_reference,
       has_table_privilege(roles.rolname, c.oid, 'TRIGGER') as can_trigger
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join (values ('anon'), ('authenticated'), ('service_role')) as roles(rolname)
where n.nspname = 'public' and c.relkind in ('r', 'p', 'v')
  and c.relname = any (array[
    'budgets', 'categories', 'expenses', 'incomes', 'family_members',
    'household_members', 'households', 'profiles', 'transactions'
  ])
order by c.relname, roles.rolname;

select grantee, table_name, column_name, privilege_type, is_grantable
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = any (array[
    'budgets', 'categories', 'expenses', 'incomes', 'family_members',
    'household_members', 'households', 'profiles'
  ])
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
order by table_name, grantee, column_name, privilege_type;

-- 6. Existing non-internal triggers on movements and their complete functions.
select rel.relname as table_name, t.tgname as trigger_name,
       t.tgenabled as enabled_state,
       pg_get_triggerdef(t.oid, true) as trigger_definition,
       p.proname as function_name,
       pg_get_functiondef(p.oid) as function_definition
from pg_trigger t
join pg_class rel on rel.oid = t.tgrelid
join pg_namespace n on n.oid = rel.relnamespace
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal and n.nspname = 'public'
  and rel.relname in ('incomes', 'expenses')
order by rel.relname, t.tgname;

-- 7. View SQL and its referenced relations.
select to_regclass('public.transactions') as transactions_view,
       case when to_regclass('public.transactions') is not null
         then pg_get_viewdef(to_regclass('public.transactions'), true) end as definition;

-- 8. Migration ledger existence only. NULL is not evidence that no migrations
--    were applied; compare the actual schema and project deployment records.
select to_regclass('supabase_migrations.schema_migrations') as standard_migration_ledger;
