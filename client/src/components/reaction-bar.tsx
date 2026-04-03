import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SmilePlus } from "lucide-react";

const EMOJIS = ["👍", "🔥", "😂", "😡", "😮", "❤️", "👏", "🏴‍☠️"];

interface Reaction {
  id: number;
  userId: number;
  emoji: string;
  messageId?: number | null;
  dmId?: number | null;
}

interface ReactionBarProps {
  messageId?: number;   // community message
  dmId?: number;        // DM message
  currentUserId?: number;
}

export function ReactionBar({ messageId, dmId, currentUserId }: ReactionBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const qc = useQueryClient();

  const queryKey = messageId !== undefined
    ? ["/api/reactions", "message", messageId]
    : ["/api/reactions", "dm", dmId];

  const queryParam = messageId !== undefined
    ? `messageId=${messageId}`
    : `dmId=${dmId}`;

  const { data: reactions = [] } = useQuery<Reaction[]>({
    queryKey,
    queryFn: () => apiRequest("GET", `/api/reactions?${queryParam}`).then(r => r.json()),
    enabled: messageId !== undefined || dmId !== undefined,
    staleTime: 10000,
  });

  const toggleMutation = useMutation({
    mutationFn: (emoji: string) =>
      apiRequest("POST", "/api/reactions", {
        emoji,
        ...(messageId !== undefined ? { messageId } : { dmId }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setPickerOpen(false);
    },
  });

  // Group reactions by emoji
  const grouped = EMOJIS.reduce<Record<string, { count: number; mine: boolean }>>(
    (acc, emoji) => {
      const matching = reactions.filter(r => r.emoji === emoji);
      if (matching.length > 0) {
        acc[emoji] = {
          count: matching.length,
          mine: matching.some(r => r.userId === currentUserId),
        };
      }
      return acc;
    },
    {}
  );

  return (
    <div className="flex items-center flex-wrap gap-1 mt-1.5 relative">
      {/* Existing reaction counts */}
      {Object.entries(grouped).map(([emoji, { count, mine }]) => (
        <button
          key={emoji}
          onClick={() => currentUserId && toggleMutation.mutate(emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
            mine
              ? "bg-[#cc2a2a]/15 border-[#cc2a2a]/40 text-white"
              : "bg-[#1a1a1a] border-[#252525] text-[#888] hover:border-[#444] hover:text-white"
          }`}
          title={mine ? "Remove reaction" : "Add reaction"}
        >
          <span>{emoji}</span>
          <span className="font-semibold leading-none">{count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      {currentUserId && (
        <div className="relative">
          <button
            onClick={() => setPickerOpen(p => !p)}
            className="flex items-center justify-center w-6 h-6 rounded-full border border-[#252525] text-[#555] hover:text-[#888] hover:border-[#444] transition-colors"
            title="Add reaction"
          >
            <SmilePlus size={12} />
          </button>

          {/* Emoji picker */}
          {pickerOpen && (
            <>
              {/* Click outside to close */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setPickerOpen(false)}
              />
              <div className="absolute bottom-8 left-0 z-40 bg-[#111] border border-[#2a2a2a] rounded-lg p-2 shadow-2xl shadow-black/50 flex gap-1 flex-wrap w-[180px]">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => toggleMutation.mutate(emoji)}
                    className="text-lg w-9 h-9 flex items-center justify-center rounded-md hover:bg-[#222] transition-colors"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
