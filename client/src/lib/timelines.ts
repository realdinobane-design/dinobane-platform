/**
 * Registry of all DinoBane Timelines.
 *
 * Each timeline has:
 *   - slug: URL-safe id (used for the route, status key and content key)
 *   - title: display title
 *   - subtitle: short one-liner under the title
 *   - dossierCode: retro-spy file code (e.g. DB-LM-001)
 *   - category: optional grouping tag shown in the header stripe
 *   - viewPath: hash-route path to the actual timeline page
 *   - editPath: hash-route path to the admin editor (admin-only)
 *   - tags: short labels rendered under the card
 *   - imageUrl: optional background image URL for the hub card
 *   - isPlaceholder: if true, shows as "pending" and is not clickable
 *
 * The canonical registry is stored in the DB (key = "timeline_registry").
 * This file exports a default seed used on first boot and as a fallback.
 */

import { apiRequest } from "./queryClient";

export type TimelineEntry = {
  slug: string;
  title: string;
  subtitle: string;
  dossierCode: string;
  category: string;
  viewPath: string;
  editPath?: string;
  tags: string[];
  imageUrl?: string;
  isPlaceholder?: boolean;
};

/** Seed / fallback registry. DB-stored registry wins when available. */
export const TIMELINES: TimelineEntry[] = [
  {
    slug: "long-march",
    title: "The Long March",
    subtitle: "A timeline of the utopian subversion of the West",
    dossierCode: "DB-LM-001",
    category: "Ideology",
    viewPath: "/long-march",
    editPath: "/admin/long-march",
    tags: ["1848 – now", "15 events", "Marx · Gramsci · BlackRock"],
  },
  {
    slug: "overton-shift",
    title: "The Overton Shift",
    subtitle: "Forty years of dragging the window leftward, one outrage at a time",
    dossierCode: "DB-OS-002",
    category: "Politics",
    viewPath: "/timeline/overton-shift",
    editPath: "/admin/timeline/overton-shift",
    tags: ["1985 – now", "Pending research", "Media · Politics"],
    isPlaceholder: true,
  },
  {
    slug: "mockingbird-revisited",
    title: "Operation Mockingbird Revisited",
    subtitle: "The intelligence community's long marriage with the press",
    dossierCode: "DB-MB-003",
    category: "Intelligence",
    viewPath: "/timeline/mockingbird-revisited",
    editPath: "/admin/timeline/mockingbird-revisited",
    tags: ["1948 – now", "Pending research", "CIA · Media"],
    isPlaceholder: true,
  },
  {
    slug: "great-reset",
    title: "The Great Reset",
    subtitle: "From Davos whitepaper to boardroom orthodoxy in a single decade",
    dossierCode: "DB-GR-004",
    category: "Capital",
    viewPath: "/timeline/great-reset",
    editPath: "/admin/timeline/great-reset",
    tags: ["2010 – now", "Pending research", "WEF · ESG · Capital"],
    isPlaceholder: true,
  },
];

/** Find a timeline by slug in a given registry. */
export function findTimeline(
  slug: string,
  registry: TimelineEntry[] = TIMELINES,
): TimelineEntry | undefined {
  return registry.find((t) => t.slug === slug);
}

/**
 * Merge the hardcoded seed with the DB-backed registry.
 * DB entries win by slug; DB-only entries are appended.
 */
export function mergeRegistry(db: TimelineEntry[] | null | undefined): TimelineEntry[] {
  if (!db || !Array.isArray(db) || db.length === 0) return TIMELINES;
  const bySlug = new Map<string, TimelineEntry>();
  for (const t of TIMELINES) bySlug.set(t.slug, t);
  for (const t of db) bySlug.set(t.slug, { ...bySlug.get(t.slug), ...t });
  return Array.from(bySlug.values());
}

// ─── API helpers ─────────────────────────────────────────────────────────────

/** Public: fetch the DB-stored registry of timelines. */
export async function getTimelinesRegistry(): Promise<TimelineEntry[]> {
  try {
    const r = await fetch("/api/timelines/registry", { credentials: "include" });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j.registry) ? j.registry : [];
  } catch {
    return [];
  }
}

/** Admin: create a new timeline entry. Seeds content from the last-created entry if none provided. */
export async function createTimeline(entry: Partial<TimelineEntry> & { slug: string; title: string }): Promise<TimelineEntry> {
  const r = await apiRequest("POST", "/api/admin/timelines", entry);
  const j = await r.json();
  return j.entry as TimelineEntry;
}

/** Admin: update an existing timeline entry (metadata only, not content). */
export async function updateTimelineEntry(slug: string, patch: Partial<TimelineEntry>): Promise<TimelineEntry> {
  const r = await apiRequest("PUT", `/api/admin/timelines/${encodeURIComponent(slug)}`, patch);
  const j = await r.json();
  return j.entry as TimelineEntry;
}

/** Admin: delete a timeline entry and its stored content. */
export async function deleteTimelineEntry(slug: string): Promise<void> {
  await apiRequest("DELETE", `/api/admin/timelines/${encodeURIComponent(slug)}`);
}

/** Admin: duplicate a timeline's content + registry entry to a new slug. */
export async function copyTimeline(fromSlug: string, toSlug: string, overrides?: Partial<TimelineEntry>): Promise<TimelineEntry> {
  const r = await apiRequest("POST", `/api/admin/timelines/${encodeURIComponent(fromSlug)}/copy`, {
    toSlug,
    overrides: overrides || {},
  });
  const j = await r.json();
  return j.entry as TimelineEntry;
}

// ─── Blank template for new timelines ────────────────────────────────────────

export const BLANK_TIMELINE_DATA = {
  meta: {
    dossierCode: "DOSSIER // DB-XX-000",
    eyesOnly: "EYES ONLY — ADMIN",
    fileTag: "FILE: NEW TIMELINE / v0.1",
    title: "New Timeline",
    subtitle: "A fresh dossier waiting to be written",
    byline: "Filed by DinoBane Intel · dinobane.com",
  },
  thesis: [
    "This timeline is under construction. Edit the opening thesis here to frame the story.",
  ],
  timeline: [
    {
      year: "YYYY",
      title: "First event",
      place: "Somewhere",
      key: false,
      body: "Describe what happened and why it matters.",
      links: [] as { label: string; url: string }[],
      imageUrl: "" as string,
    },
  ],
  tactics: [
    { name: "Tactic one", use: "Describe the tactic and how it's used." },
  ],
  engine: [
    { step: "Action", title: "Manufacture the crisis", body: "Describe the trigger." },
    { step: "Problem", title: "Name the villain", body: "Describe the framing." },
    { step: "Solution", title: "Surrender power upward", body: "Describe the prescribed cure." },
  ],
  closing: [
    "Add a closing thought that pulls the threads together.",
  ],
  extraSections: [] as Array<{
    kind: "prose" | "timeline" | "tactics" | "engine";
    kicker: string;
    title: string;
    paragraphs?: string[];
    events?: Array<{
      year: string; title: string; place: string; key: boolean; body: string;
      detail?: string; links: { label: string; url: string }[]; imageUrl?: string;
    }>;
    tactics?: Array<{ name: string; use: string; axis?: string }>;
    engine?: Array<{ step: string; title: string; body: string }>;
  }>,
};
