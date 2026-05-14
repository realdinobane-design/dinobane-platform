import { useEffect, useMemo, useState } from "react";
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
  const D = data;

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

  return (
    <>
      <style>{CSS}</style>
      <div className="lmn-wrap">
        <div className="lmn-dossier">
          <span>{D.meta.dossierCode}</span>
          <span className="lmn-stamp">{D.meta.eyesOnly}</span>
          <span>{D.meta.fileTag}</span>
        </div>

        <header className="lmn-hero">
          <div className="lmn-eyebrow">A DinoBane Intel Timeline</div>
          <h1 className="lmn-title">{D.meta.title}</h1>
          <p className="lmn-sub">{D.meta.subtitle}</p>
          <div className="lmn-byline">{D.meta.byline}</div>
          <div className="lmn-rule" />
        </header>

        <section className="lmn-thesis lmn-reveal">
          {D.thesis.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <SectionHead kicker="Section I · Chronology" title="The Drift Leftward" />
        <section className="lmn-timeline-host">
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
        <section className="lmn-tactics lmn-reveal">
          {D.tactics.map((t, i) => {
            const axisKey = (t.axis ?? "").trim().toLowerCase() as TacticAxis;
            const axisLabel = axisKey ? AXIS_LABELS[axisKey] ?? "" : "";
            return (
              <div className="lmn-tactic" key={i}>
                <div className="lmn-tactic-head">
                  <div className="lmn-num">TACTIC · {String(i + 1).padStart(2, "0")}</div>
                  {axisLabel && <div className="lmn-axis">{axisLabel}</div>}
                </div>
                <h4>{t.name}</h4>
                <p>{t.use}</p>
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
          <span>{(D.meta.fileTag.match(/v[\d.]+/) || ["v1.0"])[0]}</span>
          <span>// dinobane.com</span>
        </footer>
      </div>
    </>
  );
}

function ActBlock({
  act,
  events,
  heroEvents,
}: {
  act: TimelineAct | null;
  events: TimelineEvent[];
  heroEvents: WeakSet<TimelineEvent>;
}) {
  const num = act ? ACT_NUMBER[act.id] ?? "" : "";
  return (
    <div className="lmn-act">
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
    <article className={`lmn-event${hero ? " lmn-hero-card" : ""}${ev.key ? " lmn-key" : ""}`}>
      <span className="lmn-node" aria-hidden />
      <div className="lmn-card">
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

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="lmn-section-head lmn-reveal">
      <div className="lmn-kicker">{kicker}</div>
      <h2>{title}</h2>
      <div className="lmn-under" />
    </div>
  );
}

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
  padding:96px 0 64px; text-align:center; position:relative;
}
.lmn-eyebrow{
  font-family:var(--noir-mono); text-transform:uppercase; letter-spacing:.42em;
  font-size:11px; color:var(--noir-fg-3); margin-bottom:24px;
}
.lmn-title{
  font-family:var(--noir-serif); font-weight:500;
  font-size:clamp(58px, 9vw, 112px); line-height:1; margin:0 0 18px;
  letter-spacing:-.01em; color:var(--noir-fg);
}
.lmn-sub{
  font-family:var(--noir-serif); font-weight:400;
  font-size:clamp(18px, 2.2vw, 22px); color:var(--noir-fg-2);
  max-width:620px; margin:0 auto 26px; line-height:1.5;
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
  background:transparent;
  transition:border-color .25s ease;
}
.lmn-card:hover{ border-color:var(--noir-act) }

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
.lmn-tactics{
  display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));
  gap:0;
  border-top:1px solid var(--noir-line);
  border-left:1px solid var(--noir-line);
}
.lmn-tactic{
  padding:26px 24px 28px;
  border-right:1px solid var(--noir-line);
  border-bottom:1px solid var(--noir-line);
  position:relative; transition:background .25s ease;
}
.lmn-tactic::before{
  content:""; position:absolute; top:0; left:0; right:0; height:1px;
  background:transparent; transition:background .25s ease;
}
.lmn-tactic:hover{ background:rgba(10,10,10,.02) }
.lmn-tactic:hover::before{ background:var(--noir-act) }
.lmn-tactic-head{
  display:flex; justify-content:space-between; align-items:baseline;
  gap:10px; margin-bottom:14px;
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
  font-family:var(--noir-serif); font-weight:500; font-size:22px;
  margin:0 0 12px; color:var(--noir-fg); line-height:1.2;
}
.lmn-tactic p{
  margin:0; color:var(--noir-fg-2); font-size:15px; line-height:1.6;
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
  .lmn-tactics{ grid-template-columns:1fr }
  .lmn-closing{ padding:42px 0 }
  .lmn-closing p{ font-size:18px }
  .lmn-key-tag{ margin-left:0 }
}
`;
