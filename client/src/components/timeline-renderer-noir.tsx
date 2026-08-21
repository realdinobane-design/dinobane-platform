import { useEffect, useMemo, useRef, useState } from "react";
import type { TimelineData, TimelineEvent, TimelineAct, TacticAxis } from "./timeline-renderer";

/* =========================================================
   TIMELINE RENDERER — NOIR
   ---------------------------------------------------------
   A parallel renderer to the dossier one. Same `TimelineData`
   input, completely different look:

     • PALETTE: black / white / red. Red is INVISIBLE at rest.
       It only appears when the reader commits an action —
       hover (red outline + red text) or click/active (full
       red fill). No red dots, no red year, no red kicker.

     • TYPOGRAPHY: pure serif body, monospace mono for
       overlines and meta. No italic for emphasis.

     • LAYOUT: single column, generous whitespace. The
       timeline spine is a thin neutral hairline. Cards have
       a thin border, no fill, no shadow. Hero cards full-
       bleed. Pull-quote = oversized opening mark, no fill.

     • UX: "Read the dossier" toggle is a hairline button
       that fills red when active. Source links are a small
       arrow + label; they invert to white-on-red on hover.

   The dossier renderer is unchanged — both pages share the
   same `TimelineData`, so any content edit in long-march.tsx
   updates both views automatically.
   ========================================================= */

const AXIS_LABELS: Record<TacticAxis, string> = {
  identity: "Axis · Identity",
  demographic: "Axis · Demographic",
  cultural: "Axis · Cultural",
  capital: "Axis · Capital",
  institutional: "Axis · Institutional",
  technological: "Axis · Technological",
};

const ACT_NUMBER: Record<string, string> = {
  "theory": "I",
  "strategy": "II",
  "cultural-capture": "III",
  "total-capture": "IV",
};

