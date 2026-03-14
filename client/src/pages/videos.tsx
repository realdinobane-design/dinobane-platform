import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Youtube, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
}

export default function VideosPage() {
  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["/api/youtube/feed"],
    staleTime: 1000 * 60 * 15,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Videos
          </h1>
          <p className="text-muted-foreground text-sm">Latest uploads from <span className="text-red-400">@Dinobane-Clips</span></p>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((v, i) => (
            <a
              key={v.id + i}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg overflow-hidden bg-card border border-border hover:border-red-800/60 transition-all hover:shadow-lg hover:shadow-red-950/20"
              data-testid={`link-video-card-${i}`}
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading={i < 3 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                </div>
                {i === 0 && (
                  <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs border-0 font-bold">LATEST</Badge>
                )}
              </div>
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
          ))}
        </div>
      )}
    </div>
  );
}
