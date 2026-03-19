import { useState } from "react";
import { useAuth } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Crown, Lock, Search, Users, MessageSquare, AtSign,
  Hash, ChevronRight, X, Calendar, Loader2, ArrowLeft,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);

interface MemberUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  isMember: boolean;
  memberSince: string | null;
  createdAt: string;
  avatarInitials: string;
  avatarColor: string;
  avatarUrl?: string | null;
  stripeCustomerId: string | null;
}

interface MemberProfile {
  user: MemberUser;
  messages: {
    id: number;
    channel: string;
    content: string;
    createdAt: string;
    userId: number;
    user: {
      id: number;
      displayName: string;
      avatarInitials: string;
      avatarColor: string;
      avatarUrl?: string | null;
      username: string;
    };
  }[];
  mentionCount: number;
}

export default function MembersPage() {
  const { user } = useAuth();

  if (!user || !ADMIN_EMAILS.has(user.email)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lock size={40} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Access restricted.</p>
      </div>
    );
  }

  return <MembersInner />;
}

function MembersInner() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: allUsers = [], isLoading } = useQuery<MemberUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    },
    staleTime: 30_000,
  });

  const members = allUsers.filter(u => u.isMember);

  const filtered = members.filter(u =>
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-black text-white uppercase tracking-tight"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            Members
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {members.length} paid {members.length === 1 ? "member" : "members"} — click any row to view their profile.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-yellow-500 bg-yellow-950/30 border border-yellow-800/30 rounded-sm px-3 py-2">
          <Crown size={12} /> {members.length} active
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, username or email…"
          className="pl-8 bg-secondary border-border text-sm"
          data-testid="input-member-search"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-16">
          <Loader2 size={16} className="animate-spin" /> Loading members…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-sm">
          <Users size={28} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search ? "No members match your search." : "No paid members yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((member, i) => (
            <MemberRow
              key={member.id}
              member={member}
              index={i + 1}
              isSelected={selectedId === member.id}
              onClick={() => setSelectedId(selectedId === member.id ? null : member.id)}
            />
          ))}
        </div>
      )}

      {/* Profile slide-over panel */}
      {selectedId !== null && (
        <MemberProfilePanel
          userId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function MemberRow({
  member,
  index,
  isSelected,
  onClick,
}: {
  member: MemberUser;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const daysMember = member.memberSince
    ? Math.floor((Date.now() - new Date(member.memberSince).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left bg-card border rounded-sm px-4 py-3 flex items-center gap-4 transition-all hover:border-primary/40 hover:bg-card/80 group",
        isSelected ? "border-primary/60 bg-red-950/10" : "border-border"
      )}
      data-testid={`member-row-${member.id}`}
    >
      {/* Index */}
      <span className="text-xs text-muted-foreground/40 font-mono w-5 shrink-0 text-right">{index}</span>

      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
        {member.avatarUrl && (
          <AvatarImage src={member.avatarUrl} alt={member.displayName} className="object-cover" />
        )}
        <AvatarFallback
          className="text-sm font-black text-white"
          style={{ background: member.avatarColor }}
        >
          {member.avatarInitials}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white truncate">{member.displayName}</span>
          <span className="text-xs text-muted-foreground">@{member.username}</span>
          <span className="flex items-center gap-0.5 text-xs text-yellow-500 font-semibold">
            <Crown size={9} /> Member
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{member.email}</p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        {member.memberSince && (
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {daysMember !== null ? `${daysMember}d` : "—"}
          </span>
        )}
        <span className="text-muted-foreground/40">
          Joined {format(new Date(member.createdAt), "d MMM yyyy")}
        </span>
      </div>

      {/* Chevron */}
      <ChevronRight
        size={14}
        className={cn(
          "text-muted-foreground/40 shrink-0 transition-transform",
          isSelected ? "rotate-90 text-primary/60" : "group-hover:text-muted-foreground"
        )}
      />
    </button>
  );
}

function MemberProfilePanel({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery<MemberProfile>({
    queryKey: ["/api/admin/users", userId, "profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/users/${userId}/profile`);
      return res.json();
    },
    staleTime: 30_000,
  });

  const memberSinceDate = data?.user.memberSince
    ? format(new Date(data.user.memberSince), "d MMM yyyy")
    : null;
  const daysMember = data?.user.memberSince
    ? Math.floor((Date.now() - new Date(data.user.memberSince).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-background border-l border-border z-50 overflow-y-auto flex flex-col shadow-2xl">
        {/* Panel header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-muted-foreground" />
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Member Profile
            </span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            data-testid="button-close-profile"
          >
            <X size={16} />
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center flex-1 py-16 gap-2 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" /> Loading profile…
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center flex-1 py-16">
            <p className="text-sm text-red-400">Failed to load profile.</p>
          </div>
        )}

        {data && (
          <div className="flex-1 px-5 py-6 space-y-6">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 shrink-0 ring-2 ring-primary/20">
                {data.user.avatarUrl && (
                  <AvatarImage
                    src={data.user.avatarUrl}
                    alt={data.user.displayName}
                    className="object-cover"
                  />
                )}
                <AvatarFallback
                  className="text-2xl font-black text-white"
                  style={{ background: data.user.avatarColor }}
                >
                  {data.user.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2
                  className="text-lg font-black text-white leading-tight"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  {data.user.displayName}
                </h2>
                <p className="text-sm text-muted-foreground">@{data.user.username}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{data.user.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {data.user.isMember && (
                    <span className="flex items-center gap-1 text-xs text-yellow-500 font-semibold bg-yellow-950/30 border border-yellow-800/30 px-2 py-0.5 rounded-sm">
                      <Crown size={9} /> Member{memberSinceDate ? ` since ${memberSinceDate}` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Messages"
                value={data.messages.length}
                icon={MessageSquare}
              />
              <StatCard
                label="@Mentions"
                value={data.mentionCount}
                icon={AtSign}
              />
              <StatCard
                label="Days as member"
                value={daysMember ?? "—"}
                icon={Crown}
                accent
              />
            </div>

            {/* Account details */}
            <div className="bg-card border border-border rounded-sm divide-y divide-border">
              <DetailRow label="Username" value={`@${data.user.username}`} />
              <DetailRow label="Email" value={data.user.email} />
              <DetailRow
                label="Joined"
                value={format(new Date(data.user.createdAt), "d MMMM yyyy")}
              />
              {memberSinceDate && (
                <DetailRow label="Member since" value={memberSinceDate} />
              )}
              <DetailRow
                label="Stripe customer"
                value={data.user.stripeCustomerId ?? "None"}
                mono
              />
            </div>

            {/* Message history */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <MessageSquare size={11} /> Recent messages ({data.messages.length})
              </h3>
              {data.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {data.messages.map(msg => (
                    <div
                      key={msg.id}
                      className="bg-secondary/40 border border-border rounded-sm px-3 py-2.5 text-sm"
                      data-testid={`profile-msg-${msg.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Hash size={10} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">{msg.channel}</span>
                        <time className="text-xs text-muted-foreground/50 ml-auto">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </time>
                      </div>
                      {msg.content.startsWith("data:image/") ? (
                        <img
                          src={msg.content}
                          alt="Image"
                          className="max-w-xs max-h-32 rounded-sm border border-border object-contain mt-1"
                        />
                      ) : (
                        <p className="text-foreground/80 leading-relaxed break-words line-clamp-4">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: number | string;
  icon: any;
  accent?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-sm px-3 py-3 text-center">
      <Icon
        size={13}
        className={cn("mx-auto mb-1.5", accent ? "text-yellow-500" : "text-muted-foreground")}
      />
      <p className={cn("text-xl font-black leading-none", accent ? "text-yellow-400" : "text-white")}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-xs text-right break-all", mono ? "font-mono text-muted-foreground" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}