export function TimelineRendererNoir({ data }: { data: TimelineData }) {
  // Cross-link any name that exists on the power map into a popup file.
  useEffect(() => {
    const t = setTimeout(() => (window as any).PowerLink?.scan(document.body), 400);
    return () => clearTimeout(t);
  }, [data]);

  const D = data;
  const [activeActIdx, setActiveActIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const actRefs = useRef<Array<HTMLElement | null>>([]);

  // Inject Google Fonts once.
  useEffect(() => {
    const id = "lmn-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Scroll-reveal.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("lmn-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "-60px 0px", threshold: 0.12 },
    );
    document
      .querySelectorAll(".lmn-event, .lmn-act-divider, .lmn-reveal")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [D]);

  // Reading-progress bar + back-to-top visibility + scrollspy for Act rail.
  useEffect(() => {
    const bar = document.getElementById("lmn-progress-bar");
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (bar) bar.style.width = pct + "%";
      setScrolled(h.scrollTop > 400);

      // Determine which act is currently most visible.
      const acts = actRefs.current.filter(Boolean) as HTMLElement[];
      if (acts.length === 0) return;
      const viewportMid = window.innerHeight * 0.35;
      let best = 0;
      let bestDist = Infinity;
      acts.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top - viewportMid);
        if (r.top < window.innerHeight && r.bottom > 0 && dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActiveActIdx(best);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [D]);

  // Keyboard nav: ↑↓ / J K step between event cards. T = top. Esc = close open detail.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const events = Array.from(document.querySelectorAll<HTMLElement>(".lmn-event"));
      if (events.length === 0) return;

      if (e.key === "t" || e.key === "T") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        e.preventDefault();
        return;
      }
      if (e.key === "Escape") {
        document.querySelectorAll<HTMLButtonElement>(".lmn-toggle.lmn-toggle-open").forEach((b) => b.click());
        return;
      }
      const dir = e.key === "ArrowDown" || e.key === "j" || e.key === "J" ? 1
        : e.key === "ArrowUp" || e.key === "k" || e.key === "K" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const viewportMid = window.innerHeight * 0.35;
      let idx = 0;
      let bestDist = Infinity;
      events.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top - viewportMid);
        if (dist < bestDist) { bestDist = dist; idx = i; }
      });
      const next = Math.max(0, Math.min(events.length - 1, idx + dir));
      events[next].scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [D]);

  // Count-up stats once they enter the viewport.
  useEffect(() => {
    const nums = document.querySelectorAll<HTMLElement>("[data-count-to]");
    if (!nums.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        io.unobserve(el);
        const target = parseInt(el.dataset.countTo || "0", 10);
        const suffix = el.dataset.countSuffix || "";
        const dur = 900;
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * ease).toString() + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    nums.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [D]);

  // Group events under acts. Same logic as the dossier renderer.
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

  // Promote first key event in each act to a hero card.
  const heroEvents = useMemo(() => {
    const set = new WeakSet<TimelineEvent>();
    if (!D.acts) return set;
    D.acts.forEach((a) => {
      const first = D.timeline.find((e) => e.act === a.id && e.key);
      if (first) set.add(first);
    });
    return set;
  }, [D.acts, D.timeline]);

  const titleWords = D.meta.title.split(" ");
  const acts = D.acts || [];

  const scrollToAct = (i: number) => {
    const el = actRefs.current[i];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Reading-progress hairline pinned to the top of the viewport. */}
      <div className="lmn-progress" aria-hidden>
        <div id="lmn-progress-bar" className="lmn-progress-bar" />
      </div>

      {/* Sticky Act rail (scrollspy + click-to-jump). Hidden under 1100px. */}
      {acts.length > 0 && (
        <nav className={`lmn-rail${scrolled ? " lmn-rail-on" : ""}`} aria-label="Acts">
          {acts.map((a, i) => (
            <button
              key={a.id}
              className={`lmn-rail-item${i === activeActIdx ? " lmn-rail-item-active" : ""}`}
              onClick={() => scrollToAct(i)}
              type="button"
            >
              <span className="lmn-rail-num">{ACT_NUMBER[a.id] ?? String(i + 1)}</span>
              <span className="lmn-rail-label">{a.title}</span>
              <span className="lmn-rail-tick" aria-hidden />
            </button>
          ))}
        </nav>
      )}

      {/* Back-to-top, only after some scroll. */}
      <button
        type="button"
        aria-label="Back to top"
        className={`lmn-totop${scrolled ? " lmn-totop-on" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑
      </button>

      <div className="lmn-wrap">
        <div className="lmn-dossier">
          <span>{D.meta.dossierCode}</span>
          <span className="lmn-stamp">{D.meta.eyesOnly}</span>
          <span>{D.meta.fileTag}</span>
        </div>

        <header className="lmn-hero">
          <div className="lmn-eyebrow">A DinoBane Intel Timeline</div>
          <h1 className="lmn-title" aria-label={D.meta.title}>
            {titleWords.map((w, i) => (
              <span
                key={i}
                className="lmn-title-word"
                style={{ animationDelay: `${0.08 + i * 0.12}s` }}
              >
                {w}
                {i < titleWords.length - 1 ? "\u00A0" : ""}
              </span>
            ))}
          </h1>
          <p className="lmn-sub">{D.meta.subtitle}</p>
          <div className="lmn-byline">{D.meta.byline}</div>
          <div className="lmn-rule" />
          <div className="lmn-hero-stats" aria-hidden>
            <div className="lmn-stat">
              <span className="lmn-stat-num" data-count-to={D.timeline.length}>0</span>
              <span className="lmn-stat-label">Events</span>
            </div>
            <div className="lmn-stat">
              <span className="lmn-stat-num" data-count-to={acts.length || 0}>0</span>
              <span className="lmn-stat-label">Acts</span>
            </div>
            <div className="lmn-stat">
              <span className="lmn-stat-num" data-count-to={170} data-count-suffix="+">0</span>
              <span className="lmn-stat-label">Years</span>
            </div>
            <div className="lmn-stat">
              <span className="lmn-stat-num" data-count-to={D.tactics?.length || 0}>0</span>
              <span className="lmn-stat-label">Tactics</span>
            </div>
          </div>
          <div className="lmn-scroll-hint" aria-hidden>
            <span>Scroll to begin</span>
            <span className="lmn-scroll-hint-line" />
          </div>
        </header>

        <section className="lmn-thesis lmn-reveal">
          {D.thesis.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <SectionHead kicker="Section I · Chronology" title="The Drift Leftward" />
        <section className="lmn-timeline-host">
          {groupedTimeline.map((group, gi) => {
            const actIdx = group.act ? acts.findIndex((a) => a.id === group.act!.id) : -1;
            return (
              <ActBlock
                key={group.act?.id ?? `orphans-${gi}`}
                act={group.act}
                events={group.events}
                heroEvents={heroEvents}
                forwardRef={(el) => {
                  if (actIdx >= 0) actRefs.current[actIdx] = el;
                }}
              />
            );
          })}
        </section>

        <SectionHead
          kicker="Section II · The Tactics"
          title="Same Engine, Different Mask"
          lede="Every tactic on this list arrives wearing a cause almost no one wants to oppose. Underneath, each one does the same job: dissolve an existing loyalty, manufacture a new dependency, and route more authority upward. Left column: what you are told it is about. Right column: what it actually does."
        />
        <section className="lmn-tactics lmn-reveal">
          {D.tactics.map((t, i) => {
            const axisKey = (t.axis ?? "").trim().toLowerCase() as TacticAxis;
            const axisLabel = axisKey ? AXIS_LABELS[axisKey] ?? "" : "";
            const mask = axisKey ? AXIS_MASK[axisKey] ?? "" : "";
            return (
              <div className="lmn-tactic" key={i}>
                <div className="lmn-tactic-head">
                  <div className="lmn-num">TACTIC · {String(i + 1).padStart(2, "0")}</div>
                  {axisLabel && <div className="lmn-axis">{axisLabel}</div>}
                </div>
                <h4>{t.name}</h4>
                <div className="lmn-tactic-split">
                  <div className="lmn-tactic-col lmn-tactic-mask">
                    <div className="lmn-col-label">The Mask — what you are told</div>
                    <p>{mask || "A cause almost no one wants to oppose."}</p>
                  </div>
                  <div className="lmn-tactic-col lmn-tactic-function">
                    <div className="lmn-col-label">The Function — what it actually does</div>
                    <p>{t.use}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <SectionHead kicker="Section III · The Machiavellian Engine" title="Action · Problem · Solution" />
        <section className="lmn-engine lmn-reveal">
          {D.engine.map((s, i) => (
            <div className="lmn-step" key={i}>
              <div className="lmn-step-num">{s.step}</div>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </div>
          ))}
        </section>

        <SectionHead kicker="Section IV · In Closing" title="The Blueprint" />
        <section className="lmn-closing lmn-reveal">
          {D.closing.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <footer className="lmn-footer">
          <span>DinoBane Intel · // {D.meta.title} Dossier</span>
          <span className="lmn-keys">
            <kbd>↑</kbd><kbd>↓</kbd> step · <kbd>T</kbd> top · <kbd>Esc</kbd> close
          </span>
          <span>{(D.meta.fileTag.match(/v[\d.]+/) || ["v1.0"])[0]} · // dinobane.com</span>
        </footer>
      </div>
    </>
  );
}

function ActBlock({
  act,
  events,
  heroEvents,
  forwardRef,
}: {
  act: TimelineAct | null;
  events: TimelineEvent[];
  heroEvents: WeakSet<TimelineEvent>;
  forwardRef?: (el: HTMLDivElement | null) => void;
}) {
  const num = act ? ACT_NUMBER[act.id] ?? "" : "";
  return (
    <div className="lmn-act" ref={forwardRef}>
      {act && (
        <div className="lmn-act-divider">
          <div className="lmn-act-rail" aria-hidden>
            <span className="lmn-act-rail-dot" />
            <span className="lmn-act-rail-line" />
          </div>
          <div className="lmn-act-head">
            <div className="lmn-act-label">
              {act.label}
              {num && <span className="lmn-act-num">{num}</span>}
            </div>
            <h2 className="lmn-act-title">{act.title}</h2>
            {act.years && <div className="lmn-act-years">{act.years}</div>}
            {act.lede && <p className="lmn-act-lede">{act.lede}</p>}
          </div>
        </div>
      )}
      <div className="lmn-timeline">
        {events.map((e, i) => (
          <EventRow key={`${e.year}-${e.title}-${i}`} ev={e} hero={heroEvents.has(e)} />
        ))}
      </div>
    </div>
  );
}

function EventRow({ ev, hero }: { ev: TimelineEvent; hero?: boolean }) {
  const [open, setOpen] = useState(false);
  const hasDetail = !!(ev.detail && ev.detail.trim());
  const hasQuote = !!(ev.pullQuote && ev.pullQuote.text);

  return (
    <article className={`lmn-event${hero ? " lmn-hero-card" : ""}${ev.key ? " lmn-key" : ""}${ev.imageUrl ? " lmn-has-img" : ""}`}>
      <span className="lmn-node" aria-hidden />
      <div className="lmn-card">
        {ev.imageUrl && (
          <div className="lmn-card-img" aria-hidden>
            <img src={ev.imageUrl} alt="" loading="lazy" />
            <div className="lmn-card-img-tint" />
          </div>
        )}
        <div className="lmn-card-meta">
          <span className="lmn-year">{ev.year}</span>
          {ev.place && <span className="lmn-place">{ev.place}</span>}
          {ev.key && <span className="lmn-key-tag">Key</span>}
        </div>
        <h3>{ev.title}</h3>
        <p className="lmn-body">{ev.body}</p>

        {hasQuote && (
          <blockquote className="lmn-quote">
            <span className="lmn-quote-mark" aria-hidden>“</span>
            <p>{ev.pullQuote!.text}</p>
            <cite>— {ev.pullQuote!.attribution}</cite>
          </blockquote>
        )}

        {ev.links?.length > 0 && (
          <div className="lmn-links">
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
            className={`lmn-toggle${open ? " lmn-toggle-open" : ""}`}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="lmn-toggle-chev" aria-hidden>{open ? "−" : "+"}</span>
            {open ? "Close the dossier" : "Read the dossier"}
          </button>
        )}

        {hasDetail && open && (
          <div className="lmn-detail" role="region" aria-label={`${ev.title} — dossier`}>
            {ev.detail!.split(/\n+/).map((para, k) => (
              <p key={k}>{para}</p>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function SectionHead({ kicker, title, lede }: { kicker: string; title: string; lede?: string }) {
  return (
    <div className="lmn-section-head lmn-reveal">
      <div className="lmn-kicker">{kicker}</div>
      <h2>{title}</h2>
      <div className="lmn-under" />
      {lede && <p className="lmn-section-lede">{lede}</p>}
    </div>
  );
}

const AXIS_MASK: Record<TacticAxis, string> = {
  identity:      "Equality. Justice. Rights.",
  demographic:   "Compassion. Growth. Diversity.",
  cultural:      "Inclusion. Modernisation. Progress.",
  capital:       "Responsibility. Sustainability. Ethics.",
  institutional: "Expertise. Reform. Care.",
  technological: "Safety. Trust. Community standards.",
};

/* =========================================================
   SCOPED STYLES — all prefixed "lmn-" so the dossier renderer
   styling is completely untouched.

   Palette is exactly three tokens:
     --noir-bg    : pure white background (dominant)
     --noir-fg    : near-black text / lines
     --noir-line  : thin neutral hairline (only neutral grey allowed)
     --noir-act   : red — used ONLY for hover / focus / active

   Rule: at rest, nothing is red. The page is white + black
   with a couple of hairline greys. Every red rule below is
   gated by :hover, :focus-visible, :active, or .lmn-*-open.
   ========================================================= */
const CSS = `
.lmn-wrap{
  --noir-bg:#ffffff;
  --noir-fg:#0a0a0a;
  --noir-fg-2:rgba(10,10,10,.78);
  --noir-fg-3:rgba(10,10,10,.55);
  --noir-fg-4:rgba(10,10,10,.32);
  --noir-line:rgba(10,10,10,.14);
  --noir-line-2:rgba(10,10,10,.22);
  --noir-act:#e10b0b;
  --noir-act-soft:rgba(225,11,11,.10);
  --noir-serif:"Cormorant Garamond", Georgia, serif;
  --noir-mono:"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  max-width:920px; margin:0 auto; padding:0 32px;
  background:var(--noir-bg); color:var(--noir-fg);
  font-family:var(--noir-serif); font-weight:400;
  font-size:18px; line-height:1.7;
  position:relative;
}
.lmn-wrap *{box-sizing:border-box}

/* Full-bleed white background outside the 920px column — only while
   the noir page is mounted. Scoped via a body class added by the page. */
body.lmn-page-active{ background:#ffffff !important; }
body.lmn-page-active main,
body.lmn-page-active #root,
body.lmn-page-active [data-page-shell]{ background:#ffffff; }
.lmn-reveal{opacity:0; transform:translateY(14px); transition:opacity .7s ease, transform .7s ease}
.lmn-reveal.lmn-in{opacity:1; transform:none}

/* ──────────────── READING PROGRESS ──────────────── */
.lmn-progress{
  position:fixed; top:0; left:0; right:0; height:2px;
  background:transparent; z-index:80; pointer-events:none;
}
.lmn-progress-bar{
  height:100%; width:0%;
  background:linear-gradient(90deg, rgba(10,10,10,.85), #e10b0b);
  transition:width .12s linear;
}

/* ──────────────── STICKY ACT RAIL ──────────────── */
.lmn-rail{
  position:fixed; top:50%; left:max(20px, calc((100vw - 1120px) / 2));
  transform:translateY(-50%);
  display:flex; flex-direction:column; gap:6px;
  z-index:70; opacity:0; pointer-events:none;
  transition:opacity .35s ease;
}
.lmn-rail.lmn-rail-on{ opacity:1; pointer-events:auto }
.lmn-rail-item{
  display:flex; align-items:center; gap:10px;
  padding:8px 10px 8px 0;
  background:transparent; border:none; cursor:pointer;
  font-family:var(--noir-mono); font-size:10px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--noir-fg-3);
  transition:color .2s ease;
  text-align:left;
}
.lmn-rail-num{
  display:inline-block; width:24px;
  font-family:var(--noir-serif); font-weight:600;
  font-size:13px; letter-spacing:0; color:var(--noir-fg-3);
  transition:color .2s ease;
}
.lmn-rail-label{
  max-width:0; overflow:hidden; white-space:nowrap;
  opacity:0; transition:max-width .35s ease, opacity .25s ease;
}
.lmn-rail-tick{
  display:inline-block; width:18px; height:1px;
  background:var(--noir-fg-4);
  transition:width .25s ease, background .25s ease;
}
.lmn-rail-item:hover .lmn-rail-label,
.lmn-rail-item-active .lmn-rail-label{
  max-width:240px; opacity:1;
}
.lmn-rail-item:hover .lmn-rail-tick{
  background:var(--noir-act); width:28px;
}
.lmn-rail-item:hover{ color:var(--noir-act) }
.lmn-rail-item:hover .lmn-rail-num{ color:var(--noir-act) }
.lmn-rail-item-active .lmn-rail-num{ color:var(--noir-fg) }
.lmn-rail-item-active .lmn-rail-tick{ background:var(--noir-fg); width:28px }
.lmn-rail-item-active{ color:var(--noir-fg) }
@media (max-width: 1100px){ .lmn-rail{ display:none } }

/* ──────────────── BACK TO TOP ──────────────── */
.lmn-totop{
  position:fixed; right:24px; bottom:24px;
  width:44px; height:44px; border-radius:50%;
  border:1px solid var(--noir-line-2);
  background:rgba(255,255,255,.95); backdrop-filter:blur(4px);
  color:var(--noir-fg); cursor:pointer;
  font-size:18px; font-weight:600;
  opacity:0; transform:translateY(8px) scale(.92);
  pointer-events:none; z-index:75;
  transition:opacity .3s ease, transform .3s ease, border-color .2s ease, color .2s ease, background .2s ease;
}
.lmn-totop.lmn-totop-on{
  opacity:1; transform:none; pointer-events:auto;
}
.lmn-totop:hover{
  border-color:var(--noir-act); color:var(--noir-act);
}
.lmn-totop:active{
  background:var(--noir-act); border-color:var(--noir-act); color:#fff;
}

/* ──────────────── TITLE WORD STAGGER ──────────────── */
.lmn-title-word{
  display:inline-block;
  opacity:0; transform:translateY(28px);
  animation:lmn-word-in .9s cubic-bezier(.2,.7,.2,1) forwards;
}
@keyframes lmn-word-in{
  to{ opacity:1; transform:none }
}

/* ──────────────── SCROLL HINT ──────────────── */
.lmn-scroll-hint{
  margin:64px auto 0; display:flex; flex-direction:column; align-items:center; gap:14px;
  font-family:var(--noir-mono); font-size:10px; letter-spacing:.42em;
  text-transform:uppercase; color:var(--noir-fg-3);
  opacity:0; animation:lmn-fade-up 1s .9s ease forwards;
}
.lmn-scroll-hint-line{
  width:1px; height:40px; background:var(--noir-fg-4); position:relative; overflow:hidden;
}
.lmn-scroll-hint-line::after{
  content:""; position:absolute; left:0; top:-12px; width:1px; height:12px;
  background:var(--noir-fg);
  animation:lmn-trickle 1.8s ease-in-out infinite;
}
@keyframes lmn-trickle{
  0%{ transform:translateY(0) }
  60%{ transform:translateY(52px) }
  100%{ transform:translateY(52px) }
}
@keyframes lmn-fade-up{
  from{ opacity:0; transform:translateY(8px) }
  to{ opacity:1; transform:none }
}

/* ──────────────── DOSSIER STRIP ──────────────── */
.lmn-dossier{
  border-bottom:1px solid var(--noir-line);
  padding:22px 0 18px;
  font-family:var(--noir-mono); font-size:11px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--noir-fg-3);
  display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;
}
.lmn-stamp{
  border:1px solid var(--noir-line-2); padding:4px 10px;
  color:var(--noir-fg);
  transition:border-color .25s ease, color .25s ease, background .25s ease;
}
.lmn-stamp:hover{ border-color:var(--noir-act); color:var(--noir-act) }

/* ──────────────── HERO ──────────────── */
.lmn-hero{
  padding:120px 0 72px; text-align:center; position:relative;
}
.lmn-eyebrow{
  font-family:var(--noir-mono); text-transform:uppercase; letter-spacing:.42em;
  font-size:11px; color:var(--noir-fg-3); margin-bottom:32px;
}
.lmn-title{
  font-family:var(--noir-serif); font-weight:700;
  font-size:clamp(72px, 12vw, 168px); line-height:.92; margin:0 0 22px;
  letter-spacing:-.025em; color:var(--noir-fg);
}
.lmn-sub{
  font-family:var(--noir-serif); font-weight:400; font-style:italic;
  font-size:clamp(20px, 2.6vw, 28px); color:var(--noir-fg-2);
  max-width:680px; margin:0 auto 30px; line-height:1.4;
}
.lmn-hero-stats{
  display:flex; justify-content:center; gap:0; flex-wrap:wrap;
  margin:48px auto 0; max-width:720px;
  border-top:1px solid var(--noir-line);
  border-bottom:1px solid var(--noir-line);
}
.lmn-stat{
  flex:1; min-width:120px; padding:22px 12px;
  display:flex; flex-direction:column; align-items:center; gap:6px;
  border-right:1px solid var(--noir-line);
  transition:background .2s ease;
}
.lmn-stat:last-child{ border-right:none }
.lmn-stat:hover{ background:rgba(10,10,10,.025) }
.lmn-stat:hover .lmn-stat-num{ color:var(--noir-act) }
.lmn-stat-num{
  font-family:var(--noir-serif); font-weight:600;
  font-size:36px; line-height:1; color:var(--noir-fg);
  letter-spacing:-.01em;
  transition:color .2s ease;
}
.lmn-stat-label{
  font-family:var(--noir-mono); font-size:10px; letter-spacing:.32em;
  text-transform:uppercase; color:var(--noir-fg-3);
}
.lmn-byline{
  font-family:var(--noir-mono); font-size:11px; letter-spacing:.32em;
  text-transform:uppercase; color:var(--noir-fg-4);
}
.lmn-rule{
  width:64px; height:1px; background:var(--noir-fg-4);
  margin:36px auto 0; transition:background .25s ease, width .25s ease;
}
.lmn-hero:hover .lmn-rule{ background:var(--noir-act); width:96px }

/* ──────────────── THESIS ──────────────── */
.lmn-thesis{
  max-width:720px; margin:48px auto 88px;
  padding:48px 0;
  border-top:1px solid var(--noir-line);
  border-bottom:1px solid var(--noir-line);
}
.lmn-thesis p{
  font-family:var(--noir-serif); font-size:21px; line-height:1.55;
  color:var(--noir-fg); margin:0 0 20px; font-weight:400;
}
.lmn-thesis p:last-child{
  margin-bottom:0; color:var(--noir-fg-2); font-size:19px;
}

/* ──────────────── SECTION HEAD ──────────────── */
.lmn-section-head{ text-align:center; margin:104px 0 48px }
.lmn-kicker{
  font-family:var(--noir-mono); font-size:11px; letter-spacing:.42em;
  text-transform:uppercase; color:var(--noir-fg-3); margin-bottom:18px;
}
.lmn-section-head h2{
  font-family:var(--noir-serif); font-weight:500;
  font-size:clamp(38px, 5vw, 56px); line-height:1.05;
  color:var(--noir-fg); margin:0; letter-spacing:-.01em;
}
.lmn-under{
  width:40px; height:1px; background:var(--noir-fg-4);
  margin:22px auto 0; transition:background .25s ease, width .25s ease;
}
.lmn-section-head:hover .lmn-under{ background:var(--noir-act); width:72px }
.lmn-section-lede{
  max-width:640px; margin:24px auto 0;
  font-family:var(--noir-serif); font-size:17px; line-height:1.65;
  color:var(--noir-fg-2); font-style:italic;
}

/* ──────────────── TIMELINE ──────────────── */
.lmn-timeline-host{ position:relative; padding:0; max-width:760px; margin:0 auto }
.lmn-timeline-host::before{
  content:""; position:absolute; left:22px; top:0; bottom:0;
  width:1px; background:var(--noir-line);
}
.lmn-act{ position:relative }

/* ─── Act divider ─── */
.lmn-act-divider{
  position:relative; padding:56px 0 28px 64px;
  text-align:left;
}
.lmn-act-rail{
  position:absolute; left:22px; top:0; height:48px;
  transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center; pointer-events:none;
}
.lmn-act-rail-line{
  width:1px; flex:1; background:var(--noir-line);
}
.lmn-act-rail-dot{
  width:9px; height:9px; border-radius:50%;
  background:var(--noir-bg); border:1px solid var(--noir-line-2);
  margin-bottom:4px;
  transition:border-color .25s ease, background .25s ease;
}
.lmn-act:hover .lmn-act-rail-dot{
  border-color:var(--noir-act); background:var(--noir-act);
}
.lmn-act-label{
  font-family:var(--noir-mono); font-size:11px; letter-spacing:.42em;
  text-transform:uppercase; color:var(--noir-fg-3); margin-bottom:14px;
  display:flex; align-items:baseline; gap:14px;
}
.lmn-act-num{
  font-family:var(--noir-serif); font-style:normal; font-weight:500;
  font-size:38px; line-height:1; color:var(--noir-fg);
  letter-spacing:0; margin-left:auto; padding-left:18px;
  border-left:1px solid var(--noir-line);
}
.lmn-act-title{
  font-family:var(--noir-serif); font-weight:500;
  font-size:clamp(32px, 4.6vw, 46px); line-height:1.08;
  color:var(--noir-fg); margin:0 0 14px; letter-spacing:-.005em;
}
.lmn-act-years{
  font-family:var(--noir-mono); font-size:11px; letter-spacing:.32em;
  text-transform:uppercase; color:var(--noir-fg-4); margin-bottom:18px;
}
.lmn-act-lede{
  font-family:var(--noir-serif); font-size:18px; line-height:1.6;
  color:var(--noir-fg-2); max-width:560px; margin:0;
}

/* ─── Event row ─── */
.lmn-timeline{ padding:0; margin:0; position:relative }

.lmn-event{
  position:relative;
  padding:20px 0 20px 64px;
  opacity:0; transform:translateY(14px);
  transition:opacity .6s ease, transform .6s ease;
}
.lmn-event.lmn-in{ opacity:1; transform:none }

.lmn-node{
  position:absolute; left:22px; top:34px;
  width:9px; height:9px; border-radius:50%;
  background:var(--noir-bg); border:1px solid var(--noir-line-2);
  transform:translateX(-50%);
  transition:border-color .25s ease, background .25s ease;
}
.lmn-event:hover .lmn-node{ border-color:var(--noir-act); background:var(--noir-act) }
.lmn-event.lmn-key .lmn-node{ border-color:var(--noir-fg-2) }
.lmn-event.lmn-key:hover .lmn-node{ border-color:var(--noir-act); background:var(--noir-act) }

.lmn-card{
  position:relative; padding:24px 28px 26px;
  border:1px solid var(--noir-line);
  background:var(--noir-bg);
  transition:border-color .25s ease;
  overflow:hidden;
  isolation:isolate;
}
.lmn-card:hover{ border-color:var(--noir-act) }

/* ─── Card imagery: desaturated + faded at rest, red duotone on hover ─── */
.lmn-card-img{
  position:absolute; inset:0; z-index:-1;
  pointer-events:none; overflow:hidden;
}
.lmn-card-img img{
  width:100%; height:100%; object-fit:cover;
  filter:grayscale(1) contrast(1.05);
  opacity:.18;
  transition:opacity .35s ease, filter .35s ease;
}
.lmn-card-img-tint{
  position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,.82) 60%, rgba(255,255,255,.96) 100%);
  transition:background .35s ease, opacity .35s ease;
}
.lmn-event.lmn-has-img:hover .lmn-card-img img{
  opacity:.55;
  /* Map grayscale tones to a red hue */
  filter:grayscale(1) contrast(1.1) sepia(1) hue-rotate(-50deg) saturate(6);
}
.lmn-event.lmn-has-img:hover .lmn-card-img-tint{
  background:linear-gradient(180deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.55) 65%, rgba(255,255,255,.88) 100%);
}

