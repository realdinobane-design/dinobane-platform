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
 *
 * Add a new timeline by appending an entry here. The hub page reads from
 * this list directly so there's no extra plumbing.
 */

export type TimelineEntry = {
  slug: string;
  title: string;
  subtitle: string;
  dossierCode: string;
  category: string;
  viewPath: string;
  editPath?: string;
  tags: string[];
};

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
];

/** Find a timeline by slug. */
export function findTimeline(slug: string): TimelineEntry | undefined {
  return TIMELINES.find((t) => t.slug === slug);
}
