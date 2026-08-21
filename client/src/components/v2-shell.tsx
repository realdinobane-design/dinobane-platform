import { Link } from "wouter";
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import {
  Crown,
  ArrowRight,
  Eye,
  Lock,
} from "lucide-react";
import { useAuth } from "@/App";

/* ────────────────────────────────────────────────────────────────────────────
   V2 SHELL — shared design system extracted from /home-v2.
   Every redesigned page wraps its content in <V2Shell>. The shell:
     • injects the Satoshi font + all .hv2-* animation classes scoped to
       .home-v2-root so styling cannot leak elsewhere
     • renders a small static image banner with the page kicker + title
     • renders the same animated finale at the bottom with CTA
   Old styles on pages NOT using V2Shell remain untouched.
   ──────────────────────────────────────────────────────────────────────── */

export interface V2ShellProps {
  /** Eyebrow text in tracking-widest uppercase. e.g. "The reel". */
  kicker: string;
  /** Big H1 heading. e.g. "Videos". */
  title: string;
  /** Optional sub-headline below the title. */
  subtitle?: string;
  /** Hero banner image. Pick from /brand/hero-*.jpg. */
  bannerImage?: string;
  /** Banner tone: "crimson" (red wash) or "gold" (gold wash). Default crimson. */
  tone?: "crimson" | "gold";
  /** Hide the animated finale at the bottom — useful for auth pages. */
  hideFinale?: boolean;
  /** Hide the banner entirely — useful for short pages like /contact. */
  hideBanner?: boolean;
  /** Optional right-aligned banner action (e.g. CTA button). */
  bannerAction?: ReactNode;
  children: ReactNode;
}

