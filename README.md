# DinoBane — Working Rules

Read this before touching anything. It exists so a fresh session (human or AI)
can build on this repo without re-learning everything the hard way.

---

## 1. What this site is

A serious political-investigation membership platform. The YouTube channel
carries the satire — the site itself is the serious record. Its assets:

- **The Vault** — the best videos, member-only (`media` table + Cloudflare R2).
- **Rolling News** — continuously updated aggregator.
- **Timelines / Dossiers** — full chronological records (The Long March,
  Starmer, Farage). Every name mentioned is a live link that opens that
  person's file as a popup. This is the site's signature feature.
- **UK Power Map** — the reference library: 94 nodes, 118 edges, satellites.
  Interactive canvas version at `/rings-of-power/`, flat version at
  `/powermap-flat.html`, shared data in `powermap-data.js`.
- **Community + Membership** — Stripe subscriptions, custom session auth.

## 2. Voice & content rules (hard rules — do not violate)

1. **Never invent content.** No made-up articles, headlines, timeline events,
   map nodes, or statistics. Use only what exists in the repo and its data
   files. If it's not in the code, it doesn't go on the page.
2. **Never mention paywalls** or payment mechanics in marketing copy.
3. **No references to rival outlets or shows.**
4. **Episodes are daily.** Never "Tuesdays and Thursdays" or any schedule.
5. **No Patreon.** Nothing weird or misleading, ever.
6. **Never call the site satire.** That word describes the videos only.
7. **Locked/greyed-out styling is CTA-teaser logic only.** Real product
   surfaces show everything, fully visible, beautiful, and easy to read.
8. **Names link to popups, not pages.** Clicking a name opens their file
   in place (person-popup.js). It never navigates to the map page.

## 3. Design system

### Brand
| Token | Value | Use |
|---|---|---|
| `--bg` | `#070708` | page background |
| `--bg2` | `#101013` | panels/cards |
| `--ink` | `#f5f2ea` | primary text |
| `--muted` | `#a09c90` | secondary text |
| `--line` | `#232327` | borders |
| `--yellow` | `#f7e017` | primary CTA / accents (text on it: `#111`) |
| `--red` | `#e5484d` | alerts; email headers use `#cc2a2a` |

Fonts: **Archivo Black** for display/headings, **Inter** for body/labels.

### Power map colours — the site's own system, never improvise
Node types (`CAT` in `rings-of-power/index.html`):
money `#2f9bff` · media `#f472b6` · party `#ff4757` · lobby `#b16bff` ·
person `#f5f7fa` · scandal `#ffb020`

Edge kinds (`ET`):
money `#ffd166` · own `#2ee6cf` · work `#7bf59a` · party `#ff5c5c` ·
state `#c98bff` · personal `#93a0b8` · law `#ff8f4d`

Edge certainty: solid = on the record, dashed = reported, dotted =
circumstantial.

Structure: ring = power tier (ring 0 inner = most powerful; size and label
weight show the tier). Satellites = small coloured dots orbiting their
parent with a connector; their labels appear when the parent is hovered.

### Email
All email uses the branded helpers in `server/routes.ts`:
`emailWrapper(emailHeader(subtitle) + rows + emailFooter(note))` with
`logoAttachment()` (CID logo), sent via Resend from
`DinoBane <noreply@dinobane.com>`.

## 4. Architecture map

```
server/
  index.ts    entry; session middleware ONLY runs on /api/* — req.session
              is undefined on page routes; query the DB directly there
  static.ts   serves dist/public; "/" is the landing gate (signed-out →
              landing.html, signed-in → SPA); "/app" always serves the SPA
  routes.ts   all API routes; email helpers; token tables auto-create at
              startup (verification_tokens, free_video_tokens)
  db.ts       exports `pool` (pg)
  storage.ts  storage interface incl. getSetting/setSetting (app_settings)
  r2.ts       Cloudflare R2 (Vault media bucket: dinobane-vault)
client/
  index.html  SPA shell; loads powermap-data.js + person-popup.js
  src/App.tsx routes. Public: / /login /register /membership /news
              /articles /privacy /contact. Member-gated (MemberRoute):
              /timelines /long-march /starmer /farage /long-march-noir
              /timeline/:slug /community /media-vault
  src/components/timeline-renderer*.tsx  call PowerLink.scan() after render
  public/
    landing.html        signed-out landing (gate target)
    free-video.html     token-gated free video watch page
    powermap-flat.html  flat map (SVG, CAT/ET colours, click → popup)
    videos.html         placeholder page
    powermap-data.js    N/E/SAT/CONTRO/ROLES/DEMOG/CAMP/KISSED globals
    person-popup.js     name-link engine; API: PowerLink.scan(root),
                        PowerLink.open(id), PowerLink.close()
    rings-of-power/     the original interactive map. EXACTLY five files:
                        index.html, data.js, logo.png, uk-power-map.html,
                        rings-of-power-wiring.patch. NEVER put anything
                        else in here (see §6).
```

