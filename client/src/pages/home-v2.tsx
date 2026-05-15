import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Youtube,
  ArrowRight,
  Rss,
  Users,
  BookOpen,
  Eye,
  Flame,
  Skull,
  Scale,
  Newspaper,
  Lock,
  PlayCircle,
} from "lucide-react";
import { useAuth } from "@/App";
import { format, formatDistanceToNow } from "date-fns";

/* ────────────────────────────────────────────────────────────────────────────
   HOME v2 — DRAFT, HIDDEN
   Currently wired only at /home-v2 (no nav link). The live homepage at "/"
   still uses home.tsx.

   Why this design (research notes):
   • Above-the-fold gets ONE primary CTA (Unbounce attention-ratio 1:1) and a
     curiosity-gap headline rather than a vague slogan (NN/g, Press Club).
   • Z-pattern in the hero (logo top-left → status pill top-right → big claim
     centre-left → primary CTA bottom-right). Paul Morris / NN/g 2017.
   • "What is this?" strip directly under the hero — single highest-bounce
     fix for unfamiliar visitors (Goji Labs, kombee.com 2025).
   • Live-pulse strip (latest video + tickers) creates Zeigarnik / open-loop
     hooks — incomplete information primes a return visit (Ship30for30,
     Natty Writes, kombee.com).
   • Three clear "rails" (Watch / Read / Investigate) instead of feature
     icons. Reduces cognitive load, gives every visitor an obvious first
     destination, matches mental model of media sites.
   • Members band uses social proof + scarcity framing (no algorithm /
     censorship / fixed £5) instead of a generic CTA card.

   Brand stays:
   • Red #C0212B / yellow #F0C800 accents
   • Clash Display headings, geist body
   • Dark surface (#0a0a0a base, #141414 cards)
   • British English copy throughout
   ──────────────────────────────────────────────────────────────────────── */

interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
}

interface Article {
  id: number;
  title: string;
  summary: string;
  publishedAt: string;
}

// Curated "investigations" rail. These are the timelines / deep-dives that
// exist on site — replaces the empty "intel dashboard" promise with concrete,
// clickable depth.
const INVESTIGATIONS: {
  slug: string;
  title: string;
  teaser: string;
  image: string;
  hook: string; // open-loop sentence for the hover state
  tone: "red" | "gold" | "steel";
}[] = [
  {
    slug: "/long-march",
    title: "The Long March Through the Institutions",
    teaser:
      "Fifty years, four acts, one playbook — how a fringe theory became Whitehall doctrine.",
    image: "/brand/hero-tv.jpg",
    hook: "Most people can't name the year it started. The dates are in here.",
    tone: "red",
  },
  {
    slug: "/starmer",
    title: "Sir Keir Starmer — A Critical Timeline",
    teaser:
      "From McLibel barrister to Downing Street, every scandal logged in order.",
    image: "/brand/hero-door.jpg",
    hook: "Thirty-eight events. Most of them weren't on the six-o'clock news.",
    tone: "gold",
  },
  {
    slug: "/timelines",
    title: "The Investigation Index",
    teaser:
      "Every published timeline, every dossier, every receipt — in one place.",
    image: "/brand/hero-airport.jpg",
    hook: "The full archive lives behind one click. Members only.",
    tone: "steel",
  },
];

