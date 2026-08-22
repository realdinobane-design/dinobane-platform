import { Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useAuth } from "@/App";
import { logout } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Youtube, Users, Crown, Rss, User, Vault, ShieldAlert, Mail, Trash2, MessageSquare, BookMarked, Network, Search, FileText, Archive, Trophy, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DmChat } from "@/components/dm-chat";

import { cn } from "@/lib/utils";

const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);

type NavLink = { href: string; label: string; icon: any; memberOnly?: boolean; external?: boolean; more?: boolean };

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home", icon: null },
  { href: "/articles", label: "Videos", icon: Youtube },
  { href: "/news", label: "Intel", icon: Rss },
  { href: "/rings-of-power/index.html", label: "UK Power Map", icon: Network, external: true },
  { href: "/timelines", label: "Timelines", icon: BookMarked },
  { href: "/community", label: "Community", icon: Users, memberOnly: true },
  { href: "/media-vault", label: "Vault", icon: Vault, memberOnly: true },
  // Secondary destinations — grouped under the "More" menu on desktop to keep the bar clean
  { href: "/rings-of-power/league.html", label: "Power League", icon: Trophy, external: true, more: true },
  { href: "/search", label: "Search", icon: Search, more: true },
  { href: "/documents", label: "Documents", icon: FileText, memberOnly: true, more: true },
  { href: "/ask", label: "Ask the Archive", icon: Archive, memberOnly: true, more: true },
  { href: "/contact", label: "Contact", icon: Mail, more: true },
];

const PRIMARY_LINKS = NAV_LINKS.filter(l => !l.more);
const MORE_LINKS = NAV_LINKS.filter(l => l.more);

