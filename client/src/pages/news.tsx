import { useQuery, useMutation } from "@tanstack/react-query";
import { ExternalLink, RefreshCw, AlertCircle, Flame, EyeOff, Clock, Search, Youtube, X, Bookmark, BookmarkCheck } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/App";
import { ADMIN_EMAILS } from "@/lib/constants";

// ─── SOURCE METADATA ──────────────────────────────────────────────────────────

const SOURCE_META: Record<string, { color: string; type: "alt" | "mainstream" | "intl" }> = {
  "Guido Fawkes":           { color: "#ef4444", type: "alt" },
  "Spiked Online":          { color: "#f97316", type: "alt" },
  "GB News":                { color: "#3b82f6", type: "alt" },
  "The Spectator":          { color: "#a855f7", type: "alt" },
  "ZeroHedge":              { color: "#eab308", type: "intl" },
  "Breitbart London":       { color: "#22c55e", type: "alt" },
  "Daily Mail":             { color: "#ec4899", type: "alt" },
  "The Telegraph":          { color: "#0ea5e9", type: "alt" },
  "The Daily Sceptic":      { color: "#f43f5e", type: "alt" },
  "The Conservative Woman": { color: "#8b5cf6", type: "alt" },
  "UnHerd":                 { color: "#14b8a6", type: "alt" },
  "The Critic":             { color: "#f59e0b", type: "alt" },
  "ConservativeHome":       { color: "#60a5fa", type: "alt" },
  "Iain Dale":              { color: "#818cf8", type: "alt" },
  "The Sun Politics":       { color: "#fb923c", type: "alt" },
  "The Sun":                { color: "#fca5a5", type: "mainstream" },
  "The Times":              { color: "#94a3b8", type: "mainstream" },
  "The Guardian":           { color: "#22d3ee", type: "mainstream" },
  "BBC News":               { color: "#fca5a5", type: "mainstream" },
  "Sky News":               { color: "#7dd3fc", type: "mainstream" },
  "The Independent":        { color: "#a1a1aa", type: "mainstream" },
  "The Mirror":             { color: "#fb7185", type: "mainstream" },
  "Express":                { color: "#fde68a", type: "mainstream" },
  "Reclaim The Net":        { color: "#6ee7b7", type: "intl" },
  "The Gateway Pundit":     { color: "#fdba74", type: "intl" },
  "Westmonster":            { color: "#fca5a5", type: "alt" },
};

const SOURCE_TAGS: Record<string, string[]> = {
  "Guido Fawkes":           ["uk-corruption", "politics", "alt-media"],
  "Spiked Online":          ["culture", "censorship", "alt-media"],
  "GB News":                ["politics", "uk-corruption", "alt-media"],
  "The Spectator":          ["politics", "geopolitics", "alt-media"],
  "ZeroHedge":              ["geopolitics", "finance", "alt-media"],
  "Breitbart London":       ["immigration", "politics", "alt-media"],
  "Daily Mail":             ["politics", "immigration"],
  "The Telegraph":          ["politics", "geopolitics"],
  "The Daily Sceptic":      ["censorship", "alt-media"],
  "The Conservative Woman": ["culture", "alt-media"],
  "UnHerd":                 ["culture", "geopolitics"],
  "The Critic":             ["culture", "politics"],
  "ConservativeHome":       ["politics"],
  "Iain Dale":              ["politics"],
  "The Sun Politics":       ["politics"],
  "The Sun":                ["politics", "mainstream"],
  "The Times":              ["politics", "mainstream"],
  "The Guardian":           ["mainstream"],
  "BBC News":               ["mainstream"],
  "Sky News":               ["mainstream"],
  "The Independent":        ["mainstream"],
  "The Mirror":             ["mainstream"],
  "Express":                ["politics", "mainstream"],
  "Reclaim The Net":        ["censorship", "alt-media"],
  "The Gateway Pundit":     ["geopolitics", "alt-media"],
  "Westmonster":            ["politics", "alt-media"],
};

