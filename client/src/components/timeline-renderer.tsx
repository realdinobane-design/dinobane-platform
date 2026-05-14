import { useEffect, useMemo, useState } from "react";

/* =========================================================
   TIMELINE RENDERER (v2) — shared across every timeline page.
   ---------------------------------------------------------
   v2 changes:
     - Optional `acts` group the timeline into chapters with
       their own kicker/title/lede dividers and accent colour.
     - Events carry an optional `act` id; events without one
       still render in a single un-chaptered run (backwards
       compatible with admin-authored timelines that don't
       know about Acts yet).
     - New `pullQuote` field renders an inline primary-source
       block beneath the body.
     - Long-form `detail` prose is now behind a collapsible
       "Read the dossier" toggle, so cards scan first.
     - Brighter card surfaces; per-Act accent palette adds a
       cool steel-blue and a cold-white alongside the
       existing gold + red.
   ========================================================= */

export type TimelineLink = { label: string; url: string };

export type TimelinePullQuote = {
  text: string;
  attribution: string;
};

export type TimelineEvent = {
  year: string;
  title: string;
  place: string;
  key: boolean;
  body: string;
  /** Optional chapter id — must match one of `TimelineData.acts[].id`. */
  act?: string;
  /**
   * Optional long-form prose that renders inside a collapsible
   * "Read the dossier" panel beneath the card. Leave empty to skip.
   */
  detail?: string;
  /** Optional primary-source pull-quote rendered beneath the body. */
  pullQuote?: TimelinePullQuote;
  links: TimelineLink[];
  imageUrl?: string;
};

/**
 * Axes group tactics into families so the reader can skim by category. Each
 * axis gets a distinct tint on the card's accent bar and kicker. Unknown or
 * missing values fall back to neutral muted gold.
 */
export type TacticAxis =
  | "identity"
  | "demographic"
  | "cultural"
  | "capital"
  | "institutional"
  | "technological";

/**
 * Extra, admin-authored sections appended after the default layout. Each
 * section picks one of the four existing templates (prose, timeline, tactics,
 * engine) and carries its own kicker + title so the dossier voice is kept.
 */
export type ExtraSectionKind = "prose" | "timeline" | "tactics" | "engine";

export type ExtraSection = {
  kind: ExtraSectionKind;
  /** e.g. "Section V · Field Notes" */
  kicker: string;
  /** Large italic heading */
  title: string;
  /** Used when kind === "prose" */
  paragraphs?: string[];
  /** Used when kind === "timeline" */
  events?: TimelineEvent[];
  /** Used when kind === "tactics" */
  tactics?: { name: string; use: string; axis?: TacticAxis }[];
  /** Used when kind === "engine" */
  engine?: { step: string; title: string; body: string }[];
};

/** A chapter heading drawn between timeline events. */
export type TimelineAct = {
  /** machine id — referenced by `TimelineEvent.act` */
  id: string;
  /** short tag e.g. "Act I" */
  label: string;
  /** the kicker text above the title, e.g. "Act I · Theory" */
  kicker: string;
  /** the headline, e.g. "The Blueprint Is Drawn" */
  title: string;
  /** date range as a separate eyebrow */
  years?: string;
  /** short lede paragraph below the headline */
  lede?: string;
};

export type TimelineData = {
  /** Bumped when default content meaningfully changes; used by the server
   *  to decide whether a saved DB override is stale. */
  contentVersion?: number;
  meta: {
    dossierCode: string;
    eyesOnly: string;
    fileTag: string;
    title: string;
    subtitle: string;
    byline: string;
    heroImageUrl?: string;
  };
  thesis: string[];
  /** Optional chapter dividers. When present, timeline events are grouped by
   *  their `act` id under the matching chapter heading. */
  acts?: TimelineAct[];
  timeline: TimelineEvent[];
  tactics: { name: string; use: string; axis?: TacticAxis }[];
  engine: { step: string; title: string; body: string }[];
  closing: string[];
  /** Optional admin-added sections appended after the default closing. */
  extraSections?: ExtraSection[];
};