.lmn-card-meta{
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  margin-bottom:14px;
}
.lmn-year{
  font-family:var(--noir-serif); font-weight:600; font-size:34px;
  line-height:1; color:var(--noir-fg); letter-spacing:-.01em;
}
.lmn-place{
  font-family:var(--noir-mono); font-size:10.5px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--noir-fg-3);
}
.lmn-key-tag{
  font-family:var(--noir-mono); font-size:10px; letter-spacing:.32em;
  text-transform:uppercase; color:var(--noir-fg-3);
  border:1px solid var(--noir-line-2); padding:3px 10px;
  margin-left:auto;
  transition:border-color .25s ease, color .25s ease;
}
.lmn-event.lmn-key:hover .lmn-key-tag{ border-color:var(--noir-act); color:var(--noir-act) }

.lmn-card h3{
  font-family:var(--noir-serif); font-weight:500; font-size:28px;
  line-height:1.18; margin:0 0 14px; color:var(--noir-fg);
  letter-spacing:-.005em;
}
.lmn-body{
  margin:0 0 18px; color:var(--noir-fg-2);
  font-size:17px; line-height:1.65;
}

/* ─── Hero card (one per Act) — full-bleed flat top accent ─── */
.lmn-event.lmn-hero-card .lmn-card{
  padding:32px 32px 32px;
}
.lmn-event.lmn-hero-card .lmn-card::before{
  content:""; position:absolute; top:-1px; left:-1px; right:-1px; height:1px;
  background:var(--noir-fg-2);
  transition:background .25s ease, height .25s ease;
}
.lmn-event.lmn-hero-card .lmn-card:hover::before{ background:var(--noir-act); height:2px }
.lmn-event.lmn-hero-card h3{ font-size:32px }
.lmn-event.lmn-hero-card .lmn-year{ font-size:42px }

