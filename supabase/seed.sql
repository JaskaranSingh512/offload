-- seed.sql — Brew Lab showcase data (read-only to any authed user via RLS; see 0001_init §4).
-- DEMO_ACCOUNT_ID = 00000000-0000-0000-0000-00000b1e51ab  (= NEXT_PUBLIC_DEMO_ACCOUNT_ID)
-- Idempotent: deleting the account cascades to all child rows; re-run safe.
begin;

delete from accounts where id = '00000000-0000-0000-0000-00000b1e51ab';
delete from cross_account_aggregates;

-- ── account + brand (with §0.5 brand-doc → channel strategy columns) ──
insert into accounts (id, email) values
  ('00000000-0000-0000-0000-00000b1e51ab', 'founder@brewlab.coffee');

insert into brands (account_id, name, one_liner, domain, colors, voice, audience, goal,
                    doc_name, doc_text, industry, recommended_channels, channel_rationale)
values ('00000000-0000-0000-0000-00000b1e51ab', 'Brew Lab',
  'Small-batch coffee subscriptions for people who take their morning seriously',
  'brewlab.coffee', '{"primary":"#6F4E37","accent":"#E8C39E"}', 'warm_witty',
  'Home-brewing enthusiasts, 25-40, urban, willing to pay for freshness', 'orders',
  'brewlab-brand.md',
  'Brew Lab is a small-batch specialty coffee subscription. We roast to order, print the roast date on every bag, and ship within 48 hours. Direct-trade with four farms. Our customers are home-brewing hobbyists who care about freshness and the ritual of a good morning cup.',
  'specialty coffee / DTC',
  array['instagram','tiktok'],
  'Coffee is intensely visual and habit-driven — Instagram and TikTok let us show the ritual, the pour, and the beans, which converts browsers into subscribers faster than text-first channels. Reddit and X stay in the mix for the enthusiast communities.');

-- ── brand_assets ──
insert into brand_assets (account_id, kind, label, storage_path) values
  ('00000000-0000-0000-0000-00000b1e51ab','logo','Primary logo','brand-assets/00000000-0000-0000-0000-00000b1e51ab/logo.svg'),
  ('00000000-0000-0000-0000-00000b1e51ab','color','Brand palette','brand-assets/00000000-0000-0000-0000-00000b1e51ab/palette.json'),
  ('00000000-0000-0000-0000-00000b1e51ab','sample','Hero bag shot','brand-assets/00000000-0000-0000-0000-00000b1e51ab/hero-bag.jpg');

-- ── social_accounts (all 4 channels) ──
insert into social_accounts (account_id, provider, handle, read_scope, write_scope, status) values
  ('00000000-0000-0000-0000-00000b1e51ab','reddit','u/brewlab',   true, true,  'mock'),
  ('00000000-0000-0000-0000-00000b1e51ab','x','@brewlab',         true, true,  'mock'),
  ('00000000-0000-0000-0000-00000b1e51ab','instagram','@brewlab', true, false, 'read_only'),
  ('00000000-0000-0000-0000-00000b1e51ab','tiktok','@brewlab',    false,false, 'disconnected');

-- ── campaign (2-week) ──
insert into campaigns (id, account_id, name, goal, duration_days, frequency, channels,
                       status, starts_on, ends_on, forecast)
values ('00000000-0000-0000-0000-0000ca33a191','00000000-0000-0000-0000-00000b1e51ab',
  'Summer Cold Brew Push','orders',14,'balanced',
  array['reddit','x','instagram','tiktok'],'active',
  current_date - 5, current_date + 9, '{"impressions":48000,"signups":320}');

