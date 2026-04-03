import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Send, Loader2, MessageSquare, Check, CheckCheck } from "lucide-react";
import { ReactionBar } from "./reaction-bar";
import { formatDistanceToNow } from "date-fns";

interface DmUser {
  id: number;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  avatarInitials: string;
  avatarColor: string;
}

interface DmMessage {
  id: number;
  fromId: number;
  toId: number;
  content: string;
  readAt: string | null;
  createdAt: string;
  from: DmUser;
  to: DmUser;
}

interface DmChatProps {
  currentUser: DmUser;
  partner: DmUser;
  onClose: () => void;
}

export function DmChat({ currentUser, partner, onClose }: DmChatProps) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], isLoading } = useQuery<DmMessage[]>({
    queryKey: ["/api/dm", partner.id],
    queryFn: () => apiRequest("GET", `/api/dm/${partner.id}`).then(r => r.json()),
    refetchInterval: 5000,
    staleTime: 0,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", `/api/dm/${partner.id}`, { content }).then(r => r.json()),
    onSuccess: (newMsg) => {
      qc.setQueryData(["/api/dm", partner.id], (old: DmMessage[] = []) => [...old, newMsg]);
      qc.invalidateQueries({ queryKey: ["/api/dm/unread/count"] });
      setText("");
      inputRef.current?.focus();
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Invalidate unread count when chat opens
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["/api/dm/unread/count"] });
  }, []);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="fixed bottom-0 right-0 md:bottom-4 md:right-4 z-50 flex flex-col w-full md:w-[340px] max-h-[70vh] md:max-h-[520px] bg-[#0f0f0f] border-t md:border border-[#2a2a2a] md:rounded-sm shadow-2xl shadow-black/60"
      style={{ fontFamily: "Satoshi, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1f1f1f] bg-[#111] rounded-t-sm shrink-0">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white overflow-hidden"
          style={{ background: partner.avatarColor }}
        >
          {partner.avatarUrl
            ? <img src={partner.avatarUrl} alt="" className="w-full h-full object-cover" />
            : partner.avatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate leading-none">{partner.displayName}</p>
          <p className="text-[#555] text-xs mt-0.5">@{partner.username}</p>
        </div>
        <button
          onClick={onClose}
          className="text-[#555] hover:text-white transition-colors p-1 rounded shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#555]" />
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageSquare className="w-8 h-8 text-[#333] mb-2" />
            <p className="text-[#444] text-sm">No messages yet.</p>
            <p className="text-[#333] text-xs mt-1">Start the conversation.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.fromId === currentUser.id;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded px-3 py-2 text-sm leading-relaxed break-words ${
                  isMe
                    ? "bg-[#cc2a2a] text-white"
                    : "bg-[#1a1a1a] border border-[#252525] text-[#d0d0d0]"
                }`}
              >
                {msg.content}
              </div>
              <ReactionBar dmId={msg.id} currentUserId={currentUser.id} />
              <div className="flex items-center gap-1 mt-0.5 px-1">
                <time className="text-[10px] text-[#444]">
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </time>
                {/* Read receipt — only show on sender's messages */}
                {isMe && (
                  msg.readAt
                    ? <CheckCheck size={11} className="text-[#4ade80]" title={`Read ${formatDistanceToNow(new Date(msg.readAt), { addSuffix: true })}`} />
                    : <Check size={11} className="text-[#444]" title="Delivered" />
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-[#1f1f1f] bg-[#0f0f0f] shrink-0 rounded-b-sm">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${partner.displayName}...`}
          className="flex-1 bg-[#1a1a1a] border border-[#252525] text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-[#cc2a2a] placeholder:text-[#444] transition-colors"
          maxLength={2000}
          autoFocus
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
          className="bg-[#cc2a2a] hover:bg-[#b52020] disabled:bg-[#2a2a2a] disabled:text-[#444] text-white p-2 rounded transition-colors shrink-0"
        >
          {sendMutation.isPending
            ? <Loader2 size={16} className="animate-spin" />
            : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
