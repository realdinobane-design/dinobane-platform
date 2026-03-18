// ─── TOPIC DETECTION ─────────────────────────────────────────────────────────
// Determines which topic pill a video/article title belongs to.
// Order matters — first match wins.

export const TOPICS = [
  { id: "interviews",      label: "Interviews",      color: "#3b82f6" }, // blue
  { id: "reactions",       label: "Reactions",       color: "#f97316" }, // orange
  { id: "reviews",         label: "Reviews",         color: "#a855f7" }, // purple
  { id: "recommendations", label: "Recommendations", color: "#22c55e" }, // green
  { id: "uk-politics",     label: "UK Politics",     color: "#cc2a2a" }, // red
  { id: "news",            label: "News",            color: "#eab308" }, // yellow
] as const;

export type TopicId = typeof TOPICS[number]["id"] | "all";

const TOPIC_RULES: { id: TopicId; keywords: string[] }[] = [
  {
    id: "interviews",
    keywords: [
      "unfiltered", "interview", "sits down", "joins me", "joins us",
      "speaks to", "speaks with", "chat with", "in conversation",
      "exclusive", "guest", "we spoke", "i spoke",
    ],
  },
  {
    id: "reactions",
    keywords: [
      "react", "reaction", "reacting", "responds", "response",
      "replies", "watching", "i watched", "we watched", "watching this",
      "clipped", "clip of", "footage",
    ],
  },
  {
    id: "reviews",
    keywords: [
      "review", "reviewing", "honest take", "i tried", "we tried",
      "rating", "rated", "verdict", "breakdown of",
    ],
  },
  {
    id: "recommendations",
    keywords: [
      "recommend", "you need to", "you should watch", "check out",
      "follow this", "subscribe to", "channel you", "must watch",
      "must follow", "go watch",
    ],
  },
  {
    id: "uk-politics",
    keywords: [
      "starmer", "labour", "tory", "tories", "conservative", "parliament",
      "westminster", "mp ", "mps ", "keir", "farage", "reform",
      "rupert lowe", "sunak", "reeves", "hancock", "government",
      "election", "vote", "voted", "voting", "budget", "policy",
      "prime minister", "minister", "whitehall", "ofcom", "bbc",
      "britain", "british", "england", "english", "uk ", "u.k.",
      "grooming gang", "immigration", "border", "migrant", "asylum",
      "deporta", "channel crossing", "small boat",
    ],
  },
  {
    id: "news",
    keywords: [
      // catch-all — everything not matched above gets "news"
      // We don't list keywords here; it's the default fallback
    ],
  },
];

export function detectTopic(title: string): TopicId {
  const lower = title.toLowerCase();
  for (const rule of TOPIC_RULES) {
    if (rule.id === "news") return "news"; // fallback
    if (rule.keywords.some(kw => lower.includes(kw))) return rule.id;
  }
  return "news";
}

export function topicMeta(id: TopicId) {
  return TOPICS.find(t => t.id === id) ?? { id: "news", label: "News", color: "#eab308" };
}