/* ─── Pull-quote ─── */
.lmn-quote{
  position:relative; margin:20px 0 18px; padding:16px 18px 14px 28px;
  border-left:1px solid var(--noir-line-2);
  transition:border-color .25s ease;
}
.lmn-quote:hover{ border-left-color:var(--noir-act) }
.lmn-quote-mark{
  position:absolute; top:0; left:6px;
  font-family:var(--noir-serif); font-weight:600;
  font-size:48px; line-height:1; color:var(--noir-fg-4);
  transition:color .25s ease;
}
.lmn-quote:hover .lmn-quote-mark{ color:var(--noir-act) }
.lmn-quote p{
  font-family:var(--noir-serif); font-size:18px; line-height:1.55;
  color:var(--noir-fg); margin:0 0 8px; font-weight:400;
}
.lmn-quote cite{
  display:block; font-family:var(--noir-mono); font-style:normal;
  font-size:10.5px; letter-spacing:.24em; text-transform:uppercase;
  color:var(--noir-fg-3);
}

/* ─── Source links ─── */
.lmn-links{ display:flex; gap:10px; flex-wrap:wrap; margin-top:14px }
.lmn-links a{
  display:inline-flex; align-items:center; gap:8px;
  font-family:var(--noir-mono); font-size:10.5px; letter-spacing:.22em;
  text-transform:uppercase; color:var(--noir-fg-2);
  border:1px solid var(--noir-line-2);
  background:transparent;
  padding:7px 12px; text-decoration:none;
  transition:color .2s ease, border-color .2s ease, background .2s ease;
}
.lmn-links a::before{
  content:"→"; font-family:var(--noir-mono);
  color:var(--noir-fg-3); font-size:11px;
  transition:color .2s ease, transform .2s ease;
}
.lmn-links a:hover{
  color:var(--noir-act); border-color:var(--noir-act); background:transparent;
}
.lmn-links a:hover::before{ color:var(--noir-act); transform:translateX(2px) }
.lmn-links a:active{
  color:var(--noir-bg); background:var(--noir-act); border-color:var(--noir-act);
}
.lmn-links a:active::before{ color:var(--noir-bg) }
.lmn-links a:focus-visible{
  outline:none; color:var(--noir-act); border-color:var(--noir-act);
}

