import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { queryClient as qc } from "@/lib/queryClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Crown, LogOut, User, AtSign, MessageSquare, Calendar,
  Pencil, Check, X, ExternalLink, Hash, ShieldAlert, Loader2,
  Palette, ChevronRight,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { formatDistanceToNow, format } from "date-fns";

// ─── AVATAR COLOUR PRESETS ────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#cc2a2a", "#b91c1c", "#dc2626",   // Reds
  "#1d4ed8", "#2563eb", "#3b82f6",   // Blues
  "#16a34a", "#15803d", "#22c55e",   // Greens
  "#7c3aed", "#6d28d9", "#8b5cf6",   // Purples
  "#d97706", "#b45309", "#f59e0b",   // Ambers
  "#0f766e", "#0d9488", "#14b8a6",   // Teals
  "#be185d", "#db2777", "#ec4899",   // Pinks
  "#374151", "#4b5563", "#6b7280",   // Greys
];

interface MessageWithUser {
  id: number;
  userId: number;
  channel: string;
  content: string;
  createdAt: string;
  user: {
    id: number;
    displayName: string;
    avatarInitials: string;
    avatarColor: string;
    username: string;
  };
}

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

function renderContent(content: string) {
  return content
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">$1</a>')
    .replace(/@([a-zA-Z0-9_]+)/g, '<span class="text-red-400 font-semibold">@$1</span>');
}

