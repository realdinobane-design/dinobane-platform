import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Rss } from "lucide-react";

/* =========================================================
   CORRECTIONS & NEW EVIDENCE — the public accountability
   trail. Every correction logged, every new piece of
   evidence dated and sourced.
   ========================================================= */

type Correction = { id: string; text: string; context: string; createdAt: string };
type Evidence = { id: string; title: string; body: string; url: string; timeline: string; createdAt: string };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return [] as unknown as T;
  return res.json();
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}

export default function CorrectionsPage() {
  const { data: corrections = [] } = useQuery<Correction[]>({
    queryKey: ["/api/corrections"],
    queryFn: () => getJson<Correction[]>("/api/corrections"),
    staleTime: 30_000,
  });
  const { data: evidence = [] } = useQuery<Evidence[]>({
    queryKey: ["/api/evidence"],
    queryFn: () => getJson<Evidence[]>("/api/evidence"),
    staleTime: 30_000,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">
      <div className="max-w-3xl mx-auto px-5 py-14">
        <div className="text-[11px] tracking-[0.3em] uppercase text-[#cc2a2a] mb-2">DinoBane Intel</div>
        <h1 className="font-serif italic text-4xl text-zinc-100 mb-4">Corrections & New Evidence</h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-12 max-w-2xl">
          Every dossier on this site carries sources, and every claim is only as good as them. When we
          get something wrong, it is corrected here — publicly, dated, and with the original context.
          When new evidence lands, it is logged here first.
        </p>

        <section className="mb-14">
          <h2 className="flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-zinc-400 border-b border-zinc-800 pb-2 mb-5">
            <Rss size={14} className="text-yellow-500" /> New Evidence Feed
          </h2>
          {evidence.length === 0 ? (
            <p className="text-zinc-600 text-sm italic">No updates logged yet. When new evidence is added to a dossier, it appears here.</p>
          ) : (
            <ol className="space-y-4">
              {evidence.map((e) => (
                <li key={e.id} className="border border-zinc-800 bg-zinc-950/60 rounded-sm p-5">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <h3 className="text-zinc-100 font-medium">{e.title}</h3>
                    <time className="text-[11px] font-mono text-zinc-500">{fmtDate(e.createdAt)}</time>
                  </div>
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{e.body}</p>
                  <div className="flex gap-4 mt-3 text-[11px] tracking-[0.15em] uppercase">
                    {e.timeline && (
                      <a href={`/app/#/${e.timeline}`} className="text-yellow-500 hover:text-yellow-400">
                        {e.timeline} dossier →
                      </a>
                    )}
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-200">
                        Source →
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-zinc-400 border-b border-zinc-800 pb-2 mb-5">
            <ShieldCheck size={14} className="text-[#cc2a2a]" /> Corrections Log
          </h2>
          {corrections.length === 0 ? (
            <p className="text-zinc-600 text-sm italic">
              No corrections issued. If you spot an error in any dossier, use the contact form — every
              substantiated correction is published here.
            </p>
          ) : (
            <ol className="space-y-4">
              {corrections.map((c) => (
                <li key={c.id} className="border-l-2 border-[#cc2a2a] bg-zinc-950/60 rounded-sm p-5">
                  <time className="text-[11px] font-mono text-zinc-500">{fmtDate(c.createdAt)}</time>
                  <p className="text-zinc-200 text-sm mt-1.5 leading-relaxed">{c.text}</p>
                  {c.context && <p className="text-zinc-500 text-xs mt-2">{c.context}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