/* ─── Read the dossier toggle ─── */
.lmn-toggle{
  display:inline-flex; align-items:center; gap:10px;
  margin-top:18px; padding:9px 14px;
  font-family:var(--noir-mono); font-size:11px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--noir-fg-2);
  background:transparent; border:1px solid var(--noir-line-2);
  cursor:pointer;
  transition:color .2s ease, border-color .2s ease, background .2s ease;
}
.lmn-toggle:hover{
  color:var(--noir-act); border-color:var(--noir-act);
}
.lmn-toggle:focus-visible{
  outline:none; color:var(--noir-act); border-color:var(--noir-act);
}
.lmn-toggle.lmn-toggle-open{
  color:var(--noir-bg); background:var(--noir-act); border-color:var(--noir-act);
}
.lmn-toggle-chev{
  font-family:var(--noir-mono); font-weight:500;
  font-size:14px; line-height:1;
}

/* ─── Detail pane ─── */
.lmn-detail{
  margin-top:20px; padding-top:20px;
  border-top:1px dashed var(--noir-line);
}
.lmn-detail p{
  font-family:var(--noir-serif); font-size:17px; line-height:1.78;
  color:var(--noir-fg-2); margin:0 0 16px;
}
.lmn-detail p:last-child{ margin-bottom:0 }
.lmn-detail p:first-of-type::first-letter{
  color:var(--noir-fg); font-weight:600;
}

