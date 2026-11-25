-- FINPRO Supabase preflight. READ ONLY: run before applying any migration.
-- It returns schema metadata only; it does not read financial rows or alter the database.

-- 1) Expected FINPRO tables/views currently present in public.
select table_name, table_type
from information_schema.tables
where table_schema = 'public'
  and table_name = any (array[
    'profiles', 'households', 'household_members', 'family_members',
    'categories', 'incomes', 'expenses', 'budgets', 'transactions'
  ])
order by table_name;

-- 2) Columns used by application queries and migrations, including the
--    unified transactions view.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = any (array[
    'profiles', 'households', 'household_members', 'family_members',
    'categories', 'incomes', 'expenses', 'budgets', 'transactions'
  ])
order by table_name, ordinal_position;

-- 3) Primary, unique, check, and foreign-key definitions on FINPRO tables.
select c.relname as table_name, con.conname, con.contype,
       pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = any (array[
    'profiles', 'households', 'household_members', 'family_members',
    'categories', 'incomes', 'expenses', 'budgets'
  ])
order by c.relname, con.conname;

-- 4) Indexes, including standalone partial/functional indexes that do not
--    appear in pg_constraint (for example the case-insensitive profile email).
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = any (array[
    'profiles', 'households', 'household_members', 'family_members',
    'categories', 'incomes', 'expenses', 'budgets'
  ])
order by tablename, indexname;

-- 5) RLS enabled/forced status for each FINPRO base table.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
  and c.relname = any (array[
    'profiles', 'households', 'household_members', 'family_members',
    'categories', 'incomes', 'expenses', 'budgets'
  ])
order by c.relname;

-- 6) Existing row-level security policies, without touching user records.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = any (array[
    'profiles', 'households', 'household_members', 'family_members',
    'categories', 'incomes', 'expenses', 'budgets'
  ])
order by tablename, policyname;

-- 7) Relevant function definitions, owners, execution grants and fixed search
--    paths. Definitions are required to verify the authorization guards.
select p.proname, pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_functiondef(p.oid) as definition,
       p.proowner::regrole::text as owner,
       p.prosecdef as security_definer, p.proconfig as function_settings,
       p.proacl as explicit_acl,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = any (array[
    'is_household_member', 'can_manage_household', 'can_manage_user',
    'delete_own_account', 'wipe_own_household', 'handle_new_user',
    'sync_auth_profile', 'update_transaction',
    'manage_household_member', 'prevent_movement_household_change',
    'prevent_movement_attribution_change'
  ])
order by p.proname, arguments;

-- 8) FINPRO triggers, including auth.users provisioning/profile-sync hooks.
select n.nspname as table_schema, c.relname as table_name, t.tgname as trigger_name,
       t.tgenabled as enabled_state, pns.nspname || '.' || p.proname as trigger_function,
       pg_get_triggerdef(t.oid, true) as definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
join pg_namespace pns on pns.oid = p.pronamespace
where not t.tgisinternal
  and ((n.nspname = 'public' and c.relname = any (array[
         'profiles', 'households', 'household_members', 'family_members',
         'categories', 'incomes', 'expenses', 'budgets'
       ]))
       or (n.nspname = 'auth' and c.relname = 'users'))
order by table_schema, table_name, trigger_name;

-- 9) Required extensions and their installation schema.
select e.extname, e.extversion, n.nspname as installed_schema
from pg_extension e
join pg_namespace n on n.oid = e.extnamespace
where e.extname = 'pgcrypto';

-- 10) Table privileges for API roles; compare with the intended RLS model.
select grantee, table_schema, table_name, privilege_type, is_grantable
from information_schema.table_privileges
where table_schema = 'public'
  and table_name = any (array[
    'profiles', 'households', 'household_members', 'family_members',
    'categories', 'incomes', 'expenses', 'budgets', 'transactions'
  ])
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;

-- 11) Dependencies of the unified view on its source tables.
select view_ns.nspname as view_schema, view_rel.relname as view_name,
       source_ns.nspname as referenced_schema, source_rel.relname as referenced_object,
       d.deptype as dependency_type
from pg_rewrite rw
join pg_class view_rel on view_rel.oid = rw.ev_class
join pg_namespace view_ns on view_ns.oid = view_rel.relnamespace
join pg_depend d on d.classid = 'pg_rewrite'::regclass and d.objid = rw.oid
join pg_class source_rel on source_rel.oid = d.refobjid
join pg_namespace source_ns on source_ns.oid = source_rel.relnamespace
where view_ns.nspname = 'public' and view_rel.relname = 'transactions'
  and source_rel.relname = any (array['incomes', 'expenses'])
order by referenced_schema, referenced_object;

-- 12) View definition and migration registry location (existence only).
select to_regclass('public.transactions') as transactions_view,
       case when to_regclass('public.transactions') is not null
         then pg_get_viewdef(to_regclass('public.transactions'), true) end as transactions_view_definition,
       to_regclass('supabase_migrations.schema_migrations') as migration_registry;

-- 13) PostgreSQL version requirement: the base schema uses PostgreSQL 15+
--     syntax (UNIQUE NULLS NOT DISTINCT and security-invoker views).
select current_setting('server_version') as server_version,
       current_setting('server_version_num') as server_version_num;
