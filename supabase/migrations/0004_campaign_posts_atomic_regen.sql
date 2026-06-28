-- 0004_campaign_posts_atomic_regen
-- Fold the regen-delete INTO the function so delete + insert share one transaction. A failed
-- generate now rolls back wholesale and never empties the campaign. Grant stays locked to
-- service_role (the route's admin client) — anon/authenticated cannot call it (no p_account spoofing).
create or replace function public.create_campaign_posts(
  p_account uuid,
  p_campaign uuid,
  p_posts jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  new_post_id uuid;
  v_format format_t;
begin
  -- regen cleanup, atomic with the insert (founder_scripts cascade via FK on delete)
  delete from posts
   where account_id = p_account and campaign_id = p_campaign and status <> 'published';

  for item in select * from jsonb_array_elements(p_posts)
  loop
    v_format := (item->>'format')::format_t;
    insert into posts (account_id, campaign_id, channel, format, content, status, approval_state, scheduled_at, rationale)
    values (
      p_account, p_campaign, (item->>'channel')::provider_t, v_format,
      coalesce(item->'content', '{}'::jsonb),
      coalesce((item->>'status')::post_status_t, 'scheduled'),
      coalesce((item->>'approval_state')::approval_t, 'pending'),
      case when coalesce(item->>'scheduled_at','') = '' then null else (item->>'scheduled_at')::timestamptz end,
      item->>'rationale'
    )
    returning id into new_post_id;

    if v_format in ('tiktok_script','founder_script') then
      insert into founder_scripts (account_id, post_id, angle, title, hook, beats, shot_note, duration_sec, filmed)
      values (
        p_account, new_post_id, item->>'angle', item->>'title', item->>'hook',
        coalesce(item->'beats', '[]'::jsonb), item->>'shot_note',
        nullif(item->>'duration_sec','')::int, false
      );
    end if;
  end loop;
end;
$$;

revoke execute on function public.create_campaign_posts(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_campaign_posts(uuid, uuid, jsonb) to service_role;
