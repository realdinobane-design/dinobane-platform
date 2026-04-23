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
  "Rebel News":             { color: "#ef4444", type: "alt" },
  "The European Conservative": { color: "#3b82f6", type: "alt" },
  "Sovereignty":            { color: "#f5c842", type: "alt" },
  "Remix News":             { color: "#a855f7", type: "intl" },
  "The Post Millennial":    { color: "#22c55e", type: "intl" },
  "Politicalite":           { color: "#f97316", type: "alt" },
  "True North":             { color: "#0ea5e9", type: "intl" },
  "Watts Up With That":     { color: "#14b8a6", type: "alt" },
  "Liberty Sentinel":       { color: "#f43f5e", type: "alt" },
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
  "Rebel News":             ["politics", "immigration", "alt-media"],
  "The European Conservative": ["politics", "geopolitics", "alt-media"],
  "Sovereignty":            ["politics", "uk-corruption", "alt-media"],
  "Remix News":             ["geopolitics", "alt-media"],
  "The Post Millennial":    ["politics", "censorship", "alt-media"],
  "Politicalite":           ["politics", "alt-media"],
  "True North":             ["politics", "alt-media"],
  "Watts Up With That":     ["culture", "alt-media"],
  "Liberty Sentinel":       ["politics", "censorship", "alt-media"],
};

// Heuristic category tags per story for left sidebar counts
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "UK Corruption":        [
    "starmer","labour","tory","parliament","westminster","mp ","mps ","corruption","scandal","fraud","bribe",
    "inquiry","misconduct","keir","sunak","reeves","hancock","cover-up","cover up","whitewash","cronyism",
    "lobbying","lobbied","donations","donor","party donor","sleaze","backhander","expenses","rigged",
    "police failure","cps","crown prosecution","home office","civil servant","quango","nhs scandal",
    "reform uk","nigel farage","rupert lowe","lee anderson","net zero","two-tier","two tier",
    "grooming gang","inquiry blocked","no investigation","mbe","honour","honours list"
  ],
  "Immigration":          [
    "immigra","migrant","asylum","border","channel","grooming","gang","deporta","visa","illegal","boat",
    "rwand","small boat","dingy","dinghy","hotel","taxpayer funded","hotels for migrants",
    "afghan","eritrea","albania","eritrean","albanian","trafficking","modern slavery",
    "population","demographic","replacement","english minority","majority minority",
    "net migration","net zero migration","legal migration","student visa","work visa",
    "open borders","free movement","mass immigration","uncontrolled"
  ],
  "Media & Censorship":   [
    "bbc","ofcom","censor","banned","ban","platform","debank","free speech","silenc","suspend","restrict",
    "mainstream media","msm","guardian","ch4","channel 4","itv news","sky news","fact check",
    "misinformation","disinformation","hate speech","online safety","online safety bill",
    "social media","twitter","facebook","youtube","tiktok","algorithm","demonetis","deplatform",
    "press freedom","journalist","arrested","detained","investigated","gagged","suppressed",
    "propaganda","narrative","state media","public broadcaster"
  ],
  "Geopolitics":          [
    "ukraine","russia","nato","israel","gaza","wef","epstein","trump","china","taiwan","iran",
    "davos","zelensky","putin","world economic forum","schwab","global","globalist",
    "un ","united nations","who ","world health","imf","world bank","soros","bilderberg",
    "middle east","war","conflict","nuclear","sanction","tariff","trade war","proxy war",
    "deep state","cia","mi5","mi6","five eyes","surveillance","nwo","new world order"
  ],
  "Govt News Dumps":      [
    "friday","budget day","alongside","quietly","buried","slipped","released late","late night",
    "dumped","u-turn","sneaked","snuck","under the radar","unannounced","without debate",
    "statutory instrument","written statement","emergency","recess","parliament prorogued"
  ],
  "Economy & Cost of Living": [
    "inflation","cost of living","energy bill","energy price","fuel","petrol","diesel",
    "mortgage","rent","housing","eviction","homeless","food bank","poverty","wage",
    "tax rise","tax hike","national insurance","income tax","council tax","stamp duty",
    "recession","gdp","growth","budget","spending cut","austerity","debt","deficit",
    "interest rate","bank of england","pound","sterling","economy"
  ],
  "Culture & Identity":   [
    "woke","gender","trans","transgender","lgb","pronoun","diversity","inclusion","dei",
    "critical race","white privilege","decoloni","statues","history","heritage","flag",
    "english","englishness","british identity","st george","union jack","coronation",
    "church of england","islam","muslim","sharia","halal","grooming","honour killing",
    "school","curriculum","children","indoctrination","safeguarding","nspcc"
  ],
};

