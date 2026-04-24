import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import {
  TIMELINES,
  getTimelinesRegistry,
  mergeRegistry,
  createTimeline,
  copyTimeline,
  type TimelineEntry,
} from "@/lib/timelines";
import { getPageStatus } from "@/lib/page-status";
import { MembersOnlyBanner } from "@/components/members-only-banner";
import {
  Settings,
  ArrowUpRight,
  Radio,
  CircleDot,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Copy,
  Loader2,
  X,
} from "lucide-react";

const ADMIN_EMAILS = new Set([
  "realdinobane@gmail.com",
  "yingchanzeng@gmail.com",
]);
// Only the primary admin may create, copy or delete timelines. Secondary admins
// (e.g. yingchanzeng) can still edit existing ones but can't spin up new ones.
const TIMELINE_CREATOR = "realdinobane@gmail.com";

type ViewMode = "card" | "list";
const VIEW_STORAGE_KEY = "tl-view";

/**
 * Hub page that indexes every DinoBane Timeline.
 * Supports card and list views (persisted to localStorage), admin controls
 * for creating and duplicating timelines, and placeholder entries.
 */
export default function TimelinesPage() {
  const { user } = useAuth();
  const isAdmin = !!user && ADMIN_EMAILS.has(user.email);
  const canCreate = !!user && user.email === TIMELINE_CREATOR;

  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "card";
    const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return saved === "list" ? "list" : "card";
  });
  useEffect(() => {
    try { window.localStorage.setItem(VIEW_STORAGE_KEY, view); } catch { /* ignore */ }
  }, [view]);

  useEffect(() => {
    const id = "lm-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const { data: dbRegistry = [] } = useQuery({
    queryKey: ["/api/timelines/registry"],
    queryFn: getTimelinesRegistry,
    staleTime: 30_000,
  });
  const registry = mergeRegistry(dbRegistry);

  // Don't show placeholder entries that the admin has already replaced with a
  // real page (detected via the presence of a non-placeholder entry with same
  // slug in the DB).
  const visibleEntries = registry.filter((t) => {
    if (t.isPlaceholder && !isAdmin) return false;
    return true;
  });
  const realCount = visibleEntries.filter((t) => !t.isPlaceholder).length;

  const [newOpen, setNewOpen] = useState(false);

  const stampLabel = isAdmin ? "ADMIN ONLY · ARCHIVE" : "MEMBERS ONLY · ARCHIVE";

  return (
    <>
    <MembersOnlyBanner variant="auto" />
    <div className="tl-wrap">
      <style>{CSS}</style>

      <div className="tl-dossier">
        <span className="tl-tag">DOSSIER // DB-TL-INDEX</span>
        <span className="tl-stamp">{stampLabel}</span>
        <span>FILE: TIMELINES / v2.0</span>
      </div>

      <header className="tl-hero">
        <div className="tl-eyebrow">A DinoBane Intel Archive</div>
        <h1>
          Time<span className="tl-amp">lines</span>
        </h1>
        <p className="tl-sub">
          Dossiers on how we got here — each one a single thread pulled from the
          tapestry, followed as far as it goes.
        </p>
        <div className="tl-rule" />
      </header>

      {/* Control row: count + view toggle + new button */}
      <div className="tl-control">
        <div className="tl-count">
          <span>Classification Index</span>
          <span className="tl-dot" />
          <span>
            {realCount}{" "}
            {realCount === 1 ? "dossier" : "dossiers"} on file
          </span>
        </div>
        <div className="tl-control-right">
          {canCreate && (
            <button
              onClick={() => setNewOpen(true)}
              className="tl-new-btn"
              data-testid="button-new-timeline"
            >
              <Plus size={12} /> New Timeline
            </button>
          )}
          <div className="tl-view-toggle" role="tablist" aria-label="Display mode">
            <button
              role="tab"
              aria-selected={view === "card"}
              className={`tl-view-btn${view === "card" ? " tl-view-btn-active" : ""}`}
              onClick={() => setView("card")}
              data-testid="button-view-card"
            >
              <LayoutGrid size={12} /> Cards
            </button>
            <button
              role="tab"
              aria-selected={view === "list"}
              className={`tl-view-btn${view === "list" ? " tl-view-btn-active" : ""}`}
              onClick={() => setView("list")}
              data-testid="button-view-list"
            >
              <ListIcon size={12} /> List
            </button>
          </div>
        </div>
      </div>

      {view === "card" ? (
        <section className="tl-grid">
          {visibleEntries.map((t, i) => (
            <TimelineCard key={t.slug} entry={t} isAdmin={isAdmin} canCreate={canCreate} index={i} />
          ))}
        </section>
      ) : (
        <section className="tl-list">
          {visibleEntries.map((t, i) => (
            <TimelineRow key={t.slug} entry={t} isAdmin={isAdmin} canCreate={canCreate} index={i} />
          ))}
        </section>
      )}

      <footer className="tl-footer">
        <span>
          DinoBane Intel · <span className="tl-mark">//</span> Archive
        </span>
        <span>v2.0</span>
        <span>
          <span className="tl-mark">//</span> dinobane.com
        </span>
      </footer>

      {newOpen && (
        <NewTimelineModal
          onClose={() => setNewOpen(false)}
          lastEntry={registry.find((t) => !t.isPlaceholder)}
        />
      )}
    </div>
    </>
  );
}

