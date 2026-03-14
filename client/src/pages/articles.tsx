import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, Youtube, Loader2, BookOpen, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface Article {
  id: number;
  title: string;
  summary: string;
  youtubeUrl: string | null;
  thumbnail: string | null;
  publishedAt: string;
}

export default function ArticlesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [ytUrl, setYtUrl] = useState("");

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const generateMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/articles/generate", { youtubeUrl: url });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/articles"] });
      setYtUrl("");
      toast({ title: "Article generated", description: "The video has been converted to a written article." });
    },
    onError: () => {
      toast({ title: "Failed to generate", description: "Check the YouTube URL and try again.", variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!ytUrl.trim()) return;
    if (!ytUrl.includes("youtube.com") && !ytUrl.includes("youtu.be")) {
      toast({ title: "Invalid URL", description: "Please enter a valid YouTube URL.", variant: "destructive" });
      return;
    }
    generateMutation.mutate(ytUrl.trim());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Written Analysis
          </h1>
          <p className="text-muted-foreground text-sm">Video breakdowns converted to text. Share, reference, archive.</p>
        </div>
      </div>

      {/* ─── VIDEO TO ARTICLE TOOL ─────────────────────────────────────────── */}
      {user && (
        <div className="mb-8 p-5 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-red-400" />
            <h2 className="font-bold text-sm text-white">Generate Article from Video</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Paste any YouTube URL to auto-generate a written analysis article. Works with any DinoBane video.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Youtube size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={ytUrl}
                onChange={e => setYtUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
                placeholder="https://www.youtube.com/watch?v=..."
                className="pl-8 bg-background border-border text-sm"
                data-testid="input-youtube-url"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !ytUrl.trim()}
              className="bg-red-700 hover:bg-red-600 text-white font-semibold shrink-0"
              data-testid="button-generate-article"
            >
              {generateMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Sparkles size={14} className="mr-1.5" />}
              Generate
            </Button>
          </div>
        </div>
      )}

      {/* ─── ARTICLES LIST ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 rounded-lg bg-card border border-border">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {articles.map(a => (
            <Link
              key={a.id}
              href={`/articles/${a.id}`}
              className="group flex gap-4 p-5 rounded-lg bg-card border border-border hover:border-red-800/60 transition-all"
              data-testid={`link-article-${a.id}`}
            >
              {a.thumbnail && (
                <div className="hidden sm:block flex-shrink-0 w-32 aspect-video rounded overflow-hidden">
                  <img src={a.thumbnail} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="tag-pill bg-red-900/30 text-red-400">
                    <BookOpen size={9} /> Analysis
                  </span>
                  <span className="text-xs text-muted-foreground">{format(new Date(a.publishedAt), "d MMMM yyyy")}</span>
                </div>
                <h3 className="font-bold text-white leading-tight mb-2 group-hover:text-red-400 transition-colors" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  {a.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{a.summary}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-red-400 font-medium">
                  Read full analysis <ArrowRight size={11} />
                </div>
              </div>
            </Link>
          ))}

          {articles.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No articles yet</p>
              <p className="text-sm mt-1">Paste a YouTube URL above to generate the first one.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