-- ── posts (22 across 4 channels, mixed status/approval/format) ──
-- Published (approved, past) — these get a 7-day metrics curve below.
insert into posts (account_id, campaign_id, channel, format, status, approval_state, scheduled_at, published_at, rationale, content) values
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','reddit','reddit_text','published','approved', now()-interval '5 days', now()-interval '5 days','Story-driven Reddit posts build credibility with the home-brew community.', '{"title":"What I learned roasting 50 batches in my garage","body":"Three years ago I could not tell a light roast from a dark one. Here is the cheat sheet I wish I had when I started — grind, ratio, and the one variable nobody talks about."}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','x','x_post','published','approved', now()-interval '4 days', now()-interval '4 days','Quick myth-busting hooks perform well on X.', '{"title":"","body":"Cold brew is not just iced coffee. 18 hours, coarse grind, 1:8 ratio. Smoother, less acidic, ridiculously easy. Recipe in replies."}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','instagram','ig_carousel','published','approved', now()-interval '4 days', now()-interval '4 days','How-to carousels are highly saveable for this audience.', '{"slides":[{"heading":"Cold brew in 4 steps","sub":"No equipment, no fuss"},{"heading":"1. Grind coarse","sub":"Like sea salt"},{"heading":"2. Steep 18h","sub":"Fridge, 1:8 beans to water"},{"heading":"3. Strain","sub":"Cheesecloth or paper filter"},{"heading":"4. Serve","sub":"Over ice, dilute to taste"}],"caption":"Save this for your weekend brew. Which step trips you up?"}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','x','x_thread','published','approved', now()-interval '3 days', now()-interval '3 days','Educational threads drive profile visits.', '{"tweets":["Most specialty coffee at the grocery store was roasted 4+ months ago. Here is why freshness is the whole game.","Coffee degasses CO2 for ~2 weeks after roasting. Too fresh = sour. Too old = flat.","The sweet spot is 5-21 days off roast. We print the roast date on every bag.","The tasting notes you actually taste only show up in that window.","Fresh beans, shipped fast. brewlab.coffee"]}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','instagram','ig_single','published','approved', now()-interval '2 days', now()-interval '2 days','Lifestyle single images humanize the brand.', '{"caption":"The 6am pour that makes the alarm worth it.","image_prompt":"close-up of espresso pour into a ceramic cup, warm morning light, steam rising","image_path":"brand-assets/00000000-0000-0000-0000-00000b1e51ab/generated/pour-morning.png"}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','reddit','reddit_text','published','approved', now()-interval '2 days', now()-interval '2 days','AMA format invites engagement and trust.', '{"title":"AMA: I run a small-batch coffee subscription. Ask me anything about sourcing.","body":"Been at it 3 years, direct-trade with 4 farms. Happy to get into the weeds on green coffee pricing, roast profiles, whatever."}'),
-- Scheduled + approved (future, ready to publish)
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','x','x_post','scheduled','approved', now()+interval '1 day', null,'Approved and queued.', '{"title":"","body":"Your coffee is not bitter because it is strong. It is bitter because it is over-extracted. Grind coarser. Thank me later."}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','reddit','reddit_text','scheduled','approved', now()+interval '2 days', null,'Approved and queued.', '{"title":"The grind-size cheat sheet that fixed my bad coffee","body":"One change — going from a blade to a burr grinder — did more than any expensive machine. Here is the full breakdown by brew method."}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','instagram','ig_carousel','scheduled','approved', now()+interval '3 days', null,'Approved and queued.', '{"slides":[{"heading":"4 signs your beans are stale","sub":"Number 3 is sneaky"},{"heading":"1. No roast date","sub":"If they hide it, it is old"},{"heading":"2. Flat smell","sub":"Fresh beans punch you in the nose"},{"heading":"3. No bloom","sub":"Stale grounds do not puff up"},{"heading":"4. Oily sheen","sub":"On a light roast = rancid"}],"caption":"Check your bag right now. How many did yours hit?"}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','x','x_thread','scheduled','approved', now()+interval '4 days', null,'Approved and queued.', '{"tweets":["A $40 hand grinder beats a $200 automatic for most home brewers. A thread on why.","Consistency of grind matters more than almost anything else in the cup.","Cheap automatics throw a wide particle distribution — fines that over-extract, boulders that under-extract.","A decent hand grinder is dead consistent. The tradeoff is 60 seconds of effort.","Start there before you spend on anything else."]}'),
-- Scheduled + pending (awaiting approval — drives the Approve-all demo)
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','reddit','reddit_text','scheduled','pending', now()+interval '2 days', null,'Drafted, awaiting your approval.', '{"title":"Why we print roast dates (and most roasters do not)","body":"Freshness is measurable and most of the industry hides it. Here is what a roast date actually tells you and why we put it front and center."}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','x','x_post','scheduled','pending', now()+interval '3 days', null,'Drafted, awaiting your approval.', '{"title":"","body":"Hot take: a burr hand grinder and a $5 kitchen scale will upgrade your coffee more than any machine under $500."}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','instagram','ig_single','scheduled','pending', now()+interval '5 days', null,'Drafted, awaiting your approval.', '{"caption":"New single-origin just dropped. Ethiopia Guji, blueberry and jasmine.","image_prompt":"bag of ethiopian single origin coffee beans on a wooden table, soft natural light, minimal","image_path":"brand-assets/00000000-0000-0000-0000-00000b1e51ab/generated/ethiopia-drop.png"}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','instagram','ig_carousel','scheduled','pending', now()+interval '6 days', null,'Drafted, awaiting your approval.', '{"slides":[{"heading":"How we pick a farm","sub":"It is not just the score"},{"heading":"Cup it blind","sub":"No names, no bias"},{"heading":"Visit in person","sub":"Twice a year"},{"heading":"Pay above fair-trade","sub":"Every time"}],"caption":"Sourcing is the unglamorous half of good coffee. A peek behind ours."}'),
-- Draft video (not filmed yet) — never auto-published; founder films + posts manually
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','tiktok','tiktok_script','draft','pending', null, null,'Founder films this one; we track filmed, never auto-publish.', '{"hook":"POV: you finally make cafe-quality cold brew at home","scenes":["Hands grinding beans coarse","Pour water into a mason jar","Time-lapse of an 18h steep","Strain and pour over ice","First sip, satisfied nod"],"shot_note":"Top-down for the pour, natural light, phone is fine","duration_sec":30}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','tiktok','tiktok_script','draft','pending', null, null,'Founder films this one.', '{"hook":"3 coffee mistakes you are probably making","scenes":["Using pre-ground coffee","Boiling water poured straight on","Storing beans in the fridge"],"shot_note":"Punchy cuts, on-screen text per mistake","duration_sec":35}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','tiktok','founder_script','draft','pending', null, null,'Talking-head for the Founder Scripts surface.', '{}'),
-- Scheduled video (filmed = true) — placeholder activated on the calendar
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','tiktok','tiktok_script','scheduled','approved', now()+interval '2 days', null,'Filmed and queued (founder posts manually).', '{"hook":"Watch me roast a batch start to finish","scenes":["Green beans into the roaster","First crack close-up","Cooling tray swirl","Bagging and date-stamping"],"shot_note":"Macro lens on first crack if possible","duration_sec":45}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','tiktok','founder_script','scheduled','approved', now()+interval '4 days', null,'Filmed talking-head, queued.', '{}'),
-- Edge states
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','x','x_post','needs_attention','approved', now()-interval '1 day', null,'Publish failed — token needs reconnect.', '{"title":"","body":"Heads up: our oat-milk supplier changed formulas. If your latte tasted different this week, that is why — and we are switching back."}'),
('00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191','reddit','reddit_text','stalled','pending', now()-interval '1 day', null,'Stalled — needs a decision.', '{"title":"Thinking about a referral program — what would actually make you share?","body":"Considering free shipping vs a free bag vs account credit. Genuinely asking what would move you."}');

