import { useEffect } from "react";

/* =========================================================
   TIMELINE RENDERER — shared across every timeline page.
   Accepts a fully-hydrated data object and renders the
   dossier layout (stripe → hero → thesis → events → tactics
   → engine → closing → footer).
   ========================================================= */

export type TimelineLink = { label: string; url: string };

export type TimelineEvent = {
  year: string;
  title: string;
  place: string;
  key: boolean;
  body: string;
  links: TimelineLink[];
  imageUrl?: string;
};

export type TimelineData = {
  meta: {
    dossierCode: string;
    eyesOnly: string;
    fileTag: string;
    title: string;
    subtitle: string;
    byline: string;
  };
  thesis: string[];
  timeline: TimelineEvent[];
  tactics: { name: string; use: string }[];
  engine: { step: string; title: string; body: string }[];
  closing: string[];
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

  // Scroll-reveal for timeline cards.
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
    document.querySelectorAll(".lm-event").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [D]);

  // Split title so last word is red.
  const parts = D.meta.title.trim().split(/\s+/);
  const titleMain = parts.length > 1 ? parts.slice(0, -1).join(" ") : D.meta.title;
  const titleAccent = parts.length > 1 ? parts[parts.length - 1] : "";

  return (
    <>
      <style>{CSS}</style>
      <div className="lm-wrap">
        <div className="lm-dossier">
          <span className="lm-tag">{D.meta.dossierCode}</span>
          <span className="lm-stamp">{D.meta.eyesOnly}</span>
          <span>{D.meta.fileTag}</span>
        </div>

        <header className="lm-hero">
          <div className="lm-eyebrow">A DinoBane Intel Timeline</div>
          <h1>
            {titleMain}
            {titleAccent && <> <span className="lm-amp">{titleAccent}</span></>}
          </h1>
          <p className="lm-sub">{D.meta.subtitle}</p>
          <div className="lm-byline">{D.meta.byline}</div>
          <div className="lm-rule" />
        </header>

        <section className="lm-thesis">
          {D.thesis.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <SectionHead kicker="Section I · Chronology" title="The Drift Leftward" />
        <section className="lm-timeline">
          {D.timeline.map((e, i) => (
            <article className={`lm-event${e.key ? " lm-key" : ""}`} key={i}>
              <span className="lm-node" aria-hidden />
              <div
                className={`lm-card${e.imageUrl ? " lm-card-has-bg" : ""}`}
                style={
                  e.imageUrl
                    ? ({ ["--lm-bg-img" as unknown as string]: `url("${e.imageUrl}")` } as React.CSSProperties)
                    : undefined
                }
              >
                {e.imageUrl && <div className="lm-card-bg" aria-hidden />}
                <div className="lm-card-inner">
                  {e.key && <span className="lm-key-tag">Key Event</span>}
                  <span className="lm-year">{e.year}</span>
                  {e.place && <div className="lm-place">{e.place}</div>}
                  <h3>{e.title}</h3>
                  <p>{e.body}</p>
                  {e.links?.length > 0 && (
                    <div className="lm-links">
                      {e.links.map((l, j) => (
                        <a key={j} href={l.url} target="_blank" rel="noopener noreferrer">
                          {l.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>

        <SectionHead kicker="Section II · Tactics Matrix" title="Angels' Faces" />
        <section className="lm-tactics">
          {D.tactics.map((t, i) => (
            <div className="lm-tactic" key={i}>
              <div className="lm-num">TACTIC · {String(i + 1).padStart(2, "0")}</div>
              <h4>{t.name}</h4>
              <p>{t.use}</p>
            </div>
          ))}
        </section>

        <SectionHead kicker="Section III · The Machiavellian Engine" title="Action · Problem · Solution" />
        <section className="lm-engine">
          {D.engine.map((s, i) => (
            <div className="lm-step" key={i}>
              <div className="lm-step-num">{s.step}</div>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </div>
          ))}
        </section>

        <SectionHead kicker="Section IV · In Closing" title="The Blueprint" />
        <section className="lm-closing">
          {D.closing.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <footer className="lm-footer">
          <span>DinoBane Intel · <span className="lm-mark">//</span> {D.meta.title} Dossier</span>
          <span>{(D.meta.fileTag.match(/v[\d.]+/) || ["v1.0"])[0]}</span>
          <span><span className="lm-mark">//</span> dinobane.com</span>
        </footer>
      </div>
    </>
  );
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
   ========================================================= */
const CSS = `
.lm-wrap{
  --lm-bg:#0a0a0a; --lm-ink:#e9e3d7; --lm-dim:#a49a8a; --lm-mute:#6f6558;
  --lm-red:#cc2a2a; --lm-red-deep:#8a1616; --lm-red-glow:rgba(204,42,42,.35);
  --lm-gold:#d4a24a; --lm-gold-soft:#b8893b;
  --lm-line:#2a2420;
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

.lm-hero{padding:72px 0 48px; text-align:center}
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
  font-size:clamp(18px, 2.2vw, 24px); color:var(--lm-dim);
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
  background:linear-gradient(180deg, rgba(255,255,255,.015), transparent 60%);
  position:relative;
}
.lm-thesis::before, .lm-thesis::after{
  content:""; position:absolute; width:22px; height:22px;
  border:1px solid var(--lm-red); opacity:.8;
}
.lm-thesis::before{top:-1px; left:-1px; border-right:none; border-bottom:none}
.lm-thesis::after{bottom:-1px; right:-1px; border-left:none; border-top:none}
.lm-thesis p{font-family:var(--lm-serif); font-size:20px; line-height:1.55; color:var(--lm-ink); margin:0 0 16px}
.lm-thesis p:last-child{margin-bottom:0; color:var(--lm-dim); font-style:italic}

.lm-section-head{text-align:center; margin:80px 0 36px}
.lm-kicker{font-family:var(--lm-mono); font-size:11px; letter-spacing:.4em; text-transform:uppercase; color:var(--lm-red); margin-bottom:10px}
.lm-section-head h2{font-family:var(--lm-serif); font-style:italic; font-weight:600; font-size:clamp(36px, 5vw, 58px); color:var(--lm-ink); margin:0; line-height:1}
.lm-under{width:50px; height:1px; background:var(--lm-mute); margin:18px auto 0}

.lm-timeline{position:relative; padding:20px 0 40px}
.lm-timeline::before{
  content:""; position:absolute; left:50%; top:0; bottom:0;
  width:1px; background:linear-gradient(180deg, transparent, var(--lm-line) 8%, var(--lm-line) 92%, transparent);
  transform:translateX(-.5px);
}
.lm-timeline::after{
  content:""; position:absolute; left:50%; top:0; width:3px; height:40px;
  transform:translateX(-1.5px);
  background:linear-gradient(180deg, transparent, var(--lm-red), transparent);
  opacity:.55; animation:lm-scan 9s linear infinite;
  box-shadow:0 0 14px var(--lm-red-glow); pointer-events:none;
}
@keyframes lm-scan{0%{top:-8%} 100%{top:108%}}

.lm-event{
  position:relative; width:50%; padding:18px 44px;
  opacity:0; transform:translateY(18px);
  transition:opacity .7s ease, transform .7s ease;
}
.lm-event.lm-in{opacity:1; transform:none}
.lm-event:nth-child(odd){left:0; text-align:right}
.lm-event:nth-child(even){left:50%}
.lm-node{position:absolute; top:34px; width:14px; height:14px; background:var(--lm-bg); border:1.5px solid var(--lm-mute); border-radius:50%}
.lm-event:nth-child(odd) .lm-node{right:-7px}
.lm-event:nth-child(even) .lm-node{left:-7px}
.lm-event.lm-key .lm-node{
  border-color:var(--lm-gold); background:var(--lm-gold);
  box-shadow:0 0 0 4px rgba(212,162,74,.12), 0 0 18px rgba(212,162,74,.55);
}
.lm-event.lm-key .lm-card{
  border-color:rgba(212,162,74,.35);
  box-shadow:0 0 0 1px rgba(212,162,74,.05) inset, 0 0 40px rgba(204,42,42,.06);
}
.lm-event.lm-key .lm-year{color:var(--lm-gold)}
.lm-event.lm-key .lm-key-tag{
  display:inline-block; font-family:var(--lm-mono); font-size:10px;
  letter-spacing:.3em; text-transform:uppercase; color:var(--lm-gold);
  border:1px solid var(--lm-gold-soft); padding:2px 8px; margin-bottom:10px;
}
.lm-card{
  background:linear-gradient(180deg, rgba(255,255,255,.018), rgba(0,0,0,.25));
  border:1px solid var(--lm-line); padding:22px 24px; position:relative; overflow:hidden;
  transition:transform .3s ease, border-color .3s ease, box-shadow .3s ease;
}
.lm-card:hover{transform:translateY(-2px); border-color:var(--lm-red-deep); box-shadow:0 10px 40px rgba(204,42,42,.12)}
.lm-card-bg{
  position:absolute; inset:0; pointer-events:none; z-index:0;
  background-image:var(--lm-bg-img); background-size:cover; background-position:center;
  opacity:.18; filter:grayscale(.55) contrast(1.08) brightness(.9);
  transition:opacity .3s ease;
}
.lm-card-has-bg::after{
  content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
  background:linear-gradient(180deg, rgba(10,10,10,.35), rgba(10,10,10,.82));
}
.lm-card:hover .lm-card-bg{opacity:.28}
.lm-card-inner{position:relative; z-index:1}
.lm-year{font-family:var(--lm-serif); font-style:italic; font-weight:700; font-size:28px; color:var(--lm-red); line-height:1; display:block; margin-bottom:4px}
.lm-place{font-family:var(--lm-mono); font-size:11px; letter-spacing:.24em; text-transform:uppercase; color:var(--lm-mute); margin-bottom:10px}
.lm-card h3{font-family:var(--lm-serif); font-weight:600; font-size:26px; line-height:1.15; margin:0 0 12px; color:var(--lm-ink)}
.lm-card p{margin:0 0 14px; color:var(--lm-ink); font-size:16px}
.lm-links{display:flex; gap:8px; flex-wrap:wrap; margin-top:8px}
.lm-event:nth-child(odd) .lm-links{justify-content:flex-end}
.lm-links a{
  font-family:var(--lm-mono); font-size:10.5px; letter-spacing:.18em;
  text-transform:uppercase; color:var(--lm-dim); border:1px solid var(--lm-line);
  padding:6px 10px; text-decoration:none; transition:all .25s ease;
  display:inline-flex; align-items:center; gap:6px;
  background:rgba(10,10,10,.55);
}
.lm-links a::before{content:"▸"; color:var(--lm-red); font-size:9px}
.lm-links a:hover{color:var(--lm-ink); border-color:var(--lm-red); background:rgba(204,42,42,.18)}

.lm-tactics{
  display:grid; grid-template-columns:repeat(auto-fit, minmax(270px, 1fr));
  gap:1px; background:var(--lm-line); border:1px solid var(--lm-line); margin:10px 0 40px;
}
.lm-tactic{background:var(--lm-bg); padding:26px 24px; transition:background .3s ease}
.lm-tactic:hover{background:#0f0c0c}
.lm-num{font-family:var(--lm-mono); font-size:10px; letter-spacing:.28em; color:var(--lm-red); margin-bottom:10px}
.lm-tactic h4{font-family:var(--lm-serif); font-weight:600; font-size:22px; margin:0 0 10px; color:var(--lm-ink); line-height:1.2}
.lm-tactic p{margin:0; color:var(--lm-dim); font-size:15px; line-height:1.6}

.lm-engine{display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; margin:10px 0 40px; position:relative}
.lm-engine::before{
  content:""; position:absolute; top:50%; left:8%; right:8%; height:1px;
  background:linear-gradient(90deg, transparent, var(--lm-red-deep), transparent); z-index:0;
}
.lm-step{
  background:linear-gradient(180deg, rgba(204,42,42,.04), transparent 60%);
  border:1px solid var(--lm-line); padding:28px 24px; position:relative; z-index:1; text-align:center;
}
.lm-step-num{
  font-family:var(--lm-mono); font-size:10px; letter-spacing:.35em; text-transform:uppercase;
  color:var(--lm-red); border:1px solid var(--lm-red-deep); padding:4px 12px;
  display:inline-block; margin-bottom:16px; background:var(--lm-bg);
}
.lm-step h4{font-family:var(--lm-serif); font-style:italic; font-weight:600; font-size:28px; margin:0 0 12px; color:var(--lm-ink)}
.lm-step p{margin:0; color:var(--lm-dim); font-size:15px; line-height:1.6}

.lm-closing{max-width:780px; margin:30px auto 20px; text-align:center; padding:30px 20px}
.lm-closing p{font-family:var(--lm-serif); font-style:italic; font-size:22px; line-height:1.55; color:var(--lm-ink); margin:0 0 16px}
.lm-closing p:last-child{color:var(--lm-red)}

.lm-footer{
  margin-top:60px; border-top:1px solid var(--lm-line); padding:28px 0 50px;
  font-family:var(--lm-mono); font-size:11px; letter-spacing:.24em; text-transform:uppercase;
  color:var(--lm-mute); display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;
}
.lm-mark{color:var(--lm-red)}

@media (max-width: 780px){
  .lm-wrap{font-size:16px}
  .lm-timeline::before{left:18px}
  .lm-timeline::after{left:18px}
  .lm-event{width:100%; left:0 !important; padding:14px 0 14px 42px; text-align:left !important}
  .lm-event .lm-node{left:11px !important; right:auto !important}
  .lm-event:nth-child(odd) .lm-links{justify-content:flex-start}
  .lm-engine{grid-template-columns:1fr; gap:14px}
  .lm-engine::before{display:none}
  .lm-thesis{padding:28px 22px}
  .lm-thesis p{font-size:17px}
}
`;
