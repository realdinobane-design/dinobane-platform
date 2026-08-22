# What changed in this package

Everything from the landing-page project, integrated into the platform and
build-verified (`npm run build` passes; pre-existing `tsc` warnings in
`dm-chat.tsx` / `admin-content.tsx` / `community.tsx` / `videos.tsx` are
unchanged from your repo).

## New pages (in `client/public/`, copied to `dist/public/` on build)

| File | Served at | What it is |
|---|---|---|
| `landing.html` | `/` (signed-out only) | The landing page — Vault, rolling news, timelines, power map, community, membership |
| `powermap.html` | `/powermap.html` | Power Map — detailed version |
| `powermap-flat.html` | `/powermap-flat.html` | Power Map — flat version: monochrome, power tiered by node size/weight, red = money edges, hollow pins = satellites. Each map's header links to the other. |
| `videos.html` | `/videos.html` | Video uploads placeholder — "coming soon" |
| `person-popup.js` | `/person-popup.js` | Cross-link engine (see below) |
| `powermap-data.js`, `powermap-tours.js` | — | The map dataset + guided tours |
| `img/orig/` | `/img/orig/…` | Landing-page imagery |

## The landing-page gate (`server/static.ts`)

`GET /` now checks the `dinobane_sid` session cookie against the `sessions`
table directly (the session middleware only runs on `/api/*`, so the gate does
its own lookup):

- **Live session** → the member app (`index.html`)
- **No session / any error** → `landing.html`

A new route, `GET /app`, always serves the member app ungated. All
server-generated links — bare-path redirects, verification/password-reset
emails, Stripe success/cancel/return URLs — were repointed from `/#/…` to
`/app/#/…` so no functional flow ever hits the gate. The landing page's own
feature links also use `/app/#/…`, so signed-out visitors can still reach
public pages like News, while member-only routes keep their existing in-app
redirects. The client-side check in `landing.html` (`GET /api/auth/me` →
redirect to `/`) remains as a backup.

## Timeline ↔ Power Map cross-links

- `client/index.html` now loads `/powermap-data.js` + `/person-popup.js`.
- `TimelineRenderer` and `TimelineRendererNoir` scan the page after render, so
  **every timeline** (Starmer, Farage, Long March, noir, and any
  `timeline/:slug`) automatically turns mapped names into popup links —
  bio, positioning, career & power, affiliations, controversies, sources,
  without leaving the page.
- Only names that exist on the power map are linked (plus unambiguous
  surnames like "Mandelson"; risky ones like "Brown" are blocked). Add a node
  to `powermap-data.js` and it starts linking everywhere.

## Still to wire when you're ready

- The landing email gate ("Send me a free video") needs one backend endpoint:
  store the address, email a private link to the chosen Vault video. The front
  end is done; the modal is marked as a demo until the route exists.
- `videos.html` is a placeholder until you decide whether to host video.

## Deploy

Same as before — Railway, NIXPACKS: `npm run build`, `npm start`. Nothing new
is required in env vars.

## v.16 — Sign-in on landing + real free-video email gate (2026-08-21)

**Fixes two live bugs reported after v.14 deploy:**

1. **No way to sign in from the landing page.** Signed-out members hitting
   dinobane.com had no login entry point. Added a "Sign in" button to the
   landing header (next to Join Now) and a "Sign in" link in the footer
   Members column. Both go to `/app/#/login`.

2. **"Send me a free video" was a leftover mockup demo modal.** Removed the
   fake modal (including the "Mockup demo / paywall" disclaimer and the
   demo alert). The email gate is now real, end to end:
   - `POST /api/free-video` — validates the email, mints a 7-day token
     (new `free_video_tokens` table, auto-created at startup), and sends a
     branded Resend email with a private link: `/free-video.html?token=…`
   - `GET /api/free-video/verify?token=…` — validates the link and returns
     the video URL + title
   - `POST /api/admin/free-video` (admin only) — choose which video the
     gate gives away. Body: `{"url": "https://…", "title": "…"}`
     (R2 public URL or YouTube link both work). Until you set this, the
     watch page tells visitors the video is being uploaded.
   - `client/public/free-video.html` — branded watch page for the private
     link: plays mp4/R2 files or embeds YouTube, handles invalid/expired
     links, and funnels viewers to membership.

   To set the free video after deploy (logged in as admin, grab your
   `dinobane_sid` cookie):
   ```bash
   curl -X POST https://dinobane.com/api/admin/free-video \
     -H "Content-Type: application/json" \
     -H "Cookie: dinobane_sid=YOUR_SESSION_ID" \
     -d '{"url":"https://YOUR-R2-URL/video.mp4","title":"This week'"'"'s Vault pick"}'
   ```

## v.17 — Flat map rebuilt + every CTA wired + free video live (2026-08-21)

