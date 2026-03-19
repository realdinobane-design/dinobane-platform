import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Crown, LogOut, User, AtSign, MessageSquare,
  Pencil, Check, X, ExternalLink, Hash, ShieldAlert, Loader2,
  Palette, Upload, Trash2, ImageIcon, KeyRound, Eye, EyeOff,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { formatDistanceToNow, format } from "date-fns";

// ─── AVATAR COLOUR PRESETS ────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#cc2a2a", "#b91c1c", "#dc2626",
  "#1d4ed8", "#2563eb", "#3b82f6",
  "#16a34a", "#15803d", "#22c55e",
  "#7c3aed", "#6d28d9", "#8b5cf6",
  "#d97706", "#b45309", "#f59e0b",
  "#0f766e", "#0d9488", "#14b8a6",
  "#be185d", "#db2777", "#ec4899",
  "#374151", "#4b5563", "#6b7280",
];

// ─── CLIENT-SIDE IMAGE RESIZE ────────────────────────────────────────────────
// Compresses to max 256×256 JPEG before sending to server — keeps payload tiny
function resizeImageToDataUrl(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; } }
      else        { if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; } }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

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
    avatarUrl?: string | null;
    username: string;
  };
}

function timeAgo(dateStr: string) {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
  catch { return ""; }
}

function renderContent(content: string) {
  return content
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">$1</a>')
    .replace(/@([a-zA-Z0-9_]+)/g, '<span class="text-red-400 font-semibold">@$1</span>');
}

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
              {msg.user.avatarUrl && <AvatarImage src={msg.user.avatarUrl} alt={msg.user.displayName} className="object-cover" />}
              <AvatarFallback className="text-[8px] font-bold text-white" style={{ background: msg.user.avatarColor }}>
                {msg.user.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{msg.user.displayName}</span>
          </>
        )}
        <span className="text-muted-foreground/40 ml-auto text-xs">{timeAgo(msg.createdAt)}</span>
      </div>
      <p className="text-foreground/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
    </div>
  );
}

