import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Mail, Clock, Users, Zap, CheckCircle2, AlertCircle,
  Send, Play, ChevronDown, ChevronUp, CalendarDays,
  RefreshCw, ShieldAlert, Settings,
} from "lucide-react";
import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface EmailConfig {
  id: string;
  name: string;
  description: string;
  trigger: string;
  schedule: string | null;
  nextSend: string | null;
  recipients: string;
  recipientCount: number | null;
  subject: string;
  canTestSend: boolean;
  canManualTrigger: boolean;
  sendTimeUtc?: string;
  sendTimeBkk?: string;
}

interface EmailsConfigResponse {
  emails: EmailConfig[];
  stats: {
    memberCount: number;
    resendConfigured: boolean;
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  welcome:          <Zap size={14} className="text-green-400" />,
  newsletter:       <CalendarDays size={14} className="text-blue-400" />,
  mention:          <Mail size={14} className="text-purple-400" />,
  "password-reset": <ShieldAlert size={14} className="text-yellow-400" />,
  "admin-new-member": <Users size={14} className="text-red-400" />,
};

const ACCENT_COLORS: Record<string, string> = {
  welcome:            "#22c55e",
  newsletter:         "#3b82f6",
  mention:            "#a855f7",
  "password-reset":   "#eab308",
  "admin-new-member": "#cc2a2a",
};

// ─── EMAIL CARD ───────────────────────────────────────────────────────────────
function EmailCard({
  email,
  onTestSend,
  onTrigger,
  onScheduleChange,
  isSending,
  isTriggering,
  isScheduling,
}: {
  email: EmailConfig;
  onTestSend: (id: string) => void;
  onTrigger: (id: string) => void;
  onScheduleChange: (timeBkk: string) => void;
  isSending: boolean;
  isTriggering: boolean;
  isScheduling: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [newTimeBkk, setNewTimeBkk] = useState(email.sendTimeBkk || "14:00");
  const accent = ACCENT_COLORS[email.id] || "#cc2a2a";

  return (
    <div
      className="bg-[#111] border border-[#1e1e1e] rounded-sm overflow-hidden"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      {/* Header row */}
      <button
        className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-[#161616] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="shrink-0">{TRIGGER_ICONS[email.id]}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="font-black text-white text-base"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              {email.name}
            </span>
            {email.schedule && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm bg-blue-900/30 text-blue-400 border border-blue-800/40 uppercase tracking-widest">
                Scheduled
              </span>
            )}
            {!email.schedule && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm bg-green-900/30 text-green-400 border border-green-800/40 uppercase tracking-widest">
                Auto
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{email.description}</p>
        </div>

        {/* Next send countdown */}
        {email.nextSend && (
          <div className="hidden sm:flex flex-col items-end shrink-0 mr-2">
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Next send</span>
            <span className="text-xs font-bold text-zinc-300">
              {formatDistanceToNow(new Date(email.nextSend), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Recipient count badge */}
        {email.recipientCount !== null && (
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <Users size={12} className="text-zinc-600" />
            <span className="text-xs text-zinc-400">{email.recipientCount}</span>
          </div>
        )}

        {expanded ? <ChevronUp size={14} className="text-zinc-600 shrink-0" /> : <ChevronDown size={14} className="text-zinc-600 shrink-0" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#1a1a1a] px-6 py-5 space-y-5">

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-1">Trigger</p>
              <p className="text-sm text-zinc-300">{email.trigger}</p>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-1">Recipients</p>
              <p className="text-sm text-zinc-300">
                {email.recipients}
                {email.recipientCount !== null && (
                  <span className="ml-2 text-zinc-500">({email.recipientCount} current)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-1">Subject Line</p>
              <p className="text-sm text-zinc-300 font-mono bg-[#0d0d0d] px-3 py-2 rounded-sm border border-[#1a1a1a]">
                {email.subject}
              </p>
            </div>
            {email.nextSend && (
              <div>
                <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-1">Next Scheduled Send</p>
                <p className="text-sm text-zinc-300">
                  {format(new Date(email.nextSend), "EEEE d MMMM yyyy 'at' HH:mm")} GMT
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  = {format(new Date(new Date(email.nextSend).getTime() + 7 * 60 * 60 * 1000), "EEEE d MMMM yyyy 'at' HH:mm")} Bangkok
                </p>
              </div>
            )}
          </div>

          {/* Intel-specific: send time editor */}
          {email.id === "intel-briefing" && (
            <div className="pt-3 border-t border-[#1a1a1a]">
              <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-3">Daily Send Time (Bangkok)</p>
              {!editingTime ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0d0d0d] border border-[#2a2a2a] rounded-sm">
                    <Clock size={13} className="text-[#f0c800]" />
                    <span className="text-sm font-black text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                      {email.sendTimeBkk || "14:00"}
                    </span>
                    <span className="text-xs text-zinc-500 ml-1">Bangkok daily</span>
                  </div>
                  <button
                    onClick={() => { setNewTimeBkk(email.sendTimeBkk || "14:00"); setEditingTime(true); }}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-sm bg-[#1a1a1a] border border-[#2a2a2a] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                  >
                    <Settings size={11} />
                    Change Time
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={newTimeBkk}
                      onChange={e => setNewTimeBkk(e.target.value)}
                      className="bg-[#0d0d0d] border border-[#cc2a2a]/40 text-white text-sm font-bold px-3 py-2 rounded-sm focus:outline-none focus:border-[#cc2a2a]"
                    />
                    <span className="text-xs text-zinc-500">Bangkok time</span>
                  </div>
                  <button
                    onClick={() => { onScheduleChange(newTimeBkk); setEditingTime(false); }}
                    disabled={isScheduling}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-sm bg-[#cc2a2a]/10 border border-[#cc2a2a]/30 text-red-400 hover:bg-[#cc2a2a]/20 transition-colors disabled:opacity-50"
                  >
                    {isScheduling ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                    Save
                  </button>
                  <button
                    onClick={() => setEditingTime(false)}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-1 border-t border-[#1a1a1a]">
            {email.canTestSend && (
              <button
                onClick={() => onTestSend(email.id)}
                disabled={isSending}
                className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-sm bg-[#1a1a1a] border border-[#2a2a2a] text-zinc-300 hover:text-white hover:border-[#cc2a2a]/50 transition-colors disabled:opacity-50"
              >
                {isSending ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                Send Test to My Email
              </button>
            )}
            {email.canManualTrigger && (
              <button
                onClick={() => onTrigger(email.id)}
                disabled={isTriggering}
                className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-sm bg-[#cc2a2a]/10 border border-[#cc2a2a]/30 text-red-400 hover:bg-[#cc2a2a]/20 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {isTriggering ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Play size={12} />
                )}
                {email.id === "intel-briefing" ? "Send to All Members Now" : "Send to All Members Now"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminEmailsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);
  if (!user || !ADMIN_EMAILS.has(user.email)) {
    navigate("/");
    return null;
  }

  const { data, isLoading } = useQuery<EmailsConfigResponse>({
    queryKey: ["/api/admin/emails/config"],
    staleTime: 60_000,
  });

  const [sendingId, setSendingId] = useState<string | null>(null);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [schedulingIntel, setSchedulingIntel] = useState(false);

  const testSendMutation = useMutation({
    mutationFn: async (emailId: string) => {
      setSendingId(emailId);
      const res = await apiRequest("POST", "/api/admin/emails/test-send", { emailId });
      return res.json();
    },
    onSuccess: (data) => {
      setSendingId(null);
      toast({
        title: "Test email sent",
        description: `Sent to ${data.sentTo}. Check your inbox.`,
      });
    },
    onError: (e: any) => {
      setSendingId(null);
      toast({ title: "Failed to send test", description: e.message, variant: "destructive" });
    },
  });

  const triggerMutation = useMutation({
    mutationFn: async (emailId: string) => {
      setTriggeringId(emailId);
      const endpoint = emailId === "intel-briefing"
        ? "/api/admin/emails/trigger-intel"
        : "/api/admin/emails/trigger-newsletter";
      const res = await apiRequest("POST", endpoint, {});
      return res.json();
    },
    onSuccess: (_data, emailId) => {
      setTriggeringId(null);
      qc.invalidateQueries({ queryKey: ["/api/admin/emails/config"] });
      toast({
        title: emailId === "intel-briefing" ? "Intel Briefing dispatched" : "Newsletter dispatched",
        description: "Sent to all paid members right now.",
      });
    },
    onError: (e: any) => {
      setTriggeringId(null);
      toast({ title: "Failed to trigger", description: e.message, variant: "destructive" });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (timeBkk: string) => {
      setSchedulingIntel(true);
      const res = await apiRequest("POST", "/api/admin/emails/intel-schedule", { timeBkk });
      return res.json();
    },
    onSuccess: (data) => {
      setSchedulingIntel(false);
      qc.invalidateQueries({ queryKey: ["/api/admin/emails/config"] });
      toast({
        title: "Send time updated",
        description: `Intel briefing will now go out daily at ${data.timeBkk} Bangkok time.`,
      });
    },
    onError: (e: any) => {
      setSchedulingIntel(false);
      toast({ title: "Failed to update schedule", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-sm bg-red-900/20">
            <Mail size={20} className="text-[#cc2a2a]" />
          </div>
          <h1
            className="text-3xl font-black text-white"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            Email Control Centre
          </h1>
        </div>
        <p className="text-zinc-500 text-sm ml-12">
          All automated emails, their schedules, and send controls. Click any row to expand.
        </p>
      </div>

      {/* Stats bar */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-sm px-4 py-3">
            <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-1">Email Types</p>
            <p className="text-2xl font-black text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              {data.emails.length}
            </p>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-sm px-4 py-3">
            <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-1">Paid Members</p>
            <p className="text-2xl font-black text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              {data.stats.memberCount}
            </p>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-sm px-4 py-3">
            <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-1">Newsletter List</p>
            <p className="text-2xl font-black text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              {data.stats.memberCount}
            </p>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-sm px-4 py-3 flex items-center gap-3">
            <div>
              <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-1">Resend API</p>
              <div className="flex items-center gap-1.5">
                {data.stats.resendConfigured ? (
                  <>
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span className="text-sm font-bold text-green-400">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} className="text-red-400" />
                    <span className="text-sm font-bold text-red-400">Not set</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule banners */}
      <div className="mb-6 space-y-3">
        {data?.emails.find(e => e.id === "newsletter")?.nextSend && (
          <div className="flex items-center gap-3 p-4 bg-blue-900/10 border border-blue-800/30 rounded-sm">
            <Clock size={16} className="text-blue-400 shrink-0" />
            <div>
              <span className="text-sm font-bold text-white">Next newsletter: </span>
              <span className="text-sm text-zinc-300">
                {format(new Date(data.emails.find(e => e.id === "newsletter")!.nextSend!), "EEEE d MMMM yyyy")}
                {" at "}
                <span className="text-blue-400 font-bold">9:00 AM Bangkok</span>
                {" — "}
                {formatDistanceToNow(new Date(data.emails.find(e => e.id === "newsletter")!.nextSend!), { addSuffix: true })}
              </span>
            </div>
          </div>
        )}
        {data?.emails.find(e => e.id === "intel-briefing")?.nextSend && (
          <div className="flex items-center gap-3 p-4 bg-[#1a1400]/60 border border-[#f0c800]/20 rounded-sm">
            <Clock size={16} className="text-[#f0c800] shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-bold text-white">Next intel briefing: </span>
              <span className="text-sm text-zinc-300">
                {format(new Date(data.emails.find(e => e.id === "intel-briefing")!.nextSend!), "EEEE d MMMM yyyy")}
                {" at "}
                <span className="text-[#f0c800] font-bold">
                  {data.emails.find(e => e.id === "intel-briefing")!.sendTimeBkk} Bangkok
                </span>
                {" — "}
                {formatDistanceToNow(new Date(data.emails.find(e => e.id === "intel-briefing")!.nextSend!), { addSuffix: true })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Email list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[#111] border border-[#1e1e1e] rounded-sm animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.emails ?? []).map(email => (
            <EmailCard
              key={email.id}
              email={email}
              onTestSend={id => testSendMutation.mutate(id)}
              onTrigger={id => triggerMutation.mutate(id)}
              onScheduleChange={timeBkk => scheduleMutation.mutate(timeBkk)}
              isSending={sendingId === email.id && testSendMutation.isPending}
              isTriggering={triggeringId === email.id && triggerMutation.isPending}
              isScheduling={schedulingIntel && scheduleMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Help note */}
      <div className="mt-8 p-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-sm">
        <p className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-2">How test sends work</p>
        <p className="text-sm text-zinc-500 leading-relaxed">
          "Send Test to My Email" delivers a sample of that email directly to <span className="text-zinc-300">realdinobane@gmail.com</span>.
          For the newsletter test, it uses your most recent videos so you can see exactly how it looks.
          "Send to All Members Now" fires the real newsletter immediately to all {data?.stats.memberCount ?? 0} paid members — use carefully.
        </p>
      </div>
    </div>
  );
}
