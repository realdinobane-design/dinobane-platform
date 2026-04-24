import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageSquare, Loader2, Send, Trash2 } from "lucide-react";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);

type LikeRow = { count: number; liked: boolean };
type CommentRow = {
  id: string;
  userId: number;
  userName: string;
  text: string;
  createdAt: string;
};

/**
 * Heart + threaded comments block, rendered below every timeline. All signed-in
 * members can like and comment. Admins can delete any comment.
 */
export function TimelineReactions({ slug }: { slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const isAdmin = !!user && ADMIN_EMAILS.has(user.email);
  const canPost = !!user?.isMember;

  const likeKey = [`/api/timelines/${slug}/like`];
  const commentsKey = [`/api/timelines/${slug}/comments`];

  const { data: likeData } = useQuery<LikeRow>({
    queryKey: likeKey,
    queryFn: async () => {
      const r = await fetch(`/api/timelines/${encodeURIComponent(slug)}/like`, {
        credentials: "include",
      });
      if (!r.ok) return { count: 0, liked: false };
      return r.json();
    },
    staleTime: 15_000,
  });
  const { data: comments = [] } = useQuery<CommentRow[]>({
    queryKey: commentsKey,
    queryFn: async () => {
      const r = await fetch(`/api/timelines/${encodeURIComponent(slug)}/comments`, {
        credentials: "include",
      });
      if (!r.ok) return [];
      const j = await r.json();
      return Array.isArray(j.comments) ? j.comments : [];
    },
    staleTime: 15_000,
  });

  const liked = likeData?.liked ?? false;
  const likeCount = likeData?.count ?? 0;

  const toggleLike = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", `/api/timelines/${encodeURIComponent(slug)}/like`);
      return r.json() as Promise<LikeRow>;
    },
    onSuccess: (data) => {
      qc.setQueryData(likeKey, data);
    },
    onError: (e) => {
      toast({
        title: "Couldn't update like",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    },
  });

  const [text, setText] = useState("");
  const postComment = useMutation({
    mutationFn: async (body: string) => {
      const r = await apiRequest(
        "POST",
        `/api/timelines/${encodeURIComponent(slug)}/comments`,
        { text: body },
      );
      return r.json();
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: commentsKey });
    },
    onError: (e) => {
      toast({
        title: "Couldn't post comment",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/timelines/${encodeURIComponent(slug)}/comments/${encodeURIComponent(id)}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentsKey });
    },
    onError: (e) => {
      toast({
        title: "Couldn't delete comment",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      toast({ title: "Comment too long", description: "Max 2000 characters.", variant: "destructive" });
      return;
    }
    postComment.mutate(trimmed);
  };

  return (
    <div className="tlr-wrap">
      <style>{CSS}</style>

      <div className="tlr-kicker">A dossier sparks a conversation</div>
      <h3 className="tlr-head">
        Leave your <span className="tlr-accent">mark</span>
      </h3>

      <div className="tlr-bar">
        <button
          className={`tlr-like${liked ? " tlr-like-on" : ""}`}
          onClick={() => {
            if (!canPost) {
              toast({ title: "Members only", description: "Become a member to like this dossier." });
              return;
            }
            toggleLike.mutate();
          }}
          disabled={toggleLike.isPending}
          data-testid="button-timeline-like"
        >
          <Heart size={14} fill={liked ? "currentColor" : "none"} />
          <span>{likeCount}</span>
          <span className="tlr-like-label">{liked ? "Liked" : "Like"}</span>
        </button>
        <div className="tlr-count">
          <MessageSquare size={13} />
          <span>{comments.length} {comments.length === 1 ? "reply" : "replies"}</span>
        </div>
      </div>

      {canPost ? (
        <form onSubmit={onSubmit} className="tlr-form">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add your intel, disagreement, or footnote…"
            rows={3}
            maxLength={2000}
            className="tlr-textarea"
            data-testid="input-timeline-comment"
          />
          <div className="tlr-form-foot">
            <span className="tlr-char">{text.length}/2000</span>
            <button
              type="submit"
              className="tlr-post"
              disabled={postComment.isPending || !text.trim()}
              data-testid="button-timeline-post"
            >
              {postComment.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Post reply
            </button>
          </div>
        </form>
      ) : (
        <div className="tlr-gate">Become a member to join the discussion.</div>
      )}

      <div className="tlr-list">
        {comments.length === 0 ? (
          <div className="tlr-empty">No replies yet. Be the first to file a note.</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="tlr-item" data-testid={`comment-${c.id}`}>
              <div className="tlr-item-head">
                <span className="tlr-author">{c.userName || "Unknown"}</span>
                <span className="tlr-time">
                  {(() => {
                    try {
                      return formatDistanceToNow(new Date(c.createdAt), { addSuffix: true });
                    } catch {
                      return "";
                    }
                  })()}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm("Delete this comment?")) deleteComment.mutate(c.id);
                    }}
                    className="tlr-del"
                    title="Delete comment"
                    data-testid={`button-delete-comment-${c.id}`}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
              <p className="tlr-body">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const CSS = `
.tlr-wrap{
  max-width:900px; margin:0 auto; padding:50px 22px 80px;
  font-family:'Cormorant Garamond', Georgia, serif; color:#e6e2da;
}
.tlr-kicker{
  font-family:'JetBrains Mono', ui-monospace, monospace;
  font-size:11px; letter-spacing:.35em; text-transform:uppercase; color:#cc2a2a; margin-bottom:12px;
}
.tlr-head{
  font-family:'Cormorant Garamond', serif; font-style:italic; font-weight:600;
  font-size:42px; line-height:1.1; margin:0 0 24px; color:#e6e2da;
}
.tlr-accent{color:#cc2a2a}

.tlr-bar{
  display:flex; align-items:center; gap:18px; padding:14px 0; border-top:1px solid rgba(255,255,255,.08);
  border-bottom:1px solid rgba(255,255,255,.08); margin-bottom:22px;
}
.tlr-like{
  display:inline-flex; align-items:center; gap:8px;
  font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:.25em; text-transform:uppercase;
  color:#b6ada1; background:transparent; border:1px solid rgba(255,255,255,.12); padding:8px 14px; cursor:pointer;
  transition:color .2s ease, border-color .2s ease, background .2s ease;
}
.tlr-like:hover{color:#ff9c9c; border-color:rgba(204,42,42,.55); background:rgba(204,42,42,.06)}
.tlr-like-on{color:#ff6b6b; border-color:#cc2a2a; background:rgba(204,42,42,.1)}
.tlr-like-on:hover{color:#ff8a8a}
.tlr-like:disabled{opacity:.5; cursor:wait}
.tlr-like-label{font-weight:500}

.tlr-count{
  display:inline-flex; align-items:center; gap:6px;
  font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:.25em; text-transform:uppercase; color:#8a847c;
}

.tlr-form{margin-bottom:30px}
.tlr-textarea{
  width:100%; background:rgba(10,10,10,.6); border:1px solid rgba(255,255,255,.12);
  color:#e6e2da; font-family:'Cormorant Garamond', serif; font-size:17px; line-height:1.55;
  padding:12px 14px; resize:vertical; min-height:84px;
}
.tlr-textarea:focus{outline:none; border-color:#cc2a2a}
.tlr-form-foot{
  display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:8px;
}
.tlr-char{font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:.18em; color:#6f6558}
.tlr-post{
  display:inline-flex; align-items:center; gap:8px;
  font-family:'JetBrains Mono', monospace; font-size:10.5px; letter-spacing:.25em; text-transform:uppercase;
  color:#fff; background:#cc2a2a; border:none; padding:9px 16px; cursor:pointer; font-weight:600;
  transition:background .2s ease;
}
.tlr-post:hover{background:#e03737}
.tlr-post:disabled{opacity:.4; cursor:not-allowed; background:#cc2a2a}

.tlr-gate{
  margin-bottom:26px; padding:18px; border:1px dashed rgba(255,255,255,.12);
  text-align:center; font-family:'Cormorant Garamond', serif; font-style:italic; color:#8a847c; font-size:15px;
}

.tlr-list{display:flex; flex-direction:column}
.tlr-empty{
  padding:26px 0; text-align:center; font-family:'Cormorant Garamond', serif; font-style:italic;
  color:#6f6558; border-top:1px dashed rgba(255,255,255,.06);
}
.tlr-item{padding:18px 0; border-top:1px solid rgba(255,255,255,.06)}
.tlr-item-head{
  display:flex; align-items:center; gap:12px; margin-bottom:6px;
}
.tlr-author{
  font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:.22em; text-transform:uppercase;
  color:#d4a24a;
}
.tlr-time{
  font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:.18em; text-transform:uppercase;
  color:#6f6558;
}
.tlr-del{
  margin-left:auto; color:#6f6558; background:transparent; border:none; cursor:pointer; padding:4px;
}
.tlr-del:hover{color:#cc2a2a}
.tlr-body{
  font-family:'Cormorant Garamond', serif; font-size:17px; line-height:1.6; color:#c8c2b6;
  margin:0; white-space:pre-wrap; word-break:break-word;
}

@media (max-width:640px){
  .tlr-wrap{padding:36px 18px 60px}
  .tlr-head{font-size:34px}
}
`;
