import { Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useAuth } from "@/App";
import { logout } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Youtube, Newspaper, Users, Crown, BookOpen, Rss, User, Vault, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: null },
  { href: "/videos", label: "Videos", icon: Youtube },
  { href: "/articles", label: "Articles", icon: BookOpen },
  { href: "/news", label: "Intel", icon: Rss },
  { href: "/community", label: "Community", icon: Users, memberOnly: true },
  { href: "/media-vault", label: "Vault", icon: Vault, memberOnly: true },
];

export function AppNav() {
  const { user, refetch } = useAuth();
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
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          {/* Red X SVG logo inline */}
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none" aria-label="DinoBane logo">
            <rect width="100" height="100" rx="8" fill="#0a0a0a"/>
            <polygon points="15,10 50,45 85,10 95,20 60,55 95,90 85,100 50,65 15,100 5,90 40,55 5,20" fill="#cc2a2a"/>
            <rect x="18" y="42" width="64" height="16" fill="#0a0a0a"/>
            <text x="50" y="57" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="15" fontWeight="900" fill="white" letterSpacing="1">DINOBANE</text>
          </svg>
          <span className="hidden sm:block font-bold text-base tracking-wide text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            DINOBANE
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(link => (
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
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {!user.isMember && (
                <Link href="/membership">
                  <Button size="sm" className="hidden sm:flex gap-1.5 bg-red-700 hover:bg-red-600 text-white text-xs" data-testid="button-join-member">
                    <Crown size={12} />
                    Join £5/mo
                  </Button>
                </Link>
              )}
              {user.isMember && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-yellow-500 font-semibold">
                  <Crown size={12} /> Member
                </span>
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
                      <Crown size={14} className="mr-2 text-yellow-500" /> Membership
                    </Link>
                  </DropdownMenuItem>
                  {user.email === "realdinobane@gmail.com" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users" data-testid="link-admin-users">
                        <ShieldAlert size={14} className="mr-2 text-red-500" /> User Management
                      </Link>
                    </DropdownMenuItem>
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
                <Button size="sm" className="bg-red-700 hover:bg-red-600 text-white text-sm" data-testid="link-register">Join</Button>
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
          {NAV_LINKS.map(link => (
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
          {!user && (
            <Link href="/membership" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold text-red-400 mt-1">
              <Crown size={15} /> Join — £5/month
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
