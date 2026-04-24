import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { PageStatusGate } from "@/components/page-status-gate";
import { TimelineRenderer, type TimelineData } from "@/components/timeline-renderer";
import { getPageContent } from "@/lib/page-status";
import { MembersOnlyBanner } from "@/components/members-only-banner";
import { TimelineReactions } from "@/components/timeline-reactions";
import { BLANK_TIMELINE_DATA, getTimelinesRegistry, mergeRegistry } from "@/lib/timelines";
import { LONG_MARCH_DATA } from "@/pages/long-march";

/**
 * Generic timeline viewer at /timeline/:slug.
 * Hydrates content from the DB, falling back to a blank template for timelines
 * that haven't been authored yet. The registry entry tells us the display name.
 */
export default function TimelineViewPage() {
  const { slug } = useParams<{ slug: string }>();

  // Special-case: /timeline/long-march should behave identically to /long-march.
  // We hand the LM fallback data in so placeholder copy isn't shown during loads.
  const isLongMarch = slug === "long-march";
  const fallback: TimelineData = isLongMarch ? LONG_MARCH_DATA : (BLANK_TIMELINE_DATA as TimelineData);

  const { data: saved } = useQuery({
    queryKey: [`/api/page-content/${slug}`],
    queryFn: () => getPageContent<Partial<TimelineData>>(slug),
    staleTime: 30_000,
    retry: 1,
    enabled: !!slug,
  });

  const { data: registry = [] } = useQuery({
    queryKey: ["/api/timelines/registry"],
    queryFn: getTimelinesRegistry,
    staleTime: 60_000,
  });

  if (!slug) return <NotFoundTimeline />;

  const all = mergeRegistry(registry);
  const entry = all.find((t) => t.slug === slug);
  const displayName = entry?.title ?? slug;

  const D: TimelineData = {
    meta: { ...fallback.meta, ...(saved?.meta || {}) },
    thesis: saved?.thesis ?? fallback.thesis,
    timeline: saved?.timeline ?? fallback.timeline,
    tactics: saved?.tactics ?? fallback.tactics,
    engine: saved?.engine ?? fallback.engine,
    closing: saved?.closing ?? fallback.closing,
  };

  return (
    <>
      <MembersOnlyBanner variant="auto" />
      <PageStatusGate slug={slug} name={displayName}>
        <TimelineRenderer data={D} />
        <TimelineReactions slug={slug} />
      </PageStatusGate>
    </>
  );
}

function NotFoundTimeline() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-6 py-24 bg-[#0a0a0a]">
      <div className="max-w-md w-full border border-zinc-800 bg-zinc-950/60 p-10 text-center">
        <h1 className="font-serif italic text-3xl text-zinc-100 mb-3">Timeline not found</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          The dossier you're looking for isn't in the archive.
        </p>
        <Link
          href="/timelines"
          className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-300 border border-zinc-700 px-4 py-2 hover:border-[#cc2a2a] hover:text-white"
        >
          ← Back to Timelines
        </Link>
      </div>
    </div>
  );
}