-- Known seed post (fixed id) for the /api/chat-edit demo — a Reddit text post.
insert into posts (id, account_id, campaign_id, channel, format, status, approval_state, scheduled_at, rationale, content)
values ('00000000-0000-0000-0000-0000905709a1','00000000-0000-0000-0000-00000b1e51ab','00000000-0000-0000-0000-0000ca33a191',
  'reddit','reddit_text','scheduled','pending', now()+interval '1 day',
  'Target post for the live chat-edit demo.',
  '{"title":"The 18-hour cold brew recipe that converted my whole office","body":"Coarse grind, 1:8 ratio, fridge overnight. I brought a batch to work and now I am the office barista. Full recipe and ratios inside."}');

-- ── founder_scripts: one per video post (both tiktok_script and founder_script) ──
insert into founder_scripts (account_id, post_id, angle, title, hook, beats, shot_note, duration_sec, filmed)
select account_id, id,
  case format when 'founder_script' then 'founder-voice' else 'product-demo' end,
  'Brew Lab — ' || channel || ' / ' || format,
  coalesce(content->>'hook', 'Hey, I am the founder of Brew Lab. Quick story...'),
  coalesce(content->'scenes', '["Open with the hook","Show the product in use","One clear call to action"]'::jsonb),
  coalesce(content->>'shot_note', 'Eye-level, natural light, phone is fine'),
  coalesce((content->>'duration_sec')::int, 30),
  (status = 'scheduled')
