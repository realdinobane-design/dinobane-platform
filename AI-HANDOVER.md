# AI HANDOVER — READ THIS BEFORE TOUCHING ANYTHING

**To the next AI (or human) picking up this project: this file is your briefing. Read it fully before making changes. It will save you hours and prevent you from repeating mistakes that have already happened.**

> **Placement rule: this file must live at the repository ROOT and nowhere else. It is for GitHub only. Never copy or move it into `client/public/`, `client/src/`, or any directory the web server serves — it must never be reachable from the live website.**

---

## 1. Mission statement — what DinoBane is

**DINOBANE = "Democracy In Name Only" — and this site is the bane of it.**

DinoBane is a UK political-investigation platform. Its premise: Britain calls itself a democracy, but real power sits with donors, media barons, foreign states, lobby machines, party fixers and dynastic money — not voters. The site exists to document that gap between the democratic branding and the oligarchic reality, with sourced evidence, node by node, event by event.

Everything on the site serves that mission:
- the **UK Power Map** (who really runs Britain, and how they're connected),
- the **timeline dossiers** (how specific operators rose and what they did with power),
- the **Power League** (scoring how much power each actor actually holds),
- the **community, vault, documents and corrections log** (crowd-sourced scrutiny with provenance).

Tone: forensic, sourced, unafraid. Every factual claim should be traceable to Hansard, TheyWorkForYou, court judgments, official statistics, or named journalism. When evidence is thin, we say so (single-source / contested chips) rather than bluffing.

**Important stance note:** the project critiques power structures — parties, donors, lobby groups, states, media owners. Keep criticism aimed at institutions and documented conduct, never at ethnic or religious groups. Several map nodes track antisemitic/far-right networks as subjects of investigation; do not flip that framing.

---

## 2. The product today (as of v.27, August 2026)

Live site: **https://dinobane.com** (Railway). Repo: **https://github.com/realdinobane-design/dinobane-platform.git**

- Landing page + free-preview UK Power Map (94 nodes, 156 connections) with a timed trial for non-members
- Membership paywall: **£4.99/month** via Stripe
- Timeline dossiers (members): The Long March, Starmer, Farage, Mahmood — first act free as a teaser, then an "EYES ONLY — MEMBERS" lock card
- **Power League** — full power-ranking system (see §6)
- Members' community (channels, DMs, reactions, mentions, unread badges)
- Media vault (members), documents vault, global search, timeline comparison, corrections log, ask-the-archive, analytics, admin Intel Desk (`/app/#/admin/intel`)

**World state (matters for content):** it is August 2026. Andy Burnham has been Prime Minister since 20 July 2026. Shabana Mahmood is Home Secretary. Don't "correct" these — they are this timeline's facts.

---

## 3. Stack & architecture

- **Server:** Express, one giant file — `server/routes.ts` (~4,800 lines). WebSocket server for community chat lives near the bottom.
- **Client:** React SPA, Vite, wouter **hash routing** — all app URLs look like `/app/#/community`. Pages in `client/src/pages/`, nav in `client/src/components/app-nav.tsx`.
- **Static map pages:** plain HTML/JS in `client/public/` — `landing.html`, `powermap.html`, `powermap-flat.html`, and the main map `rings-of-power/index.html` + `league.html`. These are NOT React; they load classic scripts (`data.js`, `power-scores.js`, `person-popup.js`) and use `const` globals across script tags.
- **DB:** Drizzle ORM + Postgres. Schema in `shared/`. **Avoid migrations** — see the KV pattern below.
- **Integrations:** Stripe (subs, `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID` / webhook), Resend (email, `RESEND_API_KEY`), Cloudflare R2 (media storage).
- **Build:** `npm install && npm run build` → Vite builds the SPA to `dist/public`, esbuild bundles the server to `dist/index.cjs`. Railway config: `railway.toml`, `nixpacks.toml`.

### The KV pattern (important)
To dodge DB migrations, most v25+ server features store JSON blobs in the `app_settings` table via `storage.getSetting(key)` / `storage.setSetting(key, value)`. Existing keys:
- `page_content:<slug>`, `page_status:<slug>` — admin content overrides / page status
- `timeline_registry` — dossier registry
- `evidence_updates`, `corrections_log`, `documents_registry`, `archive_requests`, `analytics:views`

**Add new features with new KV keys, not new tables**, unless a real table is genuinely unavoidable.

### Auth
- Admins: `PAGE_STATUS_ADMINS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"])` in `server/routes.ts`, enforced by the `requirePageAdmin(req, res)` helper.
- Client pages call `useQuery({ queryKey: ["/api/auth/me"], queryFn: getMe })` — `getMe` returns `null` on 401 (not an error).
- Members-only pages use `MemberRoute` / `SignInLock` / `MembersOnlyLock` components.

---

## 4. THE THREE MAP DATA COPIES (the #1 footgun)

The power-map dataset exists as **three copies that must stay in sync**:

1. `client/public/powermap-data.js` (root — used by `landing.html`, `powermap.html`, `powermap-flat.html`)
2. `client/public/rings-of-power/powermap-data.js`
3. `client/public/rings-of-power/data.js` ← **the one the main map (`index.html`) actually loads**

A Mahmood bio rewrite once shipped to only one copy and silently never went live. **After editing any copy, diff them (they should differ by nothing) and copy the canonical one over the others.** Same discipline applies to `person-popup.js`, which exists at both `client/public/person-popup.js` and `client/public/rings-of-power/person-popup.js` (keep identical).

Other static data: `client/public/map-nodes.json` — generated index of all nodes for global search; each scored node carries a `"power": <total>` field. **Regenerate/merge it whenever node data or scores change** (merge into the existing JSON; the `N` array in data.js is not strict JSON, don't `JSON.parse` it).

---

## 5. Versioning & handover protocol (user-mandated)

- The owner has **no git push credentials from the AI sandbox**. Delivery = one zip of the whole repo: `dinobane-platform-vN.zip`. The owner unzips and pushes.
- **One zip per handover. Delete the previous version's zip. Every version gets a `## v.N — YYYY-MM-DD` entry in `CHANGES.md`** describing what changed and how it was tested.
- Before zipping: `rm -rf node_modules dist` (both are rebuildable; node_modules is huge).
- Current version: **v.28**.

---

## 6. The Power League — how the power rankings work

### Concept
Power is scored editorially ("common sense" judgment from the sourced record) on **five dimensions, each 0–10**:

| Dimension | Meaning |
|---|---|
| **Wealth** | money owned or controlled |
| **Office** | state and institutional levers held *right now* |
| **Network** | connections — who takes the call |
| **Old Money** | dynasty, hereditary depth, institutional age |
| **Influence** | agenda-setting reach |

**Total = (sum of the five) × 2 → a mark out of 100.** Bands:

| Band | Min | Name |
|---|---|---|
| S | 80 | Apex Power |
| A | 68 | Core Power |
| B | 56 | Major Player |
| C | 44 | Operator |
| D | 30 | Satellite |
| E | <30 | Periphery |

**67 actor nodes are scored. The 13 scandal nodes are deliberately unscored — "evidence, not players."** Keep it that way: scandal/inquiry nodes exist to hold receipts, not to wield power.

Calibration landmarks (don't drift far from these without reason): Murdoch 80 — the sole S ("five decades of PMs courting him… the only S-rated node on the map"). Labour 78. Tories/UAE/BBC 76. Blair 74 — deliberately ranked *above* PM Burnham (70) on TBI/Ellison network grounds. Mahmood 56 — the narrative is "power that is almost pure office: MI5, police, Prevent, proscription, borders… No money, no dynasty; it all ends the day she's sacked." Hester 44 — one-dimensional money ("£15m+ in donations buys direct access…"). urbanscoop 16 — the floor.

### The file: `client/public/rings-of-power/power-scores.js`
```js
const POWER_SCORES = {
  "node_id": [wealth, office, network, oldMoney, influence, "one-line justification"],
  ...
};
const POWER_DIMS = [["wealth","Wealth"],["office","Office"],["network","Network"],["dynasty","Old Money"],["influence","Influence"]];
const POWER_BANDS = [[80,"S","Apex Power"],[68,"A","Core Power"],[56,"B","Major Player"],[44,"C","Operator"],[30,"D","Satellite"],[0,"E","Periphery"]];
powerTotal(id)        // → total/100 or null if unscored
powerBand(total)      // → { letter, name }
powerBandColor(letter)// → hex colour
```
Classic-script `const` globals — shared across script tags in the browser (same pattern as `data.js`'s `const N=`). `node require()` tests fail on this pattern; use `eval` in tests instead.

### Where scores surface (touch all of these when rescoring)
1. **`league.html`** — the full sortable league table (rank, score, band chip, five mini-bars, justification, type filters). Rows deep-link to `index.html#n=<id>`; `#n=` hash highlights the row.
2. **Map badges** — `index.html` `drawLabel()` draws a band-coloured chip ("B · 56") above a node's label once `hpx >= 22`.
3. **Map bio panel** — `index.html` `showPanel()` fills `#powerSec`: band name, total dial, five dimension bars, justification, league link.
4. **Person popup** — `person-popup.js` `powerHTML(id)` (compact block). Remember: **two copies to keep in sync**, and its CSS classes collide with the popup's pre-existing `.pwr-*` prefix — grep carefully.
5. **`map-nodes.json`** — `"power": <total>` per scored node (used by global search results).

**To add or rescore a node:** edit `power-scores.js`, update the `power` field in `map-nodes.json`, verify `index.html`, `league.html`, and both `person-popup.js` copies still load, and note the change in CHANGES.md.

---

## 7. Feature inventory by version (see CHANGES.md for full detail)

- **v.24** — Mahmood timeline dossier (`/app/#/mahmood`), 25 map deep-links, map-node rewrite.
- **v.25** — global search (`/api/search` + `/app/#/search`), free timeline teaser with members lock card, source-confidence chips (verified/single-source/contested), event photography (Wikimedia Commons backgrounds), reciprocal map→dossier links, evidence feed + corrections log, member email digest (Resend), documents vault, timeline comparison, ask-the-archive, page-view analytics, admin Intel Desk. All server data in KV — **no migrations**.
- **v.26** — the Power League (scores, league.html, map badges, bio panel block, popup block, `power` in map-nodes.json); community QoL (unread badges via `localStorage db_lastseen_<channel>`, mention highlighting + "@ Mentions only" filter, online-first members list, jump-to-latest, char counter); vault QoL (search, 5-way sort incl. likes/comments from `/api/media/stats`, header stats, byte-size footers).
- **v.27** — this handover file. No code changes.
- **v.28** — nav declutter: desktop bar is 7 primary links + a "More" dropdown (`more: true` flag in `NAV_LINKS`, `PRIMARY_LINKS`/`MORE_LINKS` split in `app-nav.tsx`; mobile drawer shows everything under a MORE divider). League page header gained "← Back to site" alongside "Power Map →".

---

## 8. Testing recipe (works in this sandbox)

- **Static server:** a small `http.server` script serving `dist/public` on `127.0.0.1:8902`, mapping `/app` → `index.html`. **Run the server and the test in the same shell invocation** — background processes do not survive between sandbox shell calls, and rebuilding `dist/` orphans a running server's cwd (kill and restart it after every build).
- **Playwright:** `executable_path="/usr/bin/chromium"`, args `--no-sandbox --disable-gpu --disable-dev-shm-usage`, `wait_until="domcontentloaded"`.
- **Stub APIs** with `pg.route("**/api/**", handler)` and **abort websockets** (`pg.route("**/ws**", r => r.abort())`). Return properly-typed payloads: arrays for list endpoints (`/api/reactions`, `/api/messages/...`) — returning `{}` crashes components like ReactionBar (`reactions.filter`) and you'll chase a phantom bug. (This exact stub artifact cost a debugging session.)
- **After EVERY edit, re-grep to confirm it persisted.** The sandbox filesystem intermittently reports write success without persisting. This has eaten edits to `index.html`, `media-vault.tsx`, `community.tsx` and `person-popup.js` — always verify, sometimes twice.
- Writing files: use shell heredocs (`python3 - <<'EOF'`), not the notebook kernel (it runs unprivileged and can't write root-owned files).
- A missing import in `app-nav.tsx` (a lucide icon) once blanked the **entire SPA** — if every React page renders empty, check the browser console for `X is not defined` before assuming routing/auth bugs.

---

## 9. Outstanding items (owner-side, not code)

1. **Stripe:** create the £4.99/month price and set `STRIPE_PRICE_ID` on Railway (a fallback price ID is hardcoded in `server/routes.ts` — confirm it matches the live price).
2. **Deploy:** the owner pushes the zip to GitHub; Railway auto-deploys. Confirm env vars: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `RESEND_API_KEY`, R2 credentials.
3. The digest sender and several admin features degrade gracefully (503/empty) if env vars are unset — that's intentional.

## 10. Working with the owner

- Wants bold, editorial, complete features ("do it all"), dark forensic aesthetic (near-black, gold `#c9a227` accents, red `#cc2a2a`), uppercase tracking-widest headings, "classified dossier" language.
- Expects real testing evidence (browser-level, zero console errors) before handover, and the zip + CHANGES.md protocol followed exactly.
- Site copy is unapologetically partisan-investigative. Keep claims sourced and keep the institutional-not-ethnic framing discipline (§1).

**Good luck. Follow the money. — D**
