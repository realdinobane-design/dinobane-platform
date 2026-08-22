import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import {
  Rss, ShieldCheck, FileText, Archive, BarChart3, MailPlus, Trash2, Send,
} from "lucide-react";
import { Redirect } from "wouter";

/* =========================================================
   ADMIN INTEL DESK — one console for the v25 intel features:
   evidence feed, corrections log, documents registry,
   archive requests, analytics, member digest.
   Data lives in app_settings KV rows via /api/admin/*.
   ========================================================= */

const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);

type Tab = "evidence" | "corrections" | "documents" | "requests" | "analytics" | "digest";

type Evidence = { id: string; title: string; body: string; url: string; timeline: string; createdAt: string };
type Correction = { id: string; text: string; context: string; createdAt: string };
type Doc = { id: string; title: string; description: string; url: string; source: string; date: string };
type ArchReq = { id: string; userName: string; subject: string; details: string; status: string; createdAt: string };
type ViewRow = { path: string; count: number };

async function getJson<T>(url: string, fallback: T): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return fallback;
  return res.json();
}

export default function AdminIntelPage() {
  const { user, isLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("evidence");

  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  if (!ADMIN_EMAILS.has(user.email)) return <Redirect to="/" />;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "evidence", label: "Evidence Feed", icon: <Rss size={14} /> },
    { id: "corrections", label: "Corrections", icon: <ShieldCheck size={14} /> },
    { id: "documents", label: "Documents", icon: <FileText size={14} /> },
    { id: "requests", label: "Archive Requests", icon: <Archive size={14} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={14} /> },
    { id: "digest", label: "Member Digest", icon: <MailPlus size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="text-[11px] tracking-[0.3em] uppercase text-[#cc2a2a] mb-1">Admin</div>
        <h1 className="font-serif italic text-3xl text-zinc-100 mb-6">Intel Desk</h1>

        <div className="flex gap-1 mb-8 border-b border-[#1f1f1f] overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 -mb-px ${
                tab === t.id ? "border-[#cc2a2a] text-white" : "border-transparent text-[#555] hover:text-[#888]"
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {tab === "evidence" && <EvidenceTab />}
        {tab === "corrections" && <CorrectionsTab />}
        {tab === "documents" && <DocumentsTab />}
        {tab === "requests" && <RequestsTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "digest" && <DigestTab />}
      </div>
    </div>
  );
}

/* ── shared bits ─────────────────────────────────────────────────────── */

const inputCls =
  "w-full bg-[#0d0d0d] border border-zinc-800 focus:border-[#cc2a2a] outline-none rounded-sm px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700";

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

/* ── Evidence feed ───────────────────────────────────────────────────── */

function EvidenceTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", body: "", url: "", timeline: "" });

  const { data: rows = [] } = useQuery<Evidence[]>({
    queryKey: ["/api/evidence"],
    queryFn: () => getJson("/api/evidence", []),
  });

  const add = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/admin/evidence", form); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/evidence"] });
      setForm({ title: "", body: "", url: "", timeline: "" });
      toast({ title: "Evidence logged" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/evidence/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/evidence"] }),
  });

  return (
    <div>
      <div className="border border-zinc-800 bg-zinc-950/60 rounded-sm p-5 mb-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Log new evidence</h2>
        <input className={inputCls} placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className={inputCls} rows={3} placeholder="What was added, and to which dossier *" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Source URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <input className={inputCls} placeholder="Timeline slug (e.g. mahmood)" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} />
        </div>
        <button
          onClick={() => add.mutate()}
          disabled={add.isPending || !form.title.trim() || !form.body.trim()}
          className="bg-[#cc2a2a] hover:bg-[#e03030] disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-sm"
        >
          {add.isPending ? "Logging…" : "Log evidence"}
        </button>
      </div>

      <ol className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="border border-zinc-800 bg-zinc-950/60 rounded-sm p-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-zinc-100 font-medium">{r.title}</div>
              <div className="text-zinc-400 text-sm mt-1">{r.body}</div>
              <div className="text-[11px] font-mono text-zinc-600 mt-2">
                {fmtDate(r.createdAt)}{r.timeline && ` · ${r.timeline}`}{r.url && <> · <a className="text-zinc-400 underline" href={r.url} target="_blank" rel="noopener noreferrer">source</a></>}
              </div>
            </div>
            <button onClick={() => del.mutate(r.id)} className="text-zinc-600 hover:text-red-500 shrink-0" title="Delete">
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {rows.length === 0 && <p className="text-zinc-600 text-sm italic">Nothing logged yet.</p>}
      </ol>
    </div>
  );
}

