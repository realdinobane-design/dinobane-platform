import { Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/App";

const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);

/**
 * Thin red ribbon shown at the top of members-only pages (Timelines, Community,
 * Media Vault). For admin staff the copy flips to "Admin Only" so it's obvious
 * which audience the page is currently restricted to.
 */
export function MembersOnlyBanner({
  variant = "member",
}: {
  variant?: "member" | "auto";
}) {
  const { user } = useAuth();
  const isAdmin = !!user && ADMIN_EMAILS.has(user.email);
  const label = variant === "auto" && isAdmin ? "Admin Only · Restricted Access" : "Members Only · Restricted Access";
  const Icon = variant === "auto" && isAdmin ? ShieldAlert : Lock;
  return (
    <div
      className="w-full text-center py-2 text-[11px] tracking-[0.35em] uppercase bg-[#140808] border-b border-[#cc2a2a]/55 text-[#ff9c9c]"
      data-testid="members-only-banner"
    >
      <Icon size={11} className="inline-block mr-2 -mt-0.5" />
      {label}
    </div>
  );
}
