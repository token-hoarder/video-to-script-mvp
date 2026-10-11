create schema if not exists reel_private;
revoke all on schema reel_private from public, anon, authenticated;
create table reel_private.settings (id boolean primary key default true check (id), secret_hash text not null);
create table reel_private.jobs (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, status text not null default 'reserved' check(status in ('reserved','done','refunded')), created_at timestamptz not null default now());
create index on reel_private.jobs (user_id, created_at);
alter table public.profiles enable row level security;
revoke update, insert, delete on public.profiles from anon, authenticated;
drop policy if exists "Users can update own profile" on public.profiles;
create or replace function public.reserve_reel_credit(server_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); job uuid; balance integer; expired integer;
begin
  if uid is null or not exists(select 1 from reel_private.settings where secret_hash = encode(extensions.digest(server_secret,'sha256'),'hex')) then raise exception 'Unauthorized'; end if;
  select credits into balance from public.profiles where id=uid for update;
  if not found then raise exception 'Profile unavailable'; end if;
  update reel_private.jobs set status='refunded' where user_id=uid and status='reserved' and created_at < now()-interval '3 minutes';
  get diagnostics expired = row_count;
  if expired > 0 then update public.profiles set credits=credits+expired where id=uid returning credits into balance; end if;
  if exists(select 1 from reel_private.jobs where user_id=uid and status='reserved') then raise exception 'An analysis is already running'; end if;
  if (select count(*) from reel_private.jobs where user_id=uid and created_at>now()-interval '1 hour') >= 5 then raise exception 'Hourly analysis limit reached'; end if;
  if balance <= 0 then raise exception 'No credits remaining'; end if;
  update public.profiles set credits=credits-1, updated_at=now() where id=uid returning credits into balance;
  insert into reel_private.jobs(user_id) values(uid) returning id into job;
  return jsonb_build_object('jobId',job,'creditsRemaining',balance);
end $$;
create or replace function public.finish_reel_credit(server_secret text, job_id uuid, succeeded boolean)
returns integer language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); balance integer; changed integer;
begin
  if uid is null or not exists(select 1 from reel_private.settings where secret_hash = encode(extensions.digest(server_secret,'sha256'),'hex')) then raise exception 'Unauthorized'; end if;
  perform 1 from public.profiles where id=uid for update;
  update reel_private.jobs set status=case when succeeded then 'done' else 'refunded' end where id=job_id and user_id=uid and status='reserved';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'Analysis reservation expired'; end if;
  if not succeeded then update public.profiles set credits=credits+1, updated_at=now() where id=uid; end if;
  select credits into balance from public.profiles where id=uid;
  return balance;
end $$;
revoke all on function public.reserve_reel_credit(text) from public, anon;
revoke all on function public.finish_reel_credit(text,uuid,boolean) from public, anon;
grant execute on function public.reserve_reel_credit(text) to authenticated;
grant execute on function public.finish_reel_credit(text,uuid,boolean) to authenticated;
update storage.buckets set public=false, file_size_limit=31457280, allowed_mime_types=array['video/mp4','video/quicktime'] where id='videos';
drop policy if exists "Public Select" on storage.objects;
drop policy if exists "Public Insert" on storage.objects;
drop policy if exists "Users can upload their own videos" on storage.objects;
drop policy if exists "Users can read their own videos" on storage.objects;
drop policy if exists "Users can update their own videos" on storage.objects;
drop policy if exists "Users can delete their own videos" on storage.objects;
create policy "Read owned video" on storage.objects for select to authenticated using (bucket_id='videos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Upload owned video" on storage.objects for insert to authenticated with check (bucket_id='videos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Delete owned video" on storage.objects for delete to authenticated using (bucket_id='videos' and (storage.foldername(name))[1]=(select auth.uid())::text);
