import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/App";
import { TIMELINES } from "@/lib/timelines";
import { getPageStatus } from "@/lib/page-status";
import { Settings, ArrowUpRight, Radio, CircleDot } from "lucide-react";

const ADMIN_EMAILS = new Set([
  "realdinobane@gmail.com",
  "yingchanzeng@gmail.com",
]);

/**
 * Hub page that indexes every DinoBane Timeline.
 * Uses the same dossier / intel-file aesthetic as the Long March page so the
 * visitor lands somewhere that feels like a continuation of the brand, not a
 * generic CMS listing.
 */
export default function TimelinesPage() {
  const { user } = useAuth();
  const isAdmin = !!user && ADMIN_EMAILS.has(user.email);

  // Load the two fonts we use on this page (once).
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

  return (
    <div className="tl-wrap">
      <style>{CSS}</style>

      {/* Dossier stripe — mirrors the one on the Long March page */}
      <div className="tl-dossier">
        <span className="tl-tag">DOSSIER // DB-TL-INDEX</span>
        <span className="tl-stamp">EYES ONLY · ARCHIVE</span>
        <span>FILE: TIMELINES / v1.0</span>
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

      <div className="tl-count">
        <span>Classification Index</span>
        <span className="tl-dot" />
        <span>
          {TIMELINES.length}{" "}
          {TIMELINES.length === 1 ? "dossier" : "dossiers"} on file
        </span>
      </div>

      <section className="tl-grid">
        {TIMELINES.map((t) => (
          <TimelineCard key={t.slug} slug={t.slug} isAdmin={isAdmin} />
        ))}
        <ComingSoonCard />
      </section>

      <footer className="tl-footer">
        <span>
          DinoBane Intel · <span className="tl-mark">//</span> Archive
        </span>
        <span>v1.0</span>
        <span>
          <span className="tl-mark">//</span> dinobane.com
        </span>
      </footer>
    </div>
  );
}

function TimelineCard({ slug, isAdmin }: { slug: string; isAdmin: boolean }) {
  const t = TIMELINES.find((x) => x.slug === slug)!;

  // Fetch live/standby status so we can show the correct chip.
  const { data: status = "live" } = useQuery({
    queryKey: [`/api/page-status/${slug}`],
    queryFn: () => getPageStatus(slug),
    staleTime: 30_000,
    retry: 1,
  });

  const onStandby = status === "standby";

  // Non-admin visitors can't open a standby timeline — the view page would show
  // them the placeholder. Hide the whole card instead of leading them there.
  if (onStandby && !isAdmin) return null;

  return (
    <article className={`tl-card${onStandby ? " tl-card-standby" : ""}`}>
      {/* Admin cog — only rendered for admins */}
      {isAdmin && t.editPath && (
        <Link
          href={t.editPath}
          className="tl-cog"
          aria-label={`Edit ${t.title}`}
          data-testid={`link-edit-${t.slug}`}
        >
          <Settings size={14} />
        </Link>
      )}

      <Link
        href={t.viewPath}
        className="tl-card-link"
        data-testid={`link-timeline-${t.slug}`}
      >
        <div className="tl-card-top">
          <span className="tl-card-code">{t.dossierCode}</span>
          <span
            className={`tl-chip ${
              onStandby ? "tl-chip-standby" : "tl-chip-live"
            }`}
          >
            {onStandby ? (
              <>
                <CircleDot size={9} /> STANDBY
              </>
            ) : (
              <>
                <Radio size={9} /> LIVE
              </>
            )}
          </span>
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
          Open dossier <ArrowUpRight size={13} />
        </div>
      </Link>
    </article>
  );
}

function ComingSoonCard() {
  return (
    <article className="tl-card tl-card-empty" aria-hidden>
      <div className="tl-card-top">
        <span className="tl-card-code">DB-XX-???</span>
        <span className="tl-chip tl-chip-pending">PENDING</span>
      </div>
      <div className="tl-category">New dossier</div>
      <h2 className="tl-title">More on the way</h2>
      <p className="tl-subtitle">
        Additional DinoBane Timelines are under research. Check back soon.
      </p>
      <ul className="tl-tags">
        <li>archive growing</li>
      </ul>
      <div className="tl-open tl-open-muted">Filed under pending…</div>
    </article>
  );
}

// ─── Scoped CSS (tl- prefix keeps it from leaking into the rest of the site) ─
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
  content:""; position:absolute; inset:0; pointer-events:none; opacity:.05;
  background:
    repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,.03) 3px 4px),
    radial-gradient(circle at 20% 10%, rgba(204,42,42,.12), transparent 60%);
}

.tl-dossier{
  display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap;
  font-family:var(--tl-mono); font-size:11px; letter-spacing:.28em; text-transform:uppercase;
  color:var(--tl-mute); border-top:1px solid var(--tl-line); border-bottom:1px solid var(--tl-line);
  padding:14px 0; margin-bottom:48px;
}
.tl-tag{color:var(--tl-red)}
.tl-stamp{color:var(--tl-gold); border:1px solid var(--tl-gold-soft); padding:5px 12px; letter-spacing:.3em}

