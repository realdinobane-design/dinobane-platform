import { useState, useRef } from "react";
import { useAuth } from "@/App";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, Upload, Image, Film, Trash2, Copy, Check, Loader2, Lock } from "lucide-react";
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function MediaVaultPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  // Guard — paid members only
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lock size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wider">Sign in required</h2>
        <Link href="/login"><Button className="mt-4">Sign in</Button></Link>
      </div>
    );
  }
  if (!user.isMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Crown size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">Members Only</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">The Media Vault is available to paid members.</p>
        <Link href="/membership">
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold gap-2">
            <Crown size={16} /> Join for £5/month
          </Button>
        </Link>
      </div>
    );
  }

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
      toast({ title: "File too large", description: `Max size is ${maxMB}MB for ${type}s.`, variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Read as base64 data URL
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

  const images = media.filter(m => m.type === "image");
  const videos = media.filter(m => m.type === "video");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight" style={{ fontFamily: "'Clash Display', sans-serif" }}>
          Media Vault
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Upload images and videos for use across the site. Members only.</p>
      </div>

      {/* Upload buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "image")}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "video")}
        />
        <Button
          onClick={() => imageInputRef.current?.click()}
          disabled={uploading}
          className="gap-2 bg-card border border-border hover:border-primary/40 text-foreground hover:text-primary"
          variant="outline"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
          Upload Image
          <span className="text-xs text-muted-foreground">· max {MAX_IMAGE_MB}MB</span>
        </Button>
        <Button
          onClick={() => videoInputRef.current?.click()}
          disabled={uploading}
          className="gap-2 bg-card border border-border hover:border-primary/40 text-foreground hover:text-primary"
          variant="outline"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />}
          Upload Video
          <span className="text-xs text-muted-foreground">· max {MAX_VIDEO_MB}MB</span>
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 size={16} className="animate-spin" /> Loading...</div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Image size={14} /> Images ({images.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map(item => (
              <div key={item.id} className="bg-card border border-border rounded-sm overflow-hidden group relative">
                <img
                  src={item.dataUrl}
                  alt={item.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-2">
                  <p className="text-xs text-foreground truncate font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(item.size)}</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyUrl(item.id, item.dataUrl)}
                    className="bg-black/70 text-white p-1.5 rounded-sm hover:bg-black/90"
                    title="Copy data URL"
                  >
                    {copied === item.id ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="bg-red-900/80 text-red-300 p-1.5 rounded-sm hover:bg-red-900"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Film size={14} /> Videos ({videos.length})
          </h2>
          <div className="space-y-3">
            {videos.map(item => (
              <div key={item.id} className="bg-card border border-border rounded-sm p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center shrink-0">
                  <Film size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(item.size)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => copyUrl(item.id, item.dataUrl)}>
                    {copied === item.id ? <Check size={12} /> : <Copy size={12} />}
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-400 border-red-800/40 hover:bg-red-950/20" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 size={12} /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isLoading && media.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-sm">
          <Upload size={32} className="text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No media uploaded yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Upload images or videos using the buttons above.</p>
        </div>
      )}
    </div>
  );
}
