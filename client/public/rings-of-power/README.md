# DinoBane — Website Package

Everything in one drop: landing page, both power maps, the videos placeholder, and the cross-link popup system.

## What's in here

| File | What it is |
|---|---|
| `index.html` | Landing page — Vault, rolling news, timelines, power map, community, membership |
| `powermap.html` | Power Map — the detailed version (coloured by type) |
| `powermap-flat.html` | Power Map — the flat version. Monochrome, power tiered by node size/weight, red = money edges, hollow pins = satellites |
| `videos.html` | Video uploads page — "coming soon" placeholder, already in the nav |
| `person-popup.js` | The cross-link engine — turns names on any page into popup files |
| `powermap-data.js` | The dataset: 94 nodes, 118 connections, sources, controversies, roles |
| `powermap-tours.js` | The five guided tours |
| `img/orig/` | Brand imagery and logo |

## The cross-link popups (the important bit)

Any name that exists on the power map becomes a live link. Clicking it opens
that person's file in place — bio, positioning, career & power, affiliations,
controversies, sources. It never navigates away.

**Static pages** (like the landing page): just mark the container:

```html
<script src="powermap-data.js"></script>
<script src="person-popup.js"></script>

<div class="timeline" data-powerlink>
  ...your timeline HTML...
</div>
```

**The React timelines** (`starmer.tsx`, `farage.tsx`, `long-march.tsx`):

1. Copy `powermap-data.js` and `person-popup.js` into `client/public/`.
2. Add both script tags to `client/index.html`, before `</body>`.
3. On each timeline page, scan after render:

```tsx
import { useEffect, useRef } from "react";

const ref = useRef<HTMLDivElement>(null);
useEffect(() => { window.PowerLink?.scan(ref.current); }, []);

return <div ref={ref} data-powerlink>{/* existing timeline content */}</div>;
```

That's it — every mapped name in every event becomes a popup link.
Names **not** on the map (e.g. Keir Starmer, currently) stay as plain text.
Add them to `powermap-data.js` and they start linking automatically.

Rules it follows so nothing misleading happens:
- Only exact names from the map are linked (plus distinctive surnames like
  "Mandelson" or "Farage" when they're unambiguous).
- Surnames that could false-positive ("Brown", "Khan", "Fink"...) are blocked.
- It never links inside existing links, buttons, or its own popups.

## Two map versions

Both are full working maps — same data, same dossiers, same tours, same
filters. Each has a header button that switches to the other, so you can
keep both live and decide later.

## Honest gaps to wire up on the server

- The email gate ("Send me a free video") needs a backend endpoint: store the
  address, email a signed/private link to the chosen Vault video. The front
  end is ready; the modal is marked as a demo until then.
- The join buttons open the demo modal — point them at the real membership
  checkout.
- `videos.html` is a styled placeholder, per plan — swap in the real uploads
  page when you've decided whether to host video.