// ─── AVATAR UPLOAD COMPONENT ──────────────────────────────────────────────────
function AvatarUploadSection({ user, onUpdate }: { user: any; onUpdate: (u: any) => void }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingInitials, setEditingInitials] = useState(false);
  const [draftInitials, setDraftInitials] = useState("");
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: { avatarInitials?: string; avatarColor?: string }) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Update failed"); }
      return res.json();
    },
    onSuccess: (u) => { queryClient.setQueryData(["/api/auth/me"], u); onUpdate(u); setEditingInitials(false); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile/avatar", { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to remove avatar");
      return res.json();
    },
    onSuccess: (u) => { queryClient.setQueryData(["/api/auth/me"], u); onUpdate(u); setPreview(null); toast({ title: "Avatar removed" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 256);
      setPreview(dataUrl);
      const res = await apiRequest("POST", "/api/profile/avatar", { avatarUrl: dataUrl });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Upload failed"); }
      const updated = await res.json();
      queryClient.setQueryData(["/api/auth/me"], updated);
      onUpdate(updated);
      toast({ title: "Avatar updated" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const currentAvatar = preview || user.avatarUrl;

  return (
    <div className="space-y-5">
      {/* Upload area */}
      <div>
        <Label className="text-xs text-muted-foreground mb-3 block">Profile photo</Label>
        <div className="flex items-center gap-4">
          {/* Large avatar preview */}
          <div className="relative group shrink-0">
            <Avatar className="h-20 w-20">
              {currentAvatar && <AvatarImage src={currentAvatar} alt={user.displayName} className="object-cover" />}
              <AvatarFallback className="text-2xl font-black text-white" style={{ background: user.avatarColor }}>
                {user.avatarInitials}
              </AvatarFallback>
            </Avatar>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {/* Upload button */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-testid="button-upload-avatar"
            >
              <Upload size={13} />
              {currentAvatar ? "Change photo" : "Upload photo"}
            </Button>

            {/* Remove button — only when has custom image */}
            {(user.avatarUrl || preview) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs text-red-400 border-red-800/40 hover:bg-red-950/20 hover:text-red-300"
                onClick={() => removeMutation.mutate()}
                disabled={removeMutation.isPending || uploading}
                data-testid="button-remove-avatar"
              >
                {removeMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Remove photo
              </Button>
            )}

            <p className="text-xs text-muted-foreground">JPG, PNG or WebP · auto-resized to 256px</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
          data-testid="input-avatar-file"
        />
      </div>

      <div className="border-t border-border pt-4 space-y-4">
        {/* Initials fallback */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Initials (shown when no photo is set)</Label>
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
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs font-bold text-white" style={{ background: user.avatarColor }}>
                  {user.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <span className="font-mono font-bold text-sm">{user.avatarInitials}</span>
              <Pencil size={12} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Colour swatches */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Fallback colour</Label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map(color => (
              <button
                key={color}
                onClick={() => updateMutation.mutate({ avatarColor: color })}
                className="h-6 w-6 rounded-full border-2 transition-all hover:scale-110 focus:outline-none"
                style={{ background: color, borderColor: user.avatarColor === color ? "white" : "transparent" }}
                title={color}
                disabled={updateMutation.isPending}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, setUser, refetch } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");

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

  const updateMutation = useMutation({
    mutationFn: async (data: { displayName?: string }) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Update failed"); }
      return res.json();
    },
    onSuccess: (u) => {
      queryClient.setQueryData(["/api/auth/me"], u);
      setUser(u);
      toast({ title: "Profile updated" });
      setEditingName(false);
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/account", {});
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      setUser(null);
      toast({ title: "Account deleted", description: "Your account has been permanently removed.", variant: "destructive" });
      navigate("/");
    },
    onError: () => {
      toast({ title: "Error", description: "Could not delete account. Please try again.", variant: "destructive" });
    },
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Password change state ──
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 6) throw new Error("New password must be at least 6 characters");
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
      const res = await apiRequest("POST", "/api/auth/change-password", { currentPassword, newPassword });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Password change failed");
      return json;
    },
    onSuccess: () => {
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setShowPasswordSection(false);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
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
  const daysMember = user.memberSince
    ? Math.floor((Date.now() - new Date(user.memberSince).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Profile Header ── */}
      <div className="bg-card border border-border rounded-sm p-6">
        <div className="flex items-start gap-5">
          <Avatar className="h-16 w-16 shrink-0">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} className="object-cover" />}
            <AvatarFallback className="text-xl font-black text-white" style={{ background: user.avatarColor }}>
              {user.avatarInitials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
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
              <span className="text-xs text-muted-foreground">Joined {format(new Date(user.createdAt), "d MMM yyyy")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Avatar / Photo ── */}
      <Section title="Profile Photo" icon={ImageIcon}>
        <AvatarUploadSection user={user} onUpdate={(u) => setUser(u)} />
      </Section>

      {/* ── Activity Stats ── */}
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
            <p className="text-2xl font-black text-white">{user.isMember && daysMember !== null ? daysMember : "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Days as member</p>
          </div>
        </div>
      </Section>

      {/* ── @Mention History ── */}
      <Section title="@Mention History" icon={AtSign}>
        {loadingMentions ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 size={14} className="animate-spin" /> Loading…</div>
        ) : mentions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one has @mentioned you yet. Get active in the community!</p>
        ) : (
          <div className="max-h-80 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
            {mentions.map(msg => <MessageItem key={`mention-${msg.id}`} msg={msg} highlight />)}
          </div>
        )}
      </Section>

      {/* ── My Messages ── */}
      <Section title="My Messages" icon={MessageSquare}>
        {loadingMessages ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 size={14} className="animate-spin" /> Loading…</div>
        ) : myMessages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven't posted anything yet.{" "}
            <Link href="/community" className="text-primary hover:underline">Head to the community</Link>
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
            {myMessages.map(msg => <MessageItem key={`msg-${msg.id}`} msg={msg} />)}
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
                <p className="text-xs text-muted-foreground mt-0.5">£5 / month · Active{memberSinceDate ? ` since ${memberSinceDate}` : ""}</p>
              </div>
              <span className="text-xs bg-green-950/40 text-green-400 border border-green-800/40 px-2 py-0.5 rounded-sm font-semibold shrink-0">Active</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-border">
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending} data-testid="button-manage-billing">
                {portalMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
                Manage billing
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-xs text-red-400 border-red-800/40 hover:bg-red-950/20 hover:text-red-300" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending} data-testid="button-cancel-membership">
                <ShieldAlert size={13} /> Cancel membership
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Cancelling keeps your access until the end of the current billing period.</p>
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

          {/* ── Password row ── */}
          <div className="py-2 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Password</p>
                <p className="text-xs text-muted-foreground mt-0.5">Change your account password</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  setShowPasswordSection(v => !v);
                  setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
                }}
                data-testid="button-change-password-toggle"
              >
                <KeyRound size={13} />
                {showPasswordSection ? "Cancel" : "Change password"}
              </Button>
            </div>

            {showPasswordSection && (
              <div className="mt-4 space-y-3 bg-background/50 border border-border rounded-sm p-4">
                {/* Current password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current password</label>
                  <div className="relative">
                    <Input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Your current password"
                      className="pr-10 bg-background border-border focus:border-primary text-sm"
                      data-testid="input-current-password"
                    />
                    <button type="button" onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New password</label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="pr-10 bg-background border-border focus:border-primary text-sm"
                      data-testid="input-new-password"
                    />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm new password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm new password</label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="pr-10 bg-background border-border focus:border-primary text-sm"
                      data-testid="input-confirm-password"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest gap-1.5 text-xs"
                    onClick={() => changePasswordMutation.mutate()}
                    disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                    data-testid="button-save-password"
                  >
                    {changePasswordMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Update password
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Forgot your password?{" "}
                    <a href="/#/forgot-password" className="text-primary hover:underline">Reset via email</a>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-red-400 border-red-800/40 hover:bg-red-950/20 hover:text-red-300 w-fit" onClick={handleLogout} data-testid="button-profile-logout">
              <LogOut size={14} /> Sign out
            </Button>
            <div className="border-t border-border pt-3 mt-1">
              <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider text-red-500/70">Danger Zone</p>
              {!showDeleteConfirm ? (
                <Button variant="outline" size="sm" className="gap-2 text-red-500 border-red-800/40 hover:bg-red-950/30 hover:text-red-400" onClick={() => setShowDeleteConfirm(true)} data-testid="button-delete-account">
                  <Trash2 size={14} /> Delete account
                </Button>
              ) : (
                <div className="bg-red-950/20 border border-red-800/40 rounded-sm p-3 space-y-2">
                  <p className="text-xs text-red-300 font-semibold">This will permanently delete your account and cancel any active subscription. This cannot be undone.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs border-border text-muted-foreground" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                    <Button size="sm" className="text-xs bg-red-700 hover:bg-red-600 text-white gap-1.5" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                      {deleteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Yes, delete my account
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

    </div>
  );
}
