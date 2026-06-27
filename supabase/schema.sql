-- Run this in Supabase SQL Editor

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  doc_name text,
  doc_text text,
  industry text,
  best_channel text,   -- 'instagram' | 'tiktok' | 'reddit' | 'x'
  channel_reason text,
  created_at timestamptz default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  slides jsonb,             -- [{ "heading": "...", "body": "..." }]
  caption text,
  canva_design_id text,
  canva_export_url text,
  status text default 'draft',
  created_at timestamptz default now()
);

create table social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  provider text,
  status text default 'disconnected'
);