// ─── SECTION WRAPPER ─────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-sm">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        <Icon size={14} className="text-muted-foreground" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── MESSAGE ITEM ─────────────────────────────────────────────────────────────
function MessageItem({ msg, highlight }: { msg: MessageWithUser; highlight?: boolean }) {
  return (
    <div className={`rounded-sm px-4 py-3 text-sm border ${highlight ? "border-red-800/40 bg-red-950/10" : "border-border bg-background/50"}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Hash size={11} className="text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground font-medium">{msg.channel}</span>
        {msg.user && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <Avatar className="h-4 w-4 shrink-0">
              <AvatarFallback className="text-[8px] font-bold text-white" style={{ background: msg.user.avatarColor }}>
                {msg.user.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{msg.user.displayName}</span>
          </>
        )}
        <span className="text-muted-foreground/40 ml-auto text-xs">{timeAgo(msg.createdAt)}</span>
      </div>
      <p
        className="text-foreground/80 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
      />
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, setUser, refetch } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingInitials, setEditingInitials] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftInitials, setDraftInitials] = useState("");

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: mentions = [], isLoading: loadingMentions } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/profile/mentions"],
    queryFn: async () => {
      const res = await fetch("/api/profile/mentions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: myMessages = [], isLoading: loadingMessages } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/profile/messages"],
    queryFn: async () => {
      const res = await fetch("/api/profile/messages", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (data: { displayName?: string; avatarInitials?: string; avatarColor?: string }) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Update failed"); }
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/me"], updatedUser);
      setUser(updatedUser);
      toast({ title: "Profile updated" });
      setEditingName(false);
      setEditingInitials(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/portal");
      if (!res.ok) throw new Error("Could not open billing portal");
      return res.json();
    },
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleLogout = async () => {
    await logout();
    queryClient.setQueryData(["/api/auth/me"], null);
    refetch();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <User size={40} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">You need to be signed in to view your profile.</p>
        <Link href="/login"><Button>Sign in</Button></Link>
      </div>
    );
  }

  const memberSinceDate = user.memberSince ? format(new Date(user.memberSince), "d MMM yyyy") : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Profile Header ── */}
      <div className="bg-card border border-border rounded-sm p-6">
        <div className="flex items-start gap-5">

          {/* Avatar with colour picker overlay */}
          <div className="relative group shrink-0">
            <Avatar className="h-16 w-16">
              <AvatarFallback
                className="text-xl font-black text-white"
                style={{ background: user.avatarColor }}
              >
                {user.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => setEditingInitials(true)}
              title="Edit avatar"
            >
              <Palette size={16} className="text-white" />
            </div>
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            {/* Display name */}
            {editingName ? (
              <div className="flex items-center gap-2 mb-1">
                <Input
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  className="h-8 text-base font-bold w-48"
                  maxLength={30}
                  autoFocus
                  data-testid="input-display-name"
                />
                <button onClick={() => updateMutation.mutate({ displayName: draftName })} className="text-green-400 hover:text-green-300" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-black text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  {user.displayName}
                </h1>
                <button
                  onClick={() => { setDraftName(user.displayName); setEditingName(true); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit display name"
                  data-testid="button-edit-name"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}

            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {user.isMember ? (
                <span className="flex items-center gap-1.5 text-xs text-yellow-500 font-semibold bg-yellow-950/30 border border-yellow-800/40 px-2.5 py-1 rounded-sm">
                  <Crown size={11} /> Member{memberSinceDate ? ` since ${memberSinceDate}` : ""}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1 rounded-sm">
                  Free account
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                Joined {format(new Date(user.createdAt), "d MMM yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Avatar Customisation ── */}
      <Section title="Avatar" icon={Palette}>
        <div className="space-y-4">
          {/* Initials */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Initials (1–3 characters)</Label>
            {editingInitials ? (
              <div className="flex items-center gap-2">
                <Input
                  value={draftInitials}
                  onChange={e => setDraftInitials(e.target.value.toUpperCase().slice(0, 3))}
                  className="h-8 w-24 text-center font-bold uppercase"
                  maxLength={3}
                  autoFocus
                  data-testid="input-initials"
                />
                <button onClick={() => updateMutation.mutate({ avatarInitials: draftInitials })} className="text-green-400 hover:text-green-300" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button onClick={() => setEditingInitials(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
              </div>
            ) : (
              <button
                onClick={() => { setDraftInitials(user.avatarInitials); setEditingInitials(true); }}
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                data-testid="button-edit-initials"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-bold text-white" style={{ background: user.avatarColor }}>
                    {user.avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="font-mono font-bold">{user.avatarInitials}</span>
                <Pencil size={12} className="text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Colour swatches */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Colour</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => updateMutation.mutate({ avatarColor: color })}
                  className="h-7 w-7 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    background: color,
                    borderColor: user.avatarColor === color ? "white" : "transparent",
                  }}
                  title={color}
                  data-testid={`color-swatch-${color.replace("#", "")}`}
                  disabled={updateMutation.isPending}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Preview:</span>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm font-black text-white" style={{ background: user.avatarColor }}>
                {user.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold text-foreground">{user.displayName}</span>
          </div>
        </div>
      </Section>

      {/* ── Stats ── */}
      <Section title="Activity" icon={MessageSquare}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-black text-white">{myMessages.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Messages sent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{mentions.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Times @mentioned</p>
          </div>
          <div className="text-center col-span-2 sm:col-span-1">
            <p className="text-2xl font-black text-white">
              {user.isMember ? (
                memberSinceDate
                  ? Math.floor((Date.now() - new Date(user.memberSince!).getTime()) / (1000 * 60 * 60 * 24))
                  : "—"
              ) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Days as member</p>
          </div>
        </div>
      </Section>

      {/* ── @Mention History ── */}
      <Section title="@Mention History" icon={AtSign}>
        {loadingMentions ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : mentions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one has @mentioned you yet. Get active in the community!</p>
        ) : (
          <div className="space-y-2">
            {mentions.map(msg => (
              <MessageItem key={`mention-${msg.id}`} msg={msg} highlight />
            ))}
          </div>
        )}
      </Section>

      {/* ── My Recent Messages ── */}
      <Section title="My Messages" icon={MessageSquare}>
        {loadingMessages ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : myMessages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven't posted anything yet.{" "}
            <Link href="/community" className="text-primary hover:underline">Head to the community</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {myMessages.slice(0, 10).map(msg => (
              <MessageItem key={`msg-${msg.id}`} msg={msg} />
            ))}
            {myMessages.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                Showing 10 of {myMessages.length} messages
              </p>
            )}
          </div>
        )}
      </Section>

      {/* ── Membership ── */}
      <Section title="Membership" icon={Crown}>
        {user.isMember ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">DinoBane Members Community</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  £5 / month · Active{memberSinceDate ? ` since ${memberSinceDate}` : ""}
                </p>
              </div>
              <span className="text-xs bg-green-950/40 text-green-400 border border-green-800/40 px-2 py-0.5 rounded-sm font-semibold shrink-0">
                Active
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                data-testid="button-manage-billing"
              >
                {portalMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
                Manage billing
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs text-red-400 border-red-800/40 hover:bg-red-950/20 hover:text-red-300"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                data-testid="button-cancel-membership"
              >
                <ShieldAlert size={13} />
                Cancel membership
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cancelling will keep your access until the end of the current billing period.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">You're on a free account.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Join for £5/month to access the community.</p>
            </div>
            <Link href="/membership">
              <Button size="sm" className="bg-red-700 hover:bg-red-600 text-white gap-1.5 shrink-0" data-testid="button-join-from-profile">
                <Crown size={13} /> Join
              </Button>
            </Link>
          </div>
        )}
      </Section>

      {/* ── Account ── */}
      <Section title="Account" icon={User}>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-sm text-foreground">Username</p>
              <p className="text-xs text-muted-foreground mt-0.5">@{user.username} · cannot be changed</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-sm text-foreground">Email address</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-400 border-red-800/40 hover:bg-red-950/20 hover:text-red-300"
              onClick={handleLogout}
              data-testid="button-profile-logout"
            >
              <LogOut size={14} />
              Sign out
            </Button>
          </div>
        </div>
      </Section>

    </div>
  );
}
