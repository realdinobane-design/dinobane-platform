import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RefreshCw, FileText, MessageSquare, Image, AlertTriangle, Flag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Tab = "articles" | "messages" | "media" | "reports";

function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  label,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  label: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#111] border border-[#2a2a2a] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Confirm Delete
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#888]">
            Permanently delete: <span className="text-white font-semibold">{label}</span>?
            <br />This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── ARTICLES TAB ─────────────────────────────────────────────────────────────
function ArticlesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmLabel, setConfirmLabel] = useState("");
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

  const { data: articles = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/articles"],
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/articles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const regenMutation = useMutation({
    mutationFn: async (a: any) => {
      if (!a.youtubeUrl) throw new Error("No YouTube URL for this article");
      setRegeneratingId(a.id);
      const res = await apiRequest("POST", "/api/articles/generate", { youtubeUrl: a.youtubeUrl });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article regenerated" });
      setRegeneratingId(null);
    },
    onError: (e: any) => {
      toast({ title: "Regeneration failed", description: e.message, variant: "destructive" });
      setRegeneratingId(null);
    },
  });

  if (isLoading) return <p className="text-[#555] text-sm py-8 text-center">Loading articles...</p>;
  if (!articles.length) return <p className="text-[#555] text-sm py-8 text-center">No articles found.</p>;

  return (
    <>
      <div className="space-y-2">
        {articles.map((a: any) => (
          <div
            key={a.id}
            className="flex items-center justify-between bg-[#111] border border-[#1f1f1f] rounded p-3 gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{a.title}</p>
              <p className="text-[#555] text-xs mt-0.5">
                ID: {a.id} &nbsp;·&nbsp; {a.videoId ? `Video: ${a.videoId}` : "No video"} &nbsp;·&nbsp;{" "}
                {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-GB") : ""}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {a.youtubeUrl && (
                <button
                  onClick={() => regenMutation.mutate(a)}
                  disabled={regeneratingId === a.id}
                  className="text-[#444] hover:text-[#f0c800] transition-colors p-1.5 rounded hover:bg-yellow-500/10 disabled:opacity-50"
                  title="Regenerate article from transcript"
                >
                  <RefreshCw className={`w-4 h-4 ${regeneratingId === a.id ? "animate-spin text-[#f0c800]" : ""}`} />
                </button>
              )}
              <button
                onClick={() => { setConfirmId(a.id); setConfirmLabel(a.title); }}
                className="text-[#444] hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-500/10"
                title="Delete article"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={confirmId !== null}
        onOpenChange={(v) => !v && setConfirmId(null)}
        label={confirmLabel}
        onConfirm={() => {
          if (confirmId !== null) deleteMutation.mutate(confirmId);
          setConfirmId(null);
        }}
      />
    </>
  );
}

// ─── MESSAGES TAB ─────────────────────────────────────────────────────────────
function MessagesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmLabel, setConfirmLabel] = useState("");

  const { data: msgs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/messages"],
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/messages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      toast({ title: "Message deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <p className="text-[#555] text-sm py-8 text-center">Loading messages...</p>;
  if (!msgs.length) return <p className="text-[#555] text-sm py-8 text-center">No messages found.</p>;

  return (
    <>
      <div className="space-y-2">
        {msgs.map((m: any) => (
          <div
            key={m.id}
            className="flex items-start justify-between bg-[#111] border border-[#1f1f1f] rounded p-3 gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#cc2a2a] text-xs font-bold uppercase tracking-wider">
                  #{m.channel}
                </span>
                <span className="text-[#f0c800] text-xs font-semibold">@{m.user?.username || "unknown"}</span>
                {m.parentId && <span className="text-[#444] text-xs">↩ reply</span>}
              </div>
              <p className="text-[#ccc] text-sm line-clamp-2">{m.content}</p>
              <p className="text-[#444] text-xs mt-1">
                {m.createdAt ? new Date(m.createdAt).toLocaleString("en-GB") : ""}
                &nbsp;·&nbsp; ID: {m.id}
              </p>
            </div>
            <button
              onClick={() => {
                setConfirmId(m.id);
                setConfirmLabel(`"${(m.content || "").slice(0, 60)}..." by @${m.user?.username}`);
              }}
              className="shrink-0 text-[#444] hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-500/10 mt-0.5"
              title="Delete message"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={confirmId !== null}
        onOpenChange={(v) => !v && setConfirmId(null)}
        label={confirmLabel}
        onConfirm={() => {
          if (confirmId !== null) deleteMutation.mutate(confirmId);
          setConfirmId(null);
        }}
      />
    </>
  );
}

// ─── MEDIA TAB ────────────────────────────────────────────────────────────────
function MediaTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmLabel, setConfirmLabel] = useState("");

  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/media"],
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/media/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Media deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <p className="text-[#555] text-sm py-8 text-center">Loading media...</p>;
  if (!items.length) return <p className="text-[#555] text-sm py-8 text-center">No media uploaded.</p>;

  return (
    <>
      <div className="space-y-2">
        {items.map((item: any) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-[#111] border border-[#1f1f1f] rounded p-3 gap-3"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {item.type === "image" && item.dataUrl && (
                <img
                  src={item.dataUrl}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded shrink-0 border border-[#2a2a2a]"
                />
              )}
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                <p className="text-[#555] text-xs mt-0.5">
                  {item.type?.toUpperCase()} &nbsp;·&nbsp;
                  {item.size ? `${(item.size / 1024).toFixed(0)} KB` : ""} &nbsp;·&nbsp;
                  ID: {item.id}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setConfirmId(item.id); setConfirmLabel(item.name); }}
              className="shrink-0 text-[#444] hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-500/10"
              title="Delete media"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={confirmId !== null}
        onOpenChange={(v) => !v && setConfirmId(null)}
        label={confirmLabel}
        onConfirm={() => {
          if (confirmId !== null) deleteMutation.mutate(confirmId);
          setConfirmId(null);
        }}
      />
    </>
  );
}

// ─── REPORTS TAB ────────────────────────────────────────────────────────────
function ReportsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: reports = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/reports"],
    queryFn: () => apiRequest("GET", "/api/admin/reports").then(r => r.json()),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/reports/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/reports"] }); toast({ title: "Report updated" }); },
  });

  if (isLoading) return <div className="text-[#555] text-sm py-8 text-center">Loading reports...</div>;
  if (reports.length === 0) return <div className="text-[#555] text-sm py-8 text-center">No reports submitted yet.</div>;

  const pending = reports.filter(r => r.status === "pending");
  const reviewed = reports.filter(r => r.status !== "pending");

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <div className="text-xs font-bold text-[#cc2a2a] uppercase tracking-widest mb-3">{pending.length} Pending</div>
      )}
      {reports.map((r: any) => (
        <div key={r.id} className={`border rounded p-4 space-y-2 ${
          r.status === "pending" ? "border-[#cc2a2a]/30 bg-[#cc2a2a]/5" : "border-[#1f1f1f] bg-[#111]"
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  r.status === "pending" ? "bg-[#cc2a2a]/20 text-[#cc2a2a]" :
                  r.status === "actioned" ? "bg-green-900/30 text-green-400" : "bg-[#222] text-[#888]"
                }`}>{r.status}</span>
                <span className="text-xs text-[#555]">{r.contentType}</span>
                <span className="text-xs text-[#555]">{new Date(r.createdAt).toLocaleDateString("en-GB")}</span>
              </div>
              <p className="text-sm text-white">
                <span className="text-[#888]">@{r.reporterUsername}</span>
                <span className="text-[#555] mx-2">reported</span>
                <span className="text-[#cc2a2a] font-bold">@{r.reportedUsername}</span>
              </p>
              <p className="text-xs text-[#888] mt-1">Reason: <span className="text-white">{r.reason}</span></p>
              {r.details && <p className="text-xs text-[#666] mt-1">"{r.details}"</p>}
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => updateStatus.mutate({ id: r.id, status: "reviewed" })}
                  className="text-xs px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#888] rounded transition-colors"
                >Reviewed</button>
                <button
                  onClick={() => updateStatus.mutate({ id: r.id, status: "actioned" })}
                  className="text-xs px-3 py-1.5 bg-green-900/30 hover:bg-green-900/50 text-green-400 rounded transition-colors"
                >Actioned</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminContent() {
  const [tab, setTab] = useState<Tab>("articles");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "articles", label: "Articles", icon: <FileText className="w-4 h-4" /> },
    { id: "messages", label: "Messages", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "media", label: "Media Vault", icon: <Image className="w-4 h-4" /> },
    { id: "reports", label: "Reports", icon: <Flag className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black uppercase tracking-widest text-white">
            Content Moderation
          </h1>
          <p className="text-[#555] text-sm mt-1">
            Delete any article, community message, or media vault item.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-[#1f1f1f] pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "border-[#cc2a2a] text-white"
                  : "border-transparent text-[#555] hover:text-[#888]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "articles" && <ArticlesTab />}
        {tab === "messages" && <MessagesTab />}
        {tab === "media" && <MediaTab />}
        {tab === "reports" && <ReportsTab />}
      </div>
    </div>
  );
}