.tl-hero{text-align:center; margin-bottom:36px; position:relative; z-index:1}
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

.tl-count{
  display:flex; align-items:center; justify-content:center; gap:14px;
  font-family:var(--tl-mono); font-size:11px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--tl-mute); margin-bottom:28px;
}
.tl-count .tl-dot{width:4px; height:4px; background:var(--tl-red); border-radius:50%; display:inline-block}

.tl-grid{
  display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));
  gap:20px; margin-bottom:60px; position:relative; z-index:1;
}

.tl-card{
  position:relative;
  background:linear-gradient(180deg, rgba(255,255,255,.02), rgba(0,0,0,.28));
  border:1px solid var(--tl-line); transition:transform .3s ease, border-color .3s ease, box-shadow .3s ease;
}
.tl-card:hover{
  transform:translateY(-3px);
  border-color:var(--tl-red-deep);
  box-shadow:0 14px 44px rgba(204,42,42,.14);
}
.tl-card-standby{opacity:.88}
.tl-card-standby:hover{border-color:var(--tl-gold-soft); box-shadow:0 14px 44px rgba(212,162,74,.08)}

.tl-card-link{
  display:flex; flex-direction:column; gap:10px;
  padding:24px 24px 22px; text-decoration:none; color:inherit; height:100%;
}
.tl-card-top{
  display:flex; justify-content:space-between; align-items:center;
  font-family:var(--tl-mono); font-size:10.5px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--tl-mute);
}
.tl-card-code{color:var(--tl-red)}

.tl-chip{
  display:inline-flex; align-items:center; gap:5px; border:1px solid;
  padding:4px 9px; font-family:var(--tl-mono); font-size:9.5px;
  letter-spacing:.3em; text-transform:uppercase;
}
.tl-chip-live{color:#ff7b7b; border-color:rgba(204,42,42,.55)}
.tl-chip-standby{color:#f0c57a; border-color:var(--tl-gold-soft)}
.tl-chip-pending{color:#7a7266; border-color:rgba(255,255,255,.1)}

.tl-category{
  font-family:var(--tl-mono); font-size:10px; letter-spacing:.3em;
  text-transform:uppercase; color:var(--tl-gold); margin-top:2px;
}
.tl-title{
  font-family:var(--tl-serif); font-weight:600; font-size:30px; line-height:1.1;
  margin:4px 0 6px; color:var(--tl-ink);
}
.tl-subtitle{
  font-family:var(--tl-serif); font-style:italic; font-size:16.5px;
  color:var(--tl-dim); margin:0 0 10px; line-height:1.5;
}

.tl-tags{
  list-style:none; padding:0; margin:4px 0 0; display:flex; flex-wrap:wrap;
  gap:6px; font-family:var(--tl-mono); font-size:10px;
  letter-spacing:.22em; text-transform:uppercase;
}
.tl-tags li{
  border:1px solid var(--tl-line); padding:3px 8px; color:var(--tl-mute);
}

.tl-open{
  margin-top:auto; padding-top:14px; border-top:1px solid var(--tl-line);
  font-family:var(--tl-mono); font-size:11px; letter-spacing:.28em;
  text-transform:uppercase; color:var(--tl-ink); display:inline-flex;
  align-items:center; gap:6px; transition:color .25s ease, gap .25s ease;
}
.tl-card:hover .tl-open{color:var(--tl-red); gap:10px}
.tl-open-muted{color:var(--tl-mute)}
.tl-card-empty{background:transparent; border-style:dashed; opacity:.7}
.tl-card-empty:hover{transform:none; box-shadow:none; border-color:var(--tl-line)}

.tl-cog{
  position:absolute; top:10px; right:10px; z-index:2;
  width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center;
  color:var(--tl-mute); border:1px solid var(--tl-line);
  background:rgba(0,0,0,.4); backdrop-filter:blur(4px);
  transition:color .2s ease, border-color .2s ease, background .2s ease, transform .4s ease;
}
.tl-cog:hover{color:var(--tl-gold); border-color:var(--tl-gold-soft); background:rgba(212,162,74,.1); transform:rotate(60deg)}

.tl-footer{
  margin-top:60px; border-top:1px solid var(--tl-line); padding:28px 0 10px;
  font-family:var(--tl-mono); font-size:11px; letter-spacing:.24em;
  text-transform:uppercase; color:var(--tl-mute);
  display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;
}
.tl-mark{color:var(--tl-red)}

@media (max-width:780px){
  .tl-wrap{padding:28px 18px 60px}
  .tl-hero h1{font-size:58px}
  .tl-sub{font-size:17px}
  .tl-dossier{gap:10px; padding:12px 0; margin-bottom:32px}
  .tl-title{font-size:26px}
}
`;