### URL scheme — critical
- App routes are **hash routes** (wouter). The server never sees `#/…`.
- So every link that must reach the app — emails, Stripe success/cancel
  URLs, landing CTAs — must be **`/app/#/route`**, never `/#/route`.
  A root-hash URL hits the `/` gate and signed-out users get the landing.
- `/` = gate. `/app` = always the SPA.

### Data shapes (powermap-data.js)
- `N` = `[id, name, type, ring, desc, sources, wiki]` (94 nodes)
- `E` = `[fromId, toId, "solid"|"dash"|"dot", label, kind]` (118 edges)
- `SAT` = `[parentId, name, role, desc, …]` (78 satellites)

### Env vars
`DATABASE_URL` · `RESEND_API_KEY` · `STRIPE_*` · `R2_ACCOUNT_ID` /
`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_PUBLIC_URL` ·
`VITE_APP_URL` (defaults to https://dinobane.com)

## 5. How to build on request (workflow)

1. **Read the repo first.** Routes, content, and data are all in the files.
   Never ask the user for information the code already contains, and never
   guess at routes — look them up in `App.tsx`.
2. **Verify every edit with `grep`.** Edit tools can report success without
   applying. No edit counts until grep proves it.
3. **Sandbox quirks:** `/tmp` is wiped between sessions — re-clone the repo
   (`github.com/realdinobane-design/dinobane-platform`) at the start of any
   code task. The notebook interpreter runs as an unprivileged user and
   can't overwrite existing files — write via the shell.
4. **Build before handover:** `npm install && npm run build` must pass.
   Screenshot any visual page headless before claiming it looks right
   (note: full-height heroes inflate tall screenshots — hide preceding
   sections to capture lower ones). Pre-existing `tsc` warnings in
   `dm-chat.tsx` / `admin-content.tsx` / `community.tsx` / `videos.tsx` /
   `db.ts` are not yours; don't "fix" them, don't add new ones.
5. **Handover discipline:**
   - One zip only, named `dinobane-platform-vN.zip` — N = next number after
     the latest commit. Delete the previous zip.
   - Log the version in `CHANGES.md` (what changed, why, anything the user
     must do). Commit as `v.N — short summary`.
   - Be clear and concise. No clutter, no demo leftovers, no working files
     presented as deliverables. Sloppiness wastes time.
6. **Deploy path:** the user pushes to GitHub; Railway auto-deploys. If the
   live site looks unchanged after a handover, check in order: (a) was the
   new code actually pushed, (b) is the tester signed in (the `/` gate
   shows members the app, not the landing — test signed-out/incognito),
   (c) Cloudflare/Railway cache.

## 6. Known traps (learned the hard way)

- **v.13 accident:** a website package was dumped into
  `client/public/rings-of-power/`, overwriting the live map. That folder is
  sacred — five files, nothing else.
- **Root-hash URLs** (`/#/login`) silently hit the landing gate. Always
  `/app/#/…`.
- **`req.session` is undefined outside `/api/*`** — page routes must query
  the `sessions` table directly (see the `/` gate in `static.ts`).
- **Don't invent design elements.** Extract the site's real system first —
  e.g. map colours live in `CAT`/`ET` in `rings-of-power/index.html`.
- **Mockup UI must never ship.** No demo modals, no "in production this
  would…" notes. If a backend piece is missing, build it — the infra for
  email (Resend), tokens, media (R2), and settings already exists; extend
  those patterns.

---

## Pricing rule (settled v.22 — do not change without the owner)

- ONE membership, £4.99/month, flat. No tiers. Every member gets everything: news, timelines, articles, the Vault, community, power map dossiers.
- The price lives in TWO kinds of places that must always agree: every UI label (landing.html, membership.tsx, home*.tsx, app-nav, v2-shell, profile, login, register, community, media-vault) and the Stripe price object itself (`STRIPE_PRICE_ID` on Railway — create/edit prices in the Stripe dashboard, never hardcode a new price ID into the repo default).
- Access control is `isMember` only. There is no tier column and no feature gating between members — never reintroduce one without an explicit owner request.
