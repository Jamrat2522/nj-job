-- RUN-102 — Disable NJHR forced client-build gate
-- Applied to Production by ChatGPT on 2026-08-25.
-- Purpose: old/new client builds must not be blocked, logged out, redirected, or forced to reload.

create or replace function public.njhr_build_gate_login(p_ua text)
returns text
language plpgsql
stable security definer
set search_path to 'public'
as $function$
begin
  return public.njhr_build_from_ua(p_ua);
end
$function$;

create or replace function public.njhr_build_gate_session(p_client_build text)
returns void
language plpgsql
stable security definer
set search_path to 'public'
as $function$
begin
  return;
end
$function$;

update public.system_settings
   set value='""'::jsonb
 where key='required_client_build';
