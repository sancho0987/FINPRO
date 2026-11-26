-- FINPRO: datos pendientes para cotejar las migraciones 006-008 con producción.
-- SOLO LECTURA: las siete consultas siguientes leen catálogos de PostgreSQL.
-- No incluye objetos de invitaciones/multi-hogar (migración 009).
-- Ya confirmados y omitidos para no repetir consultas: PostgreSQL 17.12,
-- presencia de las ocho tablas, RLS habilitado, UNIQUE household_members.user_id,
-- vista transactions y sus dependencias, FK en términos generales, ausencia de
-- triggers en incomes/expenses, ausencia del registro estándar de migraciones,
-- y TRUNCATE revocado a anon/authenticated (conservado para service_role).
--
-- En Supabase SQL Editor ejecuta cada SELECT por separado y descarga cada
-- conjunto de resultados como CSV. La consulta 6 agrupa permisos por tabla
-- para mantener un resultado compacto. La consulta 3 incluye definiciones SQL
-- completas; en CSV se conservan como campos entrecomillados.

-- 1. Columnas exactas requeridas por 006-008 y sus dependencias directas.
--    También muestra filas con column_exists=false si falta alguna columna.
with required_columns(table_schema, table_name, column_name, used_by) as (
  values
    ('public','profiles','id','007: FK de created_by a profiles'),
    ('public','households','id','006-007: pertenencia de movimientos y FK'),
    ('public','household_members','household_id','007-008: hogar y autorización'),
    ('public','household_members','user_id','007-008: usuario miembro'),
    ('public','household_members','role','007-008: titular/admin/miembro'),
    ('public','household_members','is_active','007-008: membresía activa'),
    ('public','household_members','joined_at','007: selección estable del sucesor'),
    ('public','categories','id','006: validar y asignar categoría'),
    ('public','categories','household_id','006: validar ámbito del hogar'),
    ('public','family_members','id','006: validar integrante familiar'),
    ('public','family_members','household_id','006: validar ámbito del hogar'),
    ('public','incomes','id','006: localizar y bloquear movimiento'),
    ('public','incomes','household_id','006-008: ámbito inmutable y RLS'),
    ('public','incomes','category_id','006: referencia de categoría'),
    ('public','incomes','family_member_id','006: referencia de integrante'),
    ('public','incomes','created_by','006-008: atribución y permisos'),
    ('public','incomes','amount_cents','006: importe'),
    ('public','incomes','description','006: descripción'),
    ('public','incomes','note','006: nota'),
    ('public','incomes','occurred_on','006: fecha del movimiento'),
    ('public','incomes','created_at','006: conservar fecha de creación'),
    ('public','incomes','updated_at','006: actualizar fecha de modificación'),
    ('public','expenses','id','006: localizar y bloquear movimiento'),
    ('public','expenses','household_id','006-008: ámbito inmutable y RLS'),
    ('public','expenses','category_id','006: referencia de categoría'),
    ('public','expenses','family_member_id','006: referencia de integrante'),
    ('public','expenses','created_by','006-008: atribución y permisos'),
    ('public','expenses','amount_cents','006: importe'),
    ('public','expenses','description','006: descripción'),
    ('public','expenses','note','006: nota'),
    ('public','expenses','occurred_on','006: fecha del movimiento'),
    ('public','expenses','created_at','006: conservar fecha de creación'),
    ('public','expenses','updated_at','006: actualizar fecha de modificación'),
    ('public','budgets','household_id','008: policy de presupuesto por hogar'),
    ('auth','users','id','007: eliminar la cuenta autenticada')
)
select r.table_schema, r.table_name, r.column_name, r.used_by,
       (a.attnum is not null) as column_exists,
       case when a.attnum is not null then pg_catalog.format_type(a.atttypid, a.atttypmod) end as data_type,
       case when a.attnum is not null then a.attnotnull end as not_null,
       case when d.adbin is not null then pg_catalog.pg_get_expr(d.adbin, d.adrelid) end as column_default
from required_columns r
left join pg_catalog.pg_namespace n on n.nspname = r.table_schema
left join pg_catalog.pg_class c on c.relnamespace = n.oid and c.relname = r.table_name
left join pg_catalog.pg_attribute a on a.attrelid = c.oid and a.attname = r.column_name
  and a.attnum > 0 and not a.attisdropped
left join pg_catalog.pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
order by r.table_schema, r.table_name, r.column_name;

-- 2. Exact FK names, column mappings, full definitions and ON DELETE actions
--    for every FK declared on incomes and expenses.
select src.relname as table_name,
       con.conname as constraint_name,
       array(
         select src_att.attname
         from unnest(con.conkey) with ordinality as key_col(attnum, ord)
         join pg_catalog.pg_attribute src_att
           on src_att.attrelid = con.conrelid and src_att.attnum = key_col.attnum
         order by key_col.ord
       ) as source_columns,
       dst_ns.nspname as referenced_schema,
       dst.relname as referenced_table,
       array(
         select dst_att.attname
         from unnest(con.confkey) with ordinality as key_col(attnum, ord)
         join pg_catalog.pg_attribute dst_att
           on dst_att.attrelid = con.confrelid and dst_att.attnum = key_col.attnum
         order by key_col.ord
       ) as referenced_columns,
       case con.confdeltype
         when 'a' then 'NO ACTION'
         when 'r' then 'RESTRICT'
         when 'c' then 'CASCADE'
         when 'n' then 'SET NULL'
         when 'd' then 'SET DEFAULT'
       end as on_delete,
       con.convalidated as validated,
       pg_catalog.pg_get_constraintdef(con.oid, true) as full_definition