export function TimelineRenderer({ data }: { data: TimelineData }) {
  const D = data;

  // Inject Google Fonts once.
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

  // Scroll-reveal for timeline cards and act dividers.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("lm-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "-60px 0px", threshold: 0.12 },
    );
    document
      .querySelectorAll(".lm-event, .lm-act-divider")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [D]);

  // Split title so last word is red.
  const parts = D.meta.title.trim().split(/\s+/);
  const titleMain = parts.length > 1 ? parts.slice(0, -1).join(" ") : D.meta.title;
  const titleAccent = parts.length > 1 ? parts[parts.length - 1] : "";

  // Group events under acts when acts are defined. Events whose `act` doesn't
  // match any defined Act get bucketed under a synthetic trailing chapter so
  // nothing is silently dropped.
  const groupedTimeline = useMemo<Array<{ act: TimelineAct | null; events: TimelineEvent[] }>>(() => {
    if (!D.acts || D.acts.length === 0) {
      return [{ act: null, events: D.timeline }];
    }
    const byId = new Map<string, TimelineEvent[]>();
    D.acts.forEach((a) => byId.set(a.id, []));
    const orphans: TimelineEvent[] = [];
    D.timeline.forEach((e) => {
      if (e.act && byId.has(e.act)) byId.get(e.act)!.push(e);
      else orphans.push(e);
    });
    const groups: Array<{ act: TimelineAct | null; events: TimelineEvent[] }> = D.acts
      .map((a) => ({ act: a as TimelineAct | null, events: byId.get(a.id) || [] }))
      .filter((g) => g.events.length > 0);
    if (orphans.length > 0) groups.push({ act: null, events: orphans });
    return groups;
  }, [D.acts, D.timeline]);

  // Card variety: a couple of key events per page get the "hero" layout
  // (full-width card) so the chronology doesn't read as one long ledger.
  // We promote the first key event in each Act, capped at one per Act.
  const heroEvents = useMemo(() => {
    const set = new WeakSet<TimelineEvent>();
    if (!D.acts) return set;
    D.acts.forEach((a) => {
      const first = D.timeline.find((e) => e.act === a.id && e.key);
      if (first) set.add(first);
    });
    return set;
  }, [D.acts, D.timeline]);

  return (
    <>
      <style>{CSS}</style>
      <div className="lm-wrap">
        <div className="lm-dossier">
          <span className="lm-tag">{D.meta.dossierCode}</span>
          <span className="lm-stamp">{D.meta.eyesOnly}</span>
          <span>{D.meta.fileTag}</span>
        </div>

        <header
          className={`lm-hero${D.meta.heroImageUrl ? " lm-hero-has-bg" : ""}`}
          style={
            D.meta.heroImageUrl
              ? ({ ["--lm-hero-img" as unknown as string]: `url("${D.meta.heroImageUrl}")` } as React.CSSProperties)
              : undefined
          }
        >
          {D.meta.heroImageUrl && <div className="lm-hero-bg" aria-hidden />}
          <div className="lm-hero-inner">
            <div className="lm-eyebrow">A DinoBane Intel Timeline</div>
            <h1>
              {titleMain}
              {titleAccent && <> <span className="lm-amp">{titleAccent}</span></>}
            </h1>
            <p className="lm-sub">{D.meta.subtitle}</p>
            <div className="lm-byline">{D.meta.byline}</div>
            <div className="lm-rule" />
          </div>
        </header>

        <section className="lm-thesis">
          {D.thesis.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <SectionHead kicker="Section I · Chronology" title="The Drift Leftward" />
        <section className="lm-timeline-host">
          {groupedTimeline.map((group, gi) => (
            <ActBlock
              key={group.act?.id ?? `orphans-${gi}`}
              act={group.act}
              events={group.events}
              heroEvents={heroEvents}
            />
          ))}
        </section>

        <SectionHead kicker="Section II · Tactics Matrix" title="Angels' Faces" />
        <div className="lm-tactics-wrap">
          <section className="lm-tactics">
            {D.tactics.map((t, i) => {
              const axisKey = (t.axis ?? "").trim().toLowerCase() as TacticAxis;
              const axisLabel = axisKey ? AXIS_LABELS[axisKey] ?? "" : "";
              return (
                <div
                  className={`lm-tactic${axisKey ? ` lm-axis-${axisKey}` : ""}`}
                  key={i}
                >
                  <span className="lm-tactic-bar" aria-hidden />
                  <div className="lm-tactic-head">
                    <div className="lm-num">TACTIC · {String(i + 1).padStart(2, "0")}</div>
                    {axisLabel && <div className="lm-axis">{axisLabel}</div>}
                  </div>
                  <h4>{t.name}</h4>
                  <p>{t.use}</p>
                </div>
              );
            })}
          </section>
        </div>

        <SectionHead kicker="Section III · The Machiavellian Engine" title="Action · Problem · Solution" />
        <div className="lm-engine-wrap">
          <section className="lm-engine">
            {D.engine.map((s, i) => (
              <div className="lm-step" key={i}>
                <div className="lm-step-num">{s.step}</div>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </div>
            ))}
          </section>
        </div>

        <SectionHead kicker="Section IV · In Closing" title="The Blueprint" />
        <section className="lm-closing">
          {D.closing.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        {D.extraSections && D.extraSections.length > 0 && (
          <>
            {D.extraSections.map((s, i) => (
              <ExtraSectionBlock key={i} section={s} />
            ))}
          </>
        )}

        <footer className="lm-footer">
          <span>DinoBane Intel · <span className="lm-mark">//</span> {D.meta.title} Dossier</span>
          <span>{(D.meta.fileTag.match(/v[\d.]+/) || ["v1.0"])[0]}</span>
          <span><span className="lm-mark">//</span> dinobane.com</span>
        </footer>
      </div>
    </>
  );
}

const AXIS_LABELS: Record<TacticAxis, string> = {
  identity: "Axis · Identity",
  demographic: "Axis · Demographic",
  cultural: "Axis · Cultural",
  capital: "Axis · Capital",
  institutional: "Axis · Institutional",
  technological: "Axis · Technological",
};

/** Maps Act id → CSS modifier class. Anything outside this set falls back
 *  to neutral. Keep this in sync with the `.lm-act-*` selectors below. */
const ACT_THEME: Record<string, string> = {
  "theory": "lm-act-theory",
  "strategy": "lm-act-strategy",
  "cultural-capture": "lm-act-cultural",
  "total-capture": "lm-act-total",
};

function ActBlock({
  act,
  events,
  heroEvents,
}: {
  act: TimelineAct | null;
  events: TimelineEvent[];
  heroEvents: WeakSet<TimelineEvent>;
}) {
  const theme = act ? ACT_THEME[act.id] ?? "" : "";
  return (
    <div className={`lm-act ${theme}`}>
      {act && (
        <div className="lm-act-divider">
          <div className="lm-act-rail" aria-hidden>
            <span className="lm-act-rail-dot" />
            <span className="lm-act-rail-line" />
          </div>
          <div className="lm-act-head">
            <div className="lm-act-label">{act.label}</div>
            <div className="lm-act-kicker">{act.kicker.replace(/^Act\s+[IVX]+\s*·\s*/i, "")}</div>
            <h2 className="lm-act-title">{act.title}</h2>
            {act.years && <div className="lm-act-years">{act.years}</div>}
            {act.lede && <p className="lm-act-lede">{act.lede}</p>}
          </div>
        </div>
      )}
      <section className="lm-timeline">
        {events.map((e, i) => (
          <EventRow
            key={`${e.year}-${e.title}-${i}`}
            ev={e}
            hero={heroEvents.has(e)}
          />
        ))}
      </section>
    </div>
  );
}

function EventRow({ ev, hero }: { ev: TimelineEvent; hero?: boolean }) {
  const [open, setOpen] = useState(false);
  const hasDetail = !!(ev.detail && ev.detail.trim());
  const hasQuote = !!(ev.pullQuote && ev.pullQuote.text);

  return (
    <article
      className={[
        "lm-event",
        ev.key ? "lm-key" : "",
        hero ? "lm-hero-card" : "",
        hasQuote ? "lm-has-quote" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="lm-node" aria-hidden />
      <div
        className={`lm-card${ev.imageUrl ? " lm-card-has-bg" : ""}`}
        style={
          ev.imageUrl
            ? ({ ["--lm-bg-img" as unknown as string]: `url("${ev.imageUrl}")` } as React.CSSProperties)
            : undefined
        }
      >
        {ev.imageUrl && <div className="lm-card-bg" aria-hidden />}
        <div className="lm-card-inner">
          {ev.key && <span className="lm-key-tag">Key Event</span>}
          <span className="lm-year">{ev.year}</span>
          {ev.place && <div className="lm-place">{ev.place}</div>}
          <h3>{ev.title}</h3>
          <p>{ev.body}</p>
          {hasQuote && (
            <blockquote className="lm-quote">
              <span className="lm-quote-mark" aria-hidden>“</span>
              <p>{ev.pullQuote!.text}</p>
              <cite>— {ev.pullQuote!.attribution}</cite>
            </blockquote>
          )}
          {ev.links?.length > 0 && (
            <div className="lm-links">
              {ev.links.map((l, j) => (
                <a key={j} href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              ))}
            </div>
          )}
          {hasDetail && (
            <button
              type="button"
              className={`lm-toggle${open ? " lm-toggle-open" : ""}`}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="lm-toggle-chev" aria-hidden>▾</span>
              {open ? "Close the dossier" : "Read the dossier"}
            </button>
          )}
          {hasDetail && open && (
            <div className="lm-detail-pane" role="region" aria-label={`${ev.title} — dossier`}>
              {ev.detail!.split(/\n+/).map((para, k) => (
                <p key={k}>{para}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ExtraSectionBlock({ section }: { section: ExtraSection }) {
  const kicker = section.kicker?.trim() || "";
  const title = section.title?.trim() || "";

  switch (section.kind) {
    case "prose": {
      const paras = (section.paragraphs ?? []).filter((p) => p.trim());
      if (!paras.length) return null;
      return (
        <>
          <SectionHead kicker={kicker} title={title} />
          <section className="lm-closing">
            {paras.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        </>
      );
    }
    case "timeline": {
      const events = (section.events ?? []).filter((e) => e.title || e.body);
      if (!events.length) return null;
      return (
        <>
          <SectionHead kicker={kicker} title={title} />
          <section className="lm-timeline">
            {events.map((e, i) => (
              <EventRow key={i} ev={e} />
            ))}
          </section>
        </>
      );
    }
    case "tactics": {
      const list = (section.tactics ?? []).filter((t) => t.name || t.use);
      if (!list.length) return null;
      return (
        <>
          <SectionHead kicker={kicker} title={title} />
          <div className="lm-tactics-wrap">
            <section className="lm-tactics">
              {list.map((t, i) => {
                const axisKey = (t.axis ?? "").trim().toLowerCase() as TacticAxis;
                const axisLabel = axisKey ? AXIS_LABELS[axisKey] ?? "" : "";
                return (
                  <div className={`lm-tactic${axisKey ? ` lm-axis-${axisKey}` : ""}`} key={i}>
                    <span className="lm-tactic-bar" aria-hidden />
                    <div className="lm-tactic-head">
                      <div className="lm-num">TACTIC · {String(i + 1).padStart(2, "0")}</div>
                      {axisLabel && <div className="lm-axis">{axisLabel}</div>}
                    </div>
                    <h4>{t.name}</h4>
                    <p>{t.use}</p>
                  </div>
                );
              })}
            </section>
          </div>
        </>
      );
    }
    case "engine": {
      const steps = (section.engine ?? []).filter((s) => s.title || s.body);
      if (!steps.length) return null;
      return (
        <>
          <SectionHead kicker={kicker} title={title} />
          <div className="lm-engine-wrap">
            <section
              className="lm-engine"
              style={{ gridTemplateColumns: `repeat(${Math.min(steps.length, 4)}, 1fr)` }}
            >
              {steps.map((s, i) => (
                <div className="lm-step" key={i}>
                  <div className="lm-step-num">{s.step || `Step ${i + 1}`}</div>
                  <h4>{s.title}</h4>
                  <p>{s.body}</p>
                </div>
              ))}
            </section>
          </div>
        </>
      );
    }
    default:
      return null;
  }
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="lm-section-head">
      <div className="lm-kicker">{kicker}</div>
      <h2>{title}</h2>
      <div className="lm-under" />
    </div>
  );
}

/* =========================================================
   SCOPED STYLES — prefixed "lm-" so they don't touch the
   rest of the app's Tailwind styling.

   v2 palette
     --lm-ink:    primary text (lifted from #e9e3d7 → #efe8d9)
     --lm-ink-2:  secondary text on cards (used instead of --lm-dim)
     --lm-dim:    eyebrows / muted captions
     --lm-red:    Act III · Cultural Capture accent
     --lm-gold:   Act II · Strategy accent (also "key event" glow)
     --lm-steel:  Act I · Theory accent  (NEW — cool blue-grey)
     --lm-white:  Act IV · Total Capture accent (NEW — cold ivory)
   ========================================================= */
const CSS = `
.lm-wrap{
  --lm-bg:#0a0a0a; --lm-bg-2:#100d0a; --lm-bg-3:#15110d;
  --lm-ink:#efe8d9; --lm-ink-2:#c9bfae; --lm-dim:#9b9080; --lm-mute:#6f6558;
  --lm-red:#cc2a2a; --lm-red-deep:#8a1616; --lm-red-glow:rgba(204,42,42,.35);
  --lm-gold:#d4a24a; --lm-gold-soft:#b8893b;
  --lm-steel:#6f97b6; --lm-steel-deep:#4d7290;
  --lm-white:#ece5d1; --lm-white-soft:#bdb6a4;
  --lm-line:#2a2420; --lm-line-2:#3a322a;
  --lm-act:#cc2a2a; /* default chapter accent, overridden per Act */
  --lm-act-soft:rgba(204,42,42,.30);
  --lm-serif:"Cormorant Garamond", Georgia, serif;
  --lm-mono:"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  max-width:1100px; margin:0 auto; padding:0 28px;
  color:var(--lm-ink); font-weight:300; font-size:17px; line-height:1.65;
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(204,42,42,.10), transparent 70%),
    radial-gradient(900px 500px at 50% 110%, rgba(212,162,74,.05), transparent 70%),
    var(--lm-bg);
  position:relative;
}
.lm-wrap *{box-sizing:border-box}

.lm-dossier{
  border-bottom:1px solid var(--lm-line);
  padding:18px 0 14px;
  font-family:var(--lm-mono); font-size:12px; letter-spacing:.22em;
  text-transform:uppercase; color:var(--lm-dim);
  display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;
}
.lm-tag{color:var(--lm-red); letter-spacing:.28em}
.lm-stamp{
  color:var(--lm-gold); border:1px solid var(--lm-gold-soft);
  padding:4px 10px; transform:rotate(-1.2deg);
  background:rgba(212,162,74,.04);
}

.lm-hero{padding:72px 0 48px; text-align:center; position:relative; overflow:hidden}
.lm-hero-inner{position:relative; z-index:1}
.lm-hero-has-bg{
  padding:96px 0 72px;
  border:1px solid var(--lm-line);
  margin-top:18px;
}
.lm-hero-bg{
  position:absolute; inset:0; pointer-events:none; z-index:0;
  background-image:var(--lm-hero-img); background-size:cover; background-position:center;
  filter:grayscale(.35) contrast(1.08) brightness(.55);
  opacity:.44;
}
.lm-hero-has-bg::after{
  content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
  background:
    radial-gradient(ellipse at center, rgba(10,10,10,.45) 0%, rgba(10,10,10,.85) 70%, rgba(10,10,10,.96) 100%),
    linear-gradient(180deg, rgba(10,10,10,.70), rgba(10,10,10,.92));
}
.lm-hero-has-bg h1{text-shadow:0 2px 20px rgba(0,0,0,.85), 0 0 40px rgba(204,42,42,.2)}
.lm-hero-has-bg .lm-sub{color:var(--lm-ink); text-shadow:0 1px 8px rgba(0,0,0,.85)}
.lm-eyebrow{
  font-family:var(--lm-mono); text-transform:uppercase; letter-spacing:.4em;
  font-size:11px; color:var(--lm-red); margin-bottom:18px;
}
.lm-hero h1{
  font-family:var(--lm-serif); font-weight:700; font-style:italic;
  font-size:clamp(54px, 9vw, 108px); line-height:.95; margin:0 0 12px;
  color:var(--lm-ink); text-shadow:0 0 40px rgba(204,42,42,.15);
}
.lm-amp{color:var(--lm-red); font-style:normal}
.lm-sub{
  font-family:var(--lm-serif); font-style:italic;
  font-size:clamp(18px, 2.2vw, 24px); color:var(--lm-ink-2);
  max-width:680px; margin:0 auto 22px;
}
.lm-byline{
  font-family:var(--lm-mono); font-size:11px; letter-spacing:.3em;
  text-transform:uppercase; color:var(--lm-mute);
}
.lm-rule{width:80px; height:2px; background:var(--lm-red); margin:30px auto 0; box-shadow:0 0 24px var(--lm-red-glow)}

.lm-thesis{
  max-width:780px; margin:24px auto 60px;
  padding:36px 40px; border:1px solid var(--lm-line);
  background:linear-gradient(180deg, rgba(255,255,255,.025), transparent 60%);
  position:relative;
}
.lm-thesis::before, .lm-thesis::after{
  content:""; position:absolute; width:22px; height:22px;
  border:1px solid var(--lm-red); opacity:.8;
}
.lm-thesis::before{top:-1px; left:-1px; border-right:none; border-bottom:none}
.lm-thesis::after{bottom:-1px; right:-1px; border-left:none; border-top:none}
.lm-thesis p{font-family:var(--lm-serif); font-size:20px; line-height:1.55; color:var(--lm-ink); margin:0 0 16px}
.lm-thesis p:last-child{margin-bottom:0; color:var(--lm-ink-2); font-style:italic}

.lm-section-head{text-align:center; margin:80px 0 36px}
.lm-kicker{font-family:var(--lm-mono); font-size:11px; letter-spacing:.4em; text-transform:uppercase; color:var(--lm-red); margin-bottom:10px}
.lm-section-head h2{font-family:var(--lm-serif); font-style:italic; font-weight:600; font-size:clamp(36px, 5vw, 58px); color:var(--lm-ink); margin:0; line-height:1}
.lm-under{width:50px; height:1px; background:var(--lm-mute); margin:18px auto 0}

/* ─────────── TIMELINE WRAPPER (single spine across all Acts) ─────────── */
.lm-timeline-host{
  position:relative; padding:0;
}
.lm-timeline-host::before{
  /* one continuous spine running through every Act */
  content:""; position:absolute; left:50%; top:0; bottom:0;
  width:1px; background:linear-gradient(180deg, transparent, var(--lm-line) 4%, var(--lm-line) 96%, transparent);
  transform:translateX(-.5px);
}
.lm-timeline-host::after{
  content:""; position:absolute; left:50%; top:0; width:3px; height:40px;
  transform:translateX(-1.5px);
  background:linear-gradient(180deg, transparent, var(--lm-red), transparent);
  opacity:.55; animation:lm-scan 14s linear infinite;
  box-shadow:0 0 14px var(--lm-red-glow); pointer-events:none;
}
@keyframes lm-scan{0%{top:-2%} 100%{top:102%}}

.lm-act{position:relative; padding:0}

/* ─────────── ACT DIVIDER ─────────── */
.lm-act-divider{
  position:relative; padding:48px 0 32px;
  text-align:center; max-width:760px; margin:0 auto;
  opacity:0; transform:translateY(20px);
  transition:opacity .8s ease, transform .8s ease;
}
.lm-act-divider.lm-in{opacity:1; transform:none}
.lm-act-rail{
  position:absolute; left:50%; top:0; bottom:auto; height:44px;
  transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center; pointer-events:none;
}
.lm-act-rail-line{
  width:1px; flex:1; background:linear-gradient(180deg, transparent, var(--lm-act));
  opacity:.55;
}
.lm-act-rail-dot{
  width:11px; height:11px; border-radius:50%;
  background:var(--lm-bg); border:1.5px solid var(--lm-act);
  box-shadow:0 0 0 4px rgba(10,10,10,.6), 0 0 18px var(--lm-act-soft);
  margin-bottom:6px;
}
.lm-act-head{position:relative}
.lm-act-label{
  font-family:var(--lm-mono); font-size:10.5px; letter-spacing:.42em;
  text-transform:uppercase; color:var(--lm-act); opacity:.95;
  margin-bottom:10px;
}
.lm-act-kicker{
  font-family:var(--lm-mono); font-size:11px; letter-spacing:.32em;
  text-transform:uppercase; color:var(--lm-ink-2); margin-bottom:14px;
}
.lm-act-title{
  font-family:var(--lm-serif); font-style:italic; font-weight:600;
  font-size:clamp(34px, 4.8vw, 50px); line-height:1.05;
  color:var(--lm-ink); margin:0 0 12px;
}
.lm-act-years{
  font-family:var(--lm-mono); font-size:11px; letter-spacing:.32em;
  text-transform:uppercase; color:var(--lm-mute); margin-bottom:16px;
}
.lm-act-lede{
  font-family:var(--lm-serif); font-style:italic;
  font-size:18px; line-height:1.6; color:var(--lm-ink-2);
  max-width:600px; margin:0 auto;
}

/* Per-Act accent — sets --lm-act so dividers, key-event glow,
   card hover and toggle button all theme together. */
.lm-act-theory   {--lm-act:var(--lm-steel); --lm-act-soft:rgba(111,151,182,.30); --lm-act-tint:rgba(111,151,182,.05)}
.lm-act-strategy {--lm-act:var(--lm-gold);  --lm-act-soft:rgba(212,162,74,.30); --lm-act-tint:rgba(212,162,74,.06)}
.lm-act-cultural {--lm-act:var(--lm-red);   --lm-act-soft:rgba(204,42,42,.30); --lm-act-tint:rgba(204,42,42,.05)}
.lm-act-total    {--lm-act:var(--lm-white); --lm-act-soft:rgba(236,229,209,.22); --lm-act-tint:rgba(236,229,209,.04)}

/* ─────────── TIMELINE ROW ─────────── */
.lm-timeline{position:relative; padding:8px 0 32px}

.lm-event{
  position:relative; width:100%; padding:18px 0;
  display:grid; grid-template-columns:1fr 1fr; column-gap:48px; align-items:start;
  opacity:0; transform:translateY(18px);
  transition:opacity .7s ease, transform .7s ease;
}
.lm-event.lm-in{opacity:1; transform:none}
.lm-event:nth-child(odd)  .lm-card{grid-column:1; grid-row:1; text-align:right}
.lm-event:nth-child(even) .lm-card{grid-column:2; grid-row:1; text-align:left}

/* Hero cards span both columns so they read as section beats inside an Act */
.lm-event.lm-hero-card{grid-template-columns:1fr; column-gap:0}
.lm-event.lm-hero-card .lm-card{grid-column:1; text-align:left; max-width:760px; margin:0 auto}

.lm-node{position:absolute; top:46px; left:50%; width:14px; height:14px; background:var(--lm-bg); border:1.5px solid var(--lm-mute); border-radius:50%; transform:translate(-50%, -50%); z-index:2}
.lm-event.lm-hero-card .lm-node{top:42px}
.lm-event.lm-key .lm-node{
  border-color:var(--lm-act); background:var(--lm-act);
  box-shadow:0 0 0 4px rgba(10,10,10,.6), 0 0 18px var(--lm-act-soft);
}
.lm-event.lm-key .lm-card{
  border-color:var(--lm-act-soft);
  box-shadow:0 0 0 1px rgba(255,255,255,.02) inset, 0 0 40px var(--lm-act-tint, rgba(204,42,42,.06));
}
.lm-event.lm-key .lm-year{color:var(--lm-act)}
.lm-event.lm-key .lm-key-tag{
  display:inline-block; font-family:var(--lm-mono); font-size:10px;
  letter-spacing:.3em; text-transform:uppercase; color:var(--lm-act);
  border:1px solid var(--lm-act); padding:2px 8px; margin-bottom:10px;
  opacity:.95;
}

.lm-card{
  background:
    linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.005) 60%, rgba(0,0,0,.15)),
    var(--lm-bg-2);
  border:1px solid var(--lm-line-2); padding:24px 26px; position:relative; overflow:hidden;
  transition:transform .3s ease, border-color .3s ease, box-shadow .3s ease, background .3s ease;
}
.lm-card:hover{
  transform:translateY(-2px);
  border-color:var(--lm-act);
  box-shadow:0 10px 40px var(--lm-act-tint, rgba(204,42,42,.10));
  background:
    linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.01) 60%, rgba(0,0,0,.15)),
    var(--lm-bg-3);
}
.lm-card-bg{
  position:absolute; inset:0; pointer-events:none; z-index:0;
  background-image:var(--lm-bg-img); background-size:cover; background-position:center;
  opacity:.22; filter:grayscale(.45) contrast(1.05) brightness(.95);
  transition:opacity .3s ease;
}
.lm-card-has-bg::after{
  content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
  background:linear-gradient(180deg, rgba(10,10,10,.30), rgba(10,10,10,.75));
}
.lm-card:hover .lm-card-bg{opacity:.32}
.lm-card-inner{position:relative; z-index:1}
.lm-year{font-family:var(--lm-serif); font-style:italic; font-weight:700; font-size:30px; color:var(--lm-red); line-height:1; display:block; margin-bottom:4px}
.lm-place{font-family:var(--lm-mono); font-size:11px; letter-spacing:.24em; text-transform:uppercase; color:var(--lm-dim); margin-bottom:10px}
.lm-card h3{font-family:var(--lm-serif); font-weight:600; font-size:28px; line-height:1.15; margin:0 0 14px; color:var(--lm-ink)}
.lm-card p{margin:0 0 14px; color:var(--lm-ink); font-size:16px; line-height:1.65}

.lm-links{display:flex; gap:8px; flex-wrap:wrap; margin-top:8px}
.lm-event:nth-child(odd)  .lm-links{justify-content:flex-end}
.lm-event:nth-child(even) .lm-links{justify-content:flex-start}
.lm-event.lm-hero-card .lm-links{justify-content:flex-start}
.lm-links a{
  font-family:var(--lm-mono); font-size:10.5px; letter-spacing:.18em;
  text-transform:uppercase; color:var(--lm-ink-2); border:1px solid var(--lm-line-2);
  padding:6px 10px; text-decoration:none; transition:all .25s ease;
  display:inline-flex; align-items:center; gap:6px;
  background:rgba(10,10,10,.40);
}
.lm-links a::before{content:"▸"; color:var(--lm-act); font-size:9px}
.lm-links a:hover{color:var(--lm-ink); border-color:var(--lm-act); background:var(--lm-act-tint, rgba(204,42,42,.16))}

/* ─────────── PRIMARY-SOURCE PULL-QUOTE ─────────── */
.lm-quote{
  position:relative; margin:18px 0 16px; padding:14px 16px 12px 22px;
  border-left:2px solid var(--lm-act);
  background:linear-gradient(90deg, var(--lm-act-tint, rgba(204,42,42,.06)), transparent 80%);
}
.lm-event:nth-child(odd) .lm-quote{
  border-left:none; border-right:2px solid var(--lm-act);
  padding:14px 22px 12px 16px;
  background:linear-gradient(270deg, var(--lm-act-tint, rgba(204,42,42,.06)), transparent 80%);
  text-align:right;
}
.lm-quote-mark{
  position:absolute; top:-4px; left:8px;
  font-family:var(--lm-serif); font-style:italic; font-size:48px;
  line-height:1; color:var(--lm-act); opacity:.65;
}
.lm-event:nth-child(odd) .lm-quote-mark{left:auto; right:8px}
.lm-quote p{
  font-family:var(--lm-serif); font-style:italic; font-size:17px;
  line-height:1.55; color:var(--lm-ink); margin:0 0 6px;
}
.lm-quote cite{
  display:block; font-family:var(--lm-mono); font-style:normal;
  font-size:10.5px; letter-spacing:.20em; text-transform:uppercase;
  color:var(--lm-dim);
}

/* ─────────── "READ THE DOSSIER" TOGGLE & DETAIL PANE ─────────── */
.lm-toggle{
  display:inline-flex; align-items:center; gap:8px;
  margin-top:14px;
  font-family:var(--lm-mono); font-size:11px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--lm-act);
  background:transparent; border:1px solid var(--lm-act);
  padding:7px 14px; cursor:pointer;
  transition:background .25s ease, color .25s ease, border-color .25s ease;
}
.lm-toggle:hover{
  background:var(--lm-act); color:var(--lm-bg);
}
.lm-toggle-chev{
  display:inline-block; transition:transform .25s ease; font-size:9px;
}
.lm-toggle-open .lm-toggle-chev{transform:rotate(180deg)}
.lm-toggle-open{background:var(--lm-act); color:var(--lm-bg)}

.lm-detail-pane{
  margin-top:16px; padding:18px 20px 6px;
  border-top:1px dashed var(--lm-line-2);
  text-align:left;
}
.lm-event:nth-child(odd) .lm-detail-pane{text-align:right}
.lm-event.lm-hero-card .lm-detail-pane{text-align:left}
.lm-detail-pane p{
  font-family:var(--lm-serif); font-size:17px; line-height:1.72;
  color:var(--lm-ink-2); margin:0 0 14px;
}
.lm-detail-pane p:last-child{margin-bottom:0}
.lm-detail-pane p:first-of-type::first-letter{
  color:var(--lm-ink); font-weight:600;
}

/* Tactics section — gold-accented wrapper so it reads distinct from engine/closing */
.lm-tactics-wrap{
  position:relative; margin:10px 0 40px;
  padding:30px 24px 28px;
  border:1px solid rgba(212,162,74,.20);
  background:
    radial-gradient(900px 260px at 50% -10%, rgba(212,162,74,.06), transparent 70%),
    linear-gradient(180deg, rgba(212,162,74,.025), rgba(10,10,10,.30) 70%);
  overflow:hidden;
}
.lm-tactics-wrap::before{
  content:""; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, var(--lm-gold), transparent);
  opacity:.55;
}
.lm-tactics{
  display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));
  gap:14px;
}
.lm-tactic{
  --lm-axis-colour:var(--lm-gold-soft);
  background:linear-gradient(180deg, rgba(255,255,255,.025), rgba(0,0,0,.18));
  border:1px solid var(--lm-line-2); padding:22px 22px 24px;
  position:relative; overflow:hidden;
  transition:border-color .3s ease, transform .3s ease, background .3s ease;
}
.lm-tactic:hover{
  border-color:var(--lm-axis-colour);
  transform:translateY(-1px);
  background:linear-gradient(180deg, rgba(255,255,255,.035), rgba(0,0,0,.25));
}
.lm-tactic-bar{
  position:absolute; top:0; left:0; right:0; height:2px;
  background:var(--lm-axis-colour); opacity:.7;
}
.lm-tactic-head{
  display:flex; justify-content:space-between; align-items:baseline;
  gap:10px; margin-bottom:14px;
}
.lm-num{font-family:var(--lm-mono); font-size:10px; letter-spacing:.28em; color:var(--lm-red); margin:0}
.lm-axis{
  font-family:var(--lm-mono); font-size:9.5px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--lm-axis-colour);
  opacity:.95; white-space:nowrap;
}
.lm-tactic h4{
  font-family:var(--lm-serif); font-weight:600; font-size:22px;
  margin:0 0 12px; color:var(--lm-ink); line-height:1.2;
  letter-spacing:.005em;
}
.lm-tactic p{
  margin:0; color:var(--lm-ink-2); font-size:14.5px; line-height:1.65;
}
.lm-axis-identity       {--lm-axis-colour:#d4a24a}
.lm-axis-demographic    {--lm-axis-colour:#cc2a2a}
.lm-axis-cultural       {--lm-axis-colour:#c98a5a}
.lm-axis-capital        {--lm-axis-colour:#6fa28b}
.lm-axis-institutional  {--lm-axis-colour:#8a7db0}
.lm-axis-technological  {--lm-axis-colour:#7a9bc9}

/* Engine section — wrapped in a tinted panel so it reads visually distinct */
.lm-engine-wrap{
  position:relative; margin:10px 0 40px;
  padding:34px 28px 32px;
  border:1px solid rgba(204,42,42,.22);
  background:
    radial-gradient(900px 260px at 50% -10%, rgba(204,42,42,.08), transparent 70%),
    linear-gradient(180deg, rgba(204,42,42,.035), rgba(10,10,10,.35) 70%);
  overflow:hidden;
}
.lm-engine-wrap::before{
  content:""; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, var(--lm-red), transparent);
  opacity:.6;
}
.lm-engine-wrap::after{
  content:""; position:absolute; bottom:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg, transparent, var(--lm-red-deep), transparent);
  opacity:.45;
}
.lm-engine{display:grid; grid-template-columns:repeat(3, 1fr); gap:18px; position:relative}
.lm-step{
  background:linear-gradient(180deg, rgba(255,255,255,.025), rgba(0,0,0,.20));
  border:1px solid var(--lm-line-2); padding:30px 24px 26px; position:relative; text-align:center;
  overflow:hidden;
  transition:border-color .3s ease, transform .3s ease, background .3s ease;
}
.lm-step::before{
  content:""; position:absolute; top:0; left:0; right:0; height:2px;
  background:var(--lm-red); opacity:.7;
}
.lm-step:hover{
  border-color:var(--lm-red-deep); transform:translateY(-1px);
  background:linear-gradient(180deg, rgba(204,42,42,.06), rgba(0,0,0,.25));
}
.lm-step-num{
  font-family:var(--lm-mono); font-size:10px; letter-spacing:.35em; text-transform:uppercase;
  color:var(--lm-red); border:1px solid var(--lm-red-deep); padding:4px 12px;
  display:inline-block; margin-bottom:16px; background:var(--lm-bg);
}
.lm-step h4{font-family:var(--lm-serif); font-style:italic; font-weight:600; font-size:28px; margin:0 0 12px; color:var(--lm-ink)}
.lm-step p{margin:0; color:var(--lm-ink-2); font-size:15px; line-height:1.6}

.lm-closing{
  max-width:820px; margin:30px auto 20px; text-align:center; padding:44px 32px 40px;
  position:relative;
  border-top:1px solid var(--lm-line); border-bottom:1px solid var(--lm-line);
  background:
    radial-gradient(700px 240px at 50% 50%, rgba(212,162,74,.06), transparent 70%),
    linear-gradient(180deg, rgba(212,162,74,.02), transparent 70%);
}
.lm-closing::before, .lm-closing::after{
  content:""; position:absolute; top:50%; width:32px; height:1px;
  background:var(--lm-gold-soft); opacity:.6;
}
.lm-closing::before{left:-4px}
.lm-closing::after{right:-4px}
.lm-closing p{font-family:var(--lm-serif); font-style:italic; font-size:22px; line-height:1.55; color:var(--lm-ink); margin:0 0 16px}
.lm-closing p:last-child{color:var(--lm-red); margin-bottom:0}

.lm-footer{
  margin-top:60px; border-top:1px solid var(--lm-line); padding:28px 0 50px;
  font-family:var(--lm-mono); font-size:11px; letter-spacing:.24em; text-transform:uppercase;
  color:var(--lm-mute); display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;
}
.lm-mark{color:var(--lm-red)}

@media (max-width: 980px){
  .lm-wrap{font-size:16px}
  .lm-timeline-host::before{left:18px}
  .lm-timeline-host::after{left:18px}
  .lm-act-rail{left:18px; transform:none}
  .lm-event{
    grid-template-columns:1fr; column-gap:0; row-gap:14px;
    padding:14px 0 14px 42px; text-align:left;
  }
  .lm-event:nth-child(odd)  .lm-card,
  .lm-event:nth-child(even) .lm-card{
    grid-column:1; text-align:left; margin:0; max-width:none;
  }
  .lm-event.lm-hero-card{padding-left:42px}
  .lm-event.lm-hero-card .lm-card{max-width:none}
  .lm-event .lm-node{top:32px; left:11px; transform:none}
  .lm-event:nth-child(odd)  .lm-links,
  .lm-event:nth-child(even) .lm-links{justify-content:flex-start}
  .lm-event:nth-child(odd) .lm-quote{
    border-right:none; border-left:2px solid var(--lm-act);
    padding:14px 16px 12px 22px;
    background:linear-gradient(90deg, var(--lm-act-tint, rgba(204,42,42,.06)), transparent 80%);
    text-align:left;
  }
  .lm-event:nth-child(odd) .lm-quote-mark{left:8px; right:auto}
  .lm-event:nth-child(odd) .lm-detail-pane{text-align:left}
  .lm-act-divider{padding:36px 0 24px 42px; text-align:left}
  .lm-act-rail{left:11px; height:36px}
  .lm-tactics-wrap{padding:22px 16px}
  .lm-engine-wrap{padding:24px 18px}
  .lm-engine{grid-template-columns:1fr; gap:14px}
  .lm-thesis{padding:28px 22px}
  .lm-thesis p{font-size:17px}
}
`;
