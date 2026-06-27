-- 0001_init — Offload schema (CONTRACT.md, auth amendment 2026-06-27)
-- Supabase Auth + GitHub; per-user accounts (accounts.id = auth.uid()); RLS ON.
-- Showcase model: seed data lives under DEMO_ACCOUNT_ID and is read-only to any authed user.
-- This migration DROPS the superseded partner tables (projects/posts/social_connections/oauth_states).

-- ── 0. Drop superseded partner tables (reconciliation: CONTRACT.md wins) ──────────────
drop table if exists public.posts cascade;              -- partner posts collided with ours
drop table if exists public.projects cascade;
drop table if exists public.social_connections cascade;
drop table if exists public.oauth_states cascade;

-- ── 1. Enums ──────────────────────────────────────────────────────────────────────────
create type voice_t       as enum ('warm_witty','authoritative','playful','editorial');
create type goal_t        as enum ('awareness','orders','community','launch');
create type provider_t    as enum ('reddit','x','instagram','tiktok');
create type freq_t        as enum ('light','balanced','aggressive');
create type camp_status_t as enum ('draft','generating','active','completed');
create type format_t      as enum ('reddit_text','x_post','x_thread','ig_carousel',
                                   'ig_single','tiktok_script','founder_script');
create type post_status_t as enum ('draft','scheduled','published','needs_attention','stalled');
create type approval_t    as enum ('pending','approved','rejected');
create type sa_status_t   as enum ('connected','read_only','expired','disconnected','mock');

-- ── 2. Tables (13) ────────────────────────────────────────────────────────────────────
-- accounts.id = auth.users.id for real users (set by the handle_new_user trigger);
-- the showcase account is seeded with a fixed literal id. NOT FK to auth.users so the
-- free-standing showcase account can exist without a backing auth user.
create table accounts ( id uuid primary key default gen_random_uuid(), email text, created_at timestamptz default now() );

create table brands (
  account_id uuid primary key references accounts(id) on delete cascade,
  name text, one_liner text, domain text, colors jsonb default '{}',
  voice voice_t default 'warm_witty', audience text, goal goal_t default 'awareness',
  -- §0.5 brand-doc → channel strategy columns
  doc_name text, doc_text text, industry text,
  recommended_channels text[] default '{}', channel_rationale text );

create table brand_assets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  kind text check (kind in ('logo','font','color','sample','other')),
  label text, storage_path text, meta jsonb default '{}',
  created_at timestamptz default now() );

create table social_accounts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  provider provider_t not null, handle text,
  read_scope boolean default false, write_scope boolean default false,
  oauth_access_token text, oauth_refresh_token text, token_expires_at timestamptz,
  status sa_status_t default 'disconnected',
  unique (account_id, provider) );

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null, goal goal_t not null, duration_days int not null,
  frequency freq_t default 'balanced', channels text[] default '{}',
  status camp_status_t default 'draft', starts_on date, ends_on date,
  forecast jsonb default '{}', created_at timestamptz default now() );

create table posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  channel provider_t not null, format format_t not null,
  status post_status_t default 'draft', approval_state approval_t default 'pending',
  scheduled_at timestamptz, published_at timestamptz,
  rationale text, content jsonb not null default '{}', external_post_id text,
  created_at timestamptz default now() );
create index on posts (account_id, scheduled_at);
create index on posts (status, approval_state, scheduled_at);

create table founder_scripts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  angle text, title text, hook text, beats jsonb default '[]',
  shot_note text, duration_sec int, filmed boolean default false );

create table post_metrics (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  impressions int default 0, engagements int default 0,
  engagement_rate numeric default 0, followers_delta int default 0,
  captured_at timestamptz default now() );
create index on post_metrics (account_id, captured_at);

create table tracked_links ( id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade, post_id uuid references posts(id) on delete cascade,
  slug text unique, destination_url text, utm jsonb default '{}', click_count int default 0 );

create table conversions ( id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade, tracked_link_id uuid references tracked_links(id),
  post_id uuid references posts(id) on delete cascade, kind text check (kind in ('signup','order')),
  value numeric default 0, source text check (source in ('utm','snippet','platform','self_report')),
  occurred_at timestamptz default now() );

create table suggestions ( id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade, kind text, body text, payload jsonb default '{}',
  dismissed boolean default false, created_at timestamptz default now() );

create table notifications ( id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade, kind text, body text, read boolean default false,
  created_at timestamptz default now() );

create table cross_account_aggregates ( id uuid primary key default gen_random_uuid(),
  industry text, audience_type text, goal goal_t, format format_t,
  metric text, value numeric, sample_size int );

-- ── 3. Auth: provision an accounts row per GitHub sign-in ─────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.accounts (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 4. RLS — enable + policies (showcase = read-only to any authed user) ──────────────
-- DEMO_ACCOUNT_ID = 00000000-0000-0000-0000-00000b1e51ab (Brew Lab showcase).
-- accounts: keyed on id (not account_id).
alter table accounts enable row level security;
create policy accounts_sel on accounts for select to authenticated
  using (id = auth.uid() or id = '00000000-0000-0000-0000-00000b1e51ab');
create policy accounts_ins on accounts for insert to authenticated with check (id = auth.uid());
create policy accounts_upd on accounts for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy accounts_del on accounts for delete to authenticated using (id = auth.uid());

-- the 11 account_id-scoped tables: own rows (rw) + showcase rows (read-only).
do $$
declare t text;
begin
  foreach t in array array[
    'brands','brand_assets','social_accounts','campaigns','posts','founder_scripts',
    'post_metrics','tracked_links','conversions','suggestions','notifications'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$create policy %1$s_sel on %1$I for select to authenticated
      using (account_id = auth.uid() or account_id = '00000000-0000-0000-0000-00000b1e51ab');$f$, t);
    execute format($f$create policy %1$s_ins on %1$I for insert to authenticated
      with check (account_id = auth.uid());$f$, t);
    execute format($f$create policy %1$s_upd on %1$I for update to authenticated
      using (account_id = auth.uid()) with check (account_id = auth.uid());$f$, t);
    execute format($f$create policy %1$s_del on %1$I for delete to authenticated
      using (account_id = auth.uid());$f$, t);
  end loop;
end $$;

-- cross_account_aggregates: global benchmark rows, read-only to any authed user.
alter table cross_account_aggregates enable row level security;
create policy caa_sel on cross_account_aggregates for select to authenticated using (true);

-- ── 5. Storage bucket (single bucket; generated images → brand-assets/<account_id>/generated/) ──
insert into storage.buckets (id, name, public)
values ('brand-assets','brand-assets', false)
on conflict (id) do nothing;
