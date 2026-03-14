import { useQuery } from "@tanstack/react-query";
import { ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

const SOURCE_COLORS: Record<string, string> = {
  "Guido Fawkes":     "bg-red-900/40 text-red-300 border-red-800",
  "Spiked Online":    "bg-orange-900/40 text-orange-300 border-orange-800",
  "GB News":          "bg-blue-900/40 text-blue-300 border-blue-800",
  "The Spectator":    "bg-purple-900/40 text-purple-300 border-purple-800",
  "ZeroHedge":        "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  "Breitbart London": "bg-green-900/40 text-green-300 border-green-800",
  "Daily Mail":       "bg-pink-900/40 text-pink-300 border-pink-800",
  "The Telegraph":    "bg-sky-900/40 text-sky-300 border-sky-800",
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

export default function NewsPage() {
  const { data: items, isLoading, isError, dataUpdatedAt } = useQuery<NewsItem[]>({
    queryKey: ["/api/intel/feed"],
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Intel Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live UK political news — {items?.length ?? "—"} stories from 8 sources
            {lastUpdated && <span className="ml-2 opacity-60">· updated {lastUpdated}</span>}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-border text-muted-foreground hover:text-foreground gap-2"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/intel/feed"] })}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Source filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.keys(SOURCE_COLORS).map(src => (
            <span
              key={src}
              className={`text-xs px-2 py-0.5 rounded-sm border font-medium ${SOURCE_COLORS[src]}`}
            >
              {src}
            </span>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-sm p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-3 bg-card border border-border rounded-sm p-6 text-muted-foreground">
            <AlertCircle className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-sm">Could not load news feed</p>
              <p className="text-xs mt-0.5">Check your connection and try refreshing.</p>
            </div>
          </div>
        )}

        {/* News items */}
        {items && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, i) => (
              <a
                key={`${item.link}-${i}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-card border border-border hover:border-primary/40 rounded-sm p-4 transition-colors group"
                data-testid={`news-item-${i}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded-sm border font-medium shrink-0 ${SOURCE_COLORS[item.source] || "bg-muted text-muted-foreground border-border"}`}>
                        {item.source}
                      </span>
                      {item.pubDate && (
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(item.pubDate)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                </div>
              </a>
            ))}
          </div>
        )}

        {items && items.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-12 text-sm">
            No stories loaded. Try refreshing.
          </div>
        )}

      </div>
    </div>
  );
}
