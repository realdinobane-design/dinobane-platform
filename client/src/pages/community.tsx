import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { DmChat } from "@/components/dm-chat";
import { ReactionBar } from "@/components/reaction-bar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Crown, Hash, Send, Users, Loader2, Image as ImageIcon, X,
  ChevronDown, Star, MessageSquare, Newspaper,
  Video, Coffee, Shield, CornerDownRight, ChevronRight, Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface MessageWithUser {
  id: number;
  userId: number;
  channel: string;
  content: string;
  parentId?: number | null;
  createdAt: string;
  user: {
    id: number;
    displayName: string;
    avatarInitials: string;
    avatarColor: string;
    avatarUrl?: string;
    username: string;
  };
}

interface MemberSummary {
  id: number;
  username: string;
  displayName: string;
  avatarInitials: string;
  avatarColor: string;
  avatarUrl?: string | null;
}

interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  domain: string;
}

// ─── CHANNEL CONFIG ───────────────────────────────────────────────────────────

const CHANNELS = [
  { id: "general",          label: "General",          sub: "General chat",            Icon: MessageSquare },
  { id: "news-links",       label: "News Links",       sub: "Share & discuss stories", Icon: Newspaper     },
  { id: "video-discussion", label: "Video Discussion", sub: "Talk about the videos",   Icon: Video         },
  { id: "off-topic",        label: "Off-Topic",        sub: "Everything else",         Icon: Coffee        },
];

const MAX_CHAT_IMAGE_BYTES = 2 * 1024 * 1024;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return (text.match(urlRegex) || []).slice(0, 1);
}

function renderMessageContent(content: string) {
  return content
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-sky-400 underline hover:text-sky-300 break-all">$1</a>'
    )
    .replace(/@([a-zA-Z0-9_]+)/g, '<span class="text-[#cc2a2a] font-semibold">@$1</span>');
}

