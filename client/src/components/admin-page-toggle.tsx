import { useState } from "react";
import { useHashLocation } from "wouter/use-hash-location";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import {
  getPageStatus,
  setPageStatus,
  resolvePageForPath,
  type PageStatus,
} from "@/lib/page-status";
import { Radio, CircleDot, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);

/**
 * Floating admin-only control rendered globally (once per app).
 * Shows ONLY when:
 *   - the signed-in user is an admin, AND
 *   - the current route is a page registered in PAGE_REGISTRY.
 * Lets admin flip the current page between Live and Standby with one click.
 */
export function AdminPageToggle() {
  const { user } = useAuth();
  const [location] = useHashLocation();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(true);

  const isAdmin = !!user && ADMIN_EMAILS.has(user.email);
  const registered = resolvePageForPath(location);

  const { data: status = "live" } = useQuery({
    queryKey: [`/api/page-status/${registered?.slug}`],
    queryFn: () => getPageStatus(registered!.slug),
    enabled: !!registered && isAdmin,
    staleTime: 15_000,
  });

  if (!isAdmin || !registered) return null;

  const isLive = status === "live";
  const next: PageStatus = isLive ? "standby" : "live";

  async function toggle() {
    if (!registered) return;
    setBusy(true);
    try {
      await setPageStatus(registered.slug, next);
      // Invalidate both the admin toggle's copy and any gate's copy.
      qc.invalidateQueries({ queryKey: [`/api/page-status/${registered.slug}`] });
    } catch (e) {
      console.error("[admin-page-toggle] failed:", e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed z-50 bottom-4 right-4 select-none"
      data-testid="admin-page-toggle"
    >
      <div
        className={`flex flex-col rounded-sm border shadow-2xl backdrop-blur-md ${
          isLive
            ? "border-[#cc2a2a]/50 bg-[#140808]/85"
            : "border-[#d4a24a]/55 bg-[#1a1306]/85"
        }`}
      >
        {/* Header / collapser */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center justify-between gap-2 px-3 py-2 text-[10px] tracking-[0.32em] uppercase text-zinc-300 hover:text-white transition-colors"
          title="Admin page control"
        >
          <span className="flex items-center gap-2">
            {isLive ? (
              <Radio size={11} className="text-[#cc2a2a]" />
            ) : (
              <CircleDot size={11} className="text-[#d4a24a]" />
            )}
            Admin · Page
          </span>
          {open ? (
            <ChevronDown size={12} className="opacity-60" />
          ) : (
            <ChevronUp size={12} className="opacity-60" />
          )}
        </button>

        {open && (
          <div className="px-3 pb-3 pt-1 min-w-[240px]">
            <div className="text-[13px] font-semibold text-white truncate mb-0.5">
              {registered.name}
            </div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-3">
              Status ·{" "}
              <span className={isLive ? "text-[#ff6b6b]" : "text-[#f0c57a]"}>
                {isLive ? "LIVE" : "STANDBY"}
              </span>
            </div>

            <button
              onClick={toggle}
              disabled={busy}
              className={`w-full flex items-center justify-center gap-2 text-[11px] tracking-[0.28em] uppercase font-semibold px-3 py-2 border transition-colors ${
                isLive
                  ? "border-[#d4a24a]/60 text-[#f0c57a] hover:bg-[#d4a24a]/10"
                  : "border-[#cc2a2a]/70 text-[#ff8080] hover:bg-[#cc2a2a]/15"
              } disabled:opacity-50 disabled:cursor-wait`}
              data-testid="button-toggle-page-status"
            >
              {busy ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Working…
                </>
              ) : isLive ? (
                <>Take to Standby</>
              ) : (
                <>Take Live</>
              )}
            </button>

            <p className="text-[10px] leading-relaxed text-zinc-500 mt-2">
              {isLive
                ? "Public can see this page right now."
                : "Only admins can see this page. Visitors get a polite placeholder."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
