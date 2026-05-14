import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageStatusGate } from "@/components/page-status-gate";
import { TimelineRendererNoir } from "@/components/timeline-renderer-noir";
import { LONG_MARCH_DATA } from "@/pages/long-march";
import type { TimelineData } from "@/components/timeline-renderer";
import { getPageContent } from "@/lib/page-status";
import { MembersOnlyBanner } from "@/components/members-only-banner";
import { TimelineReactions } from "@/components/timeline-reactions";

/* =========================================================
   LONG MARCH — NOIR PREVIEW
   ---------------------------------------------------------
   This page renders the SAME data as /long-march, just through
   the noir renderer. It's a design preview only — gated to
   members (same as the main page) and uses the same DB row
   for any image overrides.

   If this theme survives review, it will be promoted to a
   site-wide toggle. The original dossier theme is preserved
   intact at /long-march and tagged as
     backup/long-march-v2-dossier
   ========================================================= */

// Lightweight merge: we don't need the full per-field defaulting
// logic from long-march.tsx — admin image overrides are the only
// thing worth carrying over for a design preview.
function mergeNoirData(override: Partial<TimelineData> | null | undefined): TimelineData {
  if (!override?.timeline?.length) return LONG_MARCH_DATA;
  const overrideByKey = new Map<string, Partial<TimelineData["timeline"][number]>>();
  override.timeline.forEach((e) => {
    if (e?.year && e?.title) overrideByKey.set(`${e.year}|${e.title}`, e);
  });
  return {
    ...LONG_MARCH_DATA,
    meta: { ...LONG_MARCH_DATA.meta, ...(override.meta || {}) },
    timeline: LONG_MARCH_DATA.timeline.map((e) => {
      const o = overrideByKey.get(`${e.year}|${e.title}`);
      if (!o) return e;
      return { ...e, imageUrl: o.imageUrl || e.imageUrl };
    }),
  };
}

export default function LongMarchNoirPage() {
  const { data: saved } = useQuery({
    queryKey: ["/api/page-content/long-march"],
    queryFn: () => getPageContent<Partial<TimelineData>>("long-march"),
    staleTime: 30_000,
    retry: 1,
  });

  const useDefaults =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("defaults") === "1";

  const D = useDefaults ? LONG_MARCH_DATA : mergeNoirData(saved);

  // While the noir page is mounted, paint the page chrome white so the
  // 920px white column doesn't sit on top of the site's dark background.
  useEffect(() => {
    document.body.classList.add("lmn-page-active");
    return () => {
      document.body.classList.remove("lmn-page-active");
    };
  }, []);

  return (
    <>
      <MembersOnlyBanner variant="auto" />
      <PageStatusGate slug="long-march" name="The Long March">
        <TimelineRendererNoir data={D} />
        <TimelineReactions slug="long-march" />
      </PageStatusGate>
    </>
  );
}