from posts
where account_id='00000000-0000-0000-0000-00000b1e51ab' and format in ('tiktok_script','founder_script');

-- ── post_metrics: 7-day curve for each published post ──
insert into post_metrics (account_id, post_id, impressions, engagements, followers_delta, captured_at)
select p.account_id, p.id,
  (800 + g*420 + (random()*200)::int),
  (40 + g*22 + (random()*15)::int),
  (2 + (random()*8)::int),
  now() - ((7-g) || ' days')::interval
from posts p cross join generate_series(1,7) g
where p.account_id='00000000-0000-0000-0000-00000b1e51ab' and p.status='published';
update post_metrics set engagement_rate = round(engagements::numeric / nullif(impressions,0), 4)
where account_id='00000000-0000-0000-0000-00000b1e51ab';

-- ── tracked_links + conversions ──
insert into tracked_links (account_id, post_id, slug, destination_url, utm, click_count)
select account_id, id, 'bl-'||left(id::text,8),
  'https://brewlab.coffee/?ref='||left(id::text,8),
  jsonb_build_object('utm_source',channel,'utm_campaign','summer-cold-brew'),
  (20 + (random()*180)::int)
from posts where account_id='00000000-0000-0000-0000-00000b1e51ab' and status='published';

insert into conversions (account_id, tracked_link_id, post_id, kind, value, source, occurred_at)
select account_id, id, post_id, 'signup', 0, 'utm', now()-interval '3 days'
from tracked_links where account_id='00000000-0000-0000-0000-00000b1e51ab' limit 3;
insert into conversions (account_id, tracked_link_id, post_id, kind, value, source, occurred_at)
select account_id, id, post_id, 'order', round((18+random()*30)::numeric,2), 'snippet', now()-interval '1 day'
from tracked_links where account_id='00000000-0000-0000-0000-00000b1e51ab' limit 3;

-- ── suggestions + notifications ──
insert into suggestions (account_id, kind, body, payload) values
  ('00000000-0000-0000-0000-00000b1e51ab','channel','Your Reddit posts are outperforming X about 3:1. Consider shifting two X slots to Reddit next week.','{"channel":"reddit"}'),
  ('00000000-0000-0000-0000-00000b1e51ab','timing','Engagement peaks 7-9am for your audience. Move morning posts earlier.','{"window":"07:00-09:00"}'),
  ('00000000-0000-0000-0000-00000b1e51ab','reconnect','TikTok is disconnected — reconnect to schedule your filmed videos.','{"provider":"tiktok"}');

insert into notifications (account_id, kind, body, read) values
  ('00000000-0000-0000-0000-00000b1e51ab','published','Your Reddit post "What I learned roasting 50 batches" went live.', true),
  ('00000000-0000-0000-0000-00000b1e51ab','approval','5 posts are scheduled and waiting for your approval.', false),
  ('00000000-0000-0000-0000-00000b1e51ab','metric','Your cold-brew carousel passed 5k impressions.', false);

-- ── cross_account_aggregates (global benchmark rows) ──
insert into cross_account_aggregates (industry, audience_type, goal, format, metric, value, sample_size) values
  ('specialty coffee / DTC','consumer','orders','ig_carousel','engagement_rate',0.058,140),
  ('specialty coffee / DTC','consumer','orders','reddit_text','engagement_rate',0.072, 90),
  ('specialty coffee / DTC','consumer','orders','x_thread','engagement_rate',0.031,120),
  ('specialty coffee / DTC','consumer','orders','tiktok_script','engagement_rate',0.094, 75),
  ('DTC food & bev','consumer','awareness','ig_single','engagement_rate',0.042,210),
  ('DTC food & bev','consumer','orders','x_post','engagement_rate',0.026,180);

commit;
