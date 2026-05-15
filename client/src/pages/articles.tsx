import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, Youtube, Loader2, BookOpen, Sparkles, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { TOPICS, detectTopic, topicMeta, type TopicId } from "@/lib/topics";
import { V2Shell } from "@/components/v2-shell";

interface Article {
  id: number;
  title: string;
  summary: string;
  youtubeUrl: string | null;
  thumbnail: string | null;
  publishedAt: string;
}

/* ─── TOPIC FILTER PILLS ────────────────────────────────────────────── */
function TopicPills({
  active,
  onChange,
}: {
  active: TopicId | "all";
  onChange: (t: TopicId | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        onClick={() => onChange("all")}
        className={`text-xs px-3.5 py-1.5 rounded-full border font-bold tracking-wide transition-all ${
          active === "all"
            ? "bg-yellow-400 text-black border-yellow-400 shadow-[0_6px_20px_-8px_rgba(245,200,66,0.7)]"
            : "bg-black/40 text-zinc-400 border-white/10 hover:text-white hover:border-yellow-400/40"
        }`}
        data-testid="filter-all"
      >
        All
      </button>
      {TOPICS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(active === t.id ? "all" : t.id)}
          className={`text-xs px-3.5 py-1.5 rounded-full border font-bold tracking-wide transition-all ${
            active === t.id
              ? "text-black border-transparent shadow-md"
              : "bg-black/40 text-zinc-400 border-white/10 hover:text-white"
          }`}
          style={active === t.id ? { background: t.color, borderColor: t.color } : {}}
          data-testid={`article-topic-filter-${t.id}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function ArticlesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [ytUrl, setYtUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [activeTopic, setActiveTopic] = useState<TopicId | "all">("all");

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const filtered =
    activeTopic === "all"
      ? articles
      : articles.filter((a) => detectTopic(a.title, a.summary) === activeTopic);

  const generateMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/articles/generate", {
        youtubeUrl: url,
        transcript: transcript.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/articles"] });
      setYtUrl("");
      setTranscript("");
      setShowTranscript(false);
      toast({
        title: "Article generated",
        description: "The video has been converted to a written article.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to generate",
        description: "Check the YouTube URL and try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!ytUrl.trim()) return;
    if (!ytUrl.includes("youtube.com") && !ytUrl.includes("youtu.be")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(ytUrl.trim());
  };

  const isAdmin =
    user &&
    new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]).has(user.email);

  return (
    <V2Shell
      kicker="The reel"
      title="Videos"
      subtitle="Written analysis and breakdowns of the latest DinoBane videos — every script, sourced and dated."
      bannerImage="/brand/hero-tv.jpg"
      tone="crimson"
    >
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {/* ─── ADMIN: Video → Article generator ─────────────────────────── */}
        {isAdmin && (
          <div className="mb-10 p-6 rounded-2xl bg-black/40 backdrop-blur-sm border border-yellow-500/15">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-yellow-300" />
              <h2 className="display text-xl text-white tracking-tight">
                Generate article from video
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Paste any YouTube URL to auto-generate a written analysis article.
              Works with any DinoBane video.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Youtube
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <Input
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="pl-8 bg-[#0a0a0a] border-white/10 text-sm text-white"
                  data-testid="input-youtube-url"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !ytUrl.trim()}
                className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 hover:from-yellow-300 hover:via-amber-200 hover:to-yellow-400 text-black font-extrabold shrink-0"
                data-testid="button-generate-article"
              >
                {generateMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                ) : (
                  <Sparkles size={14} className="mr-1.5" />
                )}
                Generate
              </Button>
            </div>
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="mt-3 text-xs text-zinc-500 hover:text-yellow-300 transition-colors flex items-center gap-1"
            >
              {showTranscript
                ? "▲ Hide transcript"
                : "▼ Paste transcript (optional — improves accuracy)"}
            </button>
            {showTranscript && (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste the full video transcript here. If provided, the article will be written based on exactly what was said in the video."
                rows={8}
                className="mt-2 w-full bg-[#0a0a0a] border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400/40 placeholder:text-zinc-600 resize-y font-mono"
              />
            )}
          </div>
        )}

        {/* ─── TOPIC FILTER PILLS ─────────────────────────────────────── */}
        <TopicPills active={activeTopic} onChange={setActiveTopic} />

        {/* Active filter caption */}
        {activeTopic !== "all" && (
          <p className="text-xs text-zinc-500 mb-6">
            Showing{" "}
            <span style={{ color: topicMeta(activeTopic).color }}>
              {topicMeta(activeTopic).label}
            </span>{" "}
            ({filtered.length})
            <button
              onClick={() => setActiveTopic("all")}
              className="ml-3 text-zinc-400 hover:text-yellow-300 underline-offset-2 hover:underline"
            >
              Clear
            </button>
          </p>
        )}

        {/* ─── ARTICLES LIST ──────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-black/40 border border-white/[0.06]"
              >
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 && articles.length > 0 ? (
          <div className="text-center py-20 text-zinc-500 text-sm">
            No{" "}
            <span style={{ color: topicMeta(activeTopic).color }}>
              {topicMeta(activeTopic).label}
            </span>{" "}
            articles yet.{" "}
            <button
              onClick={() => setActiveTopic("all")}
              className="text-yellow-300 hover:text-yellow-200 underline-offset-2 hover:underline"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((a) => {
              const topic = detectTopic(a.title, a.summary);
              const meta = topicMeta(topic);
              return (
                <Link
                  key={a.id}
                  href={`/articles/${a.id}`}
                  className="group flex flex-col sm:flex-row gap-5 p-5 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/[0.06] hover:border-yellow-500/30 hv2-tilt"
                  data-testid={`link-article-${a.id}`}
                >
                  {a.thumbnail && (
                    <a
                      href={a.youtubeUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 sm:w-56 aspect-video rounded-xl overflow-hidden relative group/thumb"
                    >
                      <img
                        src={a.thumbnail}
                        alt={a.title}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center group-hover/thumb:bg-black/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-yellow-400/95 flex items-center justify-center shadow-lg">
                          <PlayCircle size={20} className="text-black" />
                        </div>
                      </div>
                    </a>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      <span
                        className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                        style={{
                          background: `${meta.color}22`,
                          color: meta.color,
                          border: `1px solid ${meta.color}55`,
                        }}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 flex items-center gap-1">
                        <BookOpen size={9} /> Analysis
                      </span>
                      <span className="text-xs text-zinc-500">
                        {format(new Date(a.publishedAt), "d MMMM yyyy")}
                      </span>
                    </div>
                    <h3 className="display text-xl sm:text-2xl text-white leading-tight mb-2 group-hover:text-yellow-300 transition-colors">
                      {a.title}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                      {a.summary}
                    </p>
                    <div className="flex items-center gap-1.5 mt-4 text-xs font-bold text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      Read the full analysis{" "}
                      <ArrowRight
                        size={11}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}

            {articles.length === 0 && (
              <div className="text-center py-20">
                <BookOpen
                  size={40}
                  className="mx-auto mb-4 text-yellow-400/40"
                />
                <p className="display text-2xl text-white mb-1">
                  No articles yet
                </p>
                <p className="text-sm text-zinc-500">
                  {isAdmin
                    ? "Paste a YouTube URL above to generate the first one."
                    : "The first articles are on the way."}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </V2Shell>
  );
}