/* ──────────────── TACTICS ──────────────── */
/* Each tactic is a full-width row with an internal Mask | Function split.
   The Mask column reads as the friendly public framing; the Function
   column reads as the operational role. The split is what makes the
   section's point legible at a glance. */
.lmn-tactics{
  display:flex; flex-direction:column; gap:0;
  border-top:1px solid var(--noir-line);
  border-bottom:1px solid var(--noir-line);
  max-width:920px; margin:0 auto;
}
.lmn-tactic{
  padding:28px 0 30px;
  border-bottom:1px solid var(--noir-line);
  position:relative; transition:background .25s ease;
}
.lmn-tactic:last-child{ border-bottom:none }
.lmn-tactic::before{
  content:""; position:absolute; top:0; left:0; width:0; height:1px;
  background:var(--noir-act); transition:width .35s ease;
}
.lmn-tactic:hover{ background:rgba(10,10,10,.018) }
.lmn-tactic:hover::before{ width:100% }
.lmn-tactic-head{
  display:flex; justify-content:space-between; align-items:baseline;
  gap:10px; margin:0 0 8px; padding:0 4px;
}
.lmn-num{
  font-family:var(--noir-mono); font-size:10px; letter-spacing:.32em;
  color:var(--noir-fg-3); margin:0;
}
.lmn-axis{
  font-family:var(--noir-mono); font-size:9.5px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--noir-fg-3);
  white-space:nowrap;
}
.lmn-tactic:hover .lmn-num,
.lmn-tactic:hover .lmn-axis{ color:var(--noir-act) }
.lmn-tactic h4{
  font-family:var(--noir-serif); font-weight:600; font-size:26px;
  margin:0 0 18px; padding:0 4px;
  color:var(--noir-fg); line-height:1.18; letter-spacing:-.005em;
}
.lmn-tactic-split{
  display:grid; grid-template-columns:1fr 1fr; gap:0;
  border-top:1px solid var(--noir-line);
}
.lmn-tactic-col{
  padding:18px 22px 4px;
  border-right:1px solid var(--noir-line);
}
.lmn-tactic-col:last-child{ border-right:none }
.lmn-col-label{
  font-family:var(--noir-mono); font-size:9.5px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--noir-fg-3);
  margin-bottom:10px;
}
.lmn-tactic-mask .lmn-col-label{ color:var(--noir-fg-3) }
.lmn-tactic-function .lmn-col-label{ color:var(--noir-fg-2); font-weight:500 }
.lmn-tactic-col p{
  margin:0; color:var(--noir-fg-2); font-size:16px; line-height:1.6;
  font-family:var(--noir-serif);
}
.lmn-tactic-mask p{
  font-style:italic; color:var(--noir-fg-3);
}
.lmn-tactic-function p{
  color:var(--noir-fg); font-weight:400;
}
.lmn-tactic:hover .lmn-tactic-function p{
  color:var(--noir-fg);
}