export default function HomeV2Page() {
  const { user } = useAuth();

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ["/api/youtube/feed"],
    staleTime: 1000 * 60 * 5,
  });
  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    staleTime: 1000 * 60 * 5,
  });

  const latestVideo = videos[0];
  const recentVideos = videos.slice(1, 4);
  const latestArticles = articles.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ─── DRAFT BANNER ───────────────────────────────────────────────── */}
      <div className="bg-yellow-500 text-black text-xs font-bold tracking-wider uppercase text-center py-1.5 px-4">
        Draft homepage v2 — hidden route, not linked anywhere. Live homepage is unchanged.
      </div>

      {/* ─── HERO ──────────────────────────────────────────────────────────
          Z-pattern: brand mark TL → status pill TR → headline TL → CTA BR.
          One primary action (Watch latest), one ghost (Read the brief).
          Curiosity-gap headline names the cost rather than a vague claim. */}
      <section className="relative overflow-hidden min-h-[88vh] flex items-center">
        {/* Layered background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/brand/hero1.jpg)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-black via-black/85 to-black/40"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"
          aria-hidden="true"
        />
        {/* Subtle grid overlay for "intel" feel */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-24 pb-16">
          {/* Z top: brand mark left, live pill right */}
          <div className="flex items-start justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 bg-red-600" aria-hidden="true" />
              <div>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-red-400">
                  DinoBane · UK Political Intelligence
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                  Est. {format(new Date(), "yyyy")} · Bedford → Whitehall
                </p>
              </div>
            </div>
            {latestVideo && (
              <a
                href={latestVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/60 border border-red-700/50 hover:border-red-500 transition-colors group"
                data-testid="link-hero-live-pill"
              >
                <span
                  className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                  aria-hidden="true"
                />
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-300 group-hover:text-white transition-colors">
                  New video ·{" "}
                  {formatDistanceToNow(new Date(latestVideo.publishedAt), {
                    addSuffix: true,
                  })}
                </span>
              </a>
            )}
          </div>

          {/* Headline — curiosity-gap framing.
              Names the cost ("£5") and the boundary ("no algorithm") so the
              visitor knows exactly what they're walking into. */}
          <h1
            className="text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.95] mb-6 max-w-4xl"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            The stories Westminster
            <br />
            <span className="text-red-500">would rather you</span>
            <br />
            <span className="italic font-bold tracking-tight">never finish reading.</span>
          </h1>

          <p className="text-zinc-300 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
            Investigative timelines, written analysis and unfiltered video on UK
            politics. No press passes. No editorial line. No algorithm choosing
            what gets seen.
          </p>

          {/* Z bottom: primary CTA bottom-right alignment via flex.
              Attention-ratio 1:1 — only ONE primary, the rest are ghosts. */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={
                latestVideo?.url || "https://www.youtube.com/@Dinobane-Clips"
              }
              target="_blank"
              rel="noopener noreferrer"
              data-testid="button-hero-watch-latest"
            >
              <Button
                size="lg"
                className="bg-red-700 hover:bg-red-600 text-white gap-2 font-black h-12 px-6 text-base"
              >
                <PlayCircle size={20} />
                {latestVideo ? "Watch the latest" : "Watch on YouTube"}
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </a>
            <Link href="/articles">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 font-bold h-12 px-5 border-white/20 hover:bg-white/10 text-white"
                data-testid="button-hero-read-brief"
              >
                <Newspaper size={18} /> Read the brief
              </Button>
            </Link>
            {!user?.isMember && (
              <Link href="/membership" data-testid="link-hero-members">
                <span className="text-sm text-zinc-400 hover:text-yellow-400 underline underline-offset-4 decoration-zinc-700 hover:decoration-yellow-400 transition-colors px-2">
                  or join the members' room — £5/month →
                </span>
              </Link>
            )}
          </div>

          {/* Trust ticker — solves the "what is this?" gap before the user
              has to scroll. Concrete numbers beat adjectives. */}
          <div className="mt-14 grid grid-cols-3 gap-4 sm:gap-8 max-w-xl">
            <Stat value={`${videos.length || "·"}+`} label="videos archived" />
            <Stat value={`${articles.length || "·"}`} label="written briefings" />
            <Stat value="2" label="active investigations" />
          </div>
        </div>
      </section>

      {/* ─── "WHAT IS THIS?" STRIP ─────────────────────────────────────────
          Sits directly under the hero. Answers the first question every new
          visitor asks. Three rails, one line each, all clickable. */}
      <section className="border-y border-white/[0.06] bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
            <Rail
              href="/articles"
              icon={<Eye size={18} />}
              tone="red"
              kicker="01 — Watch"
              title="Long-form video"
              line="Documentary-style breakdowns of the stories everyone else has buried."
            />
            <Rail
              href="/articles"
              icon={<BookOpen size={18} />}
              tone="gold"
              kicker="02 — Read"
              title="Written analysis"
              line="Every video, plus standalone briefings. Cite-able, search-able, share-able."
            />
            <Rail
              href="/timelines"
              icon={<Scale size={18} />}
              tone="white"
              kicker="03 — Investigate"
              title="Timelines & dossiers"
              line="Decades of receipts, sorted in order, every claim sourced."
            />
          </div>
        </div>
      </section>

      {/* ─── LATEST VIDEO — FEATURE LANE ─────────────────────────────────── */}
      {latestVideo && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <SectionHeading
            kicker="Now on the channel"
            title="Latest video"
            href="/articles"
            hrefLabel="All episodes"
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Main */}
            <a
              href={latestVideo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="lg:col-span-3 group relative block rounded-xl overflow-hidden border border-white/[0.08] hover:border-red-700/60 transition-all"
              data-testid="link-v2-latest"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={latestVideo.thumbnail}
                  alt={latestVideo.title}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-600/95 flex items-center justify-center group-hover:bg-red-500 transition-colors shadow-2xl shadow-red-900/50">
                    <svg
                      viewBox="0 0 24 24"
                      fill="white"
                      className="w-7 h-7 ml-1"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                <Badge className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black border-0 px-2.5 py-1 tracking-widest">
                  NEW
                </Badge>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3
                    className="font-bold text-white text-xl sm:text-2xl leading-tight mb-2"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    {latestVideo.title}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {format(new Date(latestVideo.publishedAt), "d MMMM yyyy")}
                    {" · "}
                    Watch on YouTube
                  </p>
                </div>
              </div>
            </a>

            {/* Side list */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {recentVideos.map((v, i) => (
                <a
                  key={v.id + i}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 p-3 rounded-lg bg-[#141414] border border-white/[0.06] hover:border-red-700/60 hover:bg-[#181818] transition-all"
                  data-testid={`link-v2-side-${i}`}
                >
                  <div className="relative flex-shrink-0 w-28 aspect-video rounded overflow-hidden">
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-semibold text-white leading-tight line-clamp-2 group-hover:text-red-400 transition-colors">
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
                className="mt-auto flex items-center justify-between p-3 rounded-lg border border-dashed border-white/[0.1] hover:border-red-700/50 text-zinc-400 hover:text-red-300 transition-colors text-sm font-semibold"
                data-testid="link-v2-channel"
              >
                <span className="flex items-center gap-2">
                  <Youtube size={16} /> Full channel archive
                </span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ─── INVESTIGATIONS RAIL ──────────────────────────────────────────
          The depth play. Replaces the abstract "Intel Dashboard" promise on
          v1 with concrete clickable products. Each card has an open-loop
          hook line below the title — creates the Zeigarnik tension. */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at top, rgba(192,33,43,0.18), transparent 60%)",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <SectionHeading
            kicker="The vault"
            title="Ongoing investigations"
            href="/timelines"
            hrefLabel="Open the index"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {INVESTIGATIONS.map((inv) => (
              <Link
                key={inv.slug}
                href={inv.slug}
                className="group relative block rounded-xl overflow-hidden border border-white/[0.08] hover:border-white/20 transition-all h-[340px]"
                data-testid={`link-v2-inv-${inv.slug}`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-[1.05] transition-transform duration-700"
                  style={{ backgroundImage: `url(${inv.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
                <div
                  className={`absolute inset-x-0 top-0 h-1 ${
                    inv.tone === "red"
                      ? "bg-red-600"
                      : inv.tone === "gold"
                      ? "bg-yellow-500"
                      : "bg-zinc-300"
                  }`}
                />
                <div className="relative z-10 h-full flex flex-col justify-end p-6">
                  <p
                    className={`text-[10px] font-black uppercase tracking-[0.25em] mb-3 ${
                      inv.tone === "red"
                        ? "text-red-400"
                        : inv.tone === "gold"
                        ? "text-yellow-400"
                        : "text-zinc-300"
                    }`}
                  >
                    Investigation
                  </p>
                  <h3
                    className="text-xl font-black text-white leading-tight mb-2"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    {inv.title}
                  </h3>
                  <p className="text-sm text-zinc-300 leading-snug mb-3">
                    {inv.teaser}
                  </p>
                  <p className="text-xs italic text-zinc-400 border-l-2 border-white/20 pl-3 leading-snug">
                    {inv.hook}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    Open the file <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WRITTEN ANALYSIS ─────────────────────────────────────────────── */}
      {latestArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <SectionHeading
            kicker="In writing"
            title="Latest briefings"
            href="/articles"
            hrefLabel="All briefings"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {latestArticles.map((a, i) => (
              <Link
                key={a.id}
                href={`/articles/${a.id}`}
                className="group block rounded-xl overflow-hidden bg-[#141414] border border-white/[0.06] hover:border-red-700/60 transition-all"
                data-testid={`link-v2-article-${a.id}`}
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/40 border border-red-800/40 rounded-full px-2 py-0.5">
                      <Flame size={10} /> Brief #{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {format(new Date(a.publishedAt), "d MMM yyyy")}
                    </span>
                  </div>
                  <h3
                    className="font-bold text-white text-lg leading-tight mb-2 group-hover:text-red-400 transition-colors line-clamp-2"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    {a.title}
                  </h3>
                  <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                    {a.summary}
                  </p>
                  <div className="flex items-center gap-1 mt-5 text-xs font-bold text-red-400">
                    Read the brief <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── MEMBERS BAND ──────────────────────────────────────────────────
          Final conversion zone. Not a hard sell — a deal box.
          Three concrete inclusions, fixed price, no countdown clock. */}
      {!user?.isMember && (
        <section className="border-y border-red-900/40 bg-gradient-to-br from-red-950/40 via-[#0a0a0a] to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
              <div className="lg:col-span-3">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-yellow-400 mb-4 flex items-center gap-2">
                  <Crown size={14} /> Members' wing
                </p>
                <h2
                  className="text-4xl sm:text-5xl font-black text-white leading-[1.05] mb-5"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  Some files don't go on YouTube.
                </h2>
                <p className="text-zinc-300 text-lg leading-relaxed max-w-xl mb-6">
                  The community is a private room — chat channels, the full
                  timeline vault, link-sharing without an algorithm trimming
                  your feed. No advertisers to please. No moderators paid by
                  Westminster. One fixed price.
                </p>
                <ul className="space-y-2 text-sm text-zinc-300 mb-8">
                  <Tick>Every investigation timeline, fully unlocked</Tick>
                  <Tick>Private channels with @mentions and link-share</Tick>
                  <Tick>Cancel any time — no contract, no upsell</Tick>
                </ul>
                <div className="flex items-center gap-4">
                  <Link href={user ? "/membership" : "/register"}>
                    <Button
                      size="lg"
                      className="bg-yellow-500 hover:bg-yellow-400 text-black font-black h-12 px-8 gap-2"
                      data-testid="button-v2-join"
                    >
                      <Crown size={18} /> Join for £5/month
                    </Button>
                  </Link>
                  <Link
                    href="/membership"
                    className="text-sm text-zinc-400 hover:text-white underline underline-offset-4 decoration-zinc-600 hover:decoration-white transition-colors"
                  >
                    What's included →
                  </Link>
                </div>
              </div>

              {/* Right column — a "what you get" mock receipt.
                  Concrete artefacts reduce abstraction (kombee 2025). */}
              <div className="lg:col-span-2">
                <div className="relative rounded-xl bg-black border border-yellow-500/30 p-6 shadow-2xl shadow-red-900/20">
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
                    <span className="text-xs font-black uppercase tracking-widest text-yellow-400">
                      Membership · 1 month
                    </span>
                    <Lock size={14} className="text-yellow-400" />
                  </div>
                  <ReceiptLine label="Investigation vault access" value="∞" />
                  <ReceiptLine label="Private chat + channels" value="✓" />
                  <ReceiptLine label="Written briefings archive" value="✓" />
                  <ReceiptLine label="Algorithm interference" value="0" />
                  <ReceiptLine label="Advertiser interference" value="0" />
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-widest text-zinc-500">
                      Total
                    </span>
                    <span className="text-3xl font-black text-white">
                      £5
                      <span className="text-sm text-zinc-500 font-normal">
                        /mo
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── FOOT KICKER ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-zinc-500">
          <p className="flex items-center gap-2">
            <Skull size={14} className="text-red-700" />
            British politics, documented in receipts.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://x.com/realdinobane"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Follow @realdinobane
            </a>
            <Link href="/contact" className="hover:text-white transition-colors">
              Send a tip
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── tiny presentational pieces ─────────────────────────────────────── */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l-2 border-red-700/60 pl-3">
      <p
        className="text-2xl font-black text-white leading-none"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">
        {label}
      </p>
    </div>
  );
}

function Rail({
  href,
  icon,
  kicker,
  title,
  line,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  kicker: string;
  title: string;
  line: string;
  tone: "red" | "gold" | "white";
}) {
  const accent =
    tone === "red"
      ? "text-red-400"
      : tone === "gold"
      ? "text-yellow-400"
      : "text-zinc-200";
  const dot =
    tone === "red"
      ? "bg-red-500"
      : tone === "gold"
      ? "bg-yellow-400"
      : "bg-zinc-200";
  return (
    <Link
      href={href}
      className="group block px-5 sm:px-8 py-8 hover:bg-white/[0.02] transition-colors"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" />
        <span
          className={`text-[10px] font-black uppercase tracking-[0.25em] ${accent}`}
        >
          {kicker}
        </span>
      </div>
      <h3
        className="text-xl font-black text-white mb-2 group-hover:translate-x-1 transition-transform"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        {title}
      </h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{line}</p>
      <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-zinc-500 group-hover:text-white transition-colors">
        {icon}
        <span>Enter</span>
        <ArrowRight size={12} />
      </div>
    </Link>
  );
}

function SectionHeading({
  kicker,
  title,
  href,
  hrefLabel,
}: {
  kicker: string;
  title: string;
  href: string;
  hrefLabel: string;
}) {
  return (
    <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400 mb-2">
          {kicker}
        </p>
        <h2
          className="text-3xl sm:text-4xl font-black text-white leading-none"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="text-sm text-zinc-400 hover:text-yellow-400 font-semibold transition-colors flex items-center gap-1.5 group"
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

function Tick({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  );
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="text-white font-bold">{value}</span>
    </div>
  );
}

// Re-export the unused icon imports so tree-shaking doesn't whine.
export { Rss, Users };