// Heuristic category tags per story for left sidebar counts
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "UK Corruption":        ["starmer","labour","tory","parliament","westminster","mp ","mps ","corruption","scandal","fraud","bribe","inquiry","misconduct","keir","sunak","reeves","hancock"],
  "Immigration":          ["immigra","migrant","asylum","border","channel","grooming","gang","deporta","visa","illegal","boat","rwand","small boat"],
  "Media & Censorship":   ["bbc","ofcom","censor","ban","platform","debank","free speech","silenc","suspend","restrict","mainstream media","msm","guardian"],
  "Geopolitics":          ["ukraine","russia","nato","israel","gaza","wef","epstein","trump","china","taiwan","iran","davos","zelensky","putin"],
  "Govt News Dumps":      ["friday","budget day","alongside","quietly","buried","slipped","released late","late night","dumped","u-turn"],
};

// Which articles might be "viral" vs "suppressed" based on source type
function isViral(item: NewsItem): boolean {
  const tags = SOURCE_TAGS[item.source] || [];
  const hasMainstream = tags.includes("mainstream");
  const title = item.title.toLowerCase();
  const explosiveWords = ["record","surge","exposed","scandal","leaked","shock","crisis","collapse","ban","fury","outrage","exclusive","breaking","court","arrest","cover"];
  return explosiveWords.some(w => title.includes(w));
}

function isSuppressed(item: NewsItem): boolean {
  const tags = SOURCE_TAGS[item.source] || [];
  return tags.includes("alt-media") && !isViral(item);
}

function isNewsDump(item: NewsItem): boolean {
  if (!item.pubDate) return false;
  const d = new Date(item.pubDate);
  const day = d.getDay(); // 5 = Friday
  const hour = d.getHours();
  return day === 5 && hour >= 16;
}

// Which category does this story best match?
function storyCategory(item: NewsItem): string {
  const text = (item.title + " " + item.description).toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(kw => text.includes(kw))) return cat;
  }
  return "";
}

const CATEGORY_FILTERS = [
  { id: "all",             label: "All Stories",          icon: null },
  { id: "UK Corruption",   label: "UK Corruption",        icon: null },
  { id: "Immigration",     label: "Immigration / Demographics", icon: null },
  { id: "Media & Censorship", label: "Media & Censorship",icon: null },
  { id: "Geopolitics",     label: "Geopolitics",          icon: null },
  { id: "Govt News Dumps", label: "Govt News Dumps",      icon: null },
];

const SOURCE_FILTERS = [
  { id: "all-sources",  label: "All Sources" },
  { id: "alt-media",    label: "Alt Media" },
  { id: "mainstream",   label: "Mainstream" },
];

// Hero images for the rotating banner (map to category context)
const HERO_IMAGES = [
  { src: "/brand/hero-tv.jpg",          label: "MEDIA INTEL" },
  { src: "/brand/hero-airport.jpg",     label: "IMMIGRATION WATCH" },
  { src: "/brand/hero-blacksmith.jpg",  label: "RESTORE BRITAIN" },
  { src: "/brand/hero-door.jpg",        label: "SUPPRESSED NEWS" },
  { src: "/brand/hero-plane.jpg",       label: "GEOPOLITICS" },
];

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
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
  image?: string | null;
}