1. **powermap-flat.html rebuilt from scratch** in the teaser style (flat,
   dark, labelled nodes on concentric rings) using the original map's own
   colour system — node types: money #2f9bff / media #f472b6 / party
   #ff4757 / lobby #b16bff / person #f5f7fa / scandal #ffb020; edge kinds:
   money #ffd166 / own #2ee6cf / work #7bf59a / party #ff5c5c / state
   #c98bff / personal #93a0b8 / law #ff8f4d. No locked or greyed nodes.
   Ring = power tier (size + label weight), satellites = small dots with
   connectors, labels appear when you hover the parent. Hover focuses a
   node's web; click opens their file; search box; scroll-zoom + drag-pan;
   legend. Header links to the full interactive map at /rings-of-power/.

2. **Every landing CTA wired.** Fixed: logo (was href="#"), Long March
   "Start here" card (was plain text, now opens the dossier), locked
   Starmer/Farage cards (now click through to membership), all five
   rolling-news rows (now open Rolling News), all "Power Map" links
   (nav, footer, "Open the full map" — now point at the real map,
   /rings-of-power/). powermap.html removed (superseded).

3. **Free video now serves "Are You Ready".** GET /api/free-video/verify
   falls back to the Vault video matching "are you ready" when no admin
   override is set — emailed links play the video instead of the
   holding page. Admin override endpoint unchanged.

4. Cleaned the v.13 dump leftovers out of client/public/rings-of-power/
   (folder now matches the original five files).

## v.18 — Working rules + repo housekeeping (2026-08-21)

1. **README.md added** — the rulebook for building on this site: brand
   palette and fonts, the power map's colour system (CAT/ET), voice and
   content red lines, architecture map, the /app/#/ URL rule, the
   build/verify/handover workflow, and the known traps (v.13 accident,
   root-hash links, session middleware scope, no mockup UI in production).
2. **Repo root cleaned** — removed the v.13 dump leftovers: `app/`,
   `standalone-preview/`, `data.js.bak`, `plan.md`, `READ-ME-FIRST.txt`.

## v.19 — 2026-08-21
**CRITICAL FIX: entire /app was blank on live (Sign in, Register, all member pages).**
- Root cause: `vite.config.ts` had `base: "./"` — built index.html referenced assets relatively (`./assets/index-*.js`). At `/` they resolved fine; at `/app` they resolved to `/app/assets/...` → 404 → SPA catch-all served index.html as text/html → browser blocked the module scripts → blank page. Any URL under /app was dead for everyone.
- Fix 1: `base: "/"` in vite.config.ts — built assets now referenced absolutely.
- Fix 2: `server/static.ts` — cached SPA shell with `<base href="/">` injected (`sendSpa`), used by `/` (member branch), `/app` and the catch-all, so deep links can never break asset resolution again even if a relative ref slips through.
- Verified in build output: `src="/assets/index-*.js"`, `src="/powermap-data.js"` (absolute).

## v.20 — 2026-08-21
**Security: stop leaking credentials in API responses + DM deletion.**
- Embedded user objects in community messages, replies, media comments, DM history, DM send responses and DM conversation lists included the full users row — bcrypt password hash, email address and Stripe customer ID went out to any logged-in member's browser. All now pass through `toSafeUser()` (server/storage.ts) which strips `password`, `email`, `stripeCustomerId`. Admin-only endpoints unchanged (still full records, admins only).
- New route: `DELETE /api/dm/message/:id` — a sender can delete their own DM; admins can delete any. Enables DM moderation and test cleanup.
- Includes v.19 (blank /app fix) — deploy this, not v.19.

## v.22 — 2026-08-21
**Single flat membership: £4.99/month, everyone gets everything. (Owner decision — supersedes the v.21 tier experiment, which was never deployed.)**
- Landing page: two tier cards replaced with one "Member — £4.99/month" card listing the full feature set.
- Every price label in the app updated £5 → £4.99: membership, register, login, home, home-v2, community, media-vault, profile, app-nav, v2-shell, welcome-email automation text.
- No tiers anywhere: access control remains `isMember` only; no tier column, no gating between members.
- **ACTION REQUIRED on deploy:** create the £4.99/month price in Stripe and set `STRIPE_PRICE_ID` on Railway — the hardcoded fallback is still the old £5 price, so without the env var checkout would charge £5. Existing £5 subscribers keep their current plan until they cancel/re-subscribe (Stripe never reprices a live subscription automatically) — your call whether to migrate them.

