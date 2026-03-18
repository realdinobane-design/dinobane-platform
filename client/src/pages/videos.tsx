import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Youtube, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { TOPICS, detectTopic, topicMeta, type TopicId } from "@/lib/topics";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
}

// ─── TOPIC FILTER PILLS ───────────────────────────────────────────────────────
function TopicPills({ active, onChange }: { active: TopicId | "all"; onChange: (t: TopicId | "all") => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onChange("all")}
        className={`text-xs px-3 py-1.5 rounded-sm border font-bold tracking-wide transition-colors ${
          active === "all"
            ? "bg-[#cc2a2a] text-white border-[#cc2a2a]"
            : "bg-card text-muted-foreground border-border hover:text-white hover:border-[#cc2a2a]/50"
        }`}
      >
        All
      </button>
      {TOPICS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(active === t.id ? "all" : t.id)}
          className={`text-xs px-3 py-1.5 rounded-sm border font-bold tracking-wide transition-colors ${
            active === t.id
              ? "text-black border-transparent"
              : "bg-card text-muted-foreground border-border hover:text-white"
          }`}
          style={active === t.id ? { background: t.color, borderColor: t.color } : {}}
          data-testid={`topic-filter-${t.id}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function VideosPage() {
  const [activeTopic, setActiveTopic] = useState<TopicId | "all">("all");

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["/api/youtube/feed"],
    staleTime: 1000 * 60 * 5,
  });

  const filtered = activeTopic === "all"
    ? videos
    : videos.filter(v => detectTopic(v.title) === activeTopic);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Videos
          </h1>
          <p className="text-muted-foreground text-sm">
            Latest uploads from <span className="text-red-400">@Dinobane-Clips</span>
            {activeTopic !== "all" && (
              <span className="ml-2 text-zinc-500">
                · showing <span style={{ color: topicMeta(activeTopic).color }}>{topicMeta(activeTopic).label}</span>
                {" "}({filtered.length})
              </span>
            )}
          </p>
        </div>
        <a
          href="https://www.youtube.com/@Dinobane-Clips"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-400 transition-colors"
          data-testid="link-youtube-channel"
        >
          <Youtube size={16} /> View Channel
        </a>
      </div>

      {/* Topic filter pills */}
      <TopicPills active={activeTopic} onChange={setActiveTopic} />

      {/* Loading skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden bg-card border border-border">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 text-sm">
          No {activeTopic !== "all" ? topicMeta(activeTopic).label : ""} videos yet.{" "}
          <button onClick={() => setActiveTopic("all")} className="text-red-400 hover:underline">Clear filter</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((v, i) => {
            const topic = detectTopic(v.title);
            const meta = topicMeta(topic);
            return (
              <a
                key={v.id + i}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-lg overflow-hidden bg-card border border-border hover:border-red-800/60 transition-all hover:shadow-lg hover:shadow-red-950/20"
                data-testid={`link-video-card-${i}`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading={i < 3 ? "eager" : "lazy"}
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  </div>
                  {/* Latest badge */}
                  {i === 0 && (
                    <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs border-0 font-bold">LATEST</Badge>
                  )}
                  {/* Topic pill overlaid on thumbnail */}
                  <span
                    className="absolute bottom-2 left-2 text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-sm"
                    style={{ background: `${meta.color}dd`, color: "#fff" }}
                  >
                    {meta.label}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-red-400 transition-colors mb-2">
                    {v.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(v.publishedAt), "d MMM yyyy")}
                    </span>
                    <ExternalLink size={12} className="text-muted-foreground group-hover:text-red-400 transition-colors" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