// ─── TICKER ───────────────────────────────────────────────────────────────────
function NewsTicker({ items }: { items: NewsItem[] }) {
  const tickerItems = items.slice(0, 12);
  if (!tickerItems.length) return null;

  return (
    <div className="bg-[#f0c800] overflow-hidden h-8 flex items-center shrink-0">
      <div className="bg-black text-[#f0c800] text-[10px] font-black tracking-widest px-3 h-full flex items-center shrink-0 uppercase z-10">
        BREAKING
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div
          className="flex gap-0 whitespace-nowrap"
          style={{
            animation: "ticker 15s linear infinite",
          }}
        >
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black text-[11px] font-semibold px-6 hover:text-[#cc2a2a] transition-colors shrink-0"
            >
              {item.title}
              <span className="text-black/30 mx-3">◆</span>
            </a>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ─── STORY CARD ───────────────────────────────────────────────────────────────
function StoryCard({ item, index, isAdmin, onBlock, isBookmarked, onBookmark }: {
  item: NewsItem;
  index: number;
  isAdmin?: boolean;
  onBlock?: (link: string) => void;
  isBookmarked?: boolean;
  onBookmark?: (item: NewsItem) => void;
}) {
  const meta = SOURCE_META[item.source];
  const accentColor = meta?.color || "#cc2a2a";
  const viral = isViral(item);
  const suppressed = isSuppressed(item);
  const newsDump = isNewsDump(item);
  const category = storyCategory(item);

  return (
    <div
      className="relative group"
      data-testid={`story-card-${index}`}
    >
      {/* Admin delete button — only visible to admins */}
      {isAdmin && onBlock && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBlock(item.link); }}
          title="Remove story from feed"
          className="absolute top-2 right-2 z-20 bg-black/80 hover:bg-red-600 text-[#444] hover:text-white border border-[#333] hover:border-red-600 rounded p-1.5 transition-all duration-150 opacity-0 group-hover:opacity-100"
        >
          <X size={14} />
        </button>
      )}
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-[#111] border border-[#1e1e1e] hover:border-[#cc2a2a]/50 rounded-sm transition-all duration-200 overflow-hidden"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      {/* Source image — top of card, cropped banner */}
      {item.image && (
        <div className="w-full h-36 overflow-hidden bg-[#0d0d0d]">
          <img
            src={item.image}
            alt=""
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-300"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).closest('.overflow-hidden')?.remove(); }}
          />
        </div>
      )}
      <div className="px-6 py-5">
        {/* Tag row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {newsDump && (
            <span className="text-[11px] font-black tracking-widest px-2.5 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-sm uppercase">
              📢 NEWS DUMP
            </span>
          )}
          {viral && (
            <span className="flex items-center gap-1 text-[11px] font-black tracking-widest px-2.5 py-1 bg-[#cc2a2a]/20 text-red-400 border border-[#cc2a2a]/30 rounded-sm uppercase">
              <Flame size={11} />
              VIRAL
            </span>
          )}
          {suppressed && (
            <span className="flex items-center gap-1 text-[11px] font-black tracking-widest px-2.5 py-1 bg-purple-900/30 text-purple-300 border border-purple-700/40 rounded-sm uppercase">
              <EyeOff size={11} />
              SUPPRESSED
            </span>
          )}
          {meta?.type === "alt" && (
            <span className="text-[11px] font-black tracking-widest px-2.5 py-1 bg-[#1a1a1a] text-zinc-400 border border-zinc-700/50 rounded-sm uppercase">
              ALT SOURCE
            </span>
          )}
          {category && (
            <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 bg-[#1a1a1a] text-zinc-500 border border-zinc-800 rounded-sm uppercase">
              {category}
            </span>
          )}
          {/* Time — pushed to far right */}
          {item.pubDate && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
              <Clock size={11} />
              {timeAgo(item.pubDate)}
            </span>
          )}
        </div>

        {/* Source name — prominent, coloured */}
        <div
          className="text-sm font-black tracking-widest uppercase mb-2.5"
          style={{ color: accentColor }}
        >
          {item.source}
        </div>

        {/* Headline — large, bold, Clash Display */}
        <h3
          className="text-xl font-black text-white leading-snug group-hover:text-[#cc2a2a] transition-colors mb-3 tracking-wide"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          {item.title}
        </h3>

        {/* Description — 5 lines, larger text */}
        {item.description && (
          <p className="text-[15px] text-zinc-400 line-clamp-5 leading-relaxed">
            {stripHtml(item.description)}
          </p>
        )}
        {/* Bookmark button */}
        {onBookmark && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(item); }}
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded transition-colors ${
                isBookmarked
                  ? "text-[#f0c800] bg-yellow-500/10 border border-yellow-500/20"
                  : "text-[#444] hover:text-[#f0c800] border border-transparent hover:border-yellow-500/20"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Save for later"}
            >
              {isBookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
              {isBookmarked ? "Saved" : "Save"}
            </button>
          </div>
        )}
      </div>
    </a>
    </div>
  );
}