/* ── Corrections log ─────────────────────────────────────────────────── */

function CorrectionsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ text: "", context: "" });

  const { data: rows = [] } = useQuery<Correction[]>({
    queryKey: ["/api/corrections"],
    queryFn: () => getJson("/api/corrections", []),
  });

  const add = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/admin/corrections", form); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/corrections"] });
      setForm({ text: "", context: "" });
      toast({ title: "Correction published" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/corrections/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/corrections"] }),
  });

  return (
    <div>
      <div className="border border-zinc-800 bg-zinc-950/60 rounded-sm p-5 mb-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Publish a correction</h2>
        <textarea className={inputCls} rows={3} placeholder="The correction, stated plainly *" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        <input className={inputCls} placeholder="Context — where the error appeared" value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} />
        <button
          onClick={() => add.mutate()}
          disabled={add.isPending || !form.text.trim()}
          className="bg-[#cc2a2a] hover:bg-[#e03030] disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-sm"
        >
          {add.isPending ? "Publishing…" : "Publish correction"}
        </button>
      </div>

      <ol className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="border-l-2 border-[#cc2a2a] bg-zinc-950/60 rounded-sm p-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-zinc-200 text-sm">{r.text}</div>
              {r.context && <div className="text-zinc-500 text-xs mt-1">{r.context}</div>}
              <div className="text-[11px] font-mono text-zinc-600 mt-2">{fmtDate(r.createdAt)}</div>
            </div>
            <button onClick={() => del.mutate(r.id)} className="text-zinc-600 hover:text-red-500 shrink-0" title="Delete">
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {rows.length === 0 && <p className="text-zinc-600 text-sm italic">No corrections on record.</p>}
      </ol>
    </div>
  );
}

/* ── Documents registry ──────────────────────────────────────────────── */

function DocumentsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const blank: Doc = { id: "", title: "", description: "", url: "", source: "", date: "" };
  const [draft, setDraft] = useState<Doc>(blank);

  const { data: docs = [] } = useQuery<Doc[]>({
    queryKey: ["/api/documents"],
    queryFn: () => getJson("/api/documents", []),
  });

  const save = useMutation({
    mutationFn: async (next: Doc[]) => { await apiRequest("PUT", "/api/admin/documents", { documents: next }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/documents"] });
      setDraft(blank);
      toast({ title: "Registry saved" });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const addDoc = () => {
    if (!draft.title.trim() || !draft.url.trim()) return;
    save.mutate([{ ...draft, id: draft.id || `doc_${Date.now().toString(36)}` }, ...docs]);
  };
  const removeDoc = (id: string) => save.mutate(docs.filter((d) => d.id !== id));

  return (
    <div>
      <div className="border border-zinc-800 bg-zinc-950/60 rounded-sm p-5 mb-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Deposit a document</h2>
        <input className={inputCls} placeholder="Title *" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <textarea className={inputCls} rows={2} placeholder="What it is and why it matters" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        <input className={inputCls} placeholder="URL to the original * (R2 public URL or external)" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Provenance — source (e.g. Hansard, WQ 85943)" value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} />
          <input className={inputCls} placeholder="Document date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        </div>
        <button
          onClick={addDoc}
          disabled={save.isPending || !draft.title.trim() || !draft.url.trim()}
          className="bg-[#cc2a2a] hover:bg-[#e03030] disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-sm"
        >
          {save.isPending ? "Saving…" : "Deposit"}
        </button>
      </div>

      <ol className="space-y-3">
        {docs.map((d) => (
          <li key={d.id} className="border border-zinc-800 bg-zinc-950/60 rounded-sm p-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-zinc-100 font-medium">{d.title}</div>
              {d.description && <div className="text-zinc-400 text-sm mt-1">{d.description}</div>}
              <div className="text-[11px] font-mono text-zinc-600 mt-2">
                {d.source && <>SOURCE · {d.source} </>}{d.date && <> · {d.date} </>} · <a className="text-zinc-400 underline" href={d.url} target="_blank" rel="noopener noreferrer">original</a>
              </div>
            </div>
            <button onClick={() => removeDoc(d.id)} className="text-zinc-600 hover:text-red-500 shrink-0" title="Remove">
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {docs.length === 0 && <p className="text-zinc-600 text-sm italic">Vault is empty.</p>}
      </ol>
    </div>
  );
}

/* ── Archive requests ────────────────────────────────────────────────── */

const REQ_STATUSES = ["open", "in-progress", "answered", "declined"] as const;

function RequestsTab() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery<ArchReq[]>({
    queryKey: ["/api/admin/archive-requests"],
    queryFn: () => getJson("/api/admin/archive-requests", []),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/admin/archive-requests/${id}`, { status });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/archive-requests"] }),
  });

  const statusColor: Record<string, string> = {
    open: "text-yellow-500 border-yellow-600/50",
    "in-progress": "text-blue-400 border-blue-500/50",
    answered: "text-green-400 border-green-600/50",
    declined: "text-zinc-500 border-zinc-700",
  };

  return (
    <ol className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="border border-zinc-800 bg-zinc-950/60 rounded-sm p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-zinc-100 font-medium">{r.subject}</div>
              {r.details && <div className="text-zinc-400 text-sm mt-1 whitespace-pre-wrap">{r.details}</div>}
              <div className="text-[11px] font-mono text-zinc-600 mt-2">{r.userName} · {fmtDate(r.createdAt)}</div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {REQ_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus.mutate({ id: r.id, status: s })}
                  className={`text-[10px] uppercase tracking-wider border rounded-sm px-2 py-1 ${
                    r.status === s ? statusColor[s] : "text-zinc-600 border-zinc-800 hover:text-zinc-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </li>
      ))}
      {rows.length === 0 && <p className="text-zinc-600 text-sm italic">No member requests yet.</p>}
    </ol>
  );
}

/* ── Analytics ───────────────────────────────────────────────────────── */

function AnalyticsTab() {
  const { data: rows = [] } = useQuery<ViewRow[]>({
    queryKey: ["/api/admin/analytics"],
    queryFn: () => getJson("/api/admin/analytics", []),
    refetchInterval: 60_000,
  });
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((n, r) => n + r.count, 0);

  return (
    <div>
      <p className="text-zinc-500 text-sm mb-6">
        {total.toLocaleString()} page views recorded across {rows.length} routes. Counts are cumulative since this feature shipped — no history before that.
      </p>
      <ol className="space-y-2">
        {rows.map((r) => (
          <li key={r.path} className="flex items-center gap-3">
            <span className="w-44 shrink-0 truncate font-mono text-xs text-zinc-400">{r.path}</span>
            <div className="flex-1 h-5 bg-zinc-900 rounded-sm overflow-hidden">
              <div className="h-full bg-[#cc2a2a]/70" style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
            <span className="w-16 text-right font-mono text-xs text-zinc-300">{r.count.toLocaleString()}</span>
          </li>
        ))}
        {rows.length === 0 && <p className="text-zinc-600 text-sm italic">No views recorded yet.</p>}
      </ol>
    </div>
  );
}

/* ── Member digest ───────────────────────────────────────────────────── */

function DigestTab() {
  const { toast } = useToast();
  const [result, setResult] = useState<string | null>(null);

  const { data: evidence = [] } = useQuery<Evidence[]>({
    queryKey: ["/api/evidence"],
    queryFn: () => getJson("/api/evidence", []),
  });
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = evidence.filter((r) => new Date(r.createdAt).getTime() >= weekAgo);

  const send = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/digest");
      return res.json();
    },
    onSuccess: (d) => {
      setResult(d.sent !== undefined ? `Sent to ${d.sent} member${d.sent === 1 ? "" : "s"} (${d.items} item${d.items === 1 ? "" : "s"}).` : (d.reason || "Done."));
      toast({ title: "Digest dispatched" });
    },
    onError: (e: any) => toast({ title: "Digest failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-xl">
      <p className="text-zinc-400 text-sm leading-relaxed mb-5">
        Emails every member the evidence logged in the last 7 days, via Resend.{" "}
        <strong className="text-zinc-200">{recent.length} item{recent.length === 1 ? "" : "s"}</strong> currently qualify.
      </p>
      {recent.length > 0 && (
        <ul className="border border-zinc-800 rounded-sm p-4 mb-5 space-y-1.5 text-sm text-zinc-400">
          {recent.map((r) => <li key={r.id}>· {r.title}</li>)}
        </ul>
      )}
      <button
        onClick={() => send.mutate()}
        disabled={send.isPending || recent.length === 0}
        className="flex items-center gap-2 bg-[#cc2a2a] hover:bg-[#e03030] disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-sm"
      >
        <Send size={14} /> {send.isPending ? "Sending…" : "Send weekly digest now"}
      </button>
      {result && <p className="text-green-400 text-sm mt-4">{result}</p>}
      {recent.length === 0 && (
        <p className="text-zinc-600 text-xs mt-4">Log evidence in the first tab and the digest has something to send.</p>
      )}
    </div>
  );
}
