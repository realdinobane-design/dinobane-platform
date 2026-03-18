// ─── TOPIC DETECTION ─────────────────────────────────────────────────────────
// Determines which topic pill a video/article title belongs to.
// detectTopic() accepts both title and an optional description for better accuracy.
// Order matters — first match wins. Rules are tuned to DinoBane's actual content.

export const TOPICS = [
  { id: "interviews",      label: "Interviews",      color: "#3b82f6" }, // blue
  { id: "reactions",       label: "Reactions",       color: "#f97316" }, // orange
  { id: "reviews",         label: "Reviews",         color: "#a855f7" }, // purple
  { id: "recommendations", label: "Recommendations", color: "#22c55e" }, // green
  { id: "uk-politics",     label: "UK Politics",     color: "#cc2a2a" }, // red
  { id: "news",            label: "News",            color: "#eab308" }, // yellow
] as const;

export type TopicId = typeof TOPICS[number]["id"] | "all";

// ─── KEYWORD RULES ────────────────────────────────────────────────────────────
// Each rule is checked against `title + " " + description` (lowercased).
// The first rule whose ANY keyword matches wins. "news" is the catch-all default.

const TOPIC_RULES: { id: Exclude<TopicId, "all">; keywords: string[] }[] = [
  // ── INTERVIEWS ──────────────────────────────────────────────────────────────
  // Guest appears, name + bracket format "Name - [ Unfiltered ]", sit-downs
  {
    id: "interviews",
    keywords: [
      "unfiltered",
      "interview",
      "sits down",
      "joins me",
      "joins us",
      "speaks to",
      "speaks with",
      "chat with",
      "in conversation",
      "exclusive with",
      "guest",
      "we spoke",
      "i spoke",
      "talks to",
      "talks with",
      "sat down",
      "one on one",
      "1 on 1",
    ],
  },

  // ── REACTIONS ───────────────────────────────────────────────────────────────
  // Reacting to existing content, clips, footage from others
  {
    id: "reactions",
    keywords: [
      "react",
      "reaction",
      "reacting",
      "responds",
      "response to",
      "replies",
      "responding to",
      "i watched",
      "we watched",
      "watching this",
      "clipped",
      "clip of",
      "buried this footage",
      "buried footage",
      "suppressed footage",
      "hidden footage",
      "they buried",
      "caught on camera",
      "watch this",
      "you won't believe",
    ],
  },

  // ── REVIEWS ─────────────────────────────────────────────────────────────────
  // Reviewing books, shows, products, events
  {
    id: "reviews",
    keywords: [
      "review",
      "reviewing",
      "honest take",
      "i tried",
      "we tried",
      "rating",
      "rated",
      "verdict",
      "breakdown of",
      "is it worth",
      "my verdict",
      "honest review",
    ],
  },

  // ── RECOMMENDATIONS ─────────────────────────────────────────────────────────
  // Recommending channels, accounts, content, people to follow
  {
    id: "recommendations",
    keywords: [
      "recommend",
      "you need to",
      "you should watch",
      "check out",
      "follow this",
      "subscribe to",
      "channel you",
      "must watch",
      "must follow",
      "go watch",
      "channels are dangerous",
      "these channels",
      "follow these",
      "you need to follow",
      "accounts you",
      "people you should",
    ],
  },

  // ── UK POLITICS ─────────────────────────────────────────────────────────────
  // Named politicians, institutions, political concepts, British identity,
  // and DinoBane's distinctive political vocabulary
  {
    id: "uk-politics",
    keywords: [
      // Named politicians & parties
      "starmer", "keir", "labour", "tory", "tories", "conservative",
      "farage", "nigel", "reform uk", "reform party",
      "rupert lowe", "sunak", "rishi", "reeves", "hancock",
      "boris", "blair", "corbyn", "rayner", "wes streeting",
      "sadiq", "khan", "yvette cooper",

      // Institutions & places
      "parliament", "westminster", "whitehall", "downing street",
      "house of commons", "house of lords", "ofcom", "bbc",
      "met police", "metropolitan police",

      // Political terms
      "election", "vote", "voted", "voting", "budget", "policy",
      "prime minister", "home secretary", "chancellor",
      "government", "minister", "cabinet",
      "two-party", "establishment", "deep state",
      "globalist", "wef", "world economic",

      // Immigration / demographics (key DinoBane topics)
      "grooming gang", "immigration", "border", "migrant", "asylum",
      "deporta", "channel crossing", "small boat", "illegal",
      "demographic", "population replacement", "great replacement",
      "two-tier", "two tier",

      // British identity / nationalism
      "britain", "british", "england", "english", "patriot",
      "uk ", "u.k.", "restore britain",
      "working class", "working-class",
      "englishness", "national identity",
      "left wing", "leftist", "left-wing",
      "right wing", "right-wing", "right-winger",
      "woke", "virtue signal",
      "mainstream media", "msm", "fake news",
      "censorship", "banned", "silenced", "suppressed",
      "corruption", "corrupt",
      "debate", "split", "divide", "battle lines",
      "cooked", "exposed", "truth", "proof",
      "desperate", "afraid", "terrif",
      "demonise", "demonize",
      "they don't want", "they don't want you",
      "they buried", "they don't",
      "taking it back", "take it back",
      "wake up", "wake the",
      "makes sense",
      "unite", "united",
      "warning",
    ],
  },

  // ── NEWS ─────────────────────────────────────────────────────────────────────
  // Catch-all — everything not matched above
  {
    id: "news",
    keywords: [],
  },
];

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Detect the best-fitting topic for a piece of content.
 * Pass both title and description for maximum accuracy.
 */
export function detectTopic(title: string, description?: string): Exclude<TopicId, "all"> {
  // Combine title + description into one searchable string
  const haystack = `${title} ${description ?? ""}`.toLowerCase();

  for (const rule of TOPIC_RULES) {
    if (rule.id === "news") return "news"; // fallback
    if (rule.keywords.some(kw => haystack.includes(kw))) return rule.id;
  }
  return "news";
}

export function topicMeta(id: TopicId) {
  return TOPICS.find(t => t.id === id) ?? { id: "news" as const, label: "News", color: "#eab308" };
}