// ─── Card view ───────────────────────────────────────────────────────────────

function TimelineCard({
  entry: t,
  isAdmin,
  canCreate,
  index,
}: {
  entry: TimelineEntry;
  isAdmin: boolean;
  canCreate: boolean;
  index: number;
}) {
  const { data: status = "live" } = useQuery({
    queryKey: [`/api/page-status/${t.slug}`],
    queryFn: () => getPageStatus(t.slug),
    staleTime: 30_000,
    retry: 1,
    enabled: !t.isPlaceholder,
  });
  const onStandby = status === "standby";
  const isPending = !!t.isPlaceholder;

  // Hide standby entries from non-admins (but show placeholders to them — the
  // page itself is placeholder content, not gated).
  if (onStandby && !isAdmin && !isPending) return null;

  const isOdd = index % 2 === 0; // first card → "odd" accent (red)
  const classes = [
    "tl-card",
    isOdd ? "tl-card-odd" : "tl-card-even",
    onStandby ? "tl-card-standby" : "",
    isPending ? "tl-card-pending" : "",
    t.imageUrl ? "tl-card-has-bg" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style: React.CSSProperties | undefined = t.imageUrl
    ? ({ ["--tl-bg-img" as unknown as string]: `url("${t.imageUrl}")` } as React.CSSProperties)
    : undefined;

  const cardBody = (
    <>
      {t.imageUrl && <div className="tl-card-bg" aria-hidden />}
      <div className="tl-card-inner">
        <div className="tl-card-top">
          <span className="tl-card-code">{t.dossierCode}</span>
          <StatusChip pending={isPending} onStandby={onStandby} />
        </div>

        <div className="tl-category">{t.category}</div>
        <h2 className="tl-title">{t.title}</h2>
        <p className="tl-subtitle">{t.subtitle}</p>

        {t.tags.length > 0 && (
          <ul className="tl-tags">
            {t.tags.map((tag, i) => (
              <li key={i}>{tag}</li>
            ))}
          </ul>
        )}

        <div className="tl-open">
          {isPending ? (
            <span className="tl-open-muted">Filed under pending…</span>
          ) : (
            <>
              Open dossier <ArrowUpRight size={13} />
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <article className={classes} style={style}>
      {isAdmin && <AdminCog entry={t} canCreate={canCreate} />}
      {isPending ? (
        <div className="tl-card-link tl-card-link-pending">{cardBody}</div>
      ) : (
        <Link
          href={t.viewPath}
          className="tl-card-link"
          data-testid={`link-timeline-${t.slug}`}
        >
          {cardBody}
        </Link>
      )}
    </article>
  );
}

// ─── List view ───────────────────────────────────────────────────────────────

function TimelineRow({
  entry: t,
  isAdmin,
  canCreate,
  index,
}: {
  entry: TimelineEntry;
  isAdmin: boolean;
  canCreate: boolean;
  index: number;
}) {
  const { data: status = "live" } = useQuery({
    queryKey: [`/api/page-status/${t.slug}`],
    queryFn: () => getPageStatus(t.slug),
    staleTime: 30_000,
    retry: 1,
    enabled: !t.isPlaceholder,
  });
  const onStandby = status === "standby";
  const isPending = !!t.isPlaceholder;

  if (onStandby && !isAdmin && !isPending) return null;

  const isOdd = index % 2 === 0;
  const classes = [
    "tl-row",
    isOdd ? "tl-row-odd" : "tl-row-even",
    onStandby ? "tl-row-standby" : "",
    isPending ? "tl-row-pending" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const rowInner = (
    <>
      <div className="tl-row-code">
        <div className="tl-row-code-main">{t.dossierCode}</div>
        <div className="tl-row-code-cat">{t.category}</div>
      </div>
      <div className="tl-row-body">
        <div className="tl-row-title">{t.title}</div>
        <div className="tl-row-sub">{t.subtitle}</div>
      </div>
      <div className="tl-row-meta">
        <StatusChip pending={isPending} onStandby={onStandby} />
        <div className="tl-row-tags">
          {t.tags.slice(0, 2).map((tag, i) => (
            <span key={i}>{tag}</span>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <article className={classes}>
      {isPending ? (
        <div className="tl-row-link tl-row-link-pending">{rowInner}</div>
      ) : (
        <Link
          href={t.viewPath}
          className="tl-row-link"
          data-testid={`link-timeline-row-${t.slug}`}
        >
          {rowInner}
        </Link>
      )}
      {isAdmin && (
        <div className="tl-row-cog-wrap">
          <AdminCog entry={t} canCreate={canCreate} />
        </div>
      )}
    </article>
  );
}

function StatusChip({ pending, onStandby }: { pending: boolean; onStandby: boolean }) {
  if (pending) {
    return (
      <span className="tl-chip tl-chip-pending">
        <CircleDot size={9} /> PENDING
      </span>
    );
  }
  if (onStandby) {
    return (
      <span className="tl-chip tl-chip-standby">
        <CircleDot size={9} /> STANDBY
      </span>
    );
  }
  return (
    <span className="tl-chip tl-chip-live">
      <Radio size={9} /> LIVE
    </span>
  );
}

// ─── Admin cog with dropdown (Edit / Copy) ───────────────────────────────────

function AdminCog({ entry: t, canCreate }: { entry: TimelineEntry; canCreate: boolean }) {
  const [open, setOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [, navigate] = useLocation();

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    // Defer so the click that opened the menu doesn't immediately close it.
    const t = setTimeout(() => window.addEventListener("click", handler), 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("click", handler);
    };
  }, [open]);

  return (
    <>
      <div className="tl-cog-wrap" onClick={(e) => e.stopPropagation()}>
        <button
          className="tl-cog"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          aria-label={`Options for ${t.title}`}
          data-testid={`link-edit-${t.slug}`}
        >
          <Settings size={14} />
        </button>
        {open && (
          <div className="tl-cog-menu" role="menu">
            {t.editPath && (
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  navigate(t.editPath!);
                }}
              >
                Edit
              </button>
            )}
            {canCreate && (
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setCopyOpen(true);
                }}
              >
                <Copy size={11} style={{ display: "inline", marginRight: 4 }} />
                Copy
              </button>
            )}
          </div>
        )}
      </div>
      {copyOpen && (
        <CopyTimelineModal
          from={t}
          onClose={() => setCopyOpen(false)}
        />
      )}
    </>
  );
}

// ─── Modals ──────────────────────────────────────────────────────────────────

function NewTimelineModal({
  onClose,
  lastEntry,
}: {
  onClose: () => void;
  lastEntry?: TimelineEntry;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    subtitle: "",
    dossierCode: "",
    category: lastEntry?.category ?? "Ideology",
    copyFrom: lastEntry?.slug ?? "",
  });

  const onSubmit = async () => {
    const slug = form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(slug)) {
      toast({ title: "Invalid slug", description: "Use lowercase letters, numbers and dashes.", variant: "destructive" });
      return;
    }
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      if (form.copyFrom) {
        // Use the last entry as a template — this duplicates content too.
        await copyTimeline(form.copyFrom, slug, {
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || "A new DinoBane dossier",
          dossierCode: form.dossierCode.trim() || `DB-XX-${slug.slice(0, 3).toUpperCase()}`,
          category: form.category.trim() || "Ideology",
          tags: ["New dossier"],
        });
      } else {
        // Fresh blank entry
        await createTimeline({
          slug,
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || "A new DinoBane dossier",
          dossierCode: form.dossierCode.trim() || `DB-XX-${slug.slice(0, 3).toUpperCase()}`,
          category: form.category.trim() || "Ideology",
          viewPath: `/timeline/${slug}`,
          editPath: `/admin/timeline/${slug}`,
          tags: ["New dossier"],
        });
      }
      await qc.invalidateQueries({ queryKey: ["/api/timelines/registry"] });
      toast({ title: "Timeline created", description: `Opening editor for "${form.title}"…` });
      onClose();
      navigate(`/admin/timeline/${slug}`);
    } catch (e: unknown) {
      toast({
        title: "Create failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={busy ? () => {} : onClose} title="New Timeline" kicker="Create a fresh dossier">
      <ModalField
        label="Slug (URL)"
        value={form.slug}
        onChange={(v) => setForm((f) => ({ ...f, slug: v }))}
        placeholder="e.g. overton-shift"
        mono
      />
      <ModalField
        label="Title"
        value={form.title}
        onChange={(v) => setForm((f) => ({ ...f, title: v }))}
        placeholder="Display title"
      />
      <ModalField
        label="Subtitle"
        value={form.subtitle}
        onChange={(v) => setForm((f) => ({ ...f, subtitle: v }))}
        placeholder="One-line description"
      />
      <div className="grid grid-cols-2 gap-3">
        <ModalField
          label="Dossier code"
          value={form.dossierCode}
          onChange={(v) => setForm((f) => ({ ...f, dossierCode: v }))}
          placeholder="DB-XX-005"
          mono
        />
        <ModalField
          label="Category"
          value={form.category}
          onChange={(v) => setForm((f) => ({ ...f, category: v }))}
          placeholder="Ideology"
        />
      </div>

      <label className="block mt-2">
        <span className="block text-[10px] tracking-[0.28em] uppercase text-zinc-500 mb-1">
          Start from
        </span>
        <select
          value={form.copyFrom}
          onChange={(e) => setForm((f) => ({ ...f, copyFrom: e.target.value }))}
          className="w-full bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-200 focus:outline-none focus:border-[#cc2a2a]"
        >
          <option value="">Blank template</option>
          {lastEntry && (
            <option value={lastEntry.slug}>
              Copy of the last timeline: {lastEntry.title}
            </option>
          )}
          {TIMELINES.filter((t) => !t.isPlaceholder && t.slug !== lastEntry?.slug).map((t) => (
            <option key={t.slug} value={t.slug}>Copy of {t.title}</option>
          ))}
        </select>
      </label>

      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={onClose}
          disabled={busy}
          className="text-[11px] tracking-[0.22em] uppercase border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-zinc-500 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase bg-[#cc2a2a] hover:bg-[#e03737] text-white px-4 py-2 font-semibold disabled:opacity-40"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {busy ? "Creating…" : "Create timeline"}
        </button>
      </div>
    </Modal>
  );
}

function CopyTimelineModal({
  from,
  onClose,
}: {
  from: TimelineEntry;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    slug: `${from.slug}-copy`,
    title: `${from.title} (copy)`,
    subtitle: from.subtitle,
  });

  const onSubmit = async () => {
    const slug = form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(slug)) {
      toast({ title: "Invalid slug", description: "Use lowercase letters, numbers and dashes.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await copyTimeline(from.slug, slug, {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || from.subtitle,
      });
      await qc.invalidateQueries({ queryKey: ["/api/timelines/registry"] });
      toast({ title: "Timeline copied", description: `Opening ${slug}…` });
      onClose();
      navigate(`/admin/timeline/${slug}`);
    } catch (e: unknown) {
      toast({
        title: "Copy failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={busy ? () => {} : onClose} title={`Copy "${from.title}"`} kicker="Duplicate as starting point">
      <ModalField
        label="New slug"
        value={form.slug}
        onChange={(v) => setForm((f) => ({ ...f, slug: v }))}
        mono
      />
      <ModalField
        label="New title"
        value={form.title}
        onChange={(v) => setForm((f) => ({ ...f, title: v }))}
      />
      <ModalField
        label="New subtitle"
        value={form.subtitle}
        onChange={(v) => setForm((f) => ({ ...f, subtitle: v }))}
      />
      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={onClose}
          disabled={busy}
          className="text-[11px] tracking-[0.22em] uppercase border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-zinc-500 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase bg-[#cc2a2a] hover:bg-[#e03737] text-white px-4 py-2 font-semibold disabled:opacity-40"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
          {busy ? "Copying…" : "Create copy"}
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  onClose,
  title,
  kicker,
  children,
}: {
  onClose: () => void;
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full bg-[#0a0a0a] border border-zinc-800 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-200 p-1"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <div className="text-[10px] tracking-[0.3em] uppercase text-[#cc2a2a] mb-2">{kicker}</div>
        <h2 className="font-serif italic text-2xl text-white mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ModalField({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block mb-3">
      <span className="block text-[10px] tracking-[0.28em] uppercase text-zinc-500 mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-200 focus:outline-none focus:border-[#cc2a2a] ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}

// ─── Scoped CSS ──────────────────────────────────────────────────────────────

const CSS = `
.tl-wrap{
  --tl-bg:#0a0a0a; --tl-ink:#e6e2da; --tl-mute:#8a847c; --tl-dim:#b6ada1;
  --tl-red:#cc2a2a; --tl-red-deep:#7a1818; --tl-gold:#d4a24a; --tl-gold-soft:rgba(212,162,74,.35);
  --tl-line:rgba(255,255,255,.08);
  --tl-serif:'Cormorant Garamond', Georgia, serif;
  --tl-mono:'JetBrains Mono', ui-monospace, Menlo, monospace;
  background:var(--tl-bg); color:var(--tl-ink); font-family:var(--tl-serif); font-size:17px; line-height:1.7;
  max-width:1200px; margin:0 auto; padding:40px 24px 80px; position:relative;
}
.tl-wrap::before{
  content:""; position:absolute; inset:0; pointer-events:none; opacity:.05; z-index:0;
  background:
    repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,.03) 3px 4px),
    radial-gradient(circle at 20% 10%, rgba(204,42,42,.12), transparent 60%);
}

.tl-dossier{
  display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap;
  font-family:var(--tl-mono); font-size:11px; letter-spacing:.28em; text-transform:uppercase;
  color:var(--tl-mute); border-top:1px solid var(--tl-line); border-bottom:1px solid var(--tl-line);
  padding:14px 0; margin-bottom:48px; position:relative; z-index:1;
}
.tl-tag{color:var(--tl-red)}
.tl-stamp{color:var(--tl-gold); border:1px solid var(--tl-gold-soft); padding:5px 12px; letter-spacing:.3em}

.tl-hero{text-align:center; margin-bottom:28px; position:relative; z-index:1}
.tl-eyebrow{font-family:var(--tl-mono); font-size:11px; letter-spacing:.45em; text-transform:uppercase; color:var(--tl-red); margin-bottom:20px}
.tl-hero h1{
  font-family:var(--tl-serif); font-weight:700; font-style:italic;
  font-size:clamp(56px, 9vw, 108px); line-height:.95; letter-spacing:-.02em;
  color:var(--tl-ink); margin:0 0 14px;
}
.tl-amp{color:var(--tl-red)}
.tl-sub{
  font-family:var(--tl-serif); font-style:italic; font-size:19px;
  color:var(--tl-dim); max-width:640px; margin:0 auto 18px;
}
.tl-rule{width:72px; height:2px; background:var(--tl-red); margin:20px auto 0}

.tl-control{
  display:flex; align-items:center; justify-content:space-between; gap:16px;
  flex-wrap:wrap; margin-bottom:22px; position:relative; z-index:1;
}
.tl-count{
  display:flex; align-items:center; gap:12px;
  font-family:var(--tl-mono); font-size:11px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--tl-mute);
}
.tl-count .tl-dot{width:4px; height:4px; background:var(--tl-red); border-radius:50%}
.tl-control-right{display:flex; align-items:center; gap:10px; flex-wrap:wrap}

.tl-view-toggle{
  display:inline-flex; border:1px solid var(--tl-line); background:rgba(0,0,0,.25);
}
.tl-view-btn{
  display:inline-flex; align-items:center; gap:6px;
  font-family:var(--tl-mono); font-size:10px; letter-spacing:.24em; text-transform:uppercase;
  color:var(--tl-mute); padding:7px 12px; border:none; background:transparent;
  cursor:pointer; transition:color .2s ease, background .2s ease;
}
.tl-view-btn:hover{color:var(--tl-ink)}
.tl-view-btn-active{color:#0a0a0a; background:var(--tl-ink)}
.tl-view-btn + .tl-view-btn{border-left:1px solid var(--tl-line)}

.tl-new-btn{
  display:inline-flex; align-items:center; gap:6px;
  font-family:var(--tl-mono); font-size:10px; letter-spacing:.24em; text-transform:uppercase;
  color:#ffd9d9; padding:7px 12px; border:1px solid rgba(204,42,42,.6);
  background:rgba(204,42,42,.08); cursor:pointer;
  transition:background .2s ease, border-color .2s ease;
}
.tl-new-btn:hover{background:rgba(204,42,42,.2); border-color:var(--tl-red)}

/* ─── Card view ─── */
.tl-grid{
  display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr));
  gap:18px; margin-bottom:60px; position:relative; z-index:1;
}

.tl-card{
  position:relative; overflow:hidden;
  background:linear-gradient(180deg, rgba(255,255,255,.018), rgba(0,0,0,.28));
  border:1px solid var(--tl-line);
  transition:transform .3s ease, border-color .3s ease, box-shadow .3s ease;
}
.tl-card-odd{
  border-left:2px solid rgba(204,42,42,.45);
  background:linear-gradient(180deg, rgba(30,12,12,.55), rgba(10,10,10,.35));
}
.tl-card-even{
  border-left:2px solid rgba(150,150,170,.2);
  background:linear-gradient(180deg, rgba(12,12,20,.5), rgba(10,10,10,.3));
}
.tl-card:hover{
  transform:translateY(-3px);
  border-color:var(--tl-red-deep);
  box-shadow:0 14px 44px rgba(204,42,42,.14);
}
.tl-card-odd:hover{border-left-color:var(--tl-red)}
.tl-card-standby{opacity:.88}
.tl-card-standby:hover{border-color:var(--tl-gold-soft); box-shadow:0 14px 44px rgba(212,162,74,.08)}
.tl-card-pending{opacity:.6}
.tl-card-pending:hover{transform:none; box-shadow:none; border-color:var(--tl-line)}

.tl-card-bg{
  position:absolute; inset:0; pointer-events:none; z-index:0;
  background-image:var(--tl-bg-img); background-size:cover; background-position:center;
  opacity:.18; filter:grayscale(.55) contrast(1.08) brightness(.9);
}
.tl-card-has-bg::after{
  content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
  background:linear-gradient(180deg, rgba(10,10,10,.5), rgba(10,10,10,.9));
}

.tl-card-link{
  display:flex; flex-direction:column; gap:10px;
  padding:22px 22px 20px; text-decoration:none; color:inherit; height:100%;
  position:relative; z-index:1;
}
.tl-card-link-pending{cursor:default}
.tl-card-inner{display:flex; flex-direction:column; gap:10px; flex:1}

.tl-card-top{
  display:flex; justify-content:space-between; align-items:center;
  font-family:var(--tl-mono); font-size:10.5px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--tl-mute);
}
.tl-card-code{color:var(--tl-red)}

.tl-chip{
  display:inline-flex; align-items:center; gap:5px; border:1px solid;
  padding:4px 9px; font-family:var(--tl-mono); font-size:9.5px;
  letter-spacing:.3em; text-transform:uppercase; white-space:nowrap;
}
.tl-chip-live{color:#ff7b7b; border-color:rgba(204,42,42,.55); background:rgba(204,42,42,.06)}
.tl-chip-standby{color:#f0c57a; border-color:var(--tl-gold-soft); background:rgba(212,162,74,.06)}
.tl-chip-pending{color:#7a7266; border-color:rgba(255,255,255,.1)}

.tl-category{
  font-family:var(--tl-mono); font-size:10px; letter-spacing:.3em;
  text-transform:uppercase; color:var(--tl-gold); margin-top:2px;
}
.tl-title{
  font-family:var(--tl-serif); font-weight:600; font-size:28px; line-height:1.12;
  margin:2px 0 4px; color:var(--tl-ink);
}
.tl-subtitle{
  font-family:var(--tl-serif); font-style:italic; font-size:16px;
  color:var(--tl-dim); margin:0 0 10px; line-height:1.5;
}

.tl-tags{
  list-style:none; padding:0; margin:4px 0 0; display:flex; flex-wrap:wrap;
  gap:6px; font-family:var(--tl-mono); font-size:10px;
  letter-spacing:.22em; text-transform:uppercase;
}
.tl-tags li{
  border:1px solid var(--tl-line); padding:3px 8px; color:var(--tl-mute);
  background:rgba(0,0,0,.3);
}

.tl-open{
  margin-top:auto; padding-top:12px; border-top:1px solid var(--tl-line);
  font-family:var(--tl-mono); font-size:11px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--tl-ink); display:inline-flex;
  align-items:center; gap:6px; transition:color .25s ease, gap .25s ease;
}
.tl-card:hover .tl-open{color:var(--tl-red); gap:10px}
.tl-open-muted{color:var(--tl-mute)}

/* ─── List view ─── */
.tl-list{
  display:flex; flex-direction:column; margin-bottom:60px; position:relative; z-index:1;
  border-top:1px solid var(--tl-line);
}
.tl-row{
  position:relative; border-bottom:1px solid var(--tl-line);
  transition:background .2s ease;
}
.tl-row-odd{background:rgba(30,12,12,.28); border-left:2px solid rgba(204,42,42,.35)}
.tl-row-even{background:rgba(12,12,20,.22); border-left:2px solid rgba(150,150,170,.18)}
.tl-row:hover{background:rgba(204,42,42,.08)}
.tl-row-odd:hover{border-left-color:var(--tl-red)}
.tl-row-standby{opacity:.85}
.tl-row-pending{opacity:.55}
.tl-row-pending:hover{background:rgba(12,12,20,.22)}

.tl-row-link{
  display:grid; grid-template-columns:200px 1fr 220px; align-items:center;
  gap:20px; padding:18px 22px; text-decoration:none; color:inherit;
}
.tl-row-link-pending{cursor:default}

.tl-row-code-main{
  font-family:var(--tl-mono); font-size:11px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--tl-red);
}
.tl-row-code-cat{
  font-family:var(--tl-mono); font-size:9.5px; letter-spacing:.3em;
  text-transform:uppercase; color:var(--tl-gold); margin-top:4px;
}

.tl-row-body{min-width:0}
.tl-row-title{
  font-family:var(--tl-serif); font-weight:600; font-size:22px; line-height:1.2;
  color:var(--tl-ink); margin-bottom:3px;
}
.tl-row:hover .tl-row-title{color:var(--tl-red)}
.tl-row-sub{
  font-family:var(--tl-serif); font-style:italic; font-size:15px;
  color:var(--tl-dim); line-height:1.4;
  overflow:hidden; text-overflow:ellipsis; display:-webkit-box;
  -webkit-line-clamp:1; -webkit-box-orient:vertical;
}

.tl-row-meta{
  display:flex; flex-direction:column; align-items:flex-end; gap:6px;
}
.tl-row-tags{
  display:flex; gap:6px; font-family:var(--tl-mono); font-size:9.5px;
  letter-spacing:.22em; text-transform:uppercase; color:var(--tl-mute);
  flex-wrap:wrap; justify-content:flex-end;
}
.tl-row-tags span{border:1px solid var(--tl-line); padding:3px 7px}

.tl-row-cog-wrap{position:absolute; top:50%; right:10px; transform:translateY(-50%); z-index:2}

/* ─── Cog + dropdown ─── */
.tl-cog-wrap{position:absolute; top:10px; right:10px; z-index:3}
.tl-row .tl-cog-wrap{position:static; top:auto; right:auto}
.tl-cog{
  width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center;
  color:var(--tl-mute); border:1px solid var(--tl-line);
  background:rgba(0,0,0,.55); backdrop-filter:blur(4px); cursor:pointer;
  transition:color .2s ease, border-color .2s ease, background .2s ease, transform .4s ease;
}
.tl-cog:hover{color:var(--tl-gold); border-color:var(--tl-gold-soft); background:rgba(212,162,74,.12); transform:rotate(60deg)}
.tl-cog-menu{
  position:absolute; top:34px; right:0; min-width:140px;
  background:#0d0d0d; border:1px solid var(--tl-line); padding:4px 0;
  box-shadow:0 10px 30px rgba(0,0,0,.6); z-index:10;
}
.tl-cog-menu button{
  display:block; width:100%; text-align:left; padding:8px 14px;
  font-family:var(--tl-mono); font-size:10.5px; letter-spacing:.24em; text-transform:uppercase;
  color:var(--tl-ink); background:transparent; border:none; cursor:pointer;
}
.tl-cog-menu button:hover{background:rgba(204,42,42,.15); color:#fff}

.tl-footer{
  margin-top:60px; border-top:1px solid var(--tl-line); padding:28px 0 10px;
  font-family:var(--tl-mono); font-size:11px; letter-spacing:.24em;
  text-transform:uppercase; color:var(--tl-mute);
  display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;
  position:relative; z-index:1;
}
.tl-mark{color:var(--tl-red)}

@media (max-width:780px){
  .tl-wrap{padding:28px 18px 60px}
  .tl-hero h1{font-size:58px}
  .tl-sub{font-size:17px}
  .tl-dossier{gap:10px; padding:12px 0; margin-bottom:32px}
  .tl-title{font-size:24px}
  .tl-grid{grid-template-columns:1fr}
  .tl-row-link{grid-template-columns:1fr; gap:8px; padding:16px 18px 16px 18px}
  .tl-row-meta{align-items:flex-start}
  .tl-row-tags{justify-content:flex-start}
  .tl-row-cog-wrap{top:16px; right:14px; transform:none}
  .tl-control{flex-direction:column; align-items:flex-start}
}
`;
