select 
  (select count(*) from information_schema.tables 
   where table_schema='public' 
   and table_name in ('institutions','profiles','memberships','classes','students')) as tables,
  (select count(*) from pg_policies where schemaname='public') as policies,
  (select count(*) from storage.buckets where id='institution-logos') as buckets,
  (select count(*) from information_schema.triggers where trigger_name='on_auth_user_created') as trigger;
