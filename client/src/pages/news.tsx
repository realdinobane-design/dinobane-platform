import { useQuery } from "@tanstack/react-query";
import { ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

const SOURCE_COLORS: Record<string, string> = {
  // Alt / right-leaning
  "Guido Fawkes":           "bg-red-900/40 text-red-300 border-red-800",
  "Spiked Online":          "bg-orange-900/40 text-orange-300 border-orange-800",
  "GB News":                "bg-blue-900/40 text-blue-300 border-blue-800",
  "The Spectator":          "bg-purple-900/40 text-purple-300 border-purple-800",
  "ZeroHedge":              "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  "Breitbart London":       "bg-green-900/40 text-green-300 border-green-800",
  "Daily Mail":             "bg-pink-900/40 text-pink-300 border-pink-800",
  "The Telegraph":          "bg-sky-900/40 text-sky-300 border-sky-800",
  "The Daily Sceptic":      "bg-red-900/40 text-red-200 border-red-700",
  "The Conservative Woman": "bg-violet-900/40 text-violet-300 border-violet-800",
  "UnHerd":                 "bg-teal-900/40 text-teal-300 border-teal-800",
  "The Critic":             "bg-amber-900/40 text-amber-300 border-amber-800",
  "ConservativeHome":       "bg-blue-900/40 text-blue-200 border-blue-700",
  "Iain Dale":              "bg-indigo-900/40 text-indigo-300 border-indigo-800",
  "The Sun Politics":       "bg-orange-900/40 text-orange-200 border-orange-700",
  // Mainstream
  "The Sun":                "bg-red-950/40 text-red-200 border-red-900",
  "The Times":              "bg-slate-900/40 text-slate-300 border-slate-700",
  "The Guardian":           "bg-cyan-900/40 text-cyan-300 border-cyan-800",
  "BBC News":               "bg-red-950/40 text-red-300 border-red-900",
  "Sky News":               "bg-sky-950/40 text-sky-200 border-sky-900",
  "The Independent":        "bg-zinc-900/40 text-zinc-300 border-zinc-700",
  "The Mirror":             "bg-rose-900/40 text-rose-300 border-rose-800",
  "Express":                "bg-yellow-950/40 text-yellow-200 border-yellow-900",
  // Independent
  "Reclaim The Net":        "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  "The Gateway Pundit":     "bg-orange-950/40 text-orange-200 border-orange-900",
  "Westmonster":            "bg-red-900/40 text-red-200 border-red-800",
};

// Category tags per source
const SOURCE_TAGS: Record<string, string[]> = {
  // Alt / right-leaning
  "Guido Fawkes":           ["uk", "pro-british", "politics", "alt-media"],
  "Spiked Online":          ["uk", "pro-british", "culture", "alt-media"],
  "GB News":                ["uk", "pro-british", "politics", "alt-media"],
  "The Spectator":          ["uk", "pro-british", "politics", "culture"],
  "ZeroHedge":              ["international", "geopolitics", "finance", "alt-media"],
  "Breitbart London":       ["uk", "international", "pro-british", "politics", "alt-media"],
  "Daily Mail":             ["uk", "pro-british", "politics"],
  "The Telegraph":          ["uk", "pro-british", "politics"],
  "The Daily Sceptic":      ["uk", "pro-british", "anti-establishment", "alt-media"],
  "The Conservative Woman": ["uk", "pro-british", "culture", "alt-media"],
  "UnHerd":                 ["uk", "international", "pro-british", "culture"],
  "The Critic":             ["uk", "pro-british", "culture"],
  "ConservativeHome":       ["uk", "pro-british", "politics"],
  "Iain Dale":              ["uk", "pro-british", "politics"],
  "The Sun Politics":       ["uk", "pro-british", "politics"],
  // Mainstream
  "The Sun":                ["uk", "mainstream", "politics"],
  "The Times":              ["uk", "mainstream", "politics"],
  "The Guardian":           ["uk", "mainstream", "anti-british", "politics"],
  "BBC News":               ["uk", "mainstream", "anti-british", "politics"],
  "Sky News":               ["uk", "mainstream", "politics"],
  "The Independent":        ["uk", "mainstream", "politics"],
  "The Mirror":             ["uk", "mainstream", "anti-british", "politics"],
  "Express":                ["uk", "pro-british", "politics"],
  // Independent
  "Reclaim The Net":        ["international", "alt-media", "anti-establishment", "culture"],
  "The Gateway Pundit":     ["international", "alt-media", "anti-establishment", "politics"],
  "Westmonster":            ["uk", "pro-british", "alt-media", "anti-establishment"],
};

const FILTERS = [
  { id: "all",              label: "All" },
  { id: "uk",               label: "🇬🇧 UK" },
  { id: "international",    label: "🌍 International" },
  { id: "alt-media",        label: "Alt Media" },
  { id: "mainstream",       label: "Mainstream" },
  { id: "pro-british",      label: "Pro-British" },
  { id: "anti-british",     label: "Anti-British" },
  { id: "anti-establishment", label: "Anti-Establishment" },
  { id: "geopolitics",      label: "Geopolitics" },
  { id: "politics",         label: "Politics" },
  { id: "culture",          label: "Culture" },
  { id: "finance",          label: "Finance" },
];

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
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: items, isLoading, isError, dataUpdatedAt } = useQuery<NewsItem[]>({
    queryKey: ["/api/intel/feed"],
    staleTime: 5 * 60 * 1000,
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  const filteredItems = items?.filter(item => {
    if (activeFilter === "all") return true;
    const tags = SOURCE_TAGS[item.source] || [];
    return tags.includes(activeFilter);
  }) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Intel Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredItems.length} stories · {Object.keys(SOURCE_TAGS).length} sources
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

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`text-xs px-3 py-1.5 rounded-sm border font-semibold transition-colors ${
                activeFilter === f.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
              }`}
            >
              {f.label}
            </button>
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
        {!isLoading && filteredItems.length > 0 && (
          <div className="space-y-2">
            {filteredItems.map((item, i) => (
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

        {!isLoading && filteredItems.length === 0 && items && items.length > 0 && (
          <div className="text-center text-muted-foreground py-12 text-sm">
            No stories in this category. Try a different filter.
          </div>
        )}

        {!isLoading && items && items.length === 0 && (
          <div className="text-center text-muted-foreground py-12 text-sm">
            No stories loaded. Try refreshing.
          </div>
        )}

      </div>
    </div>
  );
}
