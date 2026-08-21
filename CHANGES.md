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
