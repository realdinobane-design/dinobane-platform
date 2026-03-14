import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Youtube, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface Article {
  id: number;
  title: string;
  content: string;
  summary: string;
  youtubeUrl: string | null;
  videoId: string | null;
  thumbnail: string | null;
  publishedAt: string;
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const { data: article, isLoading } = useQuery<Article>({
    queryKey: ["/api/articles", parseInt(id)],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Article not found");
      return res.json();
    },
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-3/4 mb-6" />
        <Skeleton className="aspect-video w-full rounded-lg mb-8" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center">
        <p className="text-muted-foreground">Article not found.</p>
        <Link href="/articles"><Button variant="ghost" className="mt-4">Back to articles</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link href="/articles" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8" data-testid="link-back-articles">
        <ArrowLeft size={14} /> All articles
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="tag-pill bg-red-900/30 text-red-400 text-xs">Analysis</span>
          <time className="text-xs text-muted-foreground">{format(new Date(article.publishedAt), "d MMMM yyyy")}</time>
        </div>
        <h1 className="text-3xl font-black text-white leading-tight mb-3" style={{ fontFamily: "'Clash Display', sans-serif" }}>
          {article.title}
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">{article.summary}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-border">
        {article.youtubeUrl && (
          <a href={article.youtubeUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-red-700 hover:bg-red-600 text-white gap-2" data-testid="button-watch-video">
              <Youtube size={14} /> Watch Video
            </Button>
          </a>
        )}
        <Button size="sm" variant="outline" className="gap-2 border-border" onClick={handleCopyLink} data-testid="button-copy-link">
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
      </div>

      {/* Thumbnail */}
      {article.thumbnail && (
        <div className="rounded-lg overflow-hidden mb-8 border border-border">
          <img src={article.thumbnail} alt={article.title} className="w-full object-cover" loading="eager" />
        </div>
      )}

      {/* Article Body */}
      <div
        className="article-body"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Source */}
      {article.youtubeUrl && (
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Source: <a href={article.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">{article.youtubeUrl}</a>
          </p>
        </div>
      )}
    </div>
  );
}