function UserAvatar({ user, size = "md" }: { user: MessageWithUser["user"]; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const textSize = size === "sm" ? "text-[9px]" : "text-xs";
  return (
    <Avatar className={cn(dim, "ring-1 ring-white/5 shrink-0")}>
      {user.avatarUrl && <AvatarFallback className="p-0"><img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover rounded-full" /></AvatarFallback>}
      <AvatarFallback className={cn(textSize, "font-bold text-white")} style={{ background: user.avatarColor }}>
        {user.avatarInitials}
      </AvatarFallback>
    </Avatar>
  );
}

// ─── LINK PREVIEW ─────────────────────────────────────────────────────────────

function LinkPreviewCard({ url }: { url: string }) {
  const { data, isLoading } = useQuery<LinkPreview>({
    queryKey: ["/api/link-preview", url],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/link-preview?url=${encodeURIComponent(url)}`);
        return res.json();
      } catch { return null; }
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  if (isLoading) return (
    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 bg-[#0f0f0f] border border-[#222] rounded-sm px-3 py-2 w-fit">
      <Loader2 size={11} className="animate-spin" /> Fetching preview…
    </div>
  );
  if (!data?.title) return null;

  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      className="mt-2 flex gap-0 border border-[#222] hover:border-[#cc2a2a]/40 rounded-sm overflow-hidden bg-[#0f0f0f] max-w-sm transition-colors group"
    >
      {data.image && (
        <img src={data.image} alt="" className="w-20 h-20 object-cover flex-shrink-0"
          onError={e => (e.currentTarget.style.display = "none")} />
      )}
      <div className="px-3 py-2 min-w-0 flex-1 border-l-2 border-[#cc2a2a]">
        <p className="text-xs font-bold text-white group-hover:text-[#cc2a2a] transition-colors line-clamp-2 leading-snug">{data.title}</p>
        {data.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2 leading-snug">{data.description}</p>}
        <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wide">{data.siteName || data.domain}</p>
      </div>
    </a>
  );
}

// ─── INLINE REPLY COMPOSER ────────────────────────────────────────────────────

function ReplyComposer({
  parentId, channel, user, onSuccess, onCancel,
}: {
  parentId: number; channel: string; user: any;
  onSuccess: (msg: MessageWithUser) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/messages", { channel, content, parentId });
      return res.json();
    },
    onSuccess: (msg) => { onSuccess(msg); },
    onError: (e: Error) => toast({ title: "Failed to send reply", description: e.message, variant: "destructive" }),
  });

  const handleSend = () => {
    if (sendMutation.isPending) return;
    if (pendingImage) { sendMutation.mutate(pendingImage); return; }
    const text = draft.trim();
    if (!text) return;
    sendMutation.mutate(text);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_CHAT_IMAGE_BYTES) { alert("Image too large. Max 2MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="mt-3 pl-4 border-l-2 border-[#cc2a2a]/30">
      {pendingImage && (
        <div className="mb-2 relative inline-block">
          <img src={pendingImage} alt="Preview" className="max-h-20 max-w-[200px] rounded-sm border border-[#222] object-contain" />
          <button onClick={() => setPendingImage(null)} className="absolute -top-1.5 -right-1.5 bg-[#cc2a2a] text-white rounded-full p-0.5 hover:bg-red-500 transition-colors">
            <X size={10} />
          </button>
        </div>
      )}
      <div className="flex items-start gap-2">
        <UserAvatar user={user} size="sm" />
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Write a reply…"
            className="w-full resize-none bg-[#0f0f0f] border border-[#222] focus:border-[#cc2a2a]/50 rounded-sm px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors min-h-[38px] max-h-28"
            rows={1}
            style={{ lineHeight: "1.5" }}
          />
          <div className="flex items-center gap-2 mt-1.5">
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <button
              onClick={() => imageInputRef.current?.click()}
              className="h-7 w-7 flex items-center justify-center rounded-sm bg-[#111] border border-[#222] text-zinc-500 hover:text-white hover:border-[#cc2a2a]/40 transition-colors"
              title="Attach image"
              type="button"
            >
              <ImageIcon size={12} />
            </button>
            <button
              onClick={handleSend}
              disabled={(!draft.trim() && !pendingImage) || sendMutation.isPending}
              className="flex items-center gap-1.5 h-7 px-3 rounded-sm bg-[#cc2a2a] hover:bg-red-600 disabled:opacity-40 text-white text-xs font-bold transition-colors"
            >
              {sendMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
              Reply
            </button>
            <button onClick={onCancel} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REPLY THREAD ─────────────────────────────────────────────────────────────

function ReplyThread({
  parentId, channel, user, initialCount,
}: {
  parentId: number; channel: string; user: any; initialCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replying, setReplying] = useState(false);
  const qc = useQueryClient();

  const { data: replies = [], isLoading } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/messages", parentId, "replies"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/messages/${parentId}/replies`);
      return res.json();
    },
    enabled: expanded,
    staleTime: 30000,
  });

  const totalReplies = expanded ? replies.length : initialCount;

  const handleNewReply = (msg: MessageWithUser) => {
    qc.setQueryData(["/api/messages", parentId, "replies"], (old: MessageWithUser[] = []) => {
      if (old.some(m => m.id === msg.id)) return old;
      return [...old, msg];
    });
    setExpanded(true);
    setReplying(false);
  };

  if (totalReplies === 0 && !replying) {
    return (
      <div className="mt-2">
        <button
          onClick={() => setReplying(true)}
          className="flex items-center gap-1.5 text-xs text-[#f0c800] hover:text-yellow-300 transition-colors py-0.5"
        >
          <CornerDownRight size={12} />
          Reply
        </button>
        {replying && (
          <ReplyComposer
            parentId={parentId} channel={channel} user={user}
            onSuccess={handleNewReply} onCancel={() => setReplying(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mt-2">
      {/* Reply count / expand toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setExpanded(o => !o)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors py-0.5 group"
        >
          <ChevronRight
            size={13}
            className={cn("transition-transform duration-150", expanded ? "rotate-90" : "")}
          />
          <span className="font-semibold text-[#cc2a2a]">{totalReplies}</span>
          <span>{totalReplies === 1 ? "reply" : "replies"}</span>
        </button>
        <button
          onClick={() => { setExpanded(true); setReplying(true); }}
          className="flex items-center gap-1 text-xs text-[#f0c800] hover:text-yellow-300 transition-colors py-0.5"
        >
          <CornerDownRight size={12} />
          Reply
        </button>
      </div>

      {/* Expanded replies */}
      {expanded && (
        <div className="mt-2 pl-4 border-l-2 border-[#1e1e1e] space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-zinc-600 py-2">
              <Loader2 size={12} className="animate-spin" /> Loading replies…
            </div>
          ) : (
            replies.map(reply => {
              const isImage = reply.content.startsWith("data:image/");
              const urls = !isImage ? extractUrls(reply.content) : [];
              const canDeleteReply = user && (user.id === reply.userId || user.email === "realdinobane@gmail.com" || user.email === "yingchanzeng@gmail.com");
              return (
                <div key={reply.id} className="flex gap-2.5">
                  <UserAvatar user={reply.user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xs font-bold text-white">{reply.user.displayName}</span>
                      <time className="text-[10px] text-zinc-600">
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </time>
                      {canDeleteReply && (
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this reply?")) return;
                            try {
                              await apiRequest("DELETE", `/api/messages/${reply.id}`);
                              qc.setQueryData(["/api/messages", parentId, "replies"], (old: MessageWithUser[] = []) =>
                                old.filter(r => r.id !== reply.id)
                              );
                            } catch (e: any) { alert(e.message); }
                          }}
                          className="text-zinc-700 hover:text-red-500 transition-colors p-0.5 rounded"
                          title="Delete reply"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                    {!isImage && (
                      <p
                        className="text-sm text-zinc-300 leading-relaxed break-words"
                        dangerouslySetInnerHTML={{ __html: renderMessageContent(reply.content) }}
                      />
                    )}
                    {isImage && (
                      <img src={reply.content} alt="Image" className="max-w-[240px] max-h-48 rounded-sm border border-[#222] mt-1 object-contain" />
                    )}
                    {urls.length > 0 && <LinkPreviewCard url={urls[0]} />}
                    <ReactionBar messageId={reply.id} currentUserId={user?.id} />
                  </div>
                </div>
              );
            })
          )}

          {/* Reply composer (when expanded) */}
          {replying ? (
            <ReplyComposer
              parentId={parentId} channel={channel} user={user}
              onSuccess={handleNewReply} onCancel={() => setReplying(false)}
            />
          ) : (
            <button
              onClick={() => setReplying(true)}
              className="flex items-center gap-1.5 text-xs text-[#f0c800] hover:text-yellow-300 transition-colors py-0.5"
            >
              <CornerDownRight size={12} />
              Add a reply…
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────────────────

function PostCard({ msg, channel, user, replyCount, onDm }: {
  msg: MessageWithUser; channel: string; user: any; replyCount: number;
  onDm?: (partner: MessageWithUser["user"]) => void;
}) {
  const isImage = msg.content.startsWith("data:image/");
  const urls = !isImage ? extractUrls(msg.content) : [];
  const qc = useQueryClient();
  const { toast } = useToast();
  const canDelete = user && (user.id === msg.userId || user.email === "realdinobane@gmail.com" || user.email === "yingchanzeng@gmail.com");

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/messages/${msg.id}`),
    onSuccess: () => {
      qc.setQueryData(["/api/messages", channel], (old: MessageWithUser[] = []) =>
        old.filter(m => m.id !== msg.id)
      );
      toast({ title: "Message deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="bg-[#111] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-sm transition-colors overflow-hidden">
      {/* Card header */}
      <div className="px-4 pt-4 pb-3">
        {/* Author row */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => onDm && user && msg.user.id !== user.id && onDm(msg.user)}
            className={onDm && user && msg.user.id !== user.id ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-default"}
            title={onDm && user && msg.user.id !== user.id ? `Message ${msg.user.displayName}` : undefined}
          >
            <UserAvatar user={msg.user} size="md" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-white leading-none">{msg.user.displayName}</span>
              <span className="text-[10px] text-zinc-600">@{msg.user.username}</span>
              <time className="text-[10px] text-zinc-600 ml-auto">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
              </time>
              {canDelete && (
                <button
                  onClick={() => { if (confirm("Delete this message?")) deleteMutation.mutate(); }}
                  className="text-zinc-700 hover:text-red-500 transition-colors p-0.5 rounded"
                  title="Delete message"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* Message body */}
            <div className="mt-2">
              {!isImage && (
                <p
                  className="text-[14px] text-zinc-200 leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: renderMessageContent(msg.content) }}
                />
              )}
              {isImage && (
                <img
                  src={msg.content}
                  alt="Shared image"
                  className="max-w-full max-h-72 rounded-sm border border-[#222] mt-1 object-contain"
                />
              )}
              {urls.length > 0 && <LinkPreviewCard url={urls[0]} />}
            </div>
          </div>
        </div>
      </div>

      {/* Reactions */}
      <div className="px-4 pb-1">
        <ReactionBar messageId={msg.id} currentUserId={user?.id} />
      </div>

      {/* Reply thread */}
      <div className="px-4 pb-3 border-t border-[#181818] pt-2.5">
        <ReplyThread
          parentId={msg.id}
          channel={channel}
          user={user}
          initialCount={replyCount}
        />
      </div>
    </div>
  );
}

// ─── GATE PAGES ───────────────────────────────────────────────────────────────

function GatePage({ isMember }: { isMember?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <div className="w-16 h-16 rounded-full bg-[#cc2a2a]/10 border border-[#cc2a2a]/30 flex items-center justify-center mb-6">
        <Crown size={28} className="text-yellow-400" />
      </div>
      {isMember === false ? (
        <>
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Members Community
          </h2>
          <p className="text-zinc-400 mb-2 max-w-xs leading-relaxed">
            Private channels, @mentions, link sharing — no algorithms, no censorship.
          </p>
          <p className="text-4xl font-black text-white mb-8">
            £5 <span className="text-zinc-500 text-lg font-normal">/ month</span>
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href="/membership">
              <Button size="lg" className="bg-[#cc2a2a] hover:bg-red-600 text-white font-black px-8 gap-2 h-12" data-testid="button-upgrade-community">
                <Crown size={16} /> Join Now — £5/mo
              </Button>
            </Link>
            <p className="text-xs text-zinc-600">Cancel anytime · No contracts</p>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Members Only
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xs">Sign in or join to access the community.</p>
          <div className="flex gap-3">
            <Link href="/login"><Button variant="outline" className="border-[#333] hover:border-[#cc2a2a]">Sign in</Button></Link>
            <Link href="/register"><Button className="bg-[#cc2a2a] hover:bg-red-600 text-white font-bold">Join</Button></Link>
          </div>
        </>
      )}
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState("general");

  if (!user) return <GatePage />;
  if (!user.isMember) return <GatePage isMember={false} />;

  return <CommunityUI user={user} activeChannel={activeChannel} setActiveChannel={setActiveChannel} />;
}

// ─── COMMUNITY UI ─────────────────────────────────────────────────────────────

function CommunityUI({ user, activeChannel, setActiveChannel }: {
  user: any; activeChannel: string; setActiveChannel: (c: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(true);
  const [mobileMembersOpen, setMobileMembersOpen] = useState(false);
  const [dmPartner, setDmPartner] = useState<any>(null); // active DM chat partner
  const feedEndRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Unread DM count badge
  const { data: dmUnread } = useQuery<{ count: number }>({
    queryKey: ["/api/dm/unread/count"],
    queryFn: () => apiRequest("GET", "/api/dm/unread/count").then(r => r.json()),
    refetchInterval: 15000,
    enabled: !!user,
  });

  const activeCh = CHANNELS.find(c => c.id === activeChannel) || CHANNELS[0];

  // Members list
  const { data: membersList = [] } = useQuery<MemberSummary[]>({
    queryKey: ["/api/community/members"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/community/members");
      return res.json();
    },
    staleTime: 60000,
  });

  // Top-level posts only
  const { data: posts = [], isLoading } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/messages", activeChannel],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/messages/${activeChannel}`);
      return res.json();
    },
    refetchInterval: 10000,
  });

  // Bulk reply counts
  const { data: replyCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ["/api/messages/reply-counts", activeChannel, posts.map(p => p.id).join(",")],
    queryFn: async () => {
      if (posts.length === 0) return {};
      const res = await apiRequest("POST", "/api/messages/reply-counts", { ids: posts.map(p => p.id) });
      return res.json();
    },
    enabled: posts.length > 0,
    staleTime: 15000,
  });

  // WebSocket live updates for new top-level posts
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "new_message" && data.message.channel === activeChannel && !data.message.parentId) {
          qc.setQueryData(["/api/messages", activeChannel], (old: MessageWithUser[] = []) => {
            if (old.some(m => m.id === data.message.id)) return old;
            return [...old, data.message];
          });
        }
        // If it's a reply, invalidate the reply cache for that parent
        if (data.type === "new_message" && data.message.parentId) {
          qc.invalidateQueries({ queryKey: ["/api/messages", data.message.parentId, "replies"] });
        }
      };
    } catch {}
    return () => { try { ws?.close(); } catch {} };
  }, [activeChannel]);

  const { toast } = useToast();

  // Post new top-level message
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/messages", { channel: activeChannel, content });
      return res.json();
    },
    onSuccess: (msg) => {
      qc.setQueryData(["/api/messages", activeChannel], (old: MessageWithUser[] = []) => {
        if (old.some(m => m.id === msg.id)) return old;
        return [...old, msg];
      });
      setDraft("");
      setPendingImage(null);
      setTimeout(() => feedEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: (e: Error) => toast({ title: "Failed to post", description: e.message, variant: "destructive" }),
  });

  const handleSend = () => {
    if (sendMutation.isPending) return;
    if (pendingImage) { sendMutation.mutate(pendingImage); return; }
    const text = draft.trim();
    if (!text) return;
    sendMutation.mutate(text);
  };

  const insertMention = (username: string) => {
    setDraft(d => d + `@${username} `);
    textareaRef.current?.focus();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_CHAT_IMAGE_BYTES) { alert("Image too large. Max 2MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
    <div className="flex bg-[#0a0a0a]" style={{ height: "calc(100vh - 4rem)" }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside className="hidden sm:flex w-60 flex-shrink-0 flex-col bg-[#0d0d0d] border-r border-[#1a1a1a]">

        {/* Server header */}
        <div className="px-4 py-4 border-b border-[#1a1a1a] flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-[#cc2a2a]/10 border border-[#cc2a2a]/30 flex items-center justify-center shrink-0">
            <Shield size={16} className="text-[#cc2a2a]" />
          </div>
          <div>
            <p className="text-sm font-black text-white uppercase tracking-wider" style={{ fontFamily: "'Clash Display', sans-serif" }}>DinoBane</p>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Members Community</p>
          </div>
        </div>

        {/* Channels */}
        <div className="px-3 pt-4 pb-2">
          <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-2 px-1">Channels</p>
          <div className="space-y-0.5">
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left transition-all",
                  activeChannel === ch.id
                    ? "bg-[#cc2a2a]/15 border border-[#cc2a2a]/30 text-white"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-[#111] border border-transparent"
                )}
                data-testid={`button-channel-${ch.id}`}
              >
                <Hash size={14} className={cn("shrink-0 transition-colors", activeChannel === ch.id ? "text-[#cc2a2a]" : "text-zinc-600")} />
                <div className="min-w-0">
                  <p className={cn("text-sm font-semibold leading-none truncate", activeChannel === ch.id ? "text-white" : "")}>{ch.label}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{ch.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#1a1a1a] mx-3 my-2" />

        {/* Members collapsible */}
        <div className="px-3 pb-2 flex-1 overflow-y-auto">
          <button
            onClick={() => setMembersOpen(o => !o)}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-sm hover:bg-[#111] transition-colors"
            data-testid="button-toggle-members"
          >
            <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
            <span className="flex-1 text-[10px] font-black uppercase tracking-widest text-yellow-400 text-left">Members</span>
            <span className="text-[10px] text-yellow-500/60 font-mono bg-yellow-500/10 px-1.5 py-0.5 rounded-sm">{membersList.length}</span>
            <ChevronDown size={12} className={cn("text-yellow-400/50 shrink-0 transition-transform duration-200", membersOpen ? "rotate-0" : "-rotate-90")} />
          </button>

          {membersOpen && (
            <div className="mt-1 space-y-0.5">
              {membersList.length === 0 && <p className="text-[11px] text-zinc-700 px-3 py-2">No members yet.</p>}
              {membersList.map(m => (
                <div key={m.id} className="flex items-center gap-1">
                  <button
                    onClick={() => insertMention(m.username)}
                    className="flex-1 flex items-center gap-2.5 px-2 py-1.5 rounded-sm hover:bg-[#111] transition-colors group/mem text-left"
                    title={`@mention ${m.username}`}
                    data-testid={`button-member-${m.id}`}
                  >
                    <div
                      className="h-6 w-6 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-white ring-1 ring-white/10"
                      style={{ background: m.avatarColor, fontSize: 9, fontWeight: 700 }}
                    >
                      {m.avatarUrl
                        ? <img src={m.avatarUrl} alt={m.displayName} className="w-full h-full object-cover" />
                        : m.avatarInitials}
                    </div>
                    <p className="text-xs text-zinc-400 group-hover/mem:text-white transition-colors truncate font-medium">@{m.username}</p>
                  </button>
                  {user && m.id !== user.id && (
                    <button
                      onClick={() => setDmPartner(m)}
                      title={`Message ${m.displayName}`}
                      className="p-1 text-[#333] hover:text-[#f0c800] transition-colors rounded shrink-0"
                    >
                      <MessageSquare size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-[#1a1a1a] flex items-center gap-2.5 bg-[#0a0a0a]">
          <Avatar className="h-8 w-8 ring-2 ring-[#cc2a2a]/30">
            {user.avatarUrl && <AvatarFallback className="p-0"><img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover rounded-full" /></AvatarFallback>}
            <AvatarFallback className="text-xs font-bold text-white" style={{ background: user.avatarColor }}>{user.avatarInitials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
            <p className="text-[10px] text-yellow-500 flex items-center gap-1"><Crown size={9} /> Member</p>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Channel header — desktop */}
        <div className="hidden sm:flex px-5 py-3 border-b border-[#1a1a1a] bg-[#0d0d0d] items-center gap-3 flex-shrink-0">
          <Hash size={15} className="text-[#cc2a2a]" />
          <span className="font-black text-white text-base" style={{ fontFamily: "'Clash Display', sans-serif" }}>{activeCh.label}</span>
          <div className="w-px h-4 bg-[#333] mx-1" />
          <p className="text-xs text-zinc-500">{activeCh.sub}</p>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500 bg-[#111] border border-[#1e1e1e] rounded-sm px-2.5 py-1">
            <Users size={11} className="text-green-400" />
            <span className="text-green-400 font-semibold">{membersList.length}</span>
            <span>members</span>
          </div>
        </div>

        {/* Mobile top bar: horizontally scrollable channel tabs + Members button */}
        <div className="sm:hidden flex-shrink-0 border-b border-[#1a1a1a] bg-[#0d0d0d]">
          {/* Current channel name */}
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
            <Hash size={13} className="text-[#cc2a2a] shrink-0" />
            <span className="font-black text-white text-sm" style={{ fontFamily: "'Clash Display', sans-serif" }}>{activeCh.label}</span>
          </div>
          {/* Scrollable tabs row */}
          <div className="flex items-center overflow-x-auto scrollbar-none pb-2 px-2 gap-1">
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={cn(
                  "shrink-0 px-3 py-1.5 text-[11px] rounded-sm font-bold uppercase tracking-wide transition-colors whitespace-nowrap",
                  activeChannel === ch.id
                    ? "bg-[#cc2a2a]/20 text-[#cc2a2a] border border-[#cc2a2a]/30"
                    : "text-zinc-500 hover:text-zinc-300 border border-[#222]"
                )}
              >
                #{ch.label}
              </button>
            ))}
            {/* Members button — opens member list modal */}
            <button
              onClick={() => setMobileMembersOpen(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-sm font-bold uppercase tracking-wide border border-[#222] text-zinc-500 hover:text-[#f0c800] hover:border-[#f0c800]/30 transition-colors whitespace-nowrap ml-1"
            >
              <Users size={12} />
              Members
              {(membersList.length > 0) && (
                <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold">{membersList.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── POST COMPOSE BOX ── */}
        <div className="px-4 pt-4 pb-3 border-b border-[#1a1a1a] bg-[#0d0d0d] flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#111] border border-[#1e1e1e] focus-within:border-[#cc2a2a]/40 rounded-sm transition-colors">
              {pendingImage && (
                <div className="p-3 pb-0">
                  <div className="relative inline-block">
                    <img src={pendingImage} alt="Preview" className="max-h-24 max-w-xs rounded-sm border border-[#222] object-contain" />
                    <button onClick={() => setPendingImage(null)} className="absolute -top-2 -right-2 bg-[#cc2a2a] text-white rounded-full p-0.5 hover:bg-red-500 transition-colors">
                      <X size={11} />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3">
                <Avatar className="h-8 w-8 ring-1 ring-white/5 mt-0.5 shrink-0">
                  {user.avatarUrl && <AvatarFallback className="p-0"><img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover rounded-full" /></AvatarFallback>}
                  <AvatarFallback className="text-xs font-bold text-white" style={{ background: user.avatarColor }}>{user.avatarInitials}</AvatarFallback>
                </Avatar>
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Post to #${activeCh.label} — use @username to mention someone`}
                  className="flex-1 resize-none bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none min-h-[44px] max-h-40"
                  rows={2}
                  style={{ lineHeight: "1.5" }}
                  data-testid="input-message"
                />
              </div>
              <div className="flex items-center gap-2 px-3 pb-3 pt-0 border-t border-[#1a1a1a]">
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-sm bg-[#0a0a0a] border border-[#222] text-zinc-500 hover:text-white hover:border-[#cc2a2a]/40 text-xs transition-colors"
                  title="Attach image (max 2MB)" type="button"
                >
                  <ImageIcon size={13} /> Image
                </button>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-[10px] text-zinc-600">Enter to post · Shift+Enter for new line</span>
                  <button
                    onClick={handleSend}
                    disabled={(!draft.trim() && !pendingImage) || sendMutation.isPending}
                    className="flex items-center gap-1.5 h-8 px-4 rounded-sm bg-[#cc2a2a] hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors"
                    data-testid="button-send-message"
                  >
                    {sendMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── POSTS FEED ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={20} className="animate-spin text-zinc-600" />
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-[#111] border border-[#1e1e1e] flex items-center justify-center mb-4">
                  <activeCh.Icon size={22} className="text-zinc-700" />
                </div>
                <p className="font-black text-white text-lg" style={{ fontFamily: "'Clash Display', sans-serif" }}>#{activeCh.label}</p>
                <p className="text-sm text-zinc-600 mt-1">Be the first to post here.</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  msg={post}
                  channel={activeChannel}
                  user={user}
                  replyCount={replyCounts[post.id] ?? 0}
                  onDm={(partner) => user && partner.id !== user.id && setDmPartner(partner)}
                />
              ))
            )}
            <div ref={feedEndRef} />
          </div>
        </div>
      </div>
    </div>

    {/* Floating DM chat window — floats above page, can be closed without affecting content */}
    {dmPartner && user && (
      <DmChat
        currentUser={user}
        partner={dmPartner}
        onClose={() => setDmPartner(null)}
      />
    )}

    {/* Mobile members modal */}
    {mobileMembersOpen && (
      <div
        className="fixed inset-0 z-50 sm:hidden"
        onClick={() => setMobileMembersOpen(false)}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70" />
        {/* Sheet slides up from bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-[#2a2a2a] rounded-t-xl max-h-[70vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-[#333] rounded-full" />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-green-400" />
              <span className="text-white font-bold text-sm">Members</span>
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-bold">{membersList.length}</span>
            </div>
            <button onClick={() => setMobileMembersOpen(false)} className="text-[#555] hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          {/* Member list */}
          <div className="overflow-y-auto flex-1 py-2">
            {membersList.length === 0 && (
              <p className="text-[#555] text-sm text-center py-8">No members yet.</p>
            )}
            {membersList.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#1a1a1a] last:border-0">
                <div
                  className="h-10 w-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-white ring-1 ring-white/10 font-bold text-xs"
                  style={{ background: m.avatarColor }}
                >
                  {m.avatarUrl
                    ? <img src={m.avatarUrl} alt={m.displayName} className="w-full h-full object-cover" />
                    : m.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{m.displayName}</p>
                  <p className="text-[#555] text-xs">@{m.username}</p>
                </div>
                {user && m.id !== user.id && (
                  <button
                    onClick={() => {
                      setDmPartner(m);
                      setMobileMembersOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#cc2a2a]/10 hover:bg-[#cc2a2a]/20 border border-[#cc2a2a]/30 text-[#cc2a2a] text-xs font-bold rounded transition-colors shrink-0"
                  >
                    <MessageSquare size={12} />
                    Message
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
