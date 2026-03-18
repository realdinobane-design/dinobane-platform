import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Youtube, ArrowRight, Rss, Users, BookOpen } from "lucide-react";
import { useAuth } from "@/App";
import { format } from "date-fns";

interface Video {
  id: string;
  title: string;
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

export default function HomePage() {
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
  const recentVideos = videos.slice(1, 5);

  return (
    <div className="min-h-screen">
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black min-h-[70vh] flex items-end">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/brand/hero1.jpg)" }}
          aria-hidden="true"
        />
        {/* Gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" aria-hidden="true" />
        {/* Red vignette on sides */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-32 w-full">
          {/* Logo mark */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-10 bg-red-600" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              UK Political Commentary
            </span>
          </div>

          <h1
            className="text-4xl sm:text-6xl font-black text-white leading-tight mb-4"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            They Don't Control<br />
            <span className="text-red-500">The Narrative.</span><br />
            You Do.
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mb-8">
            Unfiltered political commentary, investigative breakdowns, and the stories the mainstream media doesn't want you to see.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.youtube.com/@Dinobane-Clips"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="bg-red-700 hover:bg-red-600 text-white gap-2 font-bold" data-testid="button-hero-youtube">
                <Youtube size={18} /> Watch on YouTube
              </Button>
            </a>
            {!user?.isMember && (
              <Link href="/membership">
                <Button size="lg" variant="outline" className="gap-2 font-bold border-white/20 hover:bg-white/10 text-white" data-testid="button-hero-join">
                  <Crown size={18} /> Join the Community — £5/mo
                </Button>
              </Link>
            )}
            {user?.isMember && (
              <Link href="/community">
                <Button size="lg" variant="outline" className="gap-2 font-bold border-white/20 hover:bg-white/10 text-white" data-testid="button-hero-community">
                  <Users size={18} /> Members' Community
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── LATEST VIDEO FEATURE ─────────────────────────────────────────── */}
      {latestVideo && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
              Latest Video
            </h2>
            <Link href="/videos" className="text-sm text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1">
              All videos <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Main video */}
            <a
              href={latestVideo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="lg:col-span-3 group block rounded-lg overflow-hidden bg-card border border-border hover:border-red-800/60 transition-all"
              data-testid="link-latest-video"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={latestVideo.thumbnail}
                  alt={latestVideo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center group-hover:bg-red-500 transition-colors">
                    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-0.5">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                </div>
                <Badge className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold border-0">NEW</Badge>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white text-lg leading-tight mb-1" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  {latestVideo.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(latestVideo.publishedAt), "d MMMM yyyy")}
                </p>
              </div>
            </a>

            {/* Recent videos list */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {recentVideos.map((v, i) => (
                <a
                  key={v.id + i}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 p-3 rounded-lg bg-card border border-border hover:border-red-800/60 transition-all"
                  data-testid={`link-video-${i}`}
                >
                  <div className="relative flex-shrink-0 w-28 aspect-video rounded overflow-hidden">
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-red-400 transition-colors">{v.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(v.publishedAt), "d MMM yyyy")}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FEATURES STRIP ───────────────────────────────────────────────── */}
      <section className="border-y border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="flex items-start gap-4 py-4 sm:py-0 sm:px-8 first:pl-0 last:pr-0">
            <div className="p-2 rounded-md bg-red-900/20">
              <Rss size={18} className="text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">Intel Dashboard</p>
              <p className="text-xs text-muted-foreground mt-0.5">Live UK political news — viral & suppressed stories ranked for content creators</p>
            </div>
          </div>
          <div className="flex items-start gap-4 py-4 sm:py-0 sm:px-8">
            <div className="p-2 rounded-md bg-red-900/20">
              <Users size={18} className="text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">Members Community</p>
              <p className="text-xs text-muted-foreground mt-0.5">Private channels, @mentions, link sharing. £5/month. No algorithms, no censorship.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 py-4 sm:py-0 sm:px-8">
            <div className="p-2 rounded-md bg-red-900/20">
              <BookOpen size={18} className="text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">Written Analysis</p>
              <p className="text-xs text-muted-foreground mt-0.5">Every video auto-converted to a written article. Read, share, reference.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LATEST ARTICLES ──────────────────────────────────────────────── */}
      {articles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Written Analysis</h2>
            <Link href="/articles" className="text-sm text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1">
              All articles <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {articles.slice(0, 2).map(a => (
              <Link
                key={a.id}
                href={`/articles/${a.id}`}
                className="group block p-5 rounded-lg bg-card border border-border hover:border-red-800/60 transition-all"
                data-testid={`link-article-${a.id}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="tag-pill bg-red-900/30 text-red-400">Analysis</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(a.publishedAt), "d MMM yyyy")}</span>
                </div>
                <h3 className="font-bold text-white leading-tight mb-2 group-hover:text-red-400 transition-colors line-clamp-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  {a.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{a.summary}</p>
                <div className="flex items-center gap-1 mt-4 text-xs text-red-400 font-medium">
                  Read analysis <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── MEMBERSHIP CTA ───────────────────────────────────────────────── */}
      {!user?.isMember && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div
            className="relative overflow-hidden rounded-xl border border-red-800/40 bg-gradient-to-br from-red-950/40 via-black to-black p-8 sm:p-12 text-center"
          >
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "url(/brand/hero2.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }} aria-hidden="true" />
            <div className="relative z-10">
              <Crown size={36} className="text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                Join the DinoBane Community
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto mb-6">
                Private channels. @mentions. Shared links. No censorship. No algorithm. Just people who want the truth.
              </p>
              <p className="text-2xl font-black text-white mb-6">£5 <span className="text-zinc-400 text-base font-normal">/ month</span></p>
              <Link href={user ? "/membership" : "/register"}>
                <Button size="lg" className="bg-red-700 hover:bg-red-600 text-white font-bold px-10 gap-2" data-testid="button-cta-join">
                  <Crown size={18} /> Become a Member
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
