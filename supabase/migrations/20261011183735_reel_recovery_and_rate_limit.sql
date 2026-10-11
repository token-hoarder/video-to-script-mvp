alter table reel_private.jobs add column ip_hash text;
create index on reel_private.jobs(ip_hash,created_at);
grant usage on schema reel_private to authenticated;
-- Privileged functions live outside the exposed API schema.
alter function public.finish_reel_credit(text,uuid,boolean) set schema reel_private;
drop function public.reserve_reel_credit(text);
create function reel_private.reserve_reel_credit(server_secret text, request_ip_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); job uuid; balance integer; expired integer;
begin
  if uid is null or length(request_ip_hash)<>64 or not exists(select 1 from reel_private.settings where secret_hash=encode(extensions.digest(server_secret,'sha256'),'hex')) then raise exception 'Unauthorized'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(request_ip_hash,0));
  select credits into balance from public.profiles where id=uid for update;
  if not found then raise exception 'Profile unavailable'; end if;
  update reel_private.jobs set status='refunded' where user_id=uid and status='reserved' and created_at<now()-interval '3 minutes';
  get diagnostics expired=row_count;
  if expired>0 then update public.profiles set credits=credits+expired where id=uid returning credits into balance; end if;
  if exists(select 1 from reel_private.jobs where user_id=uid and status='reserved') then raise exception 'An analysis is already running'; end if;
  if (select count(*) from reel_private.jobs where (user_id=uid or ip_hash=request_ip_hash) and created_at>now()-interval '1 hour')>=5 then raise exception 'Hourly analysis limit reached'; end if;
  if balance<=0 then raise exception 'No credits remaining'; end if;
  update public.profiles set credits=credits-1,updated_at=now() where id=uid returning credits into balance;
  insert into reel_private.jobs(user_id,ip_hash) values(uid,request_ip_hash) returning id into job;
  return jsonb_build_object('jobId',job,'creditsRemaining',balance);
end $$;
create function reel_private.recover_reel_balance()
returns integer language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); balance integer; expired integer;
begin
  if uid is null then raise exception 'Unauthorized'; end if;
  select credits into balance from public.profiles where id=uid for update;
  if not found then raise exception 'Profile unavailable'; end if;
  update reel_private.jobs set status='refunded' where user_id=uid and status='reserved' and created_at<now()-interval '3 minutes';
  get diagnostics expired=row_count;
  if expired>0 then update public.profiles set credits=credits+expired,updated_at=now() where id=uid returning credits into balance; end if;
  return balance;
end $$;
revoke all on function reel_private.reserve_reel_credit(text,text), reel_private.recover_reel_balance() from public,anon;
grant execute on function reel_private.reserve_reel_credit(text,text), reel_private.recover_reel_balance() to authenticated;
create function public.reserve_reel_credit(server_secret text, request_ip_hash text)
returns jsonb language sql security invoker set search_path='' as $$ select reel_private.reserve_reel_credit(server_secret,request_ip_hash); $$;
create function public.finish_reel_credit(server_secret text, job_id uuid, succeeded boolean)
returns integer language sql security invoker set search_path='' as $$ select reel_private.finish_reel_credit(server_secret,job_id,succeeded); $$;
create function public.recover_reel_balance()
returns integer language sql security invoker set search_path='' as $$ select reel_private.recover_reel_balance(); $$;
revoke all on function public.reserve_reel_credit(text,text),public.finish_reel_credit(text,uuid,boolean),public.recover_reel_balance() from public,anon;
grant execute on function public.reserve_reel_credit(text,text),public.finish_reel_credit(text,uuid,boolean),public.recover_reel_balance() to authenticated;
