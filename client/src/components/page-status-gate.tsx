import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/App";
import { getPageStatus } from "@/lib/page-status";
import { ShieldAlert, Lock } from "lucide-react";

const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);

/**
 * Wrap any page component that should be admin-toggleable between
 * "live" (public) and "standby" (admin-only preview).
 *
 * Behaviour:
 *   - status "live"    → page renders normally for everyone.
 *   - status "standby" → admins still see the page with a STANDBY ribbon;
 *                        everyone else sees a polite placeholder.
 */
export function PageStatusGate({
  slug,
  name,
  children,
}: {
  slug: string;
  name: string;
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = !!user && ADMIN_EMAILS.has(user.email);

  const { data: status, isLoading, isError } = useQuery({
    queryKey: [`/api/page-status/${slug}`],
    queryFn: () => getPageStatus(slug),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    // Hard cap — never keep retrying; if it fails, fall through to "live" below.
    retry: 1,
  });

  // If the status check errored, fail OPEN — show the page content rather
  // than hang on a spinner. Admins can still change status from the editor.
  if (isError) {
    return <>{children}</>;
  }

  // Show a visible loading state (not a blank div) so the page never
  // looks "stuck" to the user while we're still checking.
  if (isLoading || authLoading || status === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-24 bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-[#cc2a2a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-zinc-500">
            Loading {name}…
          </p>
        </div>
      </div>
    );
  }

  const onStandby = status === "standby";

  if (onStandby && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-24 bg-[#0a0a0a]">
        <div className="max-w-md w-full border border-zinc-800 bg-zinc-950/60 p-10 text-center">
          <Lock size={28} className="mx-auto text-[#cc2a2a] mb-4" />
          <h1 className="font-serif italic text-3xl text-zinc-100 mb-3">
            This page is on standby
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            “{name}” has been pulled offline by the admin and isn't currently
            available to visitors. Please check back soon.
          </p>
          <Link
            href="/"
            className="inline-block text-[11px] tracking-[0.25em] uppercase text-zinc-300 border border-zinc-700 px-4 py-2 hover:border-[#cc2a2a] hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {onStandby && isAdmin && (
        <div
          className="w-full text-center py-2 text-[11px] tracking-[0.35em] uppercase bg-[#2a1f0a] border-b border-[#d4a24a]/40 text-[#d4a24a]"
          data-testid="page-standby-ribbon"
        >
          <ShieldAlert size={12} className="inline-block mr-2 -mt-0.5" />
          Standby mode · only admins can see this page
        </div>
      )}
      {children}
    </>
  );
}
