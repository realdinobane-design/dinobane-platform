import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search as SearchIcon, Network, BookMarked, Youtube, FileText } from "lucide-react";
import { MAHMOOD_DATA } from "@/pages/mahmood";
import { STARMER_DATA } from "@/pages/starmer";
import { FARAGE_DATA } from "@/pages/farage";
import { LONG_MARCH_DATA } from "@/pages/long-march";

/* =========================================================
   GLOBAL SEARCH — one box across the whole archive:
   dossier timeline events, Power Map nodes, articles,
   and the timeline registry (server side).
   ========================================================= */

type MapNode = { id: string; name: string; type: string; tier: number; desc: string; power?: number };

type ServerResults = {
  articles: { id: number; title: string; summary: string; publishedAt: string }[];
  timelines: { slug: string; title: string; subtitle: string; viewPath: string }[];
};

const LOCAL_DOSSIERS: { slug: string; title: string; data: typeof MAHMOOD_DATA }[] = [
  { slug: "mahmood", title: "Shabana Mahmood", data: MAHMOOD_DATA },
  { slug: "starmer", title: "Keir Starmer", data: STARMER_DATA },
  { slug: "farage", title: "Nigel Farage", data: FARAGE_DATA },
  { slug: "long-march", title: "The Long March", data: LONG_MARCH_DATA },
];

function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const query = useDebounced(q.trim());

  // Server side: articles + timeline registry
  const { data: server } = useQuery<ServerResults>({
    queryKey: ["/api/search", query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { credentials: "include" });
      if (!res.ok) return { articles: [], timelines: [] };
      return res.json();
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });

  // Power Map node index (static JSON, generated from powermap-data.js)
  const { data: mapNodes = [] } = useQuery<MapNode[]>({
    queryKey: ["/map-nodes.json"],
    queryFn: async () => {
      const res = await fetch("/map-nodes.json");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: Infinity,
  });

  const words = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query]);
  const matches = (text: string) => {
    const t = text.toLowerCase();
    return words.every((w) => t.includes(w));
  };

  const nodeHits = useMemo(() => {
    if (words.length === 0) return [];
    return mapNodes.filter((n) => matches(`${n.name} ${n.type} ${n.desc}`)).slice(0, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapNodes, words]);

  const eventHits = useMemo(() => {
    if (words.length === 0) return [];
    const out: { slug: string; dossier: string; year: string; title: string; body: string }[] = [];
    for (const d of LOCAL_DOSSIERS) {
      for (const e of d.data.timeline) {
        if (matches(`${e.year} ${e.title} ${e.place} ${e.body}`)) {
          out.push({ slug: d.slug, dossier: d.title, year: e.year, title: e.title, body: e.body });
          if (out.length >= 15) return out;
        }
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  const articles = server?.articles ?? [];
  const timelines = server?.timelines ?? [];
  const hasQuery = query.length >= 2;
  const total = nodeHits.length + eventHits.length + articles.length + timelines.length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">
      <div className="max-w-3xl mx-auto px-5 py-14">
        <div className="text-[11px] tracking-[0.3em] uppercase text-[#cc2a2a] mb-2">DinoBane Intel</div>
        <h1 className="font-serif italic text-4xl text-zinc-100 mb-8">Search the Archive</h1>

        <div className="relative mb-10">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Names, events, organisations, places…"
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#cc2a2a] outline-none rounded-sm pl-11 pr-4 py-3.5 text-lg text-zinc-100 placeholder:text-zinc-600"
          />
        </div>

        {hasQuery && (
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 mb-8">
            {total} result{total === 1 ? "" : "s"} for “{query}”
          </p>
        )}

        {hasQuery && timelines.length > 0 && (
          <ResultGroup icon={<BookMarked size={14} />} title="Dossiers">
            {timelines.map((t) => (
              <ResultRow key={t.slug} href={t.viewPath} title={t.title} sub={t.subtitle} />
            ))}
          </ResultGroup>
        )}

        {hasQuery && eventHits.length > 0 && (
          <ResultGroup icon={<FileText size={14} />} title="Timeline Events">
            {eventHits.map((h, i) => (
              <ResultRow
                key={i}
                href={`/${h.slug}`}
                title={`${h.year} — ${h.title}`}
                sub={`${h.dossier} · ${h.body.slice(0, 140)}${h.body.length > 140 ? "…" : ""}`}
              />
            ))}
          </ResultGroup>
        )}

        {hasQuery && nodeHits.length > 0 && (
          <ResultGroup icon={<Network size={14} />} title="Power Map">
            {nodeHits.map((n) => (
              <ResultRow
                key={n.id}
                href={`/rings-of-power/index.html#n=${n.id}`}
                external
                title={n.name}
                sub={`${n.type} · tier ${n.tier} — ${n.desc.slice(0, 140)}${n.desc.length > 140 ? "…" : ""}`}
              />
            ))}
          </ResultGroup>
        )}

        {hasQuery && articles.length > 0 && (
          <ResultGroup icon={<Youtube size={14} />} title="Videos & Analysis">
            {articles.map((a) => (
              <ResultRow key={a.id} href={`/articles/${a.id}`} title={a.title} sub={a.summary} />
            ))}
          </ResultGroup>
        )}

        {hasQuery && total === 0 && (
          <p className="text-zinc-500 text-sm">
            Nothing in the archive matches that. Try a surname, an organisation, or a year.
          </p>
        )}

        {!hasQuery && (
          <div className="text-zinc-600 text-sm leading-relaxed space-y-2">
            <p>One box, everything indexed: the dossier timelines, every node on the UK Power Map, and every published analysis.</p>
            <p>Try <button className="text-zinc-400 underline underline-offset-2" onClick={() => setQ("Mahmood")}>Mahmood</button>, <button className="text-zinc-400 underline underline-offset-2" onClick={() => setQ("Prevent")}>Prevent</button>, or <button className="text-zinc-400 underline underline-offset-2" onClick={() => setQ("Rwanda")}>Rwanda</button>.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultGroup({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-zinc-500 border-b border-zinc-800 pb-2 mb-3">
        {icon} {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ResultRow({ href, title, sub, external }: { href: string; title: string; sub: string; external?: boolean }) {
  const cls = "block border border-zinc-800/80 hover:border-[#cc2a2a]/70 bg-zinc-950/60 rounded-sm px-4 py-3 transition-colors group";
  const inner = (
    <>
      <div className="text-zinc-100 group-hover:text-white font-medium">{title}</div>
      {sub && <div className="text-zinc-500 text-sm mt-0.5 leading-snug">{sub}</div>}
    </>
  );
  if (external) return <a href={href} className={cls}>{inner}</a>;
  return <Link href={href} className={cls}>{inner}</Link>;
}
