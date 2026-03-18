import { useState, useRef } from "react";
import { useAuth } from "@/App";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Crown, Upload, Image, Film, Trash2, Copy, Check,
  Loader2, Lock, Vault, CloudUpload, PlayCircle
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MediaItem {
  id: number;
  name: string;
  type: "image" | "video";
  dataUrl: string;
  size: number;
  uploadedAt: string;
}

const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 50;
const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/* ─── Lock screens ─────────────────────────────────────────── */
function SignInLock() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      {/* Brand stripe */}
      <div className="w-1 h-16 bg-[#cc2a2a] rounded-full mb-8" />

      {/* Logo mark */}
      <svg width="52" height="52" viewBox="0 0 100 100" fill="none" aria-hidden="true" className="mb-6">
        <rect width="100" height="100" rx="8" fill="#111" />
        <polygon
          points="15,10 50,45 85,10 95,20 60,55 95,90 85,100 50,65 15,100 5,90 40,55 5,20"
          fill="#cc2a2a"
        />
        <rect x="18" y="42" width="64" height="16" fill="#111" />
        <text x="50" y="57" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="15" fontWeight="900" fill="white" letterSpacing="1">DINOBANE</text>
      </svg>

      <Lock size={28} className="text-[#cc2a2a] mb-4" />
      <h2
        className="text-2xl font-black text-white uppercase tracking-widest mb-2"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        Sign In Required
      </h2>
      <p className="text-sm text-zinc-500 max-w-xs mb-8">
        You need to be signed in to access the Media Vault.
      </p>
      <Link href="/login">
        <Button
          className="bg-[#cc2a2a] hover:bg-[#b02222] text-white font-bold uppercase tracking-wider px-8 py-2.5 text-sm"
          data-testid="button-signin-vault"
        >
          Sign In
        </Button>
      </Link>
    </div>
  );
}

function MembersOnlyLock() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      {/* Brand stripe */}
      <div className="w-1 h-16 bg-[#cc2a2a] rounded-full mb-8" />

      {/* Logo mark */}
      <svg width="52" height="52" viewBox="0 0 100 100" fill="none" aria-hidden="true" className="mb-6">
        <rect width="100" height="100" rx="8" fill="#111" />
        <polygon
          points="15,10 50,45 85,10 95,20 60,55 95,90 85,100 50,65 15,100 5,90 40,55 5,20"
          fill="#cc2a2a"
        />
        <rect x="18" y="42" width="64" height="16" fill="#111" />
        <text x="50" y="57" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="15" fontWeight="900" fill="white" letterSpacing="1">DINOBANE</text>
      </svg>

      <Crown size={28} className="text-yellow-400 mb-4" />
      <h2
        className="text-2xl font-black text-white uppercase tracking-widest mb-2"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        Members Only
      </h2>
      <p className="text-sm text-zinc-500 max-w-xs mb-2">
        The Media Vault is an exclusive space for DinoBane paid members.
      </p>
      <p className="text-xs text-zinc-600 mb-8">
        Upload images, store video clips, and share media with the community.
      </p>
      <Link href="/membership">
        <Button
          className="bg-[#cc2a2a] hover:bg-[#b02222] text-white font-bold uppercase tracking-wider px-8 py-2.5 text-sm gap-2"
          data-testid="button-join-vault"
        >
          <Crown size={14} /> Join for £5/month
        </Button>
      </Link>
    </div>
  );
}

