import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import {
  getPageContent,
  setPageContent,
  getPageStatus,
  setPageStatus,
  type PageStatus,
} from "@/lib/page-status";
import {
  LONG_MARCH_DATA,
  type LongMarchData,
} from "@/pages/long-march";
import {
  Save,
  Undo2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Star,
  Radio,
  CircleDot,
  Loader2,
} from "lucide-react";

const ADMIN_EMAILS = new Set([
  "realdinobane@gmail.com",
  "yingchanzeng@gmail.com",
]);

const SLUG = "long-march";

/**
 * Admin-only editor for the Long March page.
 * Loads current content from the DB (or the hardcoded default if none saved),
 * lets the admin edit every field, and writes the whole JSON blob back.
 */
export default function AdminLongMarchPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Guard: redirect non-admins. Wait for auth to resolve first so we don't
  // bounce an admin who hasn't finished loading their session.
  useEffect(() => {
    if (authLoading) return;
    if (!user || !ADMIN_EMAILS.has(user.email)) navigate("/");
  }, [authLoading, user, navigate]);

  const { data: saved, isLoading: contentLoading } = useQuery({
    queryKey: [`/api/page-content/${SLUG}`],
    queryFn: () => getPageContent<Partial<LongMarchData>>(SLUG),
    staleTime: 0,
  });

  const { data: status = "live" } = useQuery({
    queryKey: [`/api/page-status/${SLUG}`],
    queryFn: () => getPageStatus(SLUG),
    staleTime: 10_000,
  });

  // Draft state — we keep a local copy so the admin can edit freely and save
  // the whole thing at once.
  const [draft, setDraft] = useState<LongMarchData | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  // Seed the draft once content has loaded.
  useEffect(() => {
    if (draft) return;
    if (contentLoading) return;
    const merged: LongMarchData = {
      meta: { ...LONG_MARCH_DATA.meta, ...(saved?.meta || {}) },
      thesis: saved?.thesis ?? LONG_MARCH_DATA.thesis,
      timeline: saved?.timeline ?? LONG_MARCH_DATA.timeline,
      tactics: saved?.tactics ?? LONG_MARCH_DATA.tactics,
      engine: saved?.engine ?? LONG_MARCH_DATA.engine,
      closing: saved?.closing ?? LONG_MARCH_DATA.closing,
    };
    setDraft(JSON.parse(JSON.stringify(merged)));
  }, [saved, contentLoading, draft]);

  // Track whether the draft differs from what's saved
  const dirty = useMemo(() => {
    if (!draft) return false;
    const baseline: Partial<LongMarchData> = saved || {};
    return JSON.stringify(draft) !== JSON.stringify({
      meta: { ...LONG_MARCH_DATA.meta, ...(baseline.meta || {}) },
      thesis: baseline.thesis ?? LONG_MARCH_DATA.thesis,
      timeline: baseline.timeline ?? LONG_MARCH_DATA.timeline,
      tactics: baseline.tactics ?? LONG_MARCH_DATA.tactics,
      engine: baseline.engine ?? LONG_MARCH_DATA.engine,
      closing: baseline.closing ?? LONG_MARCH_DATA.closing,
    });
  }, [draft, saved]);

  if (authLoading || contentLoading || !draft) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#cc2a2a]" size={28} />
      </div>
    );
  }

  // Helpers to mutate the draft immutably
  const update = (mut: (d: LongMarchData) => void) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as LongMarchData;
      mut(next);
      return next;
    });
  };

  const onSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await setPageContent(SLUG, draft);
      await qc.invalidateQueries({ queryKey: [`/api/page-content/${SLUG}`] });
      toast({
        title: "Saved",
        description: "Long March content updated. Reload the page to see changes.",
      });
    } catch (e: unknown) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onRevert = () => {
    if (!confirm("Discard unsaved changes?")) return;
    setDraft(null); // will re-seed from saved on next effect pass
  };

  const onResetDefaults = () => {
    if (!confirm("Reset every field back to the original hardcoded defaults?")) return;
    setDraft(JSON.parse(JSON.stringify(LONG_MARCH_DATA)));
  };

  const toggleStatus = async () => {
    setStatusBusy(true);
    try {
      const next: PageStatus = status === "live" ? "standby" : "live";
      await setPageStatus(SLUG, next);
      await qc.invalidateQueries({ queryKey: [`/api/page-status/${SLUG}`] });
      toast({
        title: next === "live" ? "Page is now LIVE" : "Page is now on STANDBY",
        description:
          next === "live"
            ? "Public visitors can see the page."
            : "Only admins can see the page.",
      });
    } catch (e: unknown) {
      toast({
        title: "Status change failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 text-zinc-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <div className="text-[11px] tracking-[0.3em] uppercase text-zinc-500 mb-2">
            Admin · Content Editor
          </div>
          <h1 className="text-3xl font-serif italic text-white">The Long March</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Edit everything on the page. Save writes to the database; the live page picks it up on next load.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/long-march"
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-[#cc2a2a] hover:text-white transition-colors"
          >
            <ExternalLink size={12} /> View page
          </Link>
          <button
            onClick={toggleStatus}
            disabled={statusBusy}
            className={`inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase border px-3 py-2 transition-colors ${
              status === "live"
                ? "border-[#cc2a2a]/60 text-[#ff8a8a] hover:bg-[#cc2a2a]/10"
                : "border-[#d4a24a]/60 text-[#f0c57a] hover:bg-[#d4a24a]/10"
            } disabled:opacity-50 disabled:cursor-wait`}
          >
            {statusBusy ? (
              <Loader2 size={12} className="animate-spin" />
            ) : status === "live" ? (
              <Radio size={12} />
            ) : (
              <CircleDot size={12} />
            )}
            {status === "live" ? "Status: LIVE" : "Status: STANDBY"}
          </button>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 bg-[#0a0a0a]/90 backdrop-blur border-b border-zinc-900 flex items-center justify-between gap-3">
        <div className="text-[11px] tracking-[0.22em] uppercase text-zinc-500">
          {dirty ? (
            <span className="text-[#f0c57a]">Unsaved changes</span>
          ) : (
            <span>All changes saved</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onResetDefaults}
            className="text-[11px] tracking-[0.22em] uppercase text-zinc-500 hover:text-zinc-300 px-3 py-2"
            title="Reset all fields to the original defaults"
          >
            Reset to defaults
          </button>
          <button
            onClick={onRevert}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 size={12} /> Discard
          </button>
          <button
            onClick={onSave}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase bg-[#cc2a2a] hover:bg-[#e03737] text-white px-4 py-2 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Meta */}
      <Section title="Header & dossier">
        <Grid>
          <Field label="Title" value={draft.meta.title} onChange={(v) => update((d) => { d.meta.title = v; })} />
          <Field label="Subtitle" value={draft.meta.subtitle} onChange={(v) => update((d) => { d.meta.subtitle = v; })} />
          <Field label="Byline" value={draft.meta.byline} onChange={(v) => update((d) => { d.meta.byline = v; })} />
          <Field label="Dossier code" value={draft.meta.dossierCode} onChange={(v) => update((d) => { d.meta.dossierCode = v; })} />
          <Field label="Eyes-only tag" value={draft.meta.eyesOnly} onChange={(v) => update((d) => { d.meta.eyesOnly = v; })} />
          <Field label="File tag" value={draft.meta.fileTag} onChange={(v) => update((d) => { d.meta.fileTag = v; })} />
        </Grid>
      </Section>

      {/* Thesis */}
      <Section title="Opening thesis">
        <StringList
          items={draft.thesis}
          onChange={(next) => update((d) => { d.thesis = next; })}
          placeholder="Paragraph of the opening thesis…"
          multiline
        />
      </Section>

      {/* Timeline */}
      <Section title={`Timeline events (${draft.timeline.length})`}>
        <div className="space-y-4">
          {draft.timeline.map((ev, i) => (
            <div key={i} className="border border-zinc-800 bg-zinc-950/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">
                  Event #{i + 1}
                </div>
                <ItemControls
                  onUp={i > 0 ? () => update((d) => { [d.timeline[i - 1], d.timeline[i]] = [d.timeline[i], d.timeline[i - 1]]; }) : undefined}
                  onDown={i < draft.timeline.length - 1 ? () => update((d) => { [d.timeline[i + 1], d.timeline[i]] = [d.timeline[i], d.timeline[i + 1]]; }) : undefined}
                  onDelete={() => update((d) => { d.timeline.splice(i, 1); })}
                />
              </div>
              <Grid>
                <Field label="Year" value={ev.year} onChange={(v) => update((d) => { d.timeline[i].year = v; })} />
                <Field label="Place" value={ev.place} onChange={(v) => update((d) => { d.timeline[i].place = v; })} />
              </Grid>
              <Field label="Title" value={ev.title} onChange={(v) => update((d) => { d.timeline[i].title = v; })} />
              <Field label="Body" multiline value={ev.body} onChange={(v) => update((d) => { d.timeline[i].body = v; })} />
              <label className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-zinc-400 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ev.key}
                  onChange={(e) => update((d) => { d.timeline[i].key = e.target.checked; })}
                  className="accent-[#d4a24a]"
                />
                <Star size={12} className={ev.key ? "text-[#d4a24a]" : "text-zinc-600"} />
                Mark as key event
              </label>

              <div className="mt-4 border-t border-zinc-900 pt-3">
                <div className="text-[10px] tracking-[0.28em] uppercase text-zinc-500 mb-2">Source links</div>
                <div className="space-y-2">
                  {ev.links.map((lnk, j) => (
                    <div key={j} className="flex gap-2 items-start">
                      <input
                        value={lnk.label}
                        onChange={(e) => update((d) => { d.timeline[i].links[j].label = e.target.value; })}
                        placeholder="Label"
                        className="flex-1 min-w-0 bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-200 focus:outline-none focus:border-[#cc2a2a]"
                      />
                      <input
                        value={lnk.url}
                        onChange={(e) => update((d) => { d.timeline[i].links[j].url = e.target.value; })}
                        placeholder="https://…"
                        className="flex-[2] min-w-0 bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-300 font-mono focus:outline-none focus:border-[#cc2a2a]"
                      />
                      <button
                        onClick={() => update((d) => { d.timeline[i].links.splice(j, 1); })}
                        className="text-zinc-500 hover:text-[#cc2a2a] p-2"
                        title="Remove link"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => update((d) => { d.timeline[i].links.push({ label: "", url: "" }); })}
                  className="mt-2 inline-flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-zinc-500 hover:text-zinc-200"
                >
                  <Plus size={12} /> Add link
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() =>
              update((d) => {
                d.timeline.push({
                  year: "",
                  title: "",
                  place: "",
                  key: false,
                  body: "",
                  links: [],
                });
              })
            }
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase border border-dashed border-zinc-700 px-4 py-2 text-zinc-400 hover:border-[#cc2a2a] hover:text-white"
          >
            <Plus size={12} /> Add timeline event
          </button>
        </div>
      </Section>

      {/* Tactics */}
      <Section title={`Tactics (${draft.tactics.length})`}>
        <div className="space-y-3">
          {draft.tactics.map((t, i) => (
            <div key={i} className="border border-zinc-800 bg-zinc-950/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">
                  Tactic #{i + 1}
                </div>
                <ItemControls
                  onUp={i > 0 ? () => update((d) => { [d.tactics[i - 1], d.tactics[i]] = [d.tactics[i], d.tactics[i - 1]]; }) : undefined}
                  onDown={i < draft.tactics.length - 1 ? () => update((d) => { [d.tactics[i + 1], d.tactics[i]] = [d.tactics[i], d.tactics[i + 1]]; }) : undefined}
                  onDelete={() => update((d) => { d.tactics.splice(i, 1); })}
                />
              </div>
              <Field label="Name" value={t.name} onChange={(v) => update((d) => { d.tactics[i].name = v; })} />
              <Field label="Description" multiline value={t.use} onChange={(v) => update((d) => { d.tactics[i].use = v; })} />
            </div>
          ))}
          <button
            onClick={() => update((d) => { d.tactics.push({ name: "", use: "" }); })}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase border border-dashed border-zinc-700 px-4 py-2 text-zinc-400 hover:border-[#cc2a2a] hover:text-white"
          >
            <Plus size={12} /> Add tactic
          </button>
        </div>
      </Section>

      {/* Engine */}
      <Section title="Machiavellian engine (three steps)">
        <div className="space-y-3">
          {draft.engine.map((s, i) => (
            <div key={i} className="border border-zinc-800 bg-zinc-950/40 p-4">
              <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-2">
                Step #{i + 1}
              </div>
              <Grid>
                <Field label="Step label" value={s.step} onChange={(v) => update((d) => { d.engine[i].step = v; })} />
                <Field label="Title" value={s.title} onChange={(v) => update((d) => { d.engine[i].title = v; })} />
              </Grid>
              <Field label="Body" multiline value={s.body} onChange={(v) => update((d) => { d.engine[i].body = v; })} />
            </div>
          ))}
        </div>
      </Section>

      {/* Closing */}
      <Section title="Closing">
        <StringList
          items={draft.closing}
          onChange={(next) => update((d) => { d.closing = next; })}
          placeholder="Closing paragraph…"
          multiline
        />
      </Section>

      {/* Bottom save bar duplicate for long pages */}
      <div className="mt-10 flex justify-end gap-2">
        <button
          onClick={onRevert}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Undo2 size={12} /> Discard
        </button>
        <button
          onClick={onSave}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase bg-[#cc2a2a] hover:bg-[#e03737] text-white px-4 py-2 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Small building blocks ────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-serif italic text-xl text-white mb-3 border-b border-zinc-900 pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block mb-3">
      <span className="block text-[10px] tracking-[0.28em] uppercase text-zinc-500 mb-1">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={Math.min(10, Math.max(3, Math.ceil(value.length / 80)))}
          className="w-full bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-200 focus:outline-none focus:border-[#cc2a2a] leading-relaxed"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-200 focus:outline-none focus:border-[#cc2a2a]"
        />
      )}
    </label>
  );
}

function StringList({
  items,
  onChange,
  placeholder,
  multiline,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2">
      {items.map((s, i) => (
        <div key={i} className="flex items-start gap-2">
          {multiline ? (
            <textarea
              value={s}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              rows={Math.min(8, Math.max(2, Math.ceil(s.length / 80)))}
              className="flex-1 bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-200 focus:outline-none focus:border-[#cc2a2a] leading-relaxed"
            />
          ) : (
            <input
              value={s}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className="flex-1 bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-200 focus:outline-none focus:border-[#cc2a2a]"
            />
          )}
          <ItemControls
            onUp={i > 0 ? () => { const n = [...items]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; onChange(n); } : undefined}
            onDown={i < items.length - 1 ? () => { const n = [...items]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; onChange(n); } : undefined}
            onDelete={() => { const n = [...items]; n.splice(i, 1); onChange(n); }}
          />
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-zinc-500 hover:text-zinc-200"
      >
        <Plus size={12} /> Add paragraph
      </button>
    </div>
  );
}

function ItemControls({
  onUp,
  onDown,
  onDelete,
}: {
  onUp?: () => void;
  onDown?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={onUp}
        disabled={!onUp}
        className="text-zinc-500 hover:text-zinc-200 disabled:opacity-25 p-1.5"
        title="Move up"
      >
        <ArrowUp size={14} />
      </button>
      <button
        onClick={onDown}
        disabled={!onDown}
        className="text-zinc-500 hover:text-zinc-200 disabled:opacity-25 p-1.5"
        title="Move down"
      >
        <ArrowDown size={14} />
      </button>
      <button
        onClick={onDelete}
        className="text-zinc-500 hover:text-[#cc2a2a] p-1.5"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
