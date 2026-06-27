-- 0002_canva_oauth_states — codify the Canva OAuth integration (un-deferred 2026-06-27).
-- 'canva' provider + oauth_states (short-lived PKCE state for the Canva connect flow).
-- Idempotent: the partner created these out-of-band; this brings them under version control + adds RLS.
do $$ begin
  if not exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
                 where t.typname='provider_t' and e.enumlabel='canva') then
    alter type provider_t add value 'canva';
  end if;
end $$;

create table if not exists public.oauth_states (
  state uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  provider text not null,
  code_verifier text not null,
  created_at timestamptz default now()
);
create index if not exists oauth_states_created_at on public.oauth_states (created_at);

-- oauth_states holds sensitive PKCE verifiers → RLS on, own-account only (server flow uses the secret key).
alter table public.oauth_states enable row level security;
drop policy if exists oauth_states_rw on public.oauth_states;
create policy oauth_states_rw on public.oauth_states for all to authenticated
  using (account_id = auth.uid()) with check (account_id = auth.uid());
