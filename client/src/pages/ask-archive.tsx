import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Archive, Send, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

/* =========================================================
   ASK THE ARCHIVE — members submit research requests;
   substantiated answers become dossier updates logged in
   the public evidence feed.
   ========================================================= */

export default function AskArchivePage() {
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [done, setDone] = useState(false);

  const submit = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/archive-requests", { subject, details });
    },
    onSuccess: () => {
      setDone(true);
      setSubject("");
      setDetails("");
    },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">
      <div className="max-w-2xl mx-auto px-5 py-14">
        <div className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-[#cc2a2a] mb-2">
          <Archive size={14} /> Members' Service
        </div>
        <h1 className="font-serif italic text-4xl text-zinc-100 mb-4">Ask the Archive</h1>
        <div className="text-zinc-500 text-sm leading-relaxed mb-10 space-y-3">
          <p>
            As a member you can put a question to the archive: a person, a vote, a connection, a document
            you've heard exists but can't find.
          </p>
          <p>
            Substantiated answers are written into the relevant dossier and logged in the public{" "}
            <a href="/app/#/corrections" className="text-yellow-500 hover:text-yellow-400 underline underline-offset-2">
              evidence feed
            </a>{" "}
            — so one member's question becomes everyone's footnote.
          </p>
        </div>

        {done ? (
          <div className="border border-yellow-600/40 bg-zinc-950/70 rounded-sm p-8 text-center">
            <CheckCircle2 className="mx-auto text-yellow-500 mb-3" size={30} />
            <h2 className="text-zinc-100 text-lg font-medium mb-2">Request filed.</h2>
            <p className="text-zinc-500 text-sm">
              It's in the queue. If the answer turns into a dossier update, you'll see it in the evidence feed.
            </p>
            <button
              onClick={() => setDone(false)}
              className="mt-5 text-[11px] tracking-[0.2em] uppercase text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
            >
              File another request
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}
            className="border border-zinc-800 bg-zinc-950/60 rounded-sm p-6 space-y-5"
          >
            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-zinc-500 mb-2">
                Subject
              </label>
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder="e.g. Who funded the 2019 Stoke Central by-election campaign?"
                className="w-full bg-[#0d0d0d] border border-zinc-800 focus:border-[#cc2a2a] outline-none rounded-sm px-3 py-2.5 text-zinc-100 placeholder:text-zinc-700"
              />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-zinc-500 mb-2">
                What you already know <span className="normal-case text-zinc-600">(optional — links, dates, half-remembered details all help)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                rows={6}
                className="w-full bg-[#0d0d0d] border border-zinc-800 focus:border-[#cc2a2a] outline-none rounded-sm px-3 py-2.5 text-zinc-100 placeholder:text-zinc-700 resize-y"
              />
            </div>
            {submit.isError && (
              <p className="text-red-400 text-sm">Couldn't file the request — try again in a moment.</p>
            )}
            <button
              type="submit"
              disabled={submit.isPending || !subject.trim()}
              className="flex items-center gap-2 bg-[#cc2a2a] hover:bg-[#e03030] disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-sm transition-colors"
            >
              <Send size={14} /> {submit.isPending ? "Filing…" : "File the request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
