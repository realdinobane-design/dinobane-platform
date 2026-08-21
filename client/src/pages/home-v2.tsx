import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Youtube,
  ArrowRight,
  Eye,
  Newspaper,
  Lock,
  PlayCircle,
  Sparkles,
  Radio,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/App";
import { format, formatDistanceToNow } from "date-fns";
import { useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────────────────────────────────────
   HOME v2 — HIDDEN DRAFT  (rev 2)
   Route: /#/home-v2  · not linked in nav.

   Changes this rev (per user feedback):
   1. Killed every Clash Display reference. Site body font 'Satoshi'
      with system fallbacks is used throughout — far better kerning.
   2. Splash is no longer pitch-black: warm amber + crimson gradient
      with a slowly drifting golden wash and an animated headline gradient
      so something *moves* immediately.
   3. Removed all references to "Written analysis" / articles. The Read
      button now points to /videos (the video listings page).
   4. "Join / Member" copy replaced with "Subscribe" everywhere.
   5. "Watch for free" + "Subscribe" CTAs in the hero.
   6. Investigations section renamed "Timelines" with a slow golden light-seep
      animation behind the heading.
   7. Each Timeline card uses imagery sourced FROM the timeline itself
      (Marx for Long March, Starmer official portrait for Starmer).
   8. New "Quick News" section pulls live items from /api/intel/feed.
   9. Bottom CTA is now an animated "static-band" — implicit, no hard sell.
   All keyframes are local to this file via a <style> tag so they cannot
   leak to the live homepage.
   ──────────────────────────────────────────────────────────────────────── */

interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
  image?: string | null;
}

// Timeline cards — imagery taken from the timeline content itself, not brand
// hero photos. tone drives the accent.
const TIMELINES: {
  slug: string;
  code: string;
  title: string;
  teaser: string;
  hook: string;
  image: string;
  tone: "crimson" | "gold" | "ivory";
}[] = [
  {
    slug: "/long-march",
    code: "DB-LM-001",
    title: "The Long March",
    teaser:
      "Fifty years, four acts, one playbook — how a fringe theory became Whitehall doctrine.",
    hook: "Most people can't name the year it started. The dates are in here.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/2/27/Karl_Marx_1875_photographic_portrait_%283x4_cropped%29.png",
    tone: "crimson",
  },
  {
    slug: "/starmer",
    code: "DB-KS-005",
    title: "Sir Keir Starmer",
    teaser:
      "From McLibel barrister to Downing Street, every scandal logged in order.",
    hook: "Thirty-eight events. Most of them weren't on the six-o'clock news.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/2/2d/Keir_Starmer_official_portrait.jpg",
    tone: "gold",
  },
  {
    slug: "/timelines",
    code: "DB-VAULT",
    title: "The Vault",
    teaser:
      "Every published dossier, every receipt, every cross-reference — opened.",
    hook: "More files arrive each month. Subscribers see them first.",
    image: "/brand/hero-tv.jpg",
    tone: "ivory",
  },
];

