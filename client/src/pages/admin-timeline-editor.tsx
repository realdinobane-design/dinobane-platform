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
import type { TimelineData, TacticAxis, ExtraSection, ExtraSectionKind } from "@/components/timeline-renderer";
import { BLANK_TIMELINE_DATA, copyTimeline, deleteTimelineEntry, updateTimelineEntry } from "@/lib/timelines";
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
  Copy,
  Image as ImageIcon,
} from "lucide-react";

const ADMIN_EMAILS = new Set([
  "realdinobane@gmail.com",
  "yingchanzeng@gmail.com",
]);

/**
 * Generic editor for any timeline. Reads/writes DB content by slug, supports
 * live/standby toggle, and can duplicate itself into a new timeline.
 */
export function AdminTimelineEditor({
  slug,
  fallback = BLANK_TIMELINE_DATA as TimelineData,
  viewPath,
  allowDelete = false,
}: {
  slug: string;
  fallback?: TimelineData;
  viewPath: string;
  allowDelete?: boolean;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    if (authLoading) return;
    if (!user || !ADMIN_EMAILS.has(user.email)) navigate("/");
  }, [authLoading, user, navigate]);

  const { data: saved, isLoading: contentLoading } = useQuery({
    queryKey: [`/api/page-content/${slug}`],
    queryFn: () => getPageContent<Partial<TimelineData>>(slug),
    staleTime: 0,
  });

  const { data: status = "live" } = useQuery({
    queryKey: [`/api/page-status/${slug}`],
    queryFn: () => getPageStatus(slug),
    staleTime: 10_000,
  });

  const [draft, setDraft] = useState<TimelineData | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyForm, setCopyForm] = useState({ slug: "", title: "", subtitle: "" });
  const [copyBusy, setCopyBusy] = useState(false);

  useEffect(() => {
    // Re-seed whenever the slug changes or we haven't seeded yet.
    if (contentLoading) return;
    const merged: TimelineData = {
      meta: { ...fallback.meta, ...(saved?.meta || {}) },
      thesis: saved?.thesis ?? fallback.thesis,
      timeline: saved?.timeline ?? fallback.timeline,
      tactics: saved?.tactics ?? fallback.tactics,
      engine: saved?.engine ?? fallback.engine,
      closing: saved?.closing ?? fallback.closing,
      extraSections: saved?.extraSections ?? fallback.extraSections ?? [],
    };
    setDraft(JSON.parse(JSON.stringify(merged)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, contentLoading, saved]);

  const dirty = useMemo(() => {
    if (!draft) return false;
    const baseline: Partial<TimelineData> = saved || {};
    return JSON.stringify(draft) !== JSON.stringify({
      meta: { ...fallback.meta, ...(baseline.meta || {}) },
      thesis: baseline.thesis ?? fallback.thesis,
      timeline: baseline.timeline ?? fallback.timeline,
      tactics: baseline.tactics ?? fallback.tactics,
      engine: baseline.engine ?? fallback.engine,
      closing: baseline.closing ?? fallback.closing,
      extraSections: baseline.extraSections ?? fallback.extraSections ?? [],
    });
  }, [draft, saved, fallback]);

  if (authLoading || contentLoading || !draft) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#cc2a2a]" size={28} />
      </div>
    );
  }

  const update = (mut: (d: TimelineData) => void) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as TimelineData;
      mut(next);
      return next;
    });
  };

  const onSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await setPageContent(slug, draft);
      await qc.invalidateQueries({ queryKey: [`/api/page-content/${slug}`] });
      toast({
        title: "Saved",
        description: "Timeline content updated. Reload the page to see changes.",
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
    setDraft(null);
    // Force re-seed
    qc.invalidateQueries({ queryKey: [`/api/page-content/${slug}`] });
  };

  const onResetDefaults = () => {
    if (!confirm("Reset every field back to the original defaults?")) return;
    setDraft(JSON.parse(JSON.stringify(fallback)));
  };

  const toggleStatus = async () => {
    setStatusBusy(true);
    try {
      const next: PageStatus = status === "live" ? "standby" : "live";
      await setPageStatus(slug, next);
      await qc.invalidateQueries({ queryKey: [`/api/page-status/${slug}`] });
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

  const onCopyConfirm = async () => {
    const target = copyForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(target)) {
      toast({ title: "Invalid slug", description: "Use lowercase letters, numbers and dashes (max 40 chars).", variant: "destructive" });
      return;
    }
    setCopyBusy(true);
    try {
      // Save current draft first so the copy includes any pending edits.
      if (dirty) await setPageContent(slug, draft);
      await copyTimeline(slug, target, {
        title: copyForm.title.trim() || `${draft.meta.title} (copy)`,
        subtitle: copyForm.subtitle.trim() || draft.meta.subtitle,
      });
      await qc.invalidateQueries({ queryKey: ["/api/timelines/registry"] });
      toast({ title: "Timeline copied", description: `Opening ${target}…` });
      setCopyOpen(false);
      navigate(`/admin/timeline/${target}`);
    } catch (e: unknown) {
      toast({
        title: "Copy failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setCopyBusy(false);
    }
  };

  const onDelete = async () => {
    if (!confirm(`Delete timeline "${draft.meta.title}"? This cannot be undone.`)) return;
    try {
      await deleteTimelineEntry(slug);
      await qc.invalidateQueries({ queryKey: ["/api/timelines/registry"] });
      toast({ title: "Timeline deleted" });
      navigate("/timelines");
    } catch (e: unknown) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  // Sync title/subtitle in the registry whenever they change in the meta.
  const onSyncRegistry = async () => {
    try {
      await updateTimelineEntry(slug, {
        title: draft.meta.title,
        subtitle: draft.meta.subtitle,
      });
      await qc.invalidateQueries({ queryKey: ["/api/timelines/registry"] });
      toast({ title: "Hub updated", description: "Title and subtitle synced to the Timelines hub." });
    } catch (e: unknown) {
      toast({
        title: "Sync failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 text-zinc-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <div className="text-[11px] tracking-[0.3em] uppercase text-zinc-500 mb-2">
            Admin · Content Editor · {slug}
          </div>
          <h1 className="text-3xl font-serif italic text-white">{draft.meta.title}</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Edit everything on the page. Save writes to the database; the live page picks it up on next load.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={viewPath}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-[#cc2a2a] hover:text-white transition-colors"
          >
            <ExternalLink size={12} /> View page
          </Link>
          <button
            onClick={() => {
              setCopyForm({
                slug: `${slug}-copy`,
                title: `${draft.meta.title} (copy)`,
                subtitle: draft.meta.subtitle,
              });
              setCopyOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-[#d4a24a] hover:text-white transition-colors"
            title="Duplicate this timeline as the starting point for a new one"
          >
            <Copy size={12} /> Duplicate
          </button>
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
            onClick={onSyncRegistry}
            className="text-[11px] tracking-[0.22em] uppercase text-zinc-500 hover:text-zinc-300 px-3 py-2"
            title="Push current title & subtitle into the Timelines hub card"
          >
            Sync to hub
          </button>
          <button
            onClick={onResetDefaults}
            className="text-[11px] tracking-[0.22em] uppercase text-zinc-500 hover:text-zinc-300 px-3 py-2"
            title="Reset all fields to the original defaults"
          >
            Reset
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

        {/* Hero banner image — renders darkened behind the title block */}
        <div className="mt-4">
          <label className="block">
            <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.28em] uppercase text-zinc-500 mb-1">
              <ImageIcon size={11} /> Hero banner image URL
            </span>
            <input
              value={draft.meta.heroImageUrl ?? ""}
              onChange={(e) => update((d) => { d.meta.heroImageUrl = e.target.value; })}
              placeholder="https://… (optional — shown darkened behind the title)"
              className="w-full bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-300 font-mono focus:outline-none focus:border-[#cc2a2a]"
            />
          </label>
          {draft.meta.heroImageUrl && (
            <div className="mt-2 relative h-32 w-full overflow-hidden border border-zinc-800">
              <img
                src={draft.meta.heroImageUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(10,10,10,.25) 0%, rgba(10,10,10,.75) 70%, rgba(10,10,10,.95) 100%), linear-gradient(180deg, rgba(10,10,10,.55), rgba(10,10,10,.88))",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-serif italic text-2xl" style={{ textShadow: "0 2px 12px rgba(0,0,0,.9)" }}>
                  Preview · {draft.meta.title}
                </span>
              </div>
            </div>
          )}
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-600 mt-1">
            Image is auto-darkened so the title stays legible.
          </p>
        </div>
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
              <Field
                label="Card snippet (body)"
                multiline
                value={ev.body}
                onChange={(v) => update((d) => { d.timeline[i].body = v; })}
              />
              <Field
                label="Detail · longer prose opposite the card (optional)"
                multiline
                value={ev.detail ?? ""}
                onChange={(v) => update((d) => { d.timeline[i].detail = v; })}
              />

              <div className="mt-2">
                <label className="block">
                  <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.28em] uppercase text-zinc-500 mb-1">
                    <ImageIcon size={11} /> Background image URL
                  </span>
                  <input
                    value={ev.imageUrl ?? ""}
                    onChange={(e) => update((d) => { d.timeline[i].imageUrl = e.target.value; })}
                    placeholder="https://… (optional — used behind the event text)"
                    className="w-full bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-300 font-mono focus:outline-none focus:border-[#cc2a2a]"
                  />
                </label>
                {ev.imageUrl && (
                  <div className="mt-2 relative h-20 w-full overflow-hidden border border-zinc-800">
                    <img
                      src={ev.imageUrl}
                      alt=""
                      className="w-full h-full object-cover opacity-60"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>

              <label className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-zinc-400 mt-3 cursor-pointer">
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
                  detail: "",
                  links: [],
                  imageUrl: "",
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
              <label className="block mt-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.28em] uppercase text-zinc-500 mb-1">
                  Axis (groups tactics into families)
                </span>
                <select
                  value={t.axis ?? ""}
                  onChange={(e) =>
                    update((d) => {
                      const v = e.target.value;
                      if (!v) { delete (d.tactics[i] as { axis?: string }).axis; }
                      else { d.tactics[i].axis = v as TacticAxis; }
                    })
                  }
                  className="w-full bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-[#cc2a2a]"
                >
                  <option value="">— no axis —</option>
                  <option value="identity">Identity</option>
                  <option value="demographic">Demographic</option>
                  <option value="cultural">Cultural</option>
                  <option value="capital">Capital</option>
                  <option value="institutional">Institutional</option>
                  <option value="technological">Technological</option>
                </select>
              </label>
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

      {/* Extra custom sections */}
      <Section title={`Extra sections (${(draft.extraSections ?? []).length})`}>
        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
          Add any number of additional sections to this timeline. Each section
          picks one of the four templates and can carry its own kicker + title
          (e.g. “Section V · Field Notes”). Extras appear below the default
          closing in the order listed here.
        </p>
        <div className="space-y-4">
          {(draft.extraSections ?? []).map((sec, i) => (
            <ExtraSectionEditor
              key={i}
              section={sec}
              index={i}
              total={(draft.extraSections ?? []).length}
              onMoveUp={i > 0 ? () => update((d) => {
                const arr = d.extraSections ?? (d.extraSections = []);
                [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
              }) : undefined}
              onMoveDown={i < (draft.extraSections ?? []).length - 1 ? () => update((d) => {
                const arr = d.extraSections ?? (d.extraSections = []);
                [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
              }) : undefined}
              onDelete={() => update((d) => {
                const arr = d.extraSections ?? (d.extraSections = []);
                arr.splice(i, 1);
              })}
              onChange={(patch) => update((d) => {
                const arr = d.extraSections ?? (d.extraSections = []);
                arr[i] = { ...arr[i], ...patch } as ExtraSection;
              })}
            />
          ))}
        </div>
        <AddExtraSection
          nextIndex={(draft.extraSections ?? []).length}
          onAdd={(sec) => update((d) => {
            const arr = d.extraSections ?? (d.extraSections = []);
            arr.push(sec);
          })}
        />
      </Section>

      {/* Bottom save bar */}
      <div className="mt-10 flex justify-between items-center gap-2 flex-wrap">
        {allowDelete ? (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase border border-[#cc2a2a]/40 px-3 py-2 text-[#ff8a8a] hover:bg-[#cc2a2a]/10"
          >
            <Trash2 size={12} /> Delete timeline
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
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

      {/* Copy modal */}
      {copyOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !copyBusy && setCopyOpen(false)}
        >
          <div
            className="max-w-md w-full bg-[#0a0a0a] border border-zinc-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#cc2a2a] mb-2">
              Duplicate to new timeline
            </div>
            <h2 className="font-serif italic text-2xl text-white mb-4">Start from this one</h2>
            <div className="space-y-3">
              <Field
                label="New slug (URL)"
                value={copyForm.slug}
                onChange={(v) => setCopyForm((f) => ({ ...f, slug: v }))}
              />
              <Field
                label="New title"
                value={copyForm.title}
                onChange={(v) => setCopyForm((f) => ({ ...f, title: v }))}
              />
              <Field
                label="New subtitle"
                value={copyForm.subtitle}
                onChange={(v) => setCopyForm((f) => ({ ...f, subtitle: v }))}
              />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setCopyOpen(false)}
                disabled={copyBusy}
                className="text-[11px] tracking-[0.22em] uppercase border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-zinc-500 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={onCopyConfirm}
                disabled={copyBusy}
                className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase bg-[#cc2a2a] hover:bg-[#e03737] text-white px-4 py-2 font-semibold disabled:opacity-40"
              >
                {copyBusy ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
                {copyBusy ? "Copying…" : "Create copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small building blocks ────────────────────────────────────────────────────
// ─── Extra sections editor ─────────────────────────────────────────────────

const SECTION_TEMPLATES: Record<ExtraSectionKind, { label: string; description: string }> = {
  prose: { label: "Prose", description: "Italic paragraphs, like the closing." },
  timeline: { label: "Timeline events", description: "A second timeline spine with event cards." },
  tactics: { label: "Tactics grid", description: "A second tactics matrix with axis colours." },
  engine: { label: "Engine steps", description: "A horizontal action/problem/solution style grid." },
};

function seedSection(kind: ExtraSectionKind, nextIndex: number): ExtraSection {
  const roman = ["V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI"];
  const number = roman[nextIndex] ?? `N${nextIndex + 5}`;
  const base = { kicker: `Section ${number} · New`, title: "New section" };
  switch (kind) {
    case "prose":
      return { kind, ...base, paragraphs: [""] };
    case "timeline":
      return {
        kind,
        ...base,
        events: [{ year: "", title: "", place: "", key: false, body: "", detail: "", links: [], imageUrl: "" }],
      };
    case "tactics":
      return { kind, ...base, tactics: [{ name: "", use: "" }] };
    case "engine":
      return {
        kind,
        ...base,
        engine: [{ step: "Action", title: "", body: "" }],
      };
  }
}

function AddExtraSection({
  nextIndex,
  onAdd,
}: {
  nextIndex: number;
  onAdd: (section: ExtraSection) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-5">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.22em] uppercase border border-dashed border-zinc-700 px-4 py-2 text-zinc-400 hover:border-[#cc2a2a] hover:text-white"
        >
          <Plus size={12} /> Add section
        </button>
      ) : (
        <div className="border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-3">
            Choose a template
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(SECTION_TEMPLATES) as ExtraSectionKind[]).map((k) => (
              <button
                key={k}
                onClick={() => { onAdd(seedSection(k, nextIndex)); setOpen(false); }}
                className="text-left border border-zinc-800 bg-zinc-900/40 hover:border-[#cc2a2a] hover:bg-zinc-900/60 p-3 transition-colors"
              >
                <div className="text-xs font-semibold text-zinc-100 mb-1">
                  {SECTION_TEMPLATES[k].label}
                </div>
                <div className="text-[10px] leading-relaxed text-zinc-500">
                  {SECTION_TEMPLATES[k].description}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="mt-3 text-[10px] tracking-[0.22em] uppercase text-zinc-500 hover:text-zinc-200"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function ExtraSectionEditor({
  section,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
  onChange,
}: {
  section: ExtraSection;
  index: number;
  total: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  onChange: (patch: Partial<ExtraSection>) => void;
}) {
  const templateLabel = SECTION_TEMPLATES[section.kind]?.label ?? section.kind;
  return (
    <div className="border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">
          Extra section #{index + 1} · <span className="text-[#d4a24a]">{templateLabel}</span> · ({index + 1}/{total})
        </div>
        <ItemControls onUp={onMoveUp} onDown={onMoveDown} onDelete={onDelete} />
      </div>
      <Grid>
        <Field label="Kicker (top label)" value={section.kicker} onChange={(v) => onChange({ kicker: v })} />
        <Field label="Section title" value={section.title} onChange={(v) => onChange({ title: v })} />
      </Grid>

      {section.kind === "prose" && (
        <div className="mt-3">
          <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-2">Paragraphs</div>
          <StringList
            items={section.paragraphs ?? []}
            onChange={(next) => onChange({ paragraphs: next })}
            placeholder="Paragraph…"
            multiline
          />
        </div>
      )}

      {section.kind === "timeline" && (
        <ExtraTimelineEditor
          events={section.events ?? []}
          onChange={(next) => onChange({ events: next })}
        />
      )}

      {section.kind === "tactics" && (
        <ExtraTacticsEditor
          tactics={section.tactics ?? []}
          onChange={(next) => onChange({ tactics: next })}
        />
      )}

      {section.kind === "engine" && (
        <ExtraEngineEditor
          steps={section.engine ?? []}
          onChange={(next) => onChange({ engine: next })}
        />
      )}
    </div>
  );
}

function ExtraTimelineEditor({
  events,
  onChange,
}: {
  events: NonNullable<ExtraSection["events"]>;
  onChange: (next: NonNullable<ExtraSection["events"]>) => void;
}) {
  const set = (mut: (arr: NonNullable<ExtraSection["events"]>) => void) => {
    const n = JSON.parse(JSON.stringify(events)) as NonNullable<ExtraSection["events"]>;
    mut(n);
    onChange(n);
  };
  return (
    <div className="mt-3 space-y-3">
      {events.map((ev, i) => (
        <div key={i} className="border border-zinc-900 bg-zinc-950/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Event #{i + 1}</div>
            <ItemControls
              onUp={i > 0 ? () => set((a) => { [a[i - 1], a[i]] = [a[i], a[i - 1]]; }) : undefined}
              onDown={i < events.length - 1 ? () => set((a) => { [a[i + 1], a[i]] = [a[i], a[i + 1]]; }) : undefined}
              onDelete={() => set((a) => { a.splice(i, 1); })}
            />
          </div>
          <Grid>
            <Field label="Year" value={ev.year} onChange={(v) => set((a) => { a[i].year = v; })} />
            <Field label="Place" value={ev.place} onChange={(v) => set((a) => { a[i].place = v; })} />
          </Grid>
          <Field label="Title" value={ev.title} onChange={(v) => set((a) => { a[i].title = v; })} />
          <Field label="Body" multiline value={ev.body} onChange={(v) => set((a) => { a[i].body = v; })} />
          <Field label="Detail (opposite card)" multiline value={ev.detail ?? ""} onChange={(v) => set((a) => { a[i].detail = v; })} />
          <label className="block mt-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.28em] uppercase text-zinc-500 mb-1">
              <ImageIcon size={11} /> Background image URL
            </span>
            <input
              value={ev.imageUrl ?? ""}
              onChange={(e) => set((a) => { a[i].imageUrl = e.target.value; })}
              placeholder="https://…"
              className="w-full bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-300 font-mono focus:outline-none focus:border-[#cc2a2a]"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-zinc-400 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ev.key}
              onChange={(e) => set((a) => { a[i].key = e.target.checked; })}
              className="accent-[#d4a24a]"
            />
            <Star size={12} className={ev.key ? "text-[#d4a24a]" : "text-zinc-600"} />
            Mark as key event
          </label>
        </div>
      ))}
      <button
        onClick={() => set((a) => { a.push({ year: "", title: "", place: "", key: false, body: "", detail: "", links: [], imageUrl: "" }); })}
        className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-zinc-500 hover:text-zinc-200"
      >
        <Plus size={12} /> Add event
      </button>
    </div>
  );
}

function ExtraTacticsEditor({
  tactics,
  onChange,
}: {
  tactics: NonNullable<ExtraSection["tactics"]>;
  onChange: (next: NonNullable<ExtraSection["tactics"]>) => void;
}) {
  const set = (mut: (arr: NonNullable<ExtraSection["tactics"]>) => void) => {
    const n = JSON.parse(JSON.stringify(tactics)) as NonNullable<ExtraSection["tactics"]>;
    mut(n);
    onChange(n);
  };
  return (
    <div className="mt-3 space-y-3">
      {tactics.map((t, i) => (
        <div key={i} className="border border-zinc-900 bg-zinc-950/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Tactic #{i + 1}</div>
            <ItemControls
              onUp={i > 0 ? () => set((a) => { [a[i - 1], a[i]] = [a[i], a[i - 1]]; }) : undefined}
              onDown={i < tactics.length - 1 ? () => set((a) => { [a[i + 1], a[i]] = [a[i], a[i + 1]]; }) : undefined}
              onDelete={() => set((a) => { a.splice(i, 1); })}
            />
          </div>
          <Field label="Name" value={t.name} onChange={(v) => set((a) => { a[i].name = v; })} />
          <Field label="Description" multiline value={t.use} onChange={(v) => set((a) => { a[i].use = v; })} />
          <label className="block mt-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.28em] uppercase text-zinc-500 mb-1">
              Axis
            </span>
            <select
              value={t.axis ?? ""}
              onChange={(e) => set((a) => {
                const v = e.target.value;
                if (!v) delete (a[i] as { axis?: string }).axis;
                else a[i].axis = v as TacticAxis;
              })}
              className="w-full bg-zinc-900/70 border border-zinc-800 text-sm px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-[#cc2a2a]"
            >
              <option value="">— no axis —</option>
              <option value="identity">Identity</option>
              <option value="demographic">Demographic</option>
              <option value="cultural">Cultural</option>
              <option value="capital">Capital</option>
              <option value="institutional">Institutional</option>
              <option value="technological">Technological</option>
            </select>
          </label>
        </div>
      ))}
      <button
        onClick={() => set((a) => { a.push({ name: "", use: "" }); })}
        className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-zinc-500 hover:text-zinc-200"
      >
        <Plus size={12} /> Add tactic
      </button>
    </div>
  );
}

function ExtraEngineEditor({
  steps,
  onChange,
}: {
  steps: NonNullable<ExtraSection["engine"]>;
  onChange: (next: NonNullable<ExtraSection["engine"]>) => void;
}) {
  const set = (mut: (arr: NonNullable<ExtraSection["engine"]>) => void) => {
    const n = JSON.parse(JSON.stringify(steps)) as NonNullable<ExtraSection["engine"]>;
    mut(n);
    onChange(n);
  };
  return (
    <div className="mt-3 space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="border border-zinc-900 bg-zinc-950/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Step #{i + 1}</div>
            <ItemControls
              onUp={i > 0 ? () => set((a) => { [a[i - 1], a[i]] = [a[i], a[i - 1]]; }) : undefined}
              onDown={i < steps.length - 1 ? () => set((a) => { [a[i + 1], a[i]] = [a[i], a[i + 1]]; }) : undefined}
              onDelete={() => set((a) => { a.splice(i, 1); })}
            />
          </div>
          <Grid>
            <Field label="Step label" value={s.step} onChange={(v) => set((a) => { a[i].step = v; })} />
            <Field label="Title" value={s.title} onChange={(v) => set((a) => { a[i].title = v; })} />
          </Grid>
          <Field label="Body" multiline value={s.body} onChange={(v) => set((a) => { a[i].body = v; })} />
        </div>
      ))}
      <button
        onClick={() => set((a) => { a.push({ step: "", title: "", body: "" }); })}
        className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-zinc-500 hover:text-zinc-200"
      >
        <Plus size={12} /> Add step
      </button>
    </div>
  );
}

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

// ─── Default export: generic by-slug editor used at /admin/timeline/:slug ────

import { useParams } from "wouter";

export default function AdminTimelineEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return null;
  return (
    <AdminTimelineEditor
      slug={slug}
      viewPath={`/timeline/${slug}`}
      allowDelete={true}
    />
  );
}