// VIRAL: Story appears in BOTH mainstream AND alt-media sources (cross-source spread = trending),
// OR has high-urgency language in title AND appears in a mainstream outlet
function isViral(item: NewsItem): boolean {
  const title = item.title.toLowerCase();
  const mainTags = SOURCE_TAGS[item.source] || [];
  const isMainstream = mainTags.includes("mainstream");
  const isAlt = mainTags.includes("alt-media");
  const urgentWords = [
    "record","surge","exposed","scandal","leaked","shock","crisis","collapse","ban",
    "fury","outrage","exclusive","breaking","court","arrest","cover-up","cover up",
    "resign","sacked","fired","jailed","convicted","emergency","urgent","bombshell",
    "explosive","damning","reveals","confession","evidence","proof","caught"
  ];
  const hasUrgency = urgentWords.some(w => title.includes(w));
  // Viral = mainstream covering something explosive, OR alt-media story with very high urgency
  return (isMainstream && hasUrgency) || (isAlt && urgentWords.filter(w => title.includes(w)).length >= 2);
}

// SUPPRESSED: Stories from alt-media sources covering topics the mainstream ignores —
// i.e. alt-media stories that are NOT also appearing in mainstream outlets
function isSuppressed(item: NewsItem): boolean {
  const tags = SOURCE_TAGS[item.source] || [];
  const isAlt = tags.includes("alt-media");
  const isIntl = SOURCE_META[item.source]?.type === "intl";
  // Suppressed = alt or intl source, not viral enough to be picked up by mainstream
  return (isAlt || isIntl) && !isViral(item);
}

