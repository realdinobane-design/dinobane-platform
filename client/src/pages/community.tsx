import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Crown, Hash, Send, Users, Loader2 } from "lucide-react";
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
    username: string;
  };
}

const CHANNELS = [
  { id: "general", label: "general", icon: Hash },
  { id: "news-links", label: "news-links", icon: Hash },
  { id: "video-discussion", label: "video-discussion", icon: Hash },
  { id: "off-topic", label: "off-topic", icon: Hash },
];

function renderMessageContent(content: string): string {
  // Linkify URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  // @mention highlight
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;

  return content
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(mentionRegex, '<span class="mention">@$1</span>');
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState("general");
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Guard — members only
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Crown size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>Members Only</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">Sign in or create an account to access the community.</p>
        <div className="flex gap-3">
          <Link href="/login"><Button variant="outline">Sign in</Button></Link>
          <Link href="/register"><Button className="bg-red-700 hover:bg-red-600 text-white">Join Free</Button></Link>
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [], isLoading } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/messages", activeChannel],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${activeChannel}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket live updates
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
    },
  });

  const handleSend = () => {
    const text = draft.trim();
    if (!text || sendMutation.isPending) return;
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

  // Unique users in this channel
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
        </div>

        {/* Current user */}
        <div className="px-3 py-3 border-t border-border flex items-center gap-2">
          <Avatar className="h-7 w-7">
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

          {/* Mobile channel switcher */}
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

              return (
                <div key={msg.id} className={cn("flex gap-3 group px-2 py-1 rounded-md hover:bg-secondary/40 transition-colors", isGrouped ? "mt-0" : "mt-3")} data-testid={`message-${msg.id}`}>
                  {!isGrouped ? (
                    <button
                      onClick={() => insertMention(msg.user.username)}
                      className="flex-shrink-0 mt-0.5"
                      title={`@${msg.user.username}`}
                    >
                      <Avatar className="h-8 w-8">
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
                        <button
                          onClick={() => insertMention(msg.user.username)}
                          className="text-sm font-semibold text-foreground hover:text-red-400 transition-colors"
                        >
                          {msg.user.displayName}
                        </button>
                        <time className="text-xs text-muted-foreground/60">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </time>
                      </div>
                    )}
                    <p
                      className="text-sm text-zinc-300 leading-relaxed message-content break-words"
                      dangerouslySetInnerHTML={{ __html: renderMessageContent(msg.content) }}
                    />
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="px-4 py-3 border-t border-border flex-shrink-0">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message #${activeChannel} — use @username to mention`}
                className="resize-none bg-secondary border-border text-sm min-h-[42px] max-h-32 pr-10"
                rows={1}
                data-testid="input-message"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!draft.trim() || sendMutation.isPending}
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
          <p className="text-xs text-muted-foreground/40 mt-1.5">Enter to send · Shift+Enter for new line · Click avatar to @mention</p>
        </div>
      </div>
    </div>
  );
}