export function AppNav() {
  const { user, refetch } = useAuth();

  // DM unread count badge
  const { data: dmUnread } = useQuery<{ count: number }>({
    queryKey: ["/api/dm/unread/count"],
    queryFn: () => apiRequest("GET", "/api/dm/unread/count").then(r => r.json()),
    refetchInterval: 15000,
    enabled: !!user?.isMember,
  });

  // Global DM inbox state
  const [dmInboxOpen, setDmInboxOpen] = useState(false);
  const [dmPartner, setDmPartner] = useState<any>(null);
  const { data: dmConversations = [] } = useQuery<any[]>({
    queryKey: ["/api/dm/conversations"],
    queryFn: () => apiRequest("GET", "/api/dm/conversations").then(r => r.json()),
    refetchInterval: 15000,
    enabled: !!user?.isMember && dmInboxOpen,
  });

  const [location] = useHashLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    queryClient.setQueryData(["/api/auth/me"], null);
    refetch();
  };

  const isActive = (href: string) => {
    const path = location.replace(/^#/, "") || "/";
    if (href === "/") return path === "/";
    return path.startsWith(href);
  };

  return (
    <>
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          {/* Red X SVG logo inline */}
          <img src="/brand/logo-x.jpg" alt="DinoBane" width="36" height="36" className="rounded" />
          <span
            className="hidden sm:block font-extrabold text-base text-white"
            style={{
              fontFamily:
                "'Satoshi', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
              letterSpacing: "-0.025em",
            }}
          >
            DINOBANE
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {PRIMARY_LINKS.map(link => link.external ? (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
              data-testid={`link-nav-${link.label.toLowerCase()}`}
            >
              {link.icon && <link.icon size={14} />}
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-red-900/30 text-red-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
              data-testid={`link-nav-${link.label.toLowerCase()}`}
            >
              {link.icon && <link.icon size={14} />}
              {link.label}
              {link.memberOnly && (
                <Crown size={10} className="text-yellow-500" />
              )}
            </Link>
          ))}

          {/* More menu — secondary destinations */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  MORE_LINKS.some(l => !l.external && isActive(l.href))
                    ? "bg-red-900/30 text-red-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                data-testid="button-nav-more"
              >
                More <ChevronDown size={12} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {MORE_LINKS.map(link => (
                <DropdownMenuItem key={link.href} asChild>
                  {link.external ? (
                    <a href={link.href} data-testid={`link-nav-${link.label.toLowerCase()}`}>
                      {link.icon && <link.icon size={14} className="mr-2 text-muted-foreground" />}
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} data-testid={`link-nav-${link.label.toLowerCase()}`}>
                      {link.icon && <link.icon size={14} className="mr-2 text-muted-foreground" />}
                      {link.label}
                      {link.memberOnly && <Crown size={10} className="ml-auto text-yellow-500" />}
                    </Link>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {!user.isMember && (
                <Link href="/membership">
                  <Button
                    size="sm"
                    className="hidden sm:flex gap-1.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 hover:from-yellow-300 hover:via-amber-200 hover:to-yellow-400 text-black font-extrabold text-xs shadow-[0_8px_24px_-8px_rgba(245,200,66,0.6)]"
                    data-testid="button-subscribe-member"
                  >
                    <Crown size={12} />
                    Subscribe — £4.99/mo
                  </Button>
                </Link>
              )}
              {user.isMember && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-yellow-400 font-bold">
                  <Crown size={12} /> Subscribed
                </span>
              )}
              {/* DM inbox button with unread badge — opens inbox panel */}
              {user.isMember && (
                <button
                  onClick={() => setDmInboxOpen(o => !o)}
                  className="relative flex items-center justify-center w-8 h-8 rounded-md hover:bg-secondary transition-colors"
                  title="Private messages"
                >
                  <MessageSquare size={16} className={dmInboxOpen ? "text-[#f0c800]" : "text-muted-foreground"} />
                  {(dmUnread?.count ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#cc2a2a] text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                      {dmUnread!.count > 9 ? "9+" : dmUnread!.count}
                    </span>
                  )}
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary transition-colors" data-testid="button-user-menu">
                    <Avatar className="h-7 w-7 ring-2 ring-transparent hover:ring-primary/50 transition-all">
                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} className="object-cover" />}
                      <AvatarFallback
                        className="text-xs font-bold text-white"
                        style={{ background: user.avatarColor }}
                      >
                        {user.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm text-muted-foreground max-w-[100px] truncate">
                      {user.displayName}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {/* Profile header */}
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" data-testid="link-profile">
                      <User size={14} className="mr-2 text-muted-foreground" /> My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/membership" data-testid="link-membership">
                      <Crown size={14} className="mr-2 text-yellow-500" /> Subscription
                    </Link>
                  </DropdownMenuItem>
                  {ADMIN_EMAILS.has(user.email) && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/members" data-testid="link-admin-members">
                          <Crown size={14} className="mr-2 text-yellow-500" /> Members
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users" data-testid="link-admin-users">
                          <ShieldAlert size={14} className="mr-2 text-red-500" /> User Management
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/emails" data-testid="link-admin-emails">
                          <Mail size={14} className="mr-2 text-blue-400" /> Email Control Centre
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/content" data-testid="link-admin-content">
                          <Trash2 size={14} className="mr-2 text-orange-400" /> Content Moderation
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/intel" data-testid="link-admin-intel">
                          <Archive size={14} className="mr-2 text-yellow-400" /> Intel Desk
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="button-logout" className="text-red-400">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm" data-testid="link-login">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 hover:from-yellow-300 hover:via-amber-200 hover:to-yellow-400 text-black font-extrabold text-sm shadow-[0_8px_24px_-8px_rgba(245,200,66,0.6)]"
                  data-testid="link-register"
                >
                  Subscribe
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
          {PRIMARY_LINKS.map(link => link.external ? (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              {link.icon && <link.icon size={15} />}
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-red-900/30 text-red-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {link.icon && <link.icon size={15} />}
              {link.label}
              {link.memberOnly && <Crown size={11} className="text-yellow-500" />}
            </Link>
          ))}

          {/* Secondary destinations */}
          <div className="mt-2 pt-2 border-t border-border">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">More</p>
            {MORE_LINKS.map(link => link.external ? (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                {link.icon && <link.icon size={15} />}
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-red-900/30 text-red-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {link.icon && <link.icon size={15} />}
                {link.label}
                {link.memberOnly && <Crown size={10} className="ml-auto text-yellow-500" />}
              </Link>
            ))}
          </div>

          {!user && (
            <Link
              href="/membership"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-bold text-yellow-400 mt-1"
            >
              <Crown size={15} /> Subscribe — £4.99/month
            </Link>
          )}
        </div>
      )}
    </header>

    {/* ─── GLOBAL DM INBOX PANEL ─── */}
    {user?.isMember && dmInboxOpen && !dmPartner && (
      <div className="fixed inset-0 z-50" onClick={() => setDmInboxOpen(false)}>
        <div className="absolute inset-0 bg-black/60" />
        <div
          className="absolute right-4 top-14 w-[320px] max-h-[480px] bg-[#0f0f0f] border border-[#2a2a2a] rounded-sm shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-[#f0c800]" />
              <span className="text-white font-bold text-sm">Messages</span>
              {(dmUnread?.count ?? 0) > 0 && (
                <span className="bg-[#cc2a2a] text-white text-xs px-2 py-0.5 rounded-full font-bold">{dmUnread!.count} unread</span>
              )}
            </div>
            <button onClick={() => setDmInboxOpen(false)} className="text-[#555] hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            {dmConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <MessageSquare size={24} className="text-[#333] mb-2" />
                <p className="text-[#444] text-sm">No messages yet.</p>
                <p className="text-[#333] text-xs mt-1">Go to Community to start a chat.</p>
              </div>
            )}
            {dmConversations.map((c: any) => (
              <button
                key={c.partnerId}
                onClick={() => { setDmPartner(c.partner); setDmInboxOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] last:border-0 hover:bg-[#111] transition-colors text-left"
              >
                <div
                  className="h-9 w-9 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/10"
                  style={{ background: c.partner?.avatarColor || "#cc2a2a" }}
                >
                  {c.partner?.avatarUrl
                    ? <img src={c.partner.avatarUrl} alt={c.partner.displayName} className="w-full h-full object-cover" />
                    : c.partner?.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold truncate ${c.unread > 0 ? "text-white" : "text-[#aaa]"}`}>
                      {c.partner?.displayName}
                    </p>
                    {c.unread > 0 && (
                      <span className="bg-[#cc2a2a] text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 shrink-0">{c.unread}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#555] truncate mt-0.5">{c.lastMessage?.content?.slice(0, 45)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Floating DM chat — available on every page */}
    {user?.isMember && dmPartner && (
      <DmChat
        currentUser={user}
        partner={dmPartner}
        onClose={() => setDmPartner(null)}
      />
    )}
    </>
  );
}
