import { Lock } from "lucide-react";

/**
 * Thin red ribbon shown at the top of members-only pages (Timelines, Community,
 * Media Vault). Always describes the page's audience scope — not the viewer's
 * role. The global Admin Mode bar in App.tsx already tells admins they are
 * browsing as admin, so this banner intentionally stays focused on "who is
 * this page for" rather than re-asserting admin status on every page.
 *
 * The `variant` prop is kept for backwards compatibility but is now a no-op.
 */
export function MembersOnlyBanner({
  variant: _variant = "member",
}: {
  variant?: "member" | "auto";
} = {}) {
  return (
    <div
      className="w-full text-center py-2 text-[11px] tracking-[0.35em] uppercase bg-[#140808] border-b border-[#cc2a2a]/55 text-[#ff9c9c]"
      data-testid="members-only-banner"
    >
      <Lock size={11} className="inline-block mr-2 -mt-0.5" />
      Members Only · Restricted Access
    </div>
  );
}