// ─── SIDEBAR STAT BOX ─────────────────────────────────────────────────────────
function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center py-3">
      <div className="text-2xl font-black text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>{value}</div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}

// ─── HERO BANNER ─────────────────────────────────────────────────────────────
function HeroBanner({ items }: { items: NewsItem[] }) {
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const hero = HERO_IMAGES[heroIndex];

  return (
    <div
      className="relative w-full h-44 overflow-hidden rounded-sm mb-4 shrink-0"
      style={{
        backgroundImage: `url(${hero.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex items-center gap-2">
          <img src="/brand/logo-x.jpg" alt="DinoBane" className="w-8 h-8 rounded-sm object-cover" />
          <div>
            <div className="text-white text-xs font-black tracking-widest uppercase" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              DinoBane Intel
            </div>
            <div className="text-zinc-400 text-[9px] tracking-widest uppercase">UK Political Intelligence Feed</div>
          </div>
        </div>

        <div>
          <div className="text-[#cc2a2a] text-[9px] font-black tracking-widest uppercase mb-1">{hero.label}</div>
          <div className="text-white text-sm font-black leading-tight" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            {items[0]?.title || "Loading latest intelligence..."}
          </div>
        </div>
      </div>

      {/* Hero dots */}
      <div className="absolute bottom-3 right-4 flex gap-1">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setHeroIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === heroIndex ? "bg-[#cc2a2a]" : "bg-white/30"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function NewsPage() {
  const { user } = useAuth();
  const isAdmin = !!(user?.email && ADMIN_EMAILS.has(user.email));

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all-sources");
  const [viewFilter, setViewFilter] = useState<"all" | "viral" | "suppressed" | "latest">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const blockMutation = useMutation({
    mutationFn: (link: string) =>
      apiRequest("POST", "/api/admin/intel/block", { url: link }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intel/feed"] });
    },
  });

  // Bookmarks
  const { data: bookmarks = [] } = useQuery<{ storyLink: string }[]>({
    queryKey: ["/api/bookmarks"],
    queryFn: () => apiRequest("GET", "/api/bookmarks").then(r => r.json()),
    enabled: !!user,
    staleTime: 30000,
  });
  const bookmarkedLinks = new Set(bookmarks.map((b: any) => b.storyLink));

  const bookmarkMutation = useMutation({
    mutationFn: (item: NewsItem) =>
      apiRequest("POST", "/api/bookmarks", { storyLink: item.link, storyTitle: item.title, storySource: item.source }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] }),
  });

  const { data: items, isLoading, isError, dataUpdatedAt } = useQuery<NewsItem[]>({
    queryKey: ["/api/intel/feed"],
    staleTime: 5 * 60 * 1000,
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  // Compute category counts
  const categoryCounts = CATEGORY_FILTERS.reduce<Record<string, number>>((acc, f) => {
    if (f.id === "all") {
      acc[f.id] = items?.length ?? 0;
    } else {
      acc[f.id] = items?.filter(item => {
        const text = (item.title + " " + item.description).toLowerCase();
        const kws = CATEGORY_KEYWORDS[f.id] || [];
        return kws.some(kw => text.includes(kw));
      }).length ?? 0;
    }
    return acc;
  }, {});

  // Source counts
  const sourceCounts = Object.keys(SOURCE_TAGS).reduce<Record<string, number>>((acc, src) => {
    acc[src] = items?.filter(i => i.source === src).length ?? 0;
    return acc;
  }, {});

  const allSources = Object.entries(sourceCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  // Stats
  const viralCount = items?.filter(isViral).length ?? 0;
  const suppressedCount = items?.filter(isSuppressed).length ?? 0;
  const newsDumpCount = items?.filter(isNewsDump).length ?? 0;

  // Filter chain
  const filteredItems = (items ?? []).filter(item => {
    // Category
    if (categoryFilter !== "all") {
      const text = (item.title + " " + item.description).toLowerCase();
      const kws = CATEGORY_KEYWORDS[categoryFilter] || [];
      if (!kws.some(kw => text.includes(kw))) return false;
    }
    // Source type
    if (sourceFilter === "alt-media") {
      const tags = SOURCE_TAGS[item.source] || [];
      if (!tags.includes("alt-media")) return false;
    } else if (sourceFilter === "mainstream") {
      const tags = SOURCE_TAGS[item.source] || [];
      if (!tags.includes("mainstream")) return false;
    }
    // View filter
    if (viewFilter === "viral" && !isViral(item)) return false;
    if (viewFilter === "suppressed" && !isSuppressed(item)) return false;
    if (viewFilter === "latest") {
      const diff = Date.now() - new Date(item.pubDate || 0).getTime();
      if (diff > 12 * 60 * 60 * 1000) return false; // last 12h
    }
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.title.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Sort: news dumps and viral first
  const sorted = [...filteredItems].sort((a, b) => {
    const aScore = (isNewsDump(a) ? 3 : 0) + (isViral(a) ? 2 : 0) + (isSuppressed(a) ? 1 : 0);
    const bScore = (isNewsDump(b) ? 3 : 0) + (isViral(b) ? 2 : 0) + (isSuppressed(b) ? 1 : 0);
    if (bScore !== aScore) return bScore - aScore;
    return new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime();
  });

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] overflow-hidden">

      {/* Ticker */}
      {items && items.length > 0 && <NewsTicker items={items} />}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-56 shrink-0 border-r border-[#1a1a1a] flex flex-col overflow-y-auto hidden md:flex">

          {/* Categories */}
          <div className="px-3 pt-4 pb-2">
            <div className="text-[9px] font-black tracking-widest text-zinc-600 uppercase mb-2 px-1">Categories</div>
            {CATEGORY_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-sm text-xs font-semibold transition-colors mb-0.5 ${
                  categoryFilter === f.id
                    ? "bg-[#cc2a2a]/20 text-[#cc2a2a] border-l-2 border-[#cc2a2a]"
                    : "text-zinc-400 hover:text-white hover:bg-[#1a1a1a]"
                }`}
                data-testid={`category-${f.id}`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${categoryFilter === f.id ? "bg-[#cc2a2a]/30 text-[#cc2a2a]" : "bg-[#1a1a1a] text-zinc-600"}`}>
                  {categoryCounts[f.id] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-[#1a1a1a] mx-3 my-1" />

          {/* Sources */}
          <div className="px-3 py-2">
            <div className="text-[9px] font-black tracking-widest text-zinc-600 uppercase mb-2 px-1">Sources</div>
            {allSources.slice(0, 12).map(([src, count]) => {
              const meta = SOURCE_META[src];
              return (
                <button
                  key={src}
                  onClick={() => {
                    setSearchQuery("");
                    // filter by source via search
                    setSearchQuery(prev => prev === src ? "" : "");
                    setCategoryFilter("all");
                  }}
                  className="w-full flex items-center justify-between text-left px-2 py-1 rounded-sm transition-colors mb-0.5 hover:bg-[#1a1a1a] group"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta?.color || "#cc2a2a" }} />
                    <span className="text-[11px] text-zinc-400 group-hover:text-white transition-colors truncate max-w-[110px]">{src}</span>
                  </div>
                  <span className="text-[10px] text-zinc-600">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#1a1a1a] mx-3 my-1" />

          {/* Feed stats */}
          <div className="px-3 py-2">
            <div className="text-[9px] font-black tracking-widest text-zinc-600 uppercase mb-2 px-1">Feed Stats</div>
            <div className="grid grid-cols-2 divide-x divide-y divide-[#1a1a1a] border border-[#1a1a1a] rounded-sm overflow-hidden">
              <StatBox value={items?.length ?? 0} label="Stories" />
              <StatBox value={viralCount} label="Viral" />
              <StatBox value={suppressedCount} label="Suppressed" />
              <StatBox value={newsDumpCount} label="Dumps" />
            </div>
            {lastUpdated && (
              <div className="text-[9px] text-zinc-700 mt-2 px-1 text-center">
                Updated {lastUpdated}
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top bar */}
          <div className="flex flex-col border-b border-[#1a1a1a] bg-[#0a0a0a] shrink-0">
            {/* Scrollable filter row */}
            <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-none">
              {/* View filter pills */}
              {(["all", "viral", "suppressed", "latest"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setViewFilter(v)}
                  className={`shrink-0 flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-sm transition-colors capitalize ${
                    viewFilter === v
                      ? "bg-[#cc2a2a] text-white"
                      : "bg-[#111] text-zinc-400 border border-[#222] hover:border-[#cc2a2a]/40 hover:text-white"
                  }`}
                  data-testid={`view-filter-${v}`}
                >
                  {v === "viral" && <Flame size={10} />}
                  {v === "suppressed" && <EyeOff size={10} />}
                  {v === "latest" && <Clock size={10} />}
                  {v === "all" ? "All Stories" : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
              <div className="w-px h-4 bg-[#222] shrink-0 mx-1" />
              {/* Source type pills */}
              {SOURCE_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSourceFilter(f.id)}
                  className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-sm transition-colors ${
                    sourceFilter === f.id
                      ? "bg-[#1a1a1a] text-white border border-[#cc2a2a]/50"
                      : "text-zinc-500 border border-transparent hover:text-zinc-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              {/* Search */}
              <div className="relative shrink-0 ml-auto">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-[#111] border border-[#222] rounded-sm pl-7 pr-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-[#cc2a2a]/50 w-28 sm:w-44"
                  data-testid="news-search"
                />
              </div>
              {/* Refresh */}
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/intel/feed"] })}
                disabled={isLoading}
                className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-white border border-[#222] hover:border-[#cc2a2a]/40 px-3 py-1.5 rounded-sm transition-colors"
                data-testid="news-refresh"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-[#cc2a2a]" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Story count bar */}
          <div className="px-4 py-2 border-b border-[#1a1a1a] bg-[#0d0d0d] shrink-0">
            <span className="text-[11px] text-zinc-500">
              Updated {lastUpdated || "—"} · <span className="text-zinc-300 font-semibold">{sorted.length} stories loaded</span>
              {viewFilter !== "all" && <span className="ml-2 text-[#cc2a2a]">· Filtered: {viewFilter}</span>}
            </span>
          </div>

          {/* Feed */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-5 max-w-3xl mx-auto">

              {/* Loading */}
              {isLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-sm p-4 animate-pulse">
                      <div className="flex gap-2 mb-3">
                        <div className="h-3 bg-[#222] rounded-sm w-16" />
                        <div className="h-3 bg-[#222] rounded-sm w-12" />
                      </div>
                      <div className="h-4 bg-[#222] rounded-sm w-4/5 mb-2" />
                      <div className="h-3 bg-[#1a1a1a] rounded-sm w-2/3" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {isError && (
                <div className="flex items-center gap-3 bg-[#111] border border-[#cc2a2a]/30 rounded-sm p-5">
                  <AlertCircle className="h-5 w-5 text-[#cc2a2a] shrink-0" />
                  <div>
                    <p className="font-bold text-white text-sm">Feed temporarily unavailable</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Hit Refresh to try again.</p>
                  </div>
                </div>
              )}

              {/* News dump alert */}
              {!isLoading && sorted.some(isNewsDump) && (
                <div className="mb-4 p-3 border border-yellow-500/40 bg-yellow-500/5 rounded-sm flex items-start gap-2">
                  <span className="text-yellow-400 text-sm shrink-0">📢</span>
                  <div>
                    <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">News Dump Alert</p>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      {sorted.filter(isNewsDump).length} story{sorted.filter(isNewsDump).length > 1 ? "ies" : "y"} released on Friday evening — a common government tactic to bury bad news.
                    </p>
                  </div>
                </div>
              )}

              {/* Stories grid */}
              {!isLoading && sorted.length > 0 && (
                <div className="space-y-4">
                  {sorted.map((item, i) => (
                    <StoryCard key={`${item.link}-${i}`} item={item} index={i} isAdmin={isAdmin} onBlock={(link) => blockMutation.mutate(link)} isBookmarked={bookmarkedLinks.has(item.link)} onBookmark={user ? (item) => bookmarkMutation.mutate(item) : undefined} />
                  ))}
                </div>
              )}

              {/* Empty states */}
              {!isLoading && sorted.length === 0 && items && items.length > 0 && (
                <div className="text-center text-zinc-600 py-16 text-sm">
                  No stories match this filter. Try adjusting your selection.
                </div>
              )}
              {!isLoading && (!items || items.length === 0) && !isError && (
                <div className="text-center text-zinc-600 py-16 text-sm">
                  No stories loaded yet. Hit Refresh.
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="w-80 shrink-0 border-l border-[#1a1a1a] flex-col overflow-y-auto hidden lg:flex">
          <div className="p-3">
            {/* Hero banner */}
            <HeroBanner items={items ?? []} />

            {/* Top stories by category */}
            <div className="text-[9px] font-black tracking-widest text-zinc-600 uppercase mb-2 px-1">Top Stories</div>
            <div className="space-y-1">
              {(items ?? []).filter(isViral).slice(0, 5).map((item, i) => {
                const meta = SOURCE_META[item.source];
                return (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="flex gap-2 p-2 rounded-sm bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] hover:border-[#cc2a2a]/30 transition-colors">
                      <span className="text-[#cc2a2a] font-black text-xs shrink-0">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-[11px] text-zinc-300 font-semibold leading-snug group-hover:text-white line-clamp-2 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[9px] mt-1" style={{ color: meta?.color || "#cc2a2a" }}>{item.source}</p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            <div className="border-t border-[#1a1a1a] my-3" />

            {/* YouTube shortcut */}
            <a
              href="https://www.youtube.com/@Dinobane-Clips"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2.5 rounded-sm bg-[#cc2a2a]/10 border border-[#cc2a2a]/30 hover:bg-[#cc2a2a]/20 transition-colors group"
            >
              <Youtube size={14} className="text-[#cc2a2a] shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-white">@Dinobane-Clips</p>
                <p className="text-[9px] text-zinc-500">Watch on YouTube</p>
              </div>
              <ExternalLink size={10} className="text-zinc-600 group-hover:text-[#cc2a2a] ml-auto transition-colors" />
            </a>

            <div className="border-t border-[#1a1a1a] my-3" />

            {/* Suppressed stories list */}
            <div className="text-[9px] font-black tracking-widest text-zinc-600 uppercase mb-2 px-1">Suppressed</div>
            <div className="space-y-1">
              {(items ?? []).filter(isSuppressed).slice(0, 4).map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group p-2 rounded-sm bg-purple-950/20 border border-purple-900/30 hover:border-purple-700/50 transition-colors"
                >
                  <p className="text-[11px] text-zinc-400 leading-snug group-hover:text-white transition-colors line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-[9px] text-zinc-600 mt-0.5">{item.source}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