## v.23 — 2026-08-21
**Power Map funnel: timed free preview + intro polish.**
- Free preview: non-members get 2 minutes of full map access, starting the moment the "How to read the map" guide is closed (or when the intro ends if the guide is suppressed). Countdown chip bottom-left ("Free preview · 1:47 left"). When it ends the map locks behind a subscribe card (unlimited map + Vault + news/timelines + community, £4.99/month CTA + sign-in link for logged-out members). The lock persists (localStorage) — refreshing doesn't reset it.
- Members are never timed or locked: checked live against /api/auth/me (same-origin session cookie).
- Guide popup gains a "Don't show this again" tickbox (localStorage `upm_nointro`) — works for everyone, members included.
- Intro sequence rebuilt: the zoom starts immediately (was a 3.4s freeze), creeping very slowly and accelerating (ease-in cubic), landing on the standard view exactly as the title finishes fading (~4.2s).
- Title overlay readability: dark radial backdrop behind the title plus layered shadows on title and strapline — no longer lost against the glowing web.
- Trial length is one constant (TRIAL_SECONDS in rings-of-power/index.html) if it ever needs tuning.

## v.24 — 2026-08-22
**New timeline dossier: Shabana Mahmood (`/app/#/mahmood`).**
- New page `client/src/pages/mahmood.tsx` — full dossier timeline in the Starmer/Farage house pattern: 4 acts (Origins 1980–2010 · Opposition 2010–2024 · The Lord Chancellor 2024–25 · The Home Office 2025–present), 20 events (9 key), 6 pull-quotes (verbatim, sourced: TheyWorkForYou voting fingerprint, British Muslim TV 2024 faith interview, acceptance speech, "safest way forward", "two-tier sentencing… under my watch", Times "fair spread"), collapsible "Read the dossier" details, 6 tactics, 4-step engine, closing. Content built from the 12-dimension Mahmood research dossier (Hansard, TheyWorkForYou, gov.uk, court judgments, official stats).
- **Power Map cross-links**: 25 in-timeline links deep-link straight into the map at the relevant node — `/rings-of-power/index.html#n=<id>` — covering mahmood, labour, burnham, islam, mb, pakistan, ricu, asylumhotels, grooming, robinson. The map's existing `#n=` deep-link handler flies straight to the node.
- Route: `/mahmood` (MemberRoute, same gating as /starmer and /farage) in `client/src/App.tsx`; registry seed entry in `client/src/lib/timelines.ts` (slug `mahmood`, code DB-SM-007, official cabinet portrait card image) so the Timelines hub lists it automatically even before any DB registry update.
- Admin override: same deep-merge pattern as starmer.tsx — content can be edited via the page-content key `mahmood` without code changes; `?defaults=1` previews the shipped copy.
- Tested in a real browser (Chromium/Playwright): page renders end-to-end with zero JS errors, all acts/quotes/tactics/engine/closing present, hub card links correctly, and `#n=mahmood` deep-link selects her node on the map. Non-members redirect to sign-in as designed.

## v.25 — 2026-08-22
**The platform release: ten new features, Mahmood photos + map-node rewrite.**
- **Global search** — new public page `/app/#/search`: one box across dossier timeline events (client-side over the shipped data), every UK Power Map node (new static index `client/public/map-nodes.json`, 80 nodes), articles and the timeline registry (new server endpoint `GET /api/search?q=`). Linked in the main nav.
- **Free timeline teaser** — `/long-march`, `/starmer`, `/farage`, `/mahmood` and `/timeline/:slug` are now public routes. Non-members see the hero, thesis and the entire first act, then an "EYES ONLY — MEMBERS" lock card ("The rest of this dossier is classified", £4.99/month CTA + sign-in link). Members get the full dossier + reactions exactly as before. Implemented via a `locked` prop on `TimelineRenderer`; `/timelines` hub is public too so visitors can browse.
- **Source-confidence chips** — `TimelineEvent.confidence` ("verified" / "single-source" / "contested") renders a colour-coded chip (gold/steel/red, with tooltip definitions) on every event card. All 25 Mahmood events tagged (24 verified, born-1980 single-source).
- **Mahmood event photography** — all 25 events now carry a `imageUrl` (Wikimedia Commons, licence-checked URLs), rendering as the semi-transparent card background like the other timelines.
- **Reciprocal map→dossier links** — `person-popup.js` now has a `DOSSIERS` registry; nodes with a full dossier (mahmood, farage) get a "Read the full DinoBane dossier →" button in their map popup, closing the loop with the timelines' map links.
- **Mahmood map node rewritten** from the deep-dive: two-records framing (19 votes against a stricter asylum system → the most restrictive package since the 1990s), Jamaica letter, 2024–25 justice reforms, Palestine Action/HTS/NCHI proscription context, "fair spread", NEC/Burnham saga, majority 3,421, links to `/app/#/mahmood`; sources: Hansard, TheyWorkForYou, The Times, gov.uk, Full Fact.
- **New-evidence feed + corrections log** — public page `/app/#/corrections` shows both; admin CRUD via `POST/DELETE /api/admin/evidence` and `/api/admin/corrections` (KV keys `evidence_updates`, `corrections_log`). Corrections Log also linked in the footer.
- **Member email digest** — `POST /api/admin/digest` emails the last 7 days of evidence updates to all members via Resend (graceful 503 if `RESEND_API_KEY` unset).
- **Documents vault** — member page `/app/#/documents`, a registry of primary sources with provenance (source/date/original link); admin-managed via `PUT /api/admin/documents` (KV key `documents_registry`).
- **Timeline comparison** — member page `/app/#/compare?a=&b=`: two dossiers side by side, events in chronological order, with picker dropdowns and links into the full dossiers.
- **Ask the Archive** — member page `/app/#/ask` files research requests (`POST /api/archive-requests`, members only); admin triage with open/in-progress/answered/declined statuses (`GET/PATCH /api/admin/archive-requests`).
- **Analytics** — silent page-view ping (`POST /api/analytics/view`) on every route change; admin view `GET /api/admin/analytics` shows top routes with bar chart.
- **Admin Intel Desk** — new `/app/#/admin/intel` console (nav → user menu → Intel Desk) with tabs for evidence, corrections, documents, requests, analytics and the digest sender. All v25 server data lives in `app_settings` KV rows — **no database migrations**.
- Tested in Chromium/Playwright with stubbed APIs: guest sees teaser + lock card (first act only, 4 events, chips + background photos render), member sees all 25 events + tactics + reactions, search groups results, compare renders 63 events across two columns, documents/ask/corrections pages render, power map + popup load clean. `npm run build` passes.

