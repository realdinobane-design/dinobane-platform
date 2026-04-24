import { useAuth } from "@/App";
import { ShieldAlert } from "lucide-react";

const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);

/**
 * Slim global banner pinned to the top of every page for admin staff.
 * Lets admins immediately recognise they're browsing as admin — a safeguard
 * against accidentally posting/editing content as a normal member.
 */
export function AdminBanner() {
  const { user } = useAuth();
  const isAdmin = !!user && ADMIN_EMAILS.has(user.email);
  if (!isAdmin) return null;
  return (
    <div
      className="w-full text-center py-1.5 text-[10px] tracking-[0.35em] uppercase bg-[#1a1306] border-b border-[#d4a24a]/55 text-[#f0c57a]"
      data-testid="global-admin-banner"
    >
      <ShieldAlert size={11} className="inline-block mr-2 -mt-0.5" />
      Admin Mode · Signed in as {user.email}
    </div>
  );
}