/* ─── Drag-and-drop upload zone ──────────────────────────────── */
function UploadZone({
  onFile,
  accept,
  maxMB,
  label,
  icon: Icon,
  uploading,
}: {
  onFile: (f: File) => void;
  accept: string;
  maxMB: number;
  label: string;
  icon: React.ElementType;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-3 p-8 rounded-sm cursor-pointer
        border-2 border-dashed transition-all select-none
        ${dragging
          ? "border-[#cc2a2a] bg-[#cc2a2a]/5"
          : "border-zinc-800 bg-[#111] hover:border-zinc-600 hover:bg-zinc-900/60"
        }
      `}
      data-testid={`dropzone-${label.toLowerCase().replace(" ", "-")}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {uploading ? (
        <Loader2 size={28} className="text-[#cc2a2a] animate-spin" />
      ) : (
        <Icon size={28} className={dragging ? "text-[#cc2a2a]" : "text-zinc-500"} />
      )}
      <div className="text-center">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Drag & drop or click · max {maxMB}MB
        </p>
      </div>
      {dragging && (
        <div className="absolute inset-0 rounded-sm bg-[#cc2a2a]/10 pointer-events-none border-2 border-[#cc2a2a]" />
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function MediaVaultPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images");

  if (!user) return <SignInLock />;
  if (!user.isMember) return <MembersOnlyLock />;

  const { data: media = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ["/api/media"],
    queryFn: async () => {
      const res = await fetch("/api/media", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/media/${id}`, {});
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Deleted" });
    },
  });

  const handleFileUpload = async (file: File, type: "image" | "video") => {
    const maxMB = type === "image" ? MAX_IMAGE_MB : MAX_VIDEO_MB;
    if (file.size > maxMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Max size is ${maxMB}MB for ${type}s.`,
        variant: "destructive",
      });
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
      const res = await apiRequest("POST", "/api/media", {
        name: file.name,
        type,
        dataUrl,
        size: file.size,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      await qc.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Uploaded", description: file.name });
      setActiveTab(type === "image" ? "images" : "videos");
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = (id: number, dataUrl: string) => {
    navigator.clipboard.writeText(dataUrl);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const isAdmin = ADMIN_EMAILS.has(user.email);
  const images = media.filter(m => m.type === "image");
  const videos = media.filter(m => m.type === "video");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Page header ── */}
      <div className="mb-8">
        {/* Red accent bar */}
        <div className="w-10 h-1 bg-[#cc2a2a] rounded-full mb-4" />
        <div className="flex items-center gap-3 mb-1">
          <Vault size={22} className="text-[#cc2a2a]" />
          <h1
            className="text-2xl font-black text-white uppercase tracking-widest"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            Media Vault
          </h1>
        </div>
        <p className="text-sm text-zinc-500 ml-9">
          Private media library — images &amp; videos for community use.
        </p>
      </div>

      {/* ── Upload zones (admin only) ── */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <UploadZone
            onFile={f => handleFileUpload(f, "image")}
            accept="image/*"
            maxMB={MAX_IMAGE_MB}
            label="Upload Image"
            icon={CloudUpload}
            uploading={uploading}
          />
          <UploadZone
            onFile={f => handleFileUpload(f, "video")}
            accept="video/*"
            maxMB={MAX_VIDEO_MB}
            label="Upload Video"
            icon={Film}
            uploading={uploading}
          />
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center gap-2.5 text-zinc-500 py-8">
          <Loader2 size={16} className="animate-spin text-[#cc2a2a]" />
          <span className="text-sm">Loading vault...</span>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && media.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-sm text-center">
          <Upload size={32} className="text-zinc-700 mb-4" />
          <p className="text-sm font-semibold text-zinc-400">No media yet</p>
          <p className="text-xs text-zinc-600 mt-1">
            {isAdmin ? "Use the upload zones above to add images or videos." : "No media has been uploaded yet."}
          </p>
        </div>
      )}

      {/* ── Tabs ── */}
      {!isLoading && media.length > 0 && (
        <>
          <div className="flex items-center gap-1 mb-6 border-b border-zinc-800">
            <button
              onClick={() => setActiveTab("images")}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px
                ${activeTab === "images"
                  ? "border-[#cc2a2a] text-[#cc2a2a]"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
                }
              `}
              data-testid="tab-images"
            >
              <Image size={13} />
              Images
              <span className="text-xs font-normal text-zinc-600 ml-0.5">({images.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px
                ${activeTab === "videos"
                  ? "border-[#cc2a2a] text-[#cc2a2a]"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
                }
              `}
              data-testid="tab-videos"
            >
              <Film size={13} />
              Videos
              <span className="text-xs font-normal text-zinc-600 ml-0.5">({videos.length})</span>
            </button>
          </div>

          {/* ── Image grid ── */}
          {activeTab === "images" && (
            <section>
              {images.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-zinc-800 rounded-sm">
                  <Image size={28} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No images uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {images.map(item => (
                    <div
                      key={item.id}
                      className="bg-[#111] border border-zinc-800 rounded-sm overflow-hidden group relative"
                      data-testid={`card-image-${item.id}`}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square overflow-hidden bg-zinc-900">
                        <img
                          src={item.dataUrl}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>

                      {/* Info strip */}
                      <div className="px-2.5 py-2">
                        <p className="text-xs font-medium text-zinc-300 truncate leading-tight">{item.name}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{formatBytes(item.size)}</p>
                      </div>

                      {/* Hover overlay actions */}
                      <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyUrl(item.id, item.dataUrl)}
                          className="bg-[#111] text-white p-2 rounded-sm hover:bg-zinc-800 transition-colors"
                          title="Copy data URL"
                          data-testid={`button-copy-${item.id}`}
                        >
                          {copied === item.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => deleteMutation.mutate(item.id)}
                            className="bg-[#cc2a2a]/20 text-red-400 p-2 rounded-sm hover:bg-[#cc2a2a]/40 transition-colors"
                            title="Delete"
                            data-testid={`button-delete-${item.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Video list ── */}
          {activeTab === "videos" && (
            <section>
              {videos.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-zinc-800 rounded-sm">
                  <Film size={28} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No videos uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map(item => (
                    <div
                      key={item.id}
                      className="bg-[#111] border border-zinc-800 rounded-sm overflow-hidden"
                      data-testid={`card-video-${item.id}`}
                    >
                      {/* Video player */}
                      <div className="relative bg-black">
                        <video
                          src={item.dataUrl}
                          controls
                          controlsList="nodownload"
                          className="w-full max-h-80"
                          preload="metadata"
                        />
                      </div>

                      {/* Footer row */}
                      <div className="px-4 py-3 flex items-center gap-3 border-t border-zinc-800/60">
                        {/* Left — red accent + file name */}
                        <div className="w-0.5 h-8 bg-[#cc2a2a] rounded-full shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-200 truncate leading-tight">{item.name}</p>
                          <p className="text-xs text-zinc-600 mt-0.5">{formatBytes(item.size)}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => copyUrl(item.id, item.dataUrl)}
                            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-sm transition-colors"
                            data-testid={`button-copy-video-${item.id}`}
                          >
                            {copied === item.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                            {copied === item.id ? "Copied" : "Copy URL"}
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => deleteMutation.mutate(item.id)}
                              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 border border-red-900/40 hover:border-red-700/60 px-3 py-1.5 rounded-sm transition-colors"
                              data-testid={`button-delete-video-${item.id}`}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
