import { apiRequest } from "./queryClient";

export type PageStatus = "live" | "standby";

/**
 * Registry of admin-toggleable pages.
 * When you want a new page to be toggleable:
 *   1. Wrap its component in <PageStatusGate slug="..." name="..." />
 *   2. Add an entry here keyed by its hash-route path.
 * The floating admin toggle reads from this registry so it only appears
 * on pages that opted in.
 */
export const PAGE_REGISTRY: Record<string, { slug: string; name: string }> = {
  "/long-march": { slug: "long-march", name: "The Long March" },
};

/** Resolve which registered page the current route represents, if any. */
export function resolvePageForPath(path: string): { slug: string; name: string } | null {
  const clean = (path || "/").replace(/^#/, "");
  // Exact match first, then longest-prefix match so deep sub-routes inherit.
  if (PAGE_REGISTRY[clean]) return PAGE_REGISTRY[clean];
  const keys = Object.keys(PAGE_REGISTRY).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (clean === k || clean.startsWith(k + "/")) return PAGE_REGISTRY[k];
  }
  return null;
}

/** Public: fetch the current status of a page. Defaults to "live" if unknown. */
export async function getPageStatus(slug: string): Promise<PageStatus> {
  try {
    const r = await fetch(`/api/page-status/${encodeURIComponent(slug)}`, { credentials: "include" });
    if (!r.ok) return "live";
    const j = await r.json();
    return (j.status === "standby" ? "standby" : "live");
  } catch {
    return "live";
  }
}

/** Admin only: set the status of a page. */
export async function setPageStatus(slug: string, status: PageStatus): Promise<void> {
  await apiRequest("PUT", `/api/admin/page-status/${encodeURIComponent(slug)}`, { status });
}

/** Public: fetch admin-edited JSON content for a page. Returns null if none saved. */
export async function getPageContent<T = unknown>(slug: string): Promise<T | null> {
  try {
    const r = await fetch(`/api/page-content/${encodeURIComponent(slug)}`, { credentials: "include" });
    if (!r.ok) return null;
    const j = await r.json();
    return (j.content ?? null) as T | null;
  } catch {
    return null;
  }
}

/** Admin only: replace the JSON content for a page. */
export async function setPageContent<T = unknown>(slug: string, content: T): Promise<void> {
  await apiRequest("PUT", `/api/admin/page-content/${encodeURIComponent(slug)}`, { content });
}
