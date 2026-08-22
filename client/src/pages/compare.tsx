import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Columns2 } from "lucide-react";
import { getPageContent } from "@/lib/page-status";
import { getTimelinesRegistry, mergeRegistry, BLANK_TIMELINE_DATA } from "@/lib/timelines";
import type { TimelineData, TimelineEvent } from "@/components/timeline-renderer";
import { MAHMOOD_DATA } from "@/pages/mahmood";
import { STARMER_DATA } from "@/pages/starmer";
import { FARAGE_DATA } from "@/pages/farage";
import { LONG_MARCH_DATA } from "@/pages/long-march";

/* =========================================================
   COMPARE — two dossier timelines side by side, event by
   event, in chronological order. Members only.
   ========================================================= */

const DEFAULTS: Record<string, TimelineData> = {
  mahmood: MAHMOOD_DATA,
  starmer: STARMER_DATA,
  farage: FARAGE_DATA,
  "long-march": LONG_MARCH_DATA,
};

function useTimelineData(slug: string | null) {
  const { data: saved } = useQuery({
    queryKey: [`/api/page-content/${slug}`],
    queryFn: () => getPageContent<Partial<TimelineData>>(slug!),
    staleTime: 30_000,
    retry: 1,
    enabled: !!slug,
  });
  return useMemo<TimelineData | null>(() => {
    if (!slug) return null;
    const fallback = DEFAULTS[slug] ?? (BLANK_TIMELINE_DATA as TimelineData);
    return {
      meta: { ...fallback.meta, ...(saved?.meta || {}) },
      thesis: saved?.thesis ?? fallback.thesis,
      timeline: saved?.timeline ?? fallback.timeline,
      tactics: saved?.tactics ?? fallback.tactics,
      engine: saved?.engine ?? fallback.engine,
      closing: saved?.closing ?? fallback.closing,
      extraSections: saved?.extraSections ?? fallback.extraSections,
    };
  }, [slug, saved]);
}

/** Rough chronological key from the leading year digits of an event's `year` label. */
function yearKey(y: string): number {
  const m = y.match(/\d{4}/);
  return m ? parseInt(m[0], 10) : 9999;
}

export default function ComparePage() {
  const { data: registryRaw = [] } = useQuery({
    queryKey: ["/api/timelines/registry"],
    queryFn: getTimelinesRegistry,
    staleTime: 60_000,
  });
  const registry = mergeRegistry(registryRaw);
  const live = registry.filter((t) => DEFAULTS[t.slug] || t.slug);

  const params = new URLSearchParams(window.location.search);
  const [a, setA] = useState<string | null>(params.get("a") || "starmer");
  const [b, setB] = useState<string | null>(params.get("b") || "mahmood");

  const da = useTimelineData(a);
  const db = useTimelineData(b);

  const eventsA = useMemo(() => (da ? [...da.timeline].sort((x, y) => yearKey(x.year) - yearKey(y.year)) : []), [da]);
  const eventsB = useMemo(() => (db ? [...db.timeline].sort((x, y) => yearKey(x.year) - yearKey(y.year)) : []), [db]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">
      <div className="max-w-6xl mx-auto px-5 py-14">
        <div className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-[#cc2a2a] mb-2">
          <Columns2 size={14} /> DinoBane Intel
        </div>
        <h1 className="font-serif italic text-4xl text-zinc-100 mb-3">Compare Dossiers</h1>
        <p className="text-zinc-500 text-sm mb-10 max-w-2xl">
          Two timelines side by side, each in chronological order. Read the records against each other —
          who was voting for what, while the other was doing what.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <CompareColumn
            label="A"
            slug={a}
            data={da}
            events={eventsA}
            options={live}
            onChange={setA}
            exclude={b}
          />
          <CompareColumn
            label="B"
            slug={b}
            data={db}
            events={eventsB}
            options={live}
            onChange={setB}
            exclude={a}
          />
        </div>
      </div>
    </div>
  );
}

function CompareColumn({
  label, slug, data, events, options, onChange, exclude,
}: {
  label: string;
  slug: string | null;
  data: TimelineData | null;
  events: TimelineEvent[];
  options: { slug: string; title: string }[];
  onChange: (slug: string) => void;
  exclude: string | null;
}) {
  return (
    <section>
      <select
        value={slug ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2.5 text-zinc-100 mb-5 outline-none focus:border-[#cc2a2a]"
      >
        <option value="" disabled>Pick dossier {label}…</option>
        {options.filter((o) => o.slug !== exclude).map((o) => (
          <option key={o.slug} value={o.slug}>{o.title}</option>
        ))}
      </select>

      {data && (
        <>
          <header className="border border-zinc-800 bg-zinc-950/70 rounded-sm p-5 mb-5">
            <div className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 mb-1">{data.meta.dossierCode}</div>
            <h2 className="font-serif italic text-2xl text-zinc-100">{data.meta.title}</h2>
            <p className="text-zinc-500 text-sm mt-1">{data.meta.subtitle}</p>
            <Link href={`/${slug}`} className="inline-block mt-3 text-[11px] tracking-[0.2em] uppercase text-yellow-500 hover:text-yellow-400">
              Open full dossier →
            </Link>
          </header>
          <ol className="relative border-l border-zinc-800 ml-2 space-y-4">
            {events.map((e, i) => (
              <li key={i} className="pl-5 relative">
                <span className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-[#cc2a2a]" />
                <div className="text-[11px] font-mono text-yellow-600">{e.year}</div>
                <div className="text-zinc-100 font-medium leading-snug">{e.title}</div>
                <div className="text-zinc-500 text-sm leading-snug mt-0.5">
                  {e.body.slice(0, 180)}{e.body.length > 180 ? "…" : ""}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
