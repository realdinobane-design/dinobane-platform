import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Flag, X } from "lucide-react";

interface ReportModalProps {
  reportedUserId: number;
  reportedUsername: string;
  contentType: "message" | "dm" | "user";
  contentId?: number;
  onClose: () => void;
}

const REASONS = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "spam", label: "Spam" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

export function ReportModal({ reportedUserId, reportedUsername, contentType, contentId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/report", {
      reportedUserId,
      contentType,
      contentId,
      reason,
      details,
    }),
    onSuccess: () => setSubmitted(true),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-[#111] border border-[#222] rounded-sm w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-[#cc2a2a]" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Report User</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <p className="text-green-400 font-bold mb-2">Report submitted</p>
            <p className="text-zinc-400 text-sm">Thank you. Our moderation team will review this.</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-[#1a1a1a] text-white text-sm rounded hover:bg-[#222] transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="text-zinc-400 text-sm mb-5">
              Reporting <span className="text-white font-semibold">@{reportedUsername}</span>
            </p>

            <div className="space-y-3 mb-5">
              {REASONS.map(r => (
                <label key={r.value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-[#cc2a2a]"
                  />
                  <span className={`text-sm transition-colors ${reason === r.value ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                    {r.label}
                  </span>
                </label>
              ))}
            </div>

            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
              className="w-full bg-[#0a0a0a] border border-[#222] rounded text-sm text-white placeholder-zinc-600 px-3 py-2 resize-none focus:outline-none focus:border-[#cc2a2a]/50 mb-5"
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-[#1a1a1a] text-zinc-400 text-sm rounded hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={!reason || mutation.isPending}
                className="flex-1 py-2 bg-[#cc2a2a] text-white text-sm font-bold rounded hover:bg-[#aa2020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
