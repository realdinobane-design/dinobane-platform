import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/App";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Crown, Upload, Image, Film, Trash2,
  Loader2, Lock, Vault, CloudUpload,
  Heart, MessageCircle, X, Send, ChevronLeft, ChevronRight
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MediaItem {
  id: number;
  name: string;
  type: "image" | "video";
  dataUrl: string;
  size: number;
  uploadedAt: string;
}

interface MediaComment {
  id: number;
  mediaId: number;
  userId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    displayName: string;
    username: string;
    avatarInitials: string;
    avatarColor: string;
    avatarUrl?: string;
    email: string;
  };
}

// Bulk stats map: mediaId → { likeCount, commentCount, liked }
type StatsMap = Record<number, { likeCount: number; commentCount: number; liked: boolean }>;

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 50;
const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Lock screens ─────────────────────────────────────────────────────────────
const BrandLogo = () => (
  <svg width="52" height="52" viewBox="0 0 100 100" fill="none" aria-hidden="true" className="mb-6">
    <rect width="100" height="100" rx="8" fill="#111" />
    <polygon points="15,10 50,45 85,10 95,20 60,55 95,90 85,100 50,65 15,100 5,90 40,55 5,20" fill="#cc2a2a" />
    <rect x="18" y="42" width="64" height="16" fill="#111" />
    <text x="50" y="57" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="15" fontWeight="900" fill="white" letterSpacing="1">DINOBANE</text>
  </svg>
);

function SignInLock() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-1 h-16 bg-[#cc2a2a] rounded-full mb-8" />
      <BrandLogo />
      <Lock size={28} className="text-[#cc2a2a] mb-4" />
      <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
        Sign In Required
      </h2>
      <p className="text-sm text-zinc-500 max-w-xs mb-8">You need to be signed in to access the Media Vault.</p>
      <Link href="/login">
        <Button className="bg-[#cc2a2a] hover:bg-[#b02222] text-white font-bold uppercase tracking-wider px-8 py-2.5 text-sm" data-testid="button-signin-vault">
          Sign In
        </Button>
      </Link>
    </div>
  );
}

