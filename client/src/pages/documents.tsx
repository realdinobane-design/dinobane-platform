import { useQuery } from "@tanstack/react-query";
import { FileText, ExternalLink } from "lucide-react";

/* =========================================================
   DOCUMENTS VAULT — primary-source documents with full
   provenance: where each came from, when, and a link to
   the original. Members only.
   ========================================================= */

type Doc = {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  date: string;
};

export default function DocumentsPage() {
  const { data: docs = [], isLoading } = useQuery<Doc[]>({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const res = await fetch("/api/documents", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">
      <div className="max-w-4xl mx-auto px-5 py-14">
        <div className="text-[11px] tracking-[0.3em] uppercase text-[#cc2a2a] mb-2">DinoBane Intel</div>
        <h1 className="font-serif italic text-4xl text-zinc-100 mb-4">The Documents Vault</h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-12 max-w-2xl">
          Primary sources behind the dossiers — Hansard records, written questions, court judgments,
          official statistics, FOI releases. Each entry carries its provenance: the source, the date,
          and a link to the original.
        </p>

        {isLoading && <p className="text-zinc-600 text-sm">Opening the vault…</p>}

        {!isLoading && docs.length === 0 && (
          <div className="border border-dashed border-zinc-800 rounded-sm p-10 text-center">
            <FileText className="mx-auto text-zinc-700 mb-3" size={28} />
            <p className="text-zinc-500 text-sm">
              The vault is being catalogued. Documents referenced in the dossiers will be deposited here
              with their full provenance.
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {docs.map((d) => (
            <a
              key={d.id}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-zinc-800 hover:border-yellow-600/60 bg-zinc-950/60 rounded-sm p-5 transition-colors flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-zinc-100 font-medium leading-snug group-hover:text-white">{d.title}</h3>
                <ExternalLink size={14} className="text-zinc-600 group-hover:text-yellow-500 shrink-0 mt-1" />
              </div>
              {d.description && (
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed flex-1">{d.description}</p>
              )}
              <div className="mt-4 pt-3 border-t border-zinc-800/70 text-[11px] font-mono text-zinc-500 space-y-0.5">
                {d.source && <div>SOURCE · {d.source}</div>}
                {d.date && <div>DATE · {d.date}</div>}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
