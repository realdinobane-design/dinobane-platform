import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Crown, Hash, Send, Users, Loader2, Image, X, ChevronDown, ChevronRight, Star } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

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

const CHANNELS = [
  { id: "general", label: "general", icon: Hash },
  { id: "news-links", label: "news-links", icon: Hash },
  { id: "video-discussion", label: "video-discussion", icon: Hash },
  { id: "off-topic", label: "off-topic", icon: Hash },
];

// Max image size for chat: 2MB
const MAX_CHAT_IMAGE_BYTES = 2 * 1024 * 1024;

function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return (text.match(urlRegex) || []).slice(0, 1); // first URL only
}

function renderMessageContent(content: string): string {
  // If content is a data URL (image), render as img tag
  if (content.startsWith("data:image/")) {
    return `<img src="${content}" alt="Image" class="chat-image" style="max-width:320px;max-height:240px;border-radius:4px;display:block;margin-top:4px;" />`;
  }
  return content
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-sky-400 underline hover:text-sky-300">$1</a>')
    .replace(/@([a-zA-Z0-9_]+)/g, '<span class="mention text-primary font-semibold">@$1</span>');
}

// Link preview card component
function LinkPreviewCard({ url }: { url: string }) {
  const { data, isLoading } = useQuery<LinkPreview>({
    queryKey: ["/api/link-preview", url],
    queryFn: async () => {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  if (isLoading) return (
    <div className="mt-2 border border-border rounded-sm p-2 flex items-center gap-2 text-xs text-muted-foreground w-fit max-w-xs">
      <Loader2 size={12} className="animate-spin" /> Loading preview...
    </div>
  );
  if (!data || !data.title) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="mt-2 flex gap-3 border border-border hover:border-primary/40 rounded-sm overflow-hidden bg-zinc-900/60 max-w-sm transition-colors group">
      {data.image && (
        <img src={data.image} alt="" className="w-20 h-20 object-cover flex-shrink-0" onError={e => (e.currentTarget.style.display = "none")} />
      )}
      <div className="p-2 min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">{data.title}</p>
        {data.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">{data.description}</p>}
        <p className="text-xs text-muted-foreground/60 mt-1">{data.siteName || data.domain}</p>
      </div>
    </a>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState("general");

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Crown size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>Members Only</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">Sign in or create an account to access the community.</p>
        <div className="flex gap-3">
          <Link href="/login"><Button variant="outline">Sign in</Button></Link>
          <Link href="/register"><Button className="bg-red-700 hover:bg-red-600 text-white">Join</Button></Link>
        </div>
      </div>
    );
  }

  if (!user.isMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Crown size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
          Members Community
        </h2>
        <p className="text-muted-foreground mb-2 max-w-sm">
          Private channels, @mentions, and link sharing — no algorithms, no censorship.
        </p>
        <p className="text-3xl font-black text-white mb-6">£5 <span className="text-zinc-400 text-base font-normal">/ month</span></p>
        <Link href="/membership">
          <Button size="lg" className="bg-red-700 hover:bg-red-600 text-white font-bold gap-2" data-testid="button-upgrade-community">
            <Crown size={18} /> Join Now
          </Button>
        </Link>
      </div>
    );
  }

  return <CommunityUI user={user} activeChannel={activeChannel} setActiveChannel={setActiveChannel} />;
}

function CommunityUI({ user, activeChannel, setActiveChannel }: {
  user: any; activeChannel: string; setActiveChannel: (c: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null); // base64 data URL
  const [membersOpen, setMembersOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: membersList = [] } = useQuery<MemberSummary[]>({
    queryKey: ["/api/community/members"],
    queryFn: async () => {
      const res = await fetch("/api/community/members", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  const { data: messages = [], isLoading } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/messages", activeChannel],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${activeChannel}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "new_message" && data.message.channel === activeChannel) {
          qc.setQueryData(["/api/messages", activeChannel], (old: MessageWithUser[] = []) => {
            if (old.some(m => m.id === data.message.id)) return old;
            return [...old, data.message];
          });
        }
      };
    } catch {}
    return () => { try { ws?.close(); } catch {} };
  }, [activeChannel]);

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
    },
  });

  const handleSend = () => {
    if (sendMutation.isPending) return;
    if (pendingImage) {
      sendMutation.mutate(pendingImage);
      return;
    }
    const text = draft.trim();
    if (!text) return;
    sendMutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertMention = (username: string) => {
    setDraft(d => d + `@${username} `);
    textareaRef.current?.focus();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_CHAT_IMAGE_BYTES) {
      alert("Image too large. Max 2MB for chat images.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
    // reset input so same file can be selected again
    e.target.value = "";
  };

  const channelUsers = Array.from(new Map(messages.map(m => [m.user.id, m.user])).values());

  return (
    <div className="flex" style={{ height: "calc(100vh - 4rem)" }}>
      {/* ─── CHANNEL SIDEBAR ────────────────────────────────────────────── */}
      <aside className="hidden sm:flex w-52 flex-shrink-0 flex-col bg-zinc-950 border-r border-border">
        <div className="px-3 py-4 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">DinoBane</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Users size={10} className="text-green-400" />
            <span className="text-green-400">{channelUsers.length}</span> online
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Channels */}
          <p className="px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Channels</p>
          {CHANNELS.map(ch => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md mx-1 transition-colors",
                activeChannel === ch.id
                  ? "bg-red-900/30 text-red-400 font-semibold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              data-testid={`button-channel-${ch.id}`}
            >
              <ch.icon size={14} />
              {ch.label}
            </button>
          ))}

          {/* ── Members collapsible ── */}
          <div className="mt-4 px-1">
            {/* Toggle header */}
            <button
              onClick={() => setMembersOpen(o => !o)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-zinc-800/60 transition-colors group"
              data-testid="button-toggle-members"
            >
              {/* Gold star */}
              <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
              {/* Label */}
              <span className="flex-1 text-xs font-bold uppercase tracking-widest text-yellow-400 text-left">
                Members
              </span>
              {/* Count badge */}
              <span className="text-xs text-yellow-500/70 font-mono mr-1">{membersList.length}</span>
              {/* Chevron — rotates when open */}
              <ChevronDown
                size={13}
                className={cn(
                  "text-yellow-400/70 shrink-0 transition-transform duration-200",
                  membersOpen ? "rotate-0" : "-rotate-90"
                )}
              />
            </button>

            {/* Expanded list */}
            {membersOpen && (
              <div className="mt-1 pl-2 space-y-0.5">
                {membersList.map(m => (
                  <button
                    key={m.id}
                    onClick={() => insertMention(m.username)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-zinc-800/60 transition-colors group/member text-left"
                    title={`Click to @mention ${m.username}`}
                    data-testid={`button-member-${m.id}`}
                  >
                    {/* Mini avatar */}
                    <div
                      className="h-5 w-5 rounded-full flex items-center justify-center text-white shrink-0 overflow-hidden"
                      style={{ background: m.avatarColor, fontSize: 8, fontWeight: 700 }}
                    >
                      {m.avatarUrl
                        ? <img src={m.avatarUrl} alt={m.displayName} className="w-full h-full object-cover" />
                        : m.avatarInitials
                      }
                    </div>
                    <span className="text-xs text-zinc-400 group-hover/member:text-zinc-200 transition-colors truncate">
                      @{m.username}
                    </span>
                  </button>
                ))}
                {membersList.length === 0 && (
                  <p className="text-xs text-zinc-600 px-2 py-1">No members yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Current user */}
        <div className="px-3 py-3 border-t border-border flex items-center gap-2">
          <Avatar className="h-7 w-7">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} className="object-cover" />}
            <AvatarFallback className="text-xs font-bold text-white" style={{ background: user.avatarColor }}>
              {user.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{user.displayName}</p>
            <p className="text-xs text-yellow-500 flex items-center gap-0.5"><Crown size={9} /> Member</p>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CHAT ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Channel header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-background flex-shrink-0">
          <Hash size={16} className="text-muted-foreground" />
          <span className="font-semibold text-sm text-white">{activeChannel}</span>

          <div className="ml-auto sm:hidden flex gap-1">
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  activeChannel === ch.id ? "bg-red-900/30 text-red-400" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                #{ch.label.split("-")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-0.5">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Hash size={32} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-semibold">#{activeChannel}</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to post in this channel.</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const prevMsg = messages[i - 1];
              const isGrouped = prevMsg && prevMsg.user.id === msg.user.id &&
                (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < 300000;
              const isImage = msg.content.startsWith("data:image/");
              const urls = !isImage ? extractUrls(msg.content) : [];

              return (
                <div key={msg.id} className={cn("flex gap-3 group px-2 py-1 rounded-md hover:bg-secondary/40 transition-colors", isGrouped ? "mt-0" : "mt-3")} data-testid={`message-${msg.id}`}>
                  {!isGrouped ? (
                    <button onClick={() => insertMention(msg.user.username)} className="flex-shrink-0 mt-0.5" title={`@${msg.user.username}`}>
                      <Avatar className="h-8 w-8">
                        {msg.user.avatarUrl && <AvatarImage src={msg.user.avatarUrl} alt={msg.user.displayName} className="object-cover" />}
                        <AvatarFallback className="text-xs font-bold text-white" style={{ background: msg.user.avatarColor }}>
                          {msg.user.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  ) : (
                    <div className="w-8 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    {!isGrouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <button onClick={() => insertMention(msg.user.username)} className="text-sm font-semibold text-foreground hover:text-red-400 transition-colors">
                          {msg.user.displayName}
                        </button>
                        <time className="text-xs text-muted-foreground/60">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </time>
                      </div>
                    )}
                    {!isImage && (
                      <p
                        className="text-sm text-zinc-300 leading-relaxed message-content break-words"
                        dangerouslySetInnerHTML={{ __html: renderMessageContent(msg.content) }}
                      />
                    )}
                    {isImage && (
                      <img
                        src={msg.content}
                        alt="Shared image"
                        className="max-w-xs max-h-60 rounded-sm border border-border mt-1 object-contain"
                      />
                    )}
                    {/* Link preview — show for first URL in text messages */}
                    {urls.length > 0 && <LinkPreviewCard url={urls[0]} />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="px-4 py-3 border-t border-border flex-shrink-0">
          {/* Pending image preview */}
          {pendingImage && (
            <div className="mb-2 relative inline-block">
              <img src={pendingImage} alt="Preview" className="max-h-24 max-w-xs rounded-sm border border-border object-contain" />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-1.5 -right-1.5 bg-red-700 text-white rounded-full p-0.5 hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            {/* Image upload button */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex-shrink-0 h-[42px] w-[42px] flex items-center justify-center border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors bg-secondary"
              title="Upload image (max 2MB)"
              type="button"
            >
              <Image size={16} />
            </button>

            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={pendingImage ? "Add a caption (optional)..." : `Message #${activeChannel} — use @username to mention`}
                className="resize-none bg-secondary border-border text-sm min-h-[42px] max-h-32"
                rows={1}
                disabled={false}
                data-testid="input-message"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={(!draft.trim() && !pendingImage) || sendMutation.isPending}
              size="icon"
              className="bg-red-700 hover:bg-red-600 text-white h-[42px] w-[42px] flex-shrink-0"
              data-testid="button-send-message"
            >
              {sendMutation.isPending
                ? <Loader2 size={16} className="animate-spin" />
                : <Send size={16} />
              }
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/40 mt-1.5">Enter to send · Shift+Enter for new line · 📎 to post an image (max 2MB)</p>
        </div>
      </div>
    </div>
  );
}