/* ──────────────── ENGINE ──────────────── */
.lmn-engine{
  display:grid; grid-template-columns:repeat(3, 1fr); gap:0;
  border-top:1px solid var(--noir-line);
  border-left:1px solid var(--noir-line);
}
.lmn-step{
  padding:32px 24px; text-align:center;
  border-right:1px solid var(--noir-line);
  border-bottom:1px solid var(--noir-line);
  position:relative; transition:background .25s ease;
}
.lmn-step::before{
  content:""; position:absolute; top:0; left:0; right:0; height:1px;
  background:transparent; transition:background .25s ease;
}
.lmn-step:hover{ background:rgba(10,10,10,.02) }
.lmn-step:hover::before{ background:var(--noir-act) }
.lmn-step-num{
  font-family:var(--noir-mono); font-size:10px; letter-spacing:.36em;
  text-transform:uppercase; color:var(--noir-fg-3);
  border:1px solid var(--noir-line-2); padding:4px 12px;
  display:inline-block; margin-bottom:16px;
  transition:color .25s ease, border-color .25s ease;
}
.lmn-step:hover .lmn-step-num{ color:var(--noir-act); border-color:var(--noir-act) }
.lmn-step h4{
  font-family:var(--noir-serif); font-weight:500; font-size:26px;
  margin:0 0 12px; color:var(--noir-fg);
}
.lmn-step p{ margin:0; color:var(--noir-fg-2); font-size:15px; line-height:1.6 }