function MembersOnlyLock() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-1 h-16 bg-[#cc2a2a] rounded-full mb-8" />
      <BrandLogo />
      <Crown size={28} className="text-yellow-400 mb-4" />
      <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
        Members Only
      </h2>
      <p className="text-sm text-zinc-500 max-w-xs mb-2">The Media Vault is an exclusive space for DinoBane paid members.</p>
      <p className="text-xs text-zinc-600 mb-8">Upload images, store video clips, and share media with the community.</p>
      <Link href="/membership">
        <Button className="bg-[#cc2a2a] hover:bg-[#b02222] text-white font-bold uppercase tracking-wider px-8 py-2.5 text-sm gap-2" data-testid="button-join-vault">
          <Crown size={14} /> Join for £5/month
        </Button>
      </Link>
    </div>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────
function UploadZone({ onFile, accept, maxMB, label, icon: Icon, uploading }: {
  onFile: (f: File) => void; accept: string; maxMB: number;
  label: string; icon: React.ElementType; uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-sm cursor-pointer border-2 border-dashed transition-all select-none
        ${dragging ? "border-[#cc2a2a] bg-[#cc2a2a]/5" : "border-zinc-800 bg-[#111] hover:border-zinc-600 hover:bg-zinc-900/60"}`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
      {uploading ? <Loader2 size={28} className="text-[#cc2a2a] animate-spin" /> : <Icon size={28} className={dragging ? "text-[#cc2a2a]" : "text-zinc-500"} />}
      <div className="text-center">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">Drag & drop or click · max {maxMB}MB</p>
      </div>
      {dragging && <div className="absolute inset-0 rounded-sm bg-[#cc2a2a]/10 pointer-events-none border-2 border-[#cc2a2a]" />}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 28 }: { user: MediaComment["user"] | any; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
      style={{ width: size, height: size, background: user.avatarColor, fontSize: size * 0.35 }}
    >
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
        : user.avatarInitials}
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function MediaLightbox({ item, items, onClose, onNavigate, currentUser, isAdmin, stats, onStatsUpdate }: {
  item: MediaItem;
  items: MediaItem[];
  onClose: () => void;
  onNavigate: (item: MediaItem) => void;
  currentUser: any;
  isAdmin: boolean;
  stats: StatsMap;
  onStatsUpdate: (mediaId: number, patch: Partial<{ likeCount: number; commentCount: number; liked: boolean }>) => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const currentIndex = items.findIndex(i => i.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const itemStats = stats[item.id] ?? { likeCount: 0, commentCount: 0, liked: false };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(items[currentIndex - 1]);
      if (e.key === "ArrowRight" && hasNext) onNavigate(items[currentIndex + 1]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, hasPrev, hasNext]);

  // Like toggle — updates bulk stats map directly, no extra fetch
  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/media/${item.id}/likes`, {});
      return res.json() as Promise<{ liked: boolean; count: number }>;
    },
    onSuccess: (data) => {
      onStatsUpdate(item.id, { liked: data.liked, likeCount: data.count });
    },
  });

  // Comments — only fetched when lightbox is open for this specific item
  const { data: comments = [], isLoading: commentsLoading } = useQuery<MediaComment[]>({
    queryKey: ["/api/media", item.id, "comments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/media/${item.id}/comments`);
      return res.json();
    },
    staleTime: 30000,
  });

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/media/${item.id}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/media", item.id, "comments"] });
      onStatsUpdate(item.id, { commentCount: (itemStats.commentCount ?? 0) + 1 });
      setCommentText("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/media/comments/${commentId}`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/media", item.id, "comments"] });
      onStatsUpdate(item.id, { commentCount: Math.max(0, (itemStats.commentCount ?? 1) - 1) });
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/media/${item.id}`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Deleted" });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex flex-col md:flex-row w-full max-w-5xl mx-4 max-h-[92vh] bg-[#0d0d0d] border border-zinc-800 rounded-sm overflow-hidden shadow-2xl">

        {/* ── Media side ── */}
        <div className="relative flex items-center justify-center bg-black md:w-[60%] min-h-[240px] md:min-h-0">
          {item.type === "image"
            ? <img src={item.dataUrl} alt={item.name} className="w-full h-full object-contain max-h-[55vh] md:max-h-[92vh]" />
            : <video src={item.dataUrl} controls controlsList="nodownload" className="w-full max-h-[55vh] md:max-h-[92vh]" autoPlay />
          }
          {hasPrev && (
            <button onClick={() => onNavigate(items[currentIndex - 1])}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-sm transition-colors">
              <ChevronLeft size={20} />
            </button>
          )}
          {hasNext && (
            <button onClick={() => onNavigate(items[currentIndex + 1])}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-sm transition-colors">
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* ── Info + comments side ── */}
        <div className="flex flex-col md:w-[40%] min-h-0 border-t md:border-t-0 md:border-l border-zinc-800">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200 truncate">{item.name}</p>
              <p className="text-xs text-zinc-600">{formatBytes(item.size)}</p>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              {isAdmin && (
                <button onClick={() => deleteMediaMutation.mutate()} disabled={deleteMediaMutation.isPending}
                  className="text-red-500 hover:text-red-400 p-1.5 rounded-sm hover:bg-red-950/30 transition-colors" title="Delete media">
                  {deleteMediaMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              )}
              <button onClick={onClose} className="text-zinc-400 hover:text-white p-1.5 rounded-sm hover:bg-zinc-800 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Like bar */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800 shrink-0">
            <button onClick={() => likeMutation.mutate()} disabled={likeMutation.isPending}
              className="flex items-center gap-1.5 transition-colors group">
              <Heart size={18} className={`transition-colors ${itemStats.liked ? "fill-[#cc2a2a] text-[#cc2a2a]" : "text-zinc-500 group-hover:text-[#cc2a2a]"}`} />
              <span className={`text-sm font-semibold ${itemStats.liked ? "text-[#cc2a2a]" : "text-zinc-400"}`}>{itemStats.likeCount}</span>
            </button>
            <div className="flex items-center gap-1.5 text-zinc-500">
              <MessageCircle size={16} />
              <span className="text-sm">{comments.length}</span>
            </div>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
            {commentsLoading && (
              <div className="flex items-center gap-2 text-zinc-600">
                <Loader2 size={14} className="animate-spin" /><span className="text-xs">Loading...</span>
              </div>
            )}
            {!commentsLoading && comments.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-4">No comments yet. Be the first!</p>
            )}
            {comments.map(c => (
              <div key={c.id} className="flex gap-2.5 group/comment">
                <UserAvatar user={c.user} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-zinc-300">{c.user.displayName}</span>
                    <span className="text-xs text-zinc-600">{timeAgo(c.createdAt)}</span>
                    {(isAdmin || c.userId === currentUser.id) && (
                      <button onClick={() => deleteCommentMutation.mutate(c.id)}
                        className="ml-auto opacity-0 group-hover/comment:opacity-100 text-zinc-600 hover:text-red-400 transition-all">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 leading-snug break-words">{c.content}</p>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment input */}
          <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
            <div className="flex items-center gap-2">
              <UserAvatar user={currentUser} size={26} />
              <input
                type="text" value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (commentText.trim()) commentMutation.mutate(commentText.trim()); } }}
                placeholder="Add a comment…" maxLength={500}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-sm px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <button onClick={() => { if (commentText.trim()) commentMutation.mutate(commentText.trim()); }}
                disabled={commentMutation.isPending || !commentText.trim()}
                className="text-[#cc2a2a] hover:text-[#ff3333] disabled:text-zinc-700 transition-colors p-1">
                {commentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MediaVaultPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"images" | "videos">("videos");
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);

  const openLightbox = (item: MediaItem) => setLightboxItem(item);

  // Local stats override — lets like/comment mutations update the grid instantly
  // without refetching the whole bulk stats endpoint
  const [statsOverrides, setStatsOverrides] = useState<StatsMap>({});

  if (!user) return <SignInLock />;
  if (!user.isMember) return <MembersOnlyLock />;

  // ── Single bulk fetch: all media ──
  const { data: media = [], isLoading: mediaLoading } = useQuery<MediaItem[]>({
    queryKey: ["/api/media"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/media");
      return res.json();
    },
    staleTime: 60000,
  });

  // ── Single bulk fetch: all stats (3 DB queries total, not N×2) ──
  const { data: bulkStats = {} } = useQuery<StatsMap>({
    queryKey: ["/api/media/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/media/stats");
      return res.json();
    },
    staleTime: 60000,
    enabled: media.length > 0,
  });

  // Merge server stats with any local overrides from like/comment mutations
  const stats: StatsMap = { ...bulkStats, ...statsOverrides };

  const handleStatsUpdate = (mediaId: number, patch: Partial<{ likeCount: number; commentCount: number; liked: boolean }>) => {
    setStatsOverrides(prev => ({
      ...prev,
      [mediaId]: { ...(stats[mediaId] ?? { likeCount: 0, commentCount: 0, liked: false }), ...patch },
    }));
  };

  const handleFileUpload = async (file: File, type: "image" | "video") => {
    const maxMB = type === "image" ? MAX_IMAGE_MB : MAX_VIDEO_MB;
    if (file.size > maxMB * 1024 * 1024) {
      toast({ title: "File too large", description: `Max ${maxMB}MB for ${type}s.`, variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await apiRequest("POST", "/api/media", { name: file.name, type, dataUrl, size: file.size });
      const uploaded = await res.json();
      if (!uploaded) throw new Error("Upload failed");
      await qc.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Uploaded", description: file.name });
      setActiveTab(type === "image" ? "images" : "videos");
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const isAdmin = ADMIN_EMAILS.has(user.email);
  const images = media.filter(m => m.type === "image");
  const videos = media.filter(m => m.type === "video");
  const tabItems = activeTab === "images" ? images : videos;

  return (
    <>
      {lightboxItem && (
        <MediaLightbox
          item={lightboxItem}
          items={tabItems}
          onClose={() => setLightboxItem(null)}
          onNavigate={openLightbox}
          currentUser={user}
          isAdmin={isAdmin}
          stats={stats}
          onStatsUpdate={handleStatsUpdate}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="w-10 h-1 bg-[#cc2a2a] rounded-full mb-4" />
          <div className="flex items-center gap-3 mb-1">
            <Vault size={22} className="text-[#cc2a2a]" />
            <h1 className="text-2xl font-black text-white uppercase tracking-widest" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Media Vault
            </h1>
          </div>
          <p className="text-sm text-zinc-500 ml-9">Private media library — images &amp; videos for community use.</p>
        </div>

        {/* Upload zones (admin only) */}
        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <UploadZone onFile={f => handleFileUpload(f, "image")} accept="image/*" maxMB={MAX_IMAGE_MB} label="Upload Image" icon={CloudUpload} uploading={uploading} />
            <UploadZone onFile={f => handleFileUpload(f, "video")} accept="video/*" maxMB={MAX_VIDEO_MB} label="Upload Video" icon={Film} uploading={uploading} />
          </div>
        )}

        {/* Loading */}
        {mediaLoading && (
          <div className="flex items-center gap-2.5 text-zinc-500 py-8">
            <Loader2 size={16} className="animate-spin text-[#cc2a2a]" />
            <span className="text-sm">Loading vault...</span>
          </div>
        )}

        {/* Empty */}
        {!mediaLoading && media.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-sm text-center">
            <Upload size={32} className="text-zinc-700 mb-4" />
            <p className="text-sm font-semibold text-zinc-400">No media yet</p>
            <p className="text-xs text-zinc-600 mt-1">
              {isAdmin ? "Use the upload zones above to add images or videos." : "No media has been uploaded yet."}
            </p>
          </div>
        )}

        {/* Tabs */}
        {!mediaLoading && media.length > 0 && (
          <>
            <div className="flex items-center gap-1 mb-6 border-b border-zinc-800">
              {(["videos", "images"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px
                    ${activeTab === tab ? "border-[#cc2a2a] text-[#cc2a2a]" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
                >
                  {tab === "images" ? <Image size={13} /> : <Film size={13} />}
                  {tab}
                  <span className="text-xs font-normal text-zinc-600 ml-0.5">({tab === "images" ? images.length : videos.length})</span>
                </button>
              ))}
            </div>

            {/* Image grid */}
            {activeTab === "images" && (
              <section>
                {images.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-zinc-800 rounded-sm">
                    <Image size={28} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">No images uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {images.map(item => {
                      const s = stats[item.id] ?? { likeCount: 0, commentCount: 0, liked: false };
                      return (
                        <div key={item.id} onClick={() => openLightbox(item)}
                          className="bg-[#111] border border-zinc-800 rounded-sm overflow-hidden group cursor-pointer"
                          data-testid={`card-image-${item.id}`}
                        >
                          <div className="aspect-square overflow-hidden bg-zinc-900 relative">
                            <img src={item.dataUrl} alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="px-2.5 pt-2 pb-1">
                            <p className="text-xs font-medium text-zinc-300 truncate leading-tight">{item.name}</p>
                          </div>
                          {/* Stats bar — data already available, no extra fetch */}
                          <div className="flex items-center gap-3 px-2.5 py-1.5 border-t border-zinc-800/60">
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                              <Heart size={11} className={s.liked ? "fill-[#cc2a2a] text-[#cc2a2a]" : ""} />{s.likeCount}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                              <MessageCircle size={11} />{s.commentCount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Video grid — thumbnails, click to open lightbox */}
            {activeTab === "videos" && (
              <section>
                {videos.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-zinc-800 rounded-sm">
                    <Film size={28} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">No videos uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {videos.map(item => {
                      const s = stats[item.id] ?? { likeCount: 0, commentCount: 0, liked: false };
                      return (
                        <div key={item.id} onClick={() => openLightbox(item)}
                          className="bg-[#111] border border-zinc-800 rounded-sm overflow-hidden group cursor-pointer"
                          data-testid={`card-video-${item.id}`}
                        >
                          {/* Video thumbnail — preload metadata only so browser shows first frame */}
                          <div className="aspect-square overflow-hidden bg-zinc-900 relative">
                            <video
                              src={item.dataUrl}
                              preload="metadata"
                              muted
                              playsInline
                              className="w-full h-full object-cover pointer-events-none"
                            />
                            {/* Play button overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-[#cc2a2a]/90 flex items-center justify-center shadow-lg">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                                  <polygon points="5,3 19,12 5,21" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="px-2.5 pt-2 pb-1">
                            <p className="text-xs font-medium text-zinc-300 truncate leading-tight">{item.name}</p>
                          </div>
                          <div className="flex items-center gap-3 px-2.5 py-1.5 border-t border-zinc-800/60">
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                              <Heart size={11} className={s.liked ? "fill-[#cc2a2a] text-[#cc2a2a]" : ""} />{s.likeCount}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                              <MessageCircle size={11} />{s.commentCount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