// NEWS DUMP: Only Friday afternoon releases — government tactic to bury bad news
// Stories flow into the feed normally but are highlighted in gold
function isNewsDump(item: NewsItem): boolean {
  if (!item.pubDate) return false;
  const d = new Date(item.pubDate);
  const day = d.getDay(); // 5 = Friday
  const hour = d.getHours();
  return day === 5 && hour >= 15; // Friday after 3pm only
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
  { id: "all",                      label: "All Stories" },
  { id: "UK Corruption",            label: "UK Corruption" },
  { id: "Immigration",              label: "Immigration" },
  { id: "Media & Censorship",       label: "Media & Censorship" },
  { id: "Geopolitics",              label: "Geopolitics" },
  { id: "Economy & Cost of Living", label: "Economy" },
  { id: "Culture & Identity",       label: "Culture & Identity" },
  { id: "Govt News Dumps",          label: "News Dumps" },
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
    .replace(/<[^>]*>/g, " ")        // full tags
    .replace(/<[^>]*$/g, "")          // partial/unclosed tags at end of string
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "")
    .replace(/&gt;/g, "")
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
  const tickerItems = items.slice(0, 20);
  if (!tickerItems.length) return null;

  // Duplicate for seamless loop
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <div className="overflow-hidden h-10 flex items-stretch shrink-0" style={{ background: 'repeating-linear-gradient(90deg, #f5c842 0px, #f5c842 1px, #f5c842 1px)' }}>
      {/* BREAKING label */}
      <div className="bg-black text-[#f5c842] text-[11px] font-black tracking-widest px-4 h-full flex items-center shrink-0 uppercase z-10 border-r-4 border-[#f5c842]">
        BREAKING
      </div>
      {/* Hazard tape scrolling ticker */}
      <div className="relative flex-1 overflow-hidden">
        <div
          className="flex items-stretch h-full whitespace-nowrap"
          style={{ animation: "ticker 20s linear infinite" }}
        >
          {doubled.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center shrink-0 h-full px-6 font-black text-[12px] tracking-wide hover:opacity-80 transition-opacity"
              style={{
                background: i % 2 === 0 ? '#f5c842' : '#000000',
                color: i % 2 === 0 ? '#000000' : '#f5c842',
                borderRight: '4px solid #f5c842',
              }}
            >
              {item.title}
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
      className={`group block border rounded-sm transition-all duration-200 overflow-hidden ${newsDump ? "bg-[#1a1500] border-[#f5c842]/40 hover:border-[#f5c842]" : "bg-[#111] border-[#1e1e1e] hover:border-[#cc2a2a]/50"}`}
      style={{ borderLeft: `4px solid ${newsDump ? "#f5c842" : accentColor}` }}
    >

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

        {/* Image — below title */}
        {item.image && (
          <div className="w-full h-36 lg:h-72 overflow-hidden bg-[#0d0d0d] mb-4 rounded-sm">
            <img
              src={item.image}
              alt=""
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-300"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).closest('.overflow-hidden')?.remove(); }}
            />
          </div>
        )}

        {/* Description — 5 lines, larger text */}
        {item.description && (
          <p className="text-[15px] text-zinc-400 line-clamp-[15] leading-relaxed">
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
  const [activeTab, setActiveTab] = useState<"feed" | "saved">("feed");
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
  const { data: bookmarks = [] } = useQuery<{ id: number; storyLink: string; storyTitle: string; storySource: string; createdAt: string }[]>({
    queryKey: ["/api/bookmarks"],
    queryFn: () => apiRequest("GET", "/api/bookmarks").then(r => r.json()),
    enabled: !!user,
    staleTime: 30000,
  });
  const bookmarkedLinks = new Set(bookmarks.map((b: any) => b.storyLink));

  // Admin custom stories
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customSource, setCustomSource] = useState("");

  const { data: customStories = [], refetch: refetchCustom } = useQuery<any[]>({
    queryKey: ["/api/admin/intel/custom"],
    queryFn: () => apiRequest("GET", "/api/admin/intel/custom").then(r => r.json()),
    enabled: isAdmin,
    staleTime: 30000,
  });

  const addCustomMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/intel/custom", { title: customTitle, link: customUrl, source: customSource || "Admin Pick" }).then(r => r.json()),
    onSuccess: () => {
      setCustomUrl(""); setCustomTitle(""); setCustomSource("");
      refetchCustom();
      queryClient.removeQueries({ queryKey: ["/api/intel/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intel/feed"] });
    },
  });

  const removeCustomMutation = useMutation({
    mutationFn: (link: string) => apiRequest("DELETE", "/api/admin/intel/custom", { link }).then(r => r.json()),
    onSuccess: () => { refetchCustom(); queryClient.invalidateQueries({ queryKey: ["/api/intel/feed"] }); },
  });

  const bookmarkMutation = useMutation({
    mutationFn: (item: NewsItem) =>
      apiRequest("POST", "/api/bookmarks", { storyLink: item.link, storyTitle: item.title, storySource: item.source }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] }),
  });

  const { data: items, isLoading, isError, dataUpdatedAt } = useQuery<NewsItem[]>({
    queryKey: ["/api/intel/feed"],
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000, // keep in memory 1 hour
    initialData: () => {
      try {
        const cached = localStorage.getItem("dinobane_intel_cache");
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          // Use localStorage data if less than 30 mins old
          if (Date.now() - ts < 30 * 60 * 1000) return data;
        }
      } catch {}
      return undefined;
    },
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
      if (diff > 24 * 60 * 60 * 1000) return false; // last 24h
    }
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.title.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Sort: latest = pure date order; everything else = score-ranked then by date
  const sorted = [...filteredItems].sort((a, b) => {
    if (viewFilter === "latest") {
      return new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime();
    }
    const aScore = (isViral(a) ? 2 : 0) + (isSuppressed(a) ? 1 : 0);
    const bScore = (isViral(b) ? 2 : 0) + (isSuppressed(b) ? 1 : 0);
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
        <div className="w-72 shrink-0 border-r border-[#1a1a1a] flex flex-col overflow-y-auto hidden md:flex">

          {/* Categories */}
          <div className="px-3 pt-4 pb-2">
            <div className="text-[14px] font-black tracking-widest text-zinc-600 uppercase mb-3 px-1">Categories</div>
            {CATEGORY_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`w-full flex items-center justify-between text-left px-2 py-2 rounded-sm text-[14px] font-semibold transition-colors mb-1 ${
                  categoryFilter === f.id
                    ? "bg-[#cc2a2a]/20 text-[#cc2a2a] border-l-2 border-[#cc2a2a]"
                    : "text-zinc-400 hover:text-white hover:bg-[#1a1a1a]"
                }`}
                data-testid={`category-${f.id}`}
              >
                <span>{f.label}</span>
                <span className={`text-[13px] px-1.5 py-0.5 rounded-sm ${categoryFilter === f.id ? "bg-[#cc2a2a]/30 text-[#cc2a2a]" : "bg-[#1a1a1a] text-zinc-600"}`}>
                  {categoryCounts[f.id] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-[#1a1a1a] mx-3 my-1" />

          {/* Sources */}
          <div className="px-3 py-2">
            <div className="text-[14px] font-black tracking-widest text-zinc-600 uppercase mb-3 px-1">Sources</div>
            {allSources.slice(0, 12).map(([src, count]) => {
              const meta = SOURCE_META[src];
              return (
                <button
                  key={src}
                  onClick={() => {
                    setSearchQuery("");
                    setSearchQuery(prev => prev === src ? "" : "");
                    setCategoryFilter("all");
                  }}
                  className="w-full flex items-center justify-between text-left px-2 py-1.5 rounded-sm transition-colors mb-0.5 hover:bg-[#1a1a1a] group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta?.color || "#cc2a2a" }} />
                    <span className="text-[14px] text-zinc-400 group-hover:text-white transition-colors truncate max-w-[150px]">{src}</span>
                  </div>
                  <span className="text-[13px] text-zinc-600">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#1a1a1a] mx-3 my-1" />

          {/* Feed stats */}
          <div className="px-3 py-2">
            <div className="text-[14px] font-black tracking-widest text-zinc-600 uppercase mb-3 px-1">Feed Stats</div>
            <div className="grid grid-cols-2 divide-x divide-y divide-[#1a1a1a] border border-[#1a1a1a] rounded-sm overflow-hidden">
              <StatBox value={items?.length ?? 0} label="Stories" />
              <StatBox value={viralCount} label="Viral" />
              <StatBox value={suppressedCount} label="Suppressed" />
              <StatBox value={newsDumpCount} label="Dumps" />
            </div>
            {lastUpdated && (
              <div className="text-[13px] text-zinc-700 mt-2 px-1 text-center">
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
              {/* Tabs: Feed / Saved */}
              {user && (
                <>
                  <button
                    onClick={() => setActiveTab("feed")}
                    className={`shrink-0 text-[12px] font-bold px-4 py-2 rounded-sm transition-colors ${activeTab === "feed" ? "bg-[#cc2a2a] text-white" : "bg-[#111] text-zinc-400 border border-[#222] hover:border-[#cc2a2a]/40 hover:text-white"}`}
                  >Feed</button>
                  <button
                    onClick={() => setActiveTab("saved")}
                    className={`shrink-0 flex items-center gap-1.5 text-[12px] font-bold px-4 py-2 rounded-sm transition-colors ${activeTab === "saved" ? "bg-[#f5c842] text-black" : "bg-[#111] text-zinc-400 border border-[#222] hover:border-[#f5c842]/40 hover:text-white"}`}
                  ><BookmarkCheck size={10} />Saved {bookmarks.length > 0 && <span className="ml-0.5 bg-[#f5c842] text-black rounded-full px-1 text-[9px] font-black">{bookmarks.length}</span>}</button>
                  <div className="w-px h-4 bg-[#222] shrink-0 mx-1" />
                </>
              )}
              {/* View filter pills — only show in feed tab */}
              {activeTab === "feed" && (["all", "viral", "suppressed", "latest"] as const).map(v => (
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
              {activeTab === "feed" && <div className="w-px h-4 bg-[#222] shrink-0 mx-1" />}
              {/* Source type pills */}
              {activeTab === "feed" && SOURCE_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSourceFilter(f.id)}
                  className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-sm transition-colors ${
                    sourceFilter === f.id
                      ? "bg-[#1a1a1a] text-white border-[3px] border-[#f5c842]"
                      : "text-zinc-500 border-[3px] border-transparent hover:text-zinc-300"
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
                onClick={() => { try { localStorage.removeItem("dinobane_intel_cache"); } catch {} queryClient.removeQueries({ queryKey: ["/api/intel/feed"] }); queryClient.fetchQuery({ queryKey: ["/api/intel/feed"], queryFn: () => apiRequest("GET", "/api/intel/feed?t=" + Date.now()).then(r => r.json()).then(data => { try { localStorage.setItem("dinobane_intel_cache", JSON.stringify({ data, ts: Date.now() })); } catch {} return data; }) }); }}
                disabled={isLoading}
                className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-[#f5c842] hover:bg-[#f5c842] hover:text-black border border-[#f5c842] px-3 py-1.5 rounded-sm transition-all"
                data-testid="news-refresh"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-[#cc2a2a]" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Story count bar - only in feed tab */}
          {activeTab === "feed" && (
          <div className="px-4 py-2 border-b border-[#1a1a1a] bg-[#0d0d0d] shrink-0 flex items-center gap-3">
            <span className="text-[11px] text-zinc-500">
              Updated {lastUpdated || "—"} · <span className="text-zinc-300 font-semibold">{sorted.length} stories</span>
              {viewFilter !== "all" && <span className="ml-2 text-[#cc2a2a]">· {viewFilter}</span>}
            </span>
            {newsDumpCount > 0 && (
              <span className="text-[11px] font-black text-yellow-400">
                📢 {newsDumpCount} Friday news {newsDumpCount === 1 ? "dump" : "dumps"} in feed
              </span>
            )}
          </div>
          )}

          {/* Saved articles panel */}
          {activeTab === "saved" && (
            <div className="flex-1 overflow-y-auto px-4 py-5 max-w-3xl mx-auto w-full">
              {!user ? (
                <p className="text-zinc-500 text-sm">Log in to see your saved articles.</p>
              ) : bookmarks.length === 0 ? (
                <div className="text-center py-16">
                  <Bookmark size={32} className="mx-auto mb-3 text-zinc-700" />
                  <p className="text-zinc-500 text-sm">No saved articles yet.</p>
                  <p className="text-zinc-600 text-xs mt-1">Hit <strong className="text-zinc-400">Save</strong> on any story to bookmark it here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((b) => (
                    <div key={b.id} className="flex items-start justify-between gap-3 bg-[#111] border border-[#1e1e1e] rounded-sm px-4 py-3 hover:border-[#cc2a2a]/30 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <a href={b.storyLink} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-zinc-200 group-hover:text-white line-clamp-2 leading-snug">{b.storyTitle}</a>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-zinc-500">{b.storySource}</span>
                          <span className="text-[10px] text-zinc-700">·</span>
                          <span className="text-[11px] text-zinc-600">{new Date(b.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a href={b.storyLink} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white transition-colors"><ExternalLink size={13} /></a>
                        <button
                          onClick={() => bookmarkMutation.mutate({ link: b.storyLink, title: b.storyTitle, source: b.storySource } as any)}
                          className="text-[#f5c842] hover:text-zinc-400 transition-colors"
                          title="Remove bookmark"
                        ><BookmarkCheck size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feed */}
          {activeTab === "feed" && (<div className="flex-1 overflow-y-auto">
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
                      {sorted.filter(isNewsDump).length} {sorted.filter(isNewsDump).length === 1 ? "story" : "stories"} released on a Friday evening or weekend — a common government tactic to bury bad news.
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
          </div>)}

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="w-[38vw] max-w-2xl shrink-0 border-l border-[#1a1a1a] flex-col overflow-y-auto hidden lg:flex">
          <div className="p-4">
            {/* Hero banner */}
            <HeroBanner items={items ?? []} />

            {/* Top stories */}
            <div className="text-[14px] font-black tracking-widest text-zinc-600 uppercase mb-3 px-1 mt-2">Top Stories</div>
            <div className="space-y-2">
              {(items ?? []).filter(isViral).slice(0, 10).map((item, i) => {
                const meta = SOURCE_META[item.source];
                return (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="flex gap-3 p-3 rounded-sm bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] hover:border-[#cc2a2a]/30 transition-colors">
                      <span className="text-[#cc2a2a] font-black text-base shrink-0">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-[15px] text-zinc-300 font-semibold leading-snug group-hover:text-white line-clamp-2 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[13px] mt-1" style={{ color: meta?.color || "#cc2a2a" }}>{item.source}</p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            <div className="border-t border-[#1a1a1a] my-4" />

            {/* Suppressed stories */}
            <div className="text-[14px] font-black tracking-widest text-zinc-600 uppercase mb-3 px-1">Suppressed</div>
            <div className="space-y-2">
              {(items ?? []).filter(isSuppressed).slice(0, 8).map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group p-3 rounded-sm bg-purple-950/20 border border-purple-900/30 hover:border-purple-700/50 transition-colors"
                >
                  <p className="text-[15px] text-zinc-400 leading-snug group-hover:text-white transition-colors line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-[13px] text-zinc-600 mt-1">{item.source}</p>
                </a>
              ))}
            </div>

            <div className="border-t border-[#1a1a1a] my-4" />

            {/* YouTube shortcut */}
            <a
              href="https://www.youtube.com/@Dinobane-Clips"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-sm bg-[#cc2a2a]/10 border border-[#cc2a2a]/30 hover:bg-[#cc2a2a]/20 transition-colors group"
            >
              <Youtube size={20} className="text-[#cc2a2a] shrink-0" />
              <div>
                <p className="text-[15px] font-bold text-white">@Dinobane-Clips</p>
                <p className="text-[13px] text-zinc-500">Watch on YouTube</p>
              </div>
              <ExternalLink size={14} className="text-zinc-600 group-hover:text-[#cc2a2a] ml-auto transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