/* ──────────────── CLOSING ──────────────── */
.lmn-closing{
  max-width:720px; margin:32px auto 24px;
  text-align:center; padding:56px 0;
  border-top:1px solid var(--noir-line);
  border-bottom:1px solid var(--noir-line);
}
.lmn-closing p{
  font-family:var(--noir-serif); font-size:21px; line-height:1.55;
  color:var(--noir-fg); margin:0 0 20px; font-weight:400;
}
.lmn-closing p:last-child{ margin-bottom:0; color:var(--noir-fg-2) }

/* ──────────────── FOOTER ──────────────── */
.lmn-footer{
  margin-top:80px; border-top:1px solid var(--noir-line); padding:28px 0 56px;
  font-family:var(--noir-mono); font-size:11px; letter-spacing:.24em; text-transform:uppercase;
  color:var(--noir-fg-4); display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;
  align-items:center;
}
.lmn-keys{ display:inline-flex; gap:6px; align-items:center; letter-spacing:.18em }
.lmn-keys kbd{
  font-family:var(--noir-mono); font-size:10px;
  padding:2px 6px; border:1px solid var(--noir-line-2);
  background:transparent; color:var(--noir-fg-3);
  margin-right:2px;
}

/* Honour the user's reduced-motion preference. */
@media (prefers-reduced-motion: reduce){
  .lmn-title-word, .lmn-scroll-hint, .lmn-scroll-hint-line::after{ animation:none !important }
  .lmn-title-word{ opacity:1; transform:none }
  .lmn-scroll-hint{ opacity:.7 }
  .lmn-reveal{ transition:none }
}

/* ──────────────── RESPONSIVE ──────────────── */
@media (max-width: 720px){
  .lmn-wrap{ padding:0 22px; font-size:17px }
  .lmn-hero{ padding:64px 0 48px }
  .lmn-thesis{ padding:36px 0; margin:32px auto 64px }
  .lmn-thesis p{ font-size:19px }
  .lmn-section-head{ margin:72px 0 36px }
  .lmn-timeline-host::before{ left:14px }
  .lmn-act-divider{ padding:40px 0 24px 44px }
  .lmn-act-rail{ left:14px; height:36px }
  .lmn-event{ padding:18px 0 18px 44px }
  .lmn-node{ left:14px; top:34px }
  .lmn-card{ padding:20px 20px 22px }
  .lmn-card h3{ font-size:24px }
  .lmn-event.lmn-hero-card h3{ font-size:26px }
  .lmn-engine{ grid-template-columns:1fr }
  .lmn-tactic-split{ grid-template-columns:1fr }
  .lmn-tactic-col{ border-right:none; border-bottom:1px solid var(--noir-line); padding:16px 18px 16px }
  .lmn-tactic-col:last-child{ border-bottom:none }
  .lmn-tactic h4{ font-size:22px }
  .lmn-closing{ padding:42px 0 }
  .lmn-closing p{ font-size:18px }
  .lmn-key-tag{ margin-left:0 }
}
`;