from pg_catalog.pg_constraint con
join pg_catalog.pg_class src on src.oid = con.conrelid
join pg_catalog.pg_namespace src_ns on src_ns.oid = src.relnamespace
join pg_catalog.pg_class dst on dst.oid = con.confrelid
join pg_catalog.pg_namespace dst_ns on dst_ns.oid = dst.relnamespace
where con.contype = 'f'
  and src_ns.nspname = 'public'
  and src.relname in ('incomes', 'expenses')
order by src.relname, con.conname;

-- 3. Complete definitions and security properties of existing authorization,
--    account, household-provisioning and household-reset functions. The
--    effective EXECUTE booleans cover anon, authenticated and service_role.
with wanted(function_name) as (
  values ('is_household_member'), ('can_manage_household'),
         ('can_manage_user'), ('delete_own_account'),
         ('handle_new_user'), ('sync_auth_profile'), ('wipe_own_household')
)
select w.function_name as requested_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as identity_arguments,
       pg_catalog.pg_get_function_result(p.oid) as return_type,
       p.proowner::regrole::text as owner,
       p.prosecdef as security_definer,
       p.proconfig as function_settings,
       p.proacl as explicit_acl,
       pg_catalog.pg_get_functiondef(p.oid) as full_definition,
       case when p.oid is null then null else has_function_privilege('anon', p.oid, 'EXECUTE') end as anon_can_execute,
       case when p.oid is null then null else has_function_privilege('authenticated', p.oid, 'EXECUTE') end as authenticated_can_execute,
       case when p.oid is null then null else has_function_privilege('service_role', p.oid, 'EXECUTE') end as service_role_can_execute
from wanted w
left join pg_catalog.pg_namespace n on n.nspname = 'public'
left join pg_catalog.pg_proc p on p.pronamespace = n.oid and p.proname = w.function_name
order by w.function_name, identity_arguments;

-- 4. Full RLS policy definitions for all eight production tables.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename in (
    'budgets', 'categories', 'expenses', 'incomes', 'family_members',
    'household_members', 'households', 'profiles'
  )
order by tablename, policyname;

-- 5. Effective table-level privileges still pending review. TRUNCATE is
--    intentionally omitted because its removal from anon/authenticated and
--    retention for service_role have already been confirmed.
select c.relname as table_name,
       roles.role_name,
       has_table_privilege(roles.role_name, c.oid, 'SELECT') as can_select,
       has_table_privilege(roles.role_name, c.oid, 'INSERT') as can_insert,
       has_table_privilege(roles.role_name, c.oid, 'UPDATE') as can_update,
       has_table_privilege(roles.role_name, c.oid, 'DELETE') as can_delete,
       has_table_privilege(roles.role_name, c.oid, 'REFERENCES') as can_reference,
       has_table_privilege(roles.role_name, c.oid, 'TRIGGER') as can_trigger,
       has_table_privilege(roles.role_name, c.oid, 'MAINTAIN') as can_maintain
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
cross join (values ('anon'), ('authenticated'), ('service_role')) as roles(role_name)
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relname in (
    'budgets', 'categories', 'expenses', 'incomes', 'family_members',
    'household_members', 'households', 'profiles'
  )
order by c.relname, roles.role_name;

-- 6. Effective column-level privileges, grouped as JSON per table and role.
--    Table-level grants also appear as true in these effective checks.
select c.relname as table_name,
       roles.role_name,
       jsonb_object_agg(
         a.attname,
         jsonb_build_object(
           'SELECT', has_column_privilege(roles.role_name, c.oid, a.attnum, 'SELECT'),
           'INSERT', has_column_privilege(roles.role_name, c.oid, a.attnum, 'INSERT'),
           'UPDATE', has_column_privilege(roles.role_name, c.oid, a.attnum, 'UPDATE'),
           'REFERENCES', has_column_privilege(roles.role_name, c.oid, a.attnum, 'REFERENCES')
         )
         order by a.attnum
       ) as effective_column_privileges
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
join pg_catalog.pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
cross join (values ('anon'), ('authenticated'), ('service_role')) as roles(role_name)
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relname in (
    'budgets', 'categories', 'expenses', 'incomes', 'family_members',
    'household_members', 'households', 'profiles'
  )
group by c.relname, c.oid, roles.role_name
order by c.relname, roles.role_name;

-- 7. Exact transactions view definition and view options (for example
--    security_invoker), beyond the already-confirmed UNION ALL dependency.
select c.relname as view_name,
       c.reloptions as view_options,
       pg_catalog.pg_get_viewdef(c.oid, true) as full_definition
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'transactions' and c.relkind = 'v';