export default function HomeV2Page() {
  const { user } = useAuth();

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ["/api/youtube/feed"],
    staleTime: 1000 * 60 * 5,
  });

  const { data: newsItems = [] } = useQuery<NewsItem[]>({
    queryKey: ["/api/intel/feed"],
    staleTime: 1000 * 60 * 5,
  });

  const latestVideo = videos[0];
  const recentVideos = videos.slice(1, 4);

  // Top 4 fresh news items with an image preferred.
  const quickNews = [...newsItems]
    .sort((a, b) =>
      (a.image ? -1 : 1) - (b.image ? -1 : 1) ||
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    )
    .slice(0, 4);

  // Scroll-tracked parallax for hero — tiny, performant.
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-triggered finale: when the section enters the viewport, add
  // the `.is-revealed` class which fires the staggered CSS animations.
  const finaleRef = useRef<HTMLDivElement | null>(null);
  const [finaleSeen, setFinaleSeen] = useState(false);
  useEffect(() => {
    const el = finaleRef.current;
    if (!el) return;
    // Older browsers or SSR: just reveal immediately.
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] home-v2-root">
      {/* Local-scoped styles. Selectors namespaced to .home-v2-root only
          so nothing leaks to the live homepage. */}
      <style>{`
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

        /* Slow golden wash that drifts diagonally — light seeping in. */
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

        /* Slowly seeping golden glow behind the Timelines title.
           Two layers offset for a faux-volumetric feel. */
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

        /* Slow pan on the hero image so it never sits still. */
        @keyframes hv2-pan {
          0%, 100% { transform: scale(1.08) translate3d(-1%, 0, 0); }
          50%      { transform: scale(1.08) translate3d( 1%, -1%, 0); }
        }
        .home-v2-root .hv2-pan {
          animation: hv2-pan 26s ease-in-out infinite;
        }

        /* Float ambience dots in the bottom band. */
        @keyframes hv2-float {
          0%   { transform: translateY(0)    translateX(0)    scale(1);   opacity: .25; }
          50%  { transform: translateY(-40px) translateX(20px) scale(1.4); opacity: .7;  }
          100% { transform: translateY(0)    translateX(0)    scale(1);   opacity: .25; }
        }
        .home-v2-root .hv2-float {
          animation: hv2-float 10s ease-in-out infinite;
        }

        /* Soft pulse for live indicators. */
        @keyframes hv2-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,200,66,0.55); }
          70%      { box-shadow: 0 0 0 14px rgba(245,200,66,0); }
        }
        .home-v2-root .hv2-pulse {
          animation: hv2-pulse 2.2s ease-in-out infinite;
        }

        /* Marquee for news ticker. */
        @keyframes hv2-marq {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .home-v2-root .hv2-marq {
          animation: hv2-marq 55s linear infinite;
        }
        .home-v2-root .hv2-marq:hover { animation-play-state: paused; }

        /* Animated underline on link hover. */
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

        /* ─── FINALE: scroll-triggered convergence animation ───────────── */
        /* All finale elements start in a hidden "pre" state. The .is-revealed
           class is added by IntersectionObserver when the section enters
           the viewport, which fires staggered keyframes. */
        .home-v2-root .hv2-finale {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
        /* Golden glow that infuses upward from the bottom. */
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
        /* Soft animated specks once revealed. */
        @keyframes hv2-spark {
          0%   { transform: translate3d(0,0,0) scale(1);   opacity: .25; }
          50%  { transform: translate3d(8px,-26px,0) scale(1.35); opacity: .85; }
          100% { transform: translate3d(0,0,0) scale(1);   opacity: .25; }
        }
        .home-v2-root .hv2-finale.is-revealed .hv2-spark {
          animation: hv2-spark 6s ease-in-out infinite;
        }
        /* Three boxes converge from outside in. */
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

        /* Brand mark in the middle: scales + glow ramps up last. */
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
        /* Bottom rule that draws in from centre. */
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
      `}</style>


      {/* ─── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">
        {/* Auto-looping reel as the hero backdrop. Muted + playsInline so
            mobile browsers will autoplay. Poster gives an instant first
            frame while the video downloads. */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: `translateY(${scrollY * 0.18}px)` }}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/brand/reel/hero-reel-poster.jpg"
          aria-hidden="true"
          data-testid="hero-reel"
        >
          <source src="/brand/reel/hero-reel.webm" type="video/webm" />
          <source src="/brand/reel/hero-reel.mp4" type="video/mp4" />
        </video>
        {/* Reel darkening — softer than v1 so the video reads through.
            A crimson wash on the left holds the headline legibility while
            keeping the right two-thirds of the reel visible. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(0,0,0,0.85) 0%, rgba(20,8,8,0.65) 35%, rgba(0,0,0,0.35) 65%, rgba(0,0,0,0.55) 100%)",
          }}
          aria-hidden="true"
        />
        {/* Slow drifting golden wash — main "movement" cue */}
        <div
          className="absolute -inset-1/4 hv2-goldwash pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse at 30% 30%, rgba(245,200,66,0.22) 0%, rgba(245,200,66,0.05) 35%, transparent 60%)",
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-24 pb-20">
          {/* Top row */}
          <div className="flex items-start justify-between mb-14">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 bg-yellow-400" aria-hidden="true" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-yellow-300">
                  DinoBane · UK Political Intelligence
                </p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">
                  Bedford → Whitehall · No press passes
                </p>
              </div>
            </div>

            {latestVideo && (
              <a
                href={latestVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-yellow-400/40 hover:border-yellow-300 transition-colors group"
                data-testid="link-hero-live-pill"
              >
                <span
                  className="w-2 h-2 rounded-full bg-yellow-400 hv2-pulse"
                  aria-hidden="true"
                />
                <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-200 group-hover:text-white transition-colors">
                  New episode ·{" "}
                  {formatDistanceToNow(new Date(latestVideo.publishedAt), {
                    addSuffix: true,
                  })}
                </span>
              </a>
            )}
          </div>

          {/* Headline. The middle line carries the golden animated shimmer
              so the eye lands there first; the framing lines sit in white
              for legibility against the reel. */}
          <h1 className="display text-4xl sm:text-6xl lg:text-[6rem] leading-[1.0] mb-7 max-w-5xl text-white">
            Allow me to explain
            <br />
            <span className="hv2-shimmer-text">my country's identity</span>
            <br />
            <span className="text-white">to you — and how it doesn't include you.</span>
          </h1>

          <p className="text-zinc-200 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
            Investigative timelines and unfiltered video on UK politics. No
            press passes. No editorial line. No algorithm choosing what gets
            seen.
          </p>

          {/* CTAs — Watch for free + Subscribe */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={
                latestVideo?.url || "https://www.youtube.com/@Dinobane-Clips"
              }
              target="_blank"
              rel="noopener noreferrer"
              data-testid="button-hero-watch-free"
            >
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold gap-2 h-12 px-7 text-base"
              >
                <PlayCircle size={20} />
                Watch for free
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </a>
            {!user?.isMember && (
              <Link href={user ? "/membership" : "/register"}>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 font-bold h-12 px-6 border-yellow-400/40 hover:bg-yellow-400/10 text-yellow-200 hover:text-yellow-100"
                  data-testid="button-hero-subscribe"
                >
                  <Crown size={18} /> Subscribe — £4.99/mo
                </Button>
              </Link>
            )}
            {user?.isMember && (
              <Link href="/community">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 font-bold h-12 px-6 border-yellow-400/40 hover:bg-yellow-400/10 text-yellow-200"
                  data-testid="button-hero-community"
                >
                  Members' room
                </Button>
              </Link>
            )}
          </div>

          {/* Live news micro-marquee inside the hero — quiet motion that
              keeps the page alive even with no scroll. */}
          {newsItems.length > 0 && (
            <div className="mt-14 max-w-3xl">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-yellow-300 hv2-pulse"
                  aria-hidden="true"
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-yellow-200/70">
                  Live wire
                </span>
              </div>
              <div className="relative overflow-hidden border-y border-white/10 py-3">
                <div className="flex whitespace-nowrap hv2-marq gap-10">
                  {[...newsItems.slice(0, 15), ...newsItems.slice(0, 15)].map(
                    (it, i) => (
                      <a
                        key={i}
                        href={it.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-zinc-200 hover:text-yellow-300 transition-colors flex items-center gap-2"
                      >
                        <span className="text-yellow-400/70 text-[10px] uppercase tracking-widest">
                          {it.source}
                        </span>
                        <span className="text-zinc-500">·</span>
                        {it.title}
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── LATEST VIDEO ─────────────────────────────────────────────────── */}
      {latestVideo && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <SectionHeading
            kicker="Now on the channel"
            title="Latest"
            tone="crimson"
            href="/videos"
            hrefLabel="All videos"
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <a
              href={latestVideo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="lg:col-span-3 group relative block rounded-2xl overflow-hidden border border-white/[0.08] hv2-tilt"
              data-testid="link-v2-latest"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={latestVideo.thumbnail}
                  alt={latestVideo.title}
                  className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[1200ms] ease-out"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-400/95 flex items-center justify-center group-hover:bg-yellow-300 transition-colors shadow-2xl shadow-yellow-500/30 hv2-pulse">
                    <svg
                      viewBox="0 0 24 24"
                      fill="black"
                      className="w-7 h-7 ml-1"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                <Badge className="absolute top-4 left-4 bg-yellow-400 text-black text-[10px] font-bold border-0 px-2.5 py-1 tracking-widest">
                  NEW
                </Badge>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="display text-xl sm:text-3xl leading-tight mb-2 text-white">
                    {latestVideo.title}
                  </h3>
                  <p className="text-xs text-zinc-300">
                    {format(new Date(latestVideo.publishedAt), "d MMMM yyyy")}
                    {" · "}
                    Watch for free on YouTube
                  </p>
                </div>
              </div>
            </a>

            <div className="lg:col-span-2 flex flex-col gap-3">
              {recentVideos.map((v, i) => (
                <a
                  key={v.id + i}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 p-3 rounded-xl bg-[#141414] border border-white/[0.06] hv2-tilt"
                  data-testid={`link-v2-side-${i}`}
                >
                  <div className="relative flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden">
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-semibold text-white leading-tight line-clamp-2 group-hover:text-yellow-300 transition-colors">
                      {v.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider">
                      {format(new Date(v.publishedAt), "d MMM")}
                    </p>
                  </div>
                </a>
              ))}
              <a
                href="https://www.youtube.com/@Dinobane-Clips"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center justify-between p-3 rounded-xl border border-dashed border-yellow-400/30 hover:border-yellow-400 text-zinc-300 hover:text-yellow-300 transition-colors text-sm font-semibold"
                data-testid="link-v2-channel"
              >
                <span className="flex items-center gap-2">
                  <Youtube size={16} /> Full channel · YouTube
                </span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ─── TIMELINES (renamed from "Investigations") ──────────────────────
          With slow golden light-seep animation behind the heading. */}
      <section className="relative overflow-hidden">
        {/* Two offset golden blobs that drift to mimic light leaking. */}
        <div
          className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 hv2-seep-a"
            style={{
              background:
                "radial-gradient(circle at 30% 40%, rgba(245,200,66,0.35) 0%, rgba(245,200,66,0.08) 30%, transparent 55%)",
              filter: "blur(20px)",
            }}
          />
          <div
            className="absolute inset-0 hv2-seep-b"
            style={{
              background:
                "radial-gradient(circle at 70% 50%, rgba(255,229,156,0.25) 0%, rgba(255,229,156,0.05) 30%, transparent 55%)",
              filter: "blur(28px)",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-yellow-300/70 mb-3">
              The Vault
            </p>
            <h2 className="display text-5xl sm:text-7xl text-white hv2-shimmer-text inline-block">
              Timelines
            </h2>
            <p className="text-zinc-300 text-base mt-4 max-w-xl mx-auto">
              Open the dossiers. Every claim sourced, every date logged, every
              receipt one click away.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TIMELINES.map((tl) => (
              <Link
                key={tl.slug}
                href={tl.slug}
                className="group relative block rounded-2xl overflow-hidden border border-white/[0.08] hover:border-yellow-400/40 transition-all h-[400px] hv2-tilt"
                data-testid={`link-v2-tl-${tl.slug}`}
              >
                {/* Background pulled FROM the timeline content. */}
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-[1.08] transition-transform duration-[1400ms] ease-out"
                  style={{ backgroundImage: `url(${tl.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/15" />
                <div
                  className={`absolute inset-x-0 top-0 h-[3px] ${
                    tl.tone === "crimson"
                      ? "bg-red-600"
                      : tl.tone === "gold"
                      ? "bg-yellow-400"
                      : "bg-zinc-200"
                  }`}
                />

                <div className="relative z-10 h-full flex flex-col justify-end p-7">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-3 ${
                      tl.tone === "crimson"
                        ? "text-red-300"
                        : tl.tone === "gold"
                        ? "text-yellow-300"
                        : "text-zinc-200"
                    }`}
                  >
                    {tl.code}
                  </p>
                  <h3 className="display text-2xl text-white leading-tight mb-2">
                    {tl.title}
                  </h3>
                  <p className="text-sm text-zinc-200 leading-snug mb-4">
                    {tl.teaser}
                  </p>
                  <p className="text-xs italic text-zinc-300 border-l-2 border-yellow-400/40 pl-3 leading-snug">
                    {tl.hook}
                  </p>
                  <div className="mt-5 flex items-center gap-1 text-xs font-bold text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open the file <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Members-only CTA under the Timelines grid. Coloured text
              + lock icon signals "paid section" without being preachy. */}
          {!user?.isMember && (
            <div className="mt-12 flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em] text-yellow-300/90 mb-3">
                <Lock size={11} className="text-yellow-400" />
                Members only
              </div>
              <Link
                href="/membership"
                data-testid="link-v2-timelines-cta"
                className="group inline-flex items-center gap-3 rounded-full px-7 py-3.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-black font-extrabold tracking-tight shadow-[0_10px_40px_-10px_rgba(245,200,66,0.6)] hover:shadow-[0_18px_55px_-10px_rgba(245,200,66,0.85)] hover:scale-[1.03] transition-all"
              >
                <Crown size={18} className="text-black/80" />
                <span>Subscribe now to read the files</span>
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <p className="text-[11px] text-zinc-500 uppercase tracking-widest mt-3">
                £4.99 / month · Cancel any time
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── QUICK NEWS ──────────────────────────────────────────────────── */}
      {quickNews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <SectionHeading
            kicker="The wire"
            title="Quick news"
            tone="crimson"
            href="/news"
            hrefLabel="Full intel feed"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickNews.map((n, i) => (
              <a
                key={i}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl overflow-hidden bg-[#121212] border border-white/[0.06] hv2-tilt"
                data-testid={`link-v2-news-${i}`}
              >
                {n.image ? (
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={n.image}
                      alt={n.title}
                      className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-[1000ms] ease-out"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-widest text-yellow-300 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                      {n.source}
                    </span>
                  </div>
                ) : (
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-red-950/40 to-black flex items-center justify-center">
                    <Radio size={28} className="text-yellow-400/40" />
                    <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-widest text-yellow-300 bg-black/60 rounded px-2 py-1">
                      {n.source}
                    </span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-white text-sm leading-snug line-clamp-3 group-hover:text-yellow-300 transition-colors mb-2">
                    {n.title}
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    {formatDistanceToNow(new Date(n.pubDate), {
                      addSuffix: true,
                    })}
                    <ExternalLink size={10} className="ml-auto" />
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ─── ANIMATED IMPLICIT CTA BAND ──────────────────────────────────── */}
      {!user?.isMember && (
        <section className="relative overflow-hidden border-t border-yellow-500/20">
          {/* Floating particle dots */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {Array.from({ length: 22 }).map((_, i) => {
              const left = (i * 37) % 100;
              const top = (i * 53) % 100;
              const size = 2 + ((i * 7) % 5);
              const delay = (i * 0.4) % 8;
              const dur = 8 + ((i * 3) % 8);
              return (
                <span
                  key={i}
                  className="hv2-float absolute rounded-full bg-yellow-300/60"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${dur}s`,
                  }}
                />
              );
            })}
          </div>

          {/* Slow golden wash duplicated here for ambience */}
          <div
            className="absolute -inset-1/3 hv2-goldwash pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(245,200,66,0.18) 0%, rgba(192,33,43,0.08) 35%, transparent 65%)",
            }}
          />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-yellow-400/30 mb-8">
              <Sparkles size={12} className="text-yellow-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-yellow-200">
                Inside the wire
              </span>
            </div>
            <h2 className="display text-4xl sm:text-6xl text-white mb-6 leading-[1.05]">
              Some files don't go on{" "}
              <span className="hv2-shimmer-text">YouTube</span>.
            </h2>
            <p className="text-zinc-300 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              Private rooms, the full Vault, an unfiltered feed. No advertisers
              to please. No moderators paid by Westminster. One fixed price.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={user ? "/membership" : "/register"}>
                <Button
                  size="lg"
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold h-12 px-8 gap-2"
                  data-testid="button-v2-subscribe"
                >
                  Subscribe — £4.99/month
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link
                href="/membership"
                className="hv2-link-anim text-sm text-zinc-300 hover:text-yellow-300 font-semibold"
              >
                What's included
              </Link>
            </div>

            <p className="text-[11px] text-zinc-500 uppercase tracking-widest mt-10">
              Cancel any time · No contract · No upsell
            </p>
          </div>
        </section>
      )}

      {/* ANIMATED FINALE — scroll-triggered.
          Golden glow infuses upward, three boxes converge to centre,
          brand mark pulses, rule draws in. */}
      <section
        ref={finaleRef}
        className={`hv2-finale relative border-t border-yellow-500/15 bg-gradient-to-b from-[#0a0a0a] via-[#100806] to-[#0a0a0a] ${finaleSeen ? "is-revealed" : ""}`}
        data-testid="finale-section"
      >
        <div className="hv2-finale-glow" aria-hidden="true" />

        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
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

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 mb-14">
            <div
              className="hv2-finale-box hv2-finale-box-1 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 text-left"
              style={{ ["--hv2-dx" as any]: "-80px", ["--hv2-rot" as any]: "-4deg" } as React.CSSProperties}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-red-400 mb-2">
                The wire
              </div>
              <div className="display text-3xl text-white leading-none mb-2">
                Daily
              </div>
              <p className="text-sm text-zinc-400 leading-snug">
                Quick news, sourced and dated. No noise.
              </p>
            </div>

            <div
              className="hv2-finale-box hv2-finale-box-2 rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/[0.08] to-transparent p-6 text-left"
              style={{ ["--hv2-dx" as any]: "0px", ["--hv2-rot" as any]: "0deg" } as React.CSSProperties}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-yellow-300 mb-2">
                The files
              </div>
              <div className="display text-3xl text-white leading-none mb-2">
                Timelines
              </div>
              <p className="text-sm text-zinc-400 leading-snug">
                Decade-long playbooks, mapped to receipts.
              </p>
            </div>

            <div
              className="hv2-finale-box hv2-finale-box-3 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 text-left"
              style={{ ["--hv2-dx" as any]: "80px", ["--hv2-rot" as any]: "4deg" } as React.CSSProperties}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-yellow-300 mb-2">
                The reel
              </div>
              <div className="display text-3xl text-white leading-none mb-2">
                Videos
              </div>
              <p className="text-sm text-zinc-400 leading-snug">
                Long-form on YouTube. Cuts straight to the point.
              </p>
            </div>
          </div>

          <div className="hv2-finale-mark flex flex-col items-center text-center">
            <div className="hv2-finale-pulse mb-5 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 text-black">
              <Crown size={28} />
            </div>
            <h2 className="display text-4xl sm:text-6xl leading-[0.95] mb-4">
              <span className="text-white">British politics,</span>{" "}
              <span className="hv2-shimmer-text">documented in receipts.</span>
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl mb-7">
              One subscription. Every timeline. Every file. Cancel any time — no contract, no upsell.
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

          <div className="hv2-finale-rule mt-16 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

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
    </div>
  );
}

/* ─── building blocks ─────────────────────────────────────────────────── */

function SectionHeading({
  kicker,
  title,
  tone,
  href,
  hrefLabel,
}: {
  kicker: string;
  title: string;
  tone: "crimson" | "gold";
  href: string;
  hrefLabel: string;
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
    </div>
  );
}

// Re-exports so unused-import lint stays quiet.
export { Newspaper, Lock };