## v.26 — 2026-08-22
**The Power League: every map actor scored, ranked and badged — plus community & vault QoL.**
- **Power League scoring engine** — new `client/public/rings-of-power/power-scores.js`: 67 actor nodes scored 0–10 on five dimensions (Wealth, Office, Network, Old Money, Influence), total = sum × 2 → mark out of 100, with a one-line editorial justification per node. Bands: S 80+ Apex · A 68+ Core · B 56+ Major Player · C 44+ Operator · D 30+ Satellite · E <30 Periphery. The 13 scandal nodes are deliberately unscored ("evidence, not players"). Top of the table: Murdoch 80 (sole S), Labour 78, Tories/UAE/BBC 76, Qatar/Blair 74; Mahmood 56 B ("power that is almost pure office… it all ends the day she's sacked").
- **League table page** — new `rings-of-power/league.html`: full sortable table (rank, actor, score, band chip, five mini dimension bars, justification), type filters (People / Money / Parties / Lobbies & States / Media), band legend and methodology header. Every row deep-links to `index.html#n=<id>`; `#n=` hash highlights the row. Linked from the map header (POWER LEAGUE button) and the site nav.
- **Badges on the map** — nodes with a score now carry a band+score chip ("B · 56") drawn directly above their label once the node is big enough on screen; band-coloured.
- **Bio panel power section** — the map's side panel now shows a "Power League" block: band name, big band-coloured total dial, five dimension bars with scores, the justification note, and a link to the full league at that row. Same block (compact) added to the person popup used by landing/powermap-flat pages. `map-nodes.json` now carries a `power` total per scored node, so global search results can show it.
- **Community QoL** (`/app/#/community`): unread-badge counts per channel (localStorage last-seen markers, bumped by live websocket messages while you're in another channel); posts that @-mention you get a gold border + "Mentions you" chip; "@ Mentions only" filter toggle in the search bar; members list sorted online-first with a filter box (desktop sidebar + mobile drawer); jump-to-latest floating button when scrolled up; draft character counter (n/2000).
- **Vault QoL** (`/app/#/media-vault`): header stats line (N files · total bytes); toolbar with file-name search and 5-way sort (newest/oldest/most liked/most discussed/largest, likes+comments from the bulk stats map); per-card footer shows exact byte size with upload date tooltip; "N shown · bytes" result count; empty states for no-match searches.
- Fixed: missing `Trophy` import in app-nav (crashed the SPA shell); missing `mentionsMe` definition in community PostCard.
- Tested in Chromium/Playwright with stubbed APIs: league renders 67 rows (Murdoch first), map bio shows 5 dims + 56 total, badge chip renders above labels, mentions filter narrows to mention posts, vault search/sort reorder correctly, zero console errors. `npm run build` passes.

## v.27 — 2026-08-22
**Handover documentation only — no code changes.**
- Added `AI-HANDOVER.md` at the repo root: a full briefing for the next AI/developer — mission statement (DINOBANE = "Democracy In Name Only", and this site is the bane of it), architecture, the KV no-migration pattern, the three-map-data-copies rule, the Power League scoring system and every place scores surface, versioning/zip protocol, sandbox testing recipe with known pitfalls, and outstanding owner-side items (Stripe price ID, deploy env vars). **Repo-root placement is deliberate: it ships to GitHub but is never served by the website. Do not move it into `client/` or any served path.**
