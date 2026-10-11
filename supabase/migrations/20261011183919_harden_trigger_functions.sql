alter function public.handle_new_user() set search_path=pg_catalog;
revoke execute on function public.handle_new_user(),public.rls_auto_enable() from public,anon,authenticated;
alter function public.handle_new_user() set schema reel_private;
alter function public.rls_auto_enable() set schema reel_private;
alter table reel_private.settings enable row level security;
alter table reel_private.jobs enable row level security;