export function V2Shell({
  kicker,
  title,
  subtitle,
  bannerImage = "/brand/hero-tv.jpg",
  tone = "crimson",
  hideFinale,
  hideBanner,
  bannerAction,
  children,
}: V2ShellProps) {
  const { user } = useAuth();

  // Finale reveal on scroll-into-view.
  const finaleRef = useRef<HTMLDivElement | null>(null);
  const [finaleSeen, setFinaleSeen] = useState(false);
  useEffect(() => {
    const el = finaleRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setFinaleSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setFinaleSeen(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const kickerColor = tone === "gold" ? "text-yellow-300" : "text-red-400";

  return (
    <div className="home-v2-root bg-[#0a0a0a]">
      {/* All v2 keyframes + classes namespaced to .home-v2-root. */}
      <style>{V2_STYLES}</style>

      {/* ─── SMALL IMAGE BANNER ───────────────────────────────────────── */}
      {!hideBanner && (
        <section className="relative overflow-hidden border-b border-yellow-500/15">
          <div className="relative h-[280px] sm:h-[340px]">
            {/* Background image with slow pan */}
            <div
              className="absolute inset-0 hv2-pan bg-cover bg-center"
              style={{ backgroundImage: `url(${bannerImage})` }}
              aria-hidden="true"
            />
            {/* Darkening + tonal wash */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  tone === "gold"
                    ? "linear-gradient(110deg, rgba(0,0,0,0.85) 0%, rgba(20,15,5,0.75) 40%, rgba(0,0,0,0.55) 100%)"
                    : "linear-gradient(110deg, rgba(0,0,0,0.85) 0%, rgba(25,8,8,0.78) 40%, rgba(0,0,0,0.55) 100%)",
              }}
              aria-hidden="true"
            />
            {/* Slow drifting golden wash */}
            <div
              className="absolute -inset-1/4 hv2-goldwash pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 30%, rgba(245,200,66,0.20) 0%, rgba(245,200,66,0.05) 35%, transparent 60%)",
              }}
            />
            {/* Subtle scanline grid */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "56px 56px",
              }}
              aria-hidden="true"
            />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-end pb-10">
              <div className="flex items-end justify-between w-full gap-4 flex-wrap">
                <div className="max-w-2xl">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.35em] mb-3 ${kickerColor}`}
                  >
                    {kicker}
                  </p>
                  <h1 className="display text-4xl sm:text-6xl text-white leading-none mb-3">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm sm:text-base text-zinc-300 max-w-xl">
                      {subtitle}
                    </p>
                  )}
                </div>
                {bannerAction && (
                  <div className="flex-shrink-0">{bannerAction}</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── PAGE BODY ─────────────────────────────────────────────────── */}
      <main className="relative">{children}</main>

      {/* ─── ANIMATED FINALE ───────────────────────────────────────────── */}
      {!hideFinale && (
        <section
          ref={finaleRef}
          className={`hv2-finale relative border-t border-yellow-500/15 bg-gradient-to-b from-[#0a0a0a] via-[#100806] to-[#0a0a0a] ${finaleSeen ? "is-revealed" : ""}`}
          data-testid="v2-finale-section"
        >
          <div className="hv2-finale-glow" aria-hidden="true" />

          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            {[...Array(14)].map((_, i) => (
              <span
                key={i}
                className="hv2-spark absolute w-1.5 h-1.5 rounded-full bg-yellow-300/70"
                style={{
                  left: `${(i * 73) % 100}%`,
                  bottom: `${5 + ((i * 41) % 70)}%`,
                  animationDelay: `${(i * 0.31) % 6}s`,
                  filter: "blur(1px)",
                }}
              />
            ))}
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 mb-14">
              <FinaleBox
                kicker="The wire"
                kickerTone="red"
                title="Daily"
                copy="Quick news, sourced and dated. No noise."
                href="/news"
                dx="-80px"
                rot="-4deg"
                slot={1}
              />
              <FinaleBox
                kicker="The files"
                kickerTone="gold"
                title="Timelines"
                copy="Decade-long playbooks, mapped to receipts."
                href="/timelines"
                highlight
                dx="0px"
                rot="0deg"
                slot={2}
              />
              <FinaleBox
                kicker="The reel"
                kickerTone="gold"
                title="Videos"
                copy="Long-form on YouTube. Cuts straight to the point."
                href="/articles"
                dx="80px"
                rot="4deg"
                slot={3}
              />
            </div>

            <div className="hv2-finale-mark flex flex-col items-center text-center">
              <div className="hv2-finale-pulse mb-5 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 text-black">
                <Crown size={28} />
              </div>
              <h2 className="display text-3xl sm:text-5xl leading-[0.95] mb-4">
                <span className="text-white">British politics,</span>{" "}
                <span className="hv2-shimmer-text">documented in receipts.</span>
              </h2>
              <p className="text-sm text-zinc-400 max-w-xl mb-7">
                One subscription. Every timeline. Every file. Cancel any time
                — no contract, no upsell.
              </p>

              {!user?.isMember ? (
                <Link
                  href="/membership"
                  data-testid="link-v2-finale-cta"
                  className="group inline-flex items-center gap-3 rounded-full px-8 py-4 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-black font-extrabold tracking-tight shadow-[0_18px_55px_-10px_rgba(245,200,66,0.65)] hover:scale-[1.03] transition-all"
                >
                  <Crown size={20} />
                  Subscribe — £4.99 / month
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              ) : (
                <Link
                  href="/members"
                  data-testid="link-v2-finale-members"
                  className="group inline-flex items-center gap-3 rounded-full px-8 py-4 bg-white text-black font-extrabold tracking-tight hover:scale-[1.03] transition-all"
                >
                  <Crown size={20} />
                  Open the members’ area
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              )}
            </div>

            <div className="hv2-finale-rule mt-14 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
              <p className="flex items-center gap-2">
                <Eye size={12} className="text-yellow-400/70" />
                British politics, documented in receipts.
              </p>
              <div className="flex items-center gap-5">
                <a
                  href="https://x.com/realdinobane"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hv2-link-anim hover:text-white transition-colors"
                >
                  Follow @realdinobane
                </a>
                <Link
                  href="/contact"
                  className="hv2-link-anim hover:text-white transition-colors"
                >
                  Send a tip
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* ─── Re-usable finale convergence box ───────────────────────────────── */
function FinaleBox({
  kicker,
  kickerTone,
  title,
  copy,
  href,
  highlight,
  dx,
  rot,
  slot,
}: {
  kicker: string;
  kickerTone: "red" | "gold";
  title: string;
  copy: string;
  href: string;
  highlight?: boolean;
  dx: string;
  rot: string;
  slot: 1 | 2 | 3;
}) {
  return (
    <Link
      href={href}
      className={`hv2-finale-box hv2-finale-box-${slot} group rounded-2xl border p-6 text-left transition-shadow ${
        highlight
          ? "border-yellow-500/30 bg-gradient-to-b from-yellow-500/[0.08] to-transparent hover:shadow-[0_18px_50px_-15px_rgba(245,200,66,0.4)]"
          : "border-white/10 bg-black/40 backdrop-blur-sm hover:border-yellow-500/20"
      }`}
      style={
        {
          ["--hv2-dx" as any]: dx,
          ["--hv2-rot" as any]: rot,
        } as CSSProperties
      }
    >
      <div
        className={`text-[10px] font-bold uppercase tracking-[0.35em] mb-2 ${
          kickerTone === "red" ? "text-red-400" : "text-yellow-300"
        }`}
      >
        {kicker}
      </div>
      <div className="display text-3xl text-white leading-none mb-2">
        {title}
      </div>
      <p className="text-sm text-zinc-400 leading-snug">{copy}</p>
    </Link>
  );
}

/* ─── Reusable section heading for use inside a V2Shell body ──────────── */
export function V2SectionHeading({
  kicker,
  title,
  tone = "gold",
  href,
  hrefLabel,
}: {
  kicker: string;
  title: string;
  tone?: "crimson" | "gold";
  href?: string;
  hrefLabel?: string;
}) {
  const kickColor = tone === "crimson" ? "text-red-400" : "text-yellow-300";
  return (
    <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
      <div>
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.35em] mb-2 ${kickColor}`}
        >
          {kicker}
        </p>
        <h2 className="display text-3xl sm:text-5xl text-white leading-none">
          {title}
        </h2>
      </div>
      {href && hrefLabel && (
        <Link
          href={href}
          className="hv2-link-anim text-sm text-zinc-300 hover:text-yellow-300 font-semibold flex items-center gap-1.5 group"
        >
          {hrefLabel}
          <ArrowRight
            size={14}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      )}
    </div>
  );
}

/* ─── Reusable members-only CTA block ─────────────────────────────────── */
export function V2MembersOnlyCTA({
  label = "Subscribe now to unlock",
  caption = "£4.99 / month · Cancel any time",
}: {
  label?: string;
  caption?: string;
}) {
  const { user } = useAuth();
  if (user?.isMember) return null;
  return (
    <div className="my-12 flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em] text-yellow-300/90 mb-3">
        <Lock size={11} className="text-yellow-400" />
        Members only
      </div>
      <Link
        href="/membership"
        className="group inline-flex items-center gap-3 rounded-full px-7 py-3.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-black font-extrabold tracking-tight shadow-[0_10px_40px_-10px_rgba(245,200,66,0.6)] hover:shadow-[0_18px_55px_-10px_rgba(245,200,66,0.85)] hover:scale-[1.03] transition-all"
      >
        <Crown size={18} className="text-black/80" />
        <span>{label}</span>
        <ArrowRight
          size={16}
          className="group-hover:translate-x-1 transition-transform"
        />
      </Link>
      <p className="text-[11px] text-zinc-500 uppercase tracking-widest mt-3">
        {caption}
      </p>
    </div>
  );
}

/* ─── The big style block. Kept as a const string so multiple <V2Shell>
       instances on a page reuse the same <style> tag content. Browsers
       de-dupe identical adjacent style tags via rule caching. ───────── */
const V2_STYLES = `
  .home-v2-root, .home-v2-root * {
    font-family: 'Satoshi', 'Inter', system-ui, -apple-system,
      'Segoe UI', sans-serif;
    font-feature-settings: 'ss01', 'ss02';
  }
  .home-v2-root .display {
    font-family: 'Satoshi', 'Inter', system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.025em;
  }

  /* Slow golden wash that drifts diagonally. */
  @keyframes hv2-goldwash {
    0%   { transform: translate3d(-15%, -10%, 0) rotate(8deg); opacity: .55; }
    50%  { transform: translate3d( 10%,  5%, 0) rotate(8deg); opacity: .85; }
    100% { transform: translate3d(-15%, -10%, 0) rotate(8deg); opacity: .55; }
  }
  .home-v2-root .hv2-goldwash {
    animation: hv2-goldwash 18s ease-in-out infinite;
  }

  /* Animated headline gradient sweep. */
  @keyframes hv2-shimmer {
    0%   { background-position:   0% 50%; }
    100% { background-position: 200% 50%; }
  }
  .home-v2-root .hv2-shimmer-text {
    background: linear-gradient(
      90deg,
      #f5c842 0%,
      #ffe7a1 25%,
      #f5c842 50%,
      #c0212b 75%,
      #f5c842 100%
    );
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: hv2-shimmer 8s linear infinite;
  }

  /* Slowly seeping golden glow. */
  @keyframes hv2-seep-a {
    0%, 100% { transform: translate(-10%, -20%) scale(1);   opacity: .55; }
    50%      { transform: translate( 12%,  8%) scale(1.25); opacity: .9; }
  }
  @keyframes hv2-seep-b {
    0%, 100% { transform: translate( 18%,  20%) scale(.9);  opacity: .35; }
    50%      { transform: translate(-12%, -10%) scale(1.15); opacity: .7; }
  }
  .home-v2-root .hv2-seep-a {
    animation: hv2-seep-a 14s ease-in-out infinite;
  }
  .home-v2-root .hv2-seep-b {
    animation: hv2-seep-b 17s ease-in-out infinite;
  }

  /* Slow pan. */
  @keyframes hv2-pan {
    0%, 100% { transform: scale(1.08) translate3d(-1%, 0, 0); }
    50%      { transform: scale(1.08) translate3d( 1%, -1%, 0); }
  }
  .home-v2-root .hv2-pan {
    animation: hv2-pan 26s ease-in-out infinite;
  }

  /* Float ambience. */
  @keyframes hv2-float {
    0%   { transform: translateY(0)    translateX(0)    scale(1);   opacity: .25; }
    50%  { transform: translateY(-40px) translateX(20px) scale(1.4); opacity: .7;  }
    100% { transform: translateY(0)    translateX(0)    scale(1);   opacity: .25; }
  }
  .home-v2-root .hv2-float {
    animation: hv2-float 10s ease-in-out infinite;
  }

  /* Soft pulse. */
  @keyframes hv2-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,200,66,0.55); }
    70%      { box-shadow: 0 0 0 14px rgba(245,200,66,0); }
  }
  .home-v2-root .hv2-pulse {
    animation: hv2-pulse 2.2s ease-in-out infinite;
  }

  /* Marquee. */
  @keyframes hv2-marq {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .home-v2-root .hv2-marq {
    animation: hv2-marq 55s linear infinite;
  }
  .home-v2-root .hv2-marq:hover { animation-play-state: paused; }

  /* Underline on link hover. */
  .home-v2-root .hv2-link-anim {
    background-image: linear-gradient(currentColor, currentColor);
    background-size: 0% 1px;
    background-repeat: no-repeat;
    background-position: 0 100%;
    transition: background-size .35s ease;
  }
  .home-v2-root .hv2-link-anim:hover { background-size: 100% 1px; }

  /* Card lift on hover. */
  .home-v2-root .hv2-tilt {
    transition: transform .5s cubic-bezier(.2,.8,.2,1),
                box-shadow .5s ease;
  }
  .home-v2-root .hv2-tilt:hover {
    transform: translateY(-6px) scale(1.01);
    box-shadow: 0 30px 60px -20px rgba(192,33,43,0.35),
                0 18px 30px -15px rgba(245,200,66,0.25);
  }

  /* FINALE: scroll-triggered convergence animation. */
  .home-v2-root .hv2-finale {
    position: relative;
    overflow: hidden;
    isolation: isolate;
  }
  .home-v2-root .hv2-finale-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse 80% 60% at 50% 110%,
        rgba(245,200,66,0.55) 0%,
        rgba(245,200,66,0.18) 35%,
        rgba(192,33,43,0.10) 60%,
        transparent 80%);
    clip-path: inset(100% 0 0 0);
    opacity: 0;
    transition: clip-path 1.6s cubic-bezier(.2,.8,.2,1) .15s,
                opacity 1.6s ease .15s;
  }
  .home-v2-root .hv2-finale.is-revealed .hv2-finale-glow {
    clip-path: inset(0 0 0 0);
    opacity: 1;
  }
  @keyframes hv2-spark {
    0%   { transform: translate3d(0,0,0) scale(1);   opacity: .25; }
    50%  { transform: translate3d(8px,-26px,0) scale(1.35); opacity: .85; }
    100% { transform: translate3d(0,0,0) scale(1);   opacity: .25; }
  }
  .home-v2-root .hv2-finale.is-revealed .hv2-spark {
    animation: hv2-spark 6s ease-in-out infinite;
  }
  .home-v2-root .hv2-finale-box {
    opacity: 0;
    transform: translate3d(var(--hv2-dx, 0), 30px, 0) scale(.85) rotate(var(--hv2-rot, 0deg));
    filter: blur(8px);
    transition: opacity 1.2s ease, transform 1.4s cubic-bezier(.2,.8,.2,1),
                filter 1.4s ease;
  }
  .home-v2-root .hv2-finale.is-revealed .hv2-finale-box {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
    filter: blur(0);
  }
  .home-v2-root .hv2-finale.is-revealed .hv2-finale-box-1 { transition-delay: .15s; }
  .home-v2-root .hv2-finale.is-revealed .hv2-finale-box-2 { transition-delay: .35s; }
  .home-v2-root .hv2-finale.is-revealed .hv2-finale-box-3 { transition-delay: .55s; }

  .home-v2-root .hv2-finale-mark {
    opacity: 0;
    transform: scale(.6);
    transition: opacity .9s ease 1s, transform 1.1s cubic-bezier(.2,.8,.2,1) 1s;
  }
  .home-v2-root .hv2-finale.is-revealed .hv2-finale-mark {
    opacity: 1;
    transform: scale(1);
  }
  @keyframes hv2-finale-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,200,66,0.55),
                           0 0 60px 0 rgba(245,200,66,0.35); }
    50%      { box-shadow: 0 0 0 16px rgba(245,200,66,0),
                           0 0 90px 0 rgba(245,200,66,0.55); }
  }
  .home-v2-root .hv2-finale.is-revealed .hv2-finale-pulse {
    animation: hv2-finale-pulse 2.6s ease-in-out infinite 1.4s;
  }
  .home-v2-root .hv2-finale-rule {
    transform: scaleX(0);
    transform-origin: 50% 50%;
    transition: transform 1.4s cubic-bezier(.2,.8,.2,1) .7s;
  }
  .home-v2-root .hv2-finale.is-revealed .hv2-finale-rule {
    transform: scaleX(1);
  }

  /* Reduced-motion: respect the user. */
  @media (prefers-reduced-motion: reduce) {
    .home-v2-root .hv2-goldwash,
    .home-v2-root .hv2-shimmer-text,
    .home-v2-root .hv2-seep-a,
    .home-v2-root .hv2-seep-b,
    .home-v2-root .hv2-pan,
    .home-v2-root .hv2-float,
    .home-v2-root .hv2-pulse,
    .home-v2-root .hv2-marq,
    .home-v2-root .hv2-spark { animation: none !important; }
    .home-v2-root .hv2-finale-glow,
    .home-v2-root .hv2-finale-box,
    .home-v2-root .hv2-finale-mark,
    .home-v2-root .hv2-finale-rule {
      opacity: 1 !important;
      transform: none !important;
      clip-path: none !important;
      filter: none !important;
    }
  }
`;
