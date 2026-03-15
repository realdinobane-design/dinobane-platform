import { useState } from "react";
import { useAuth } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, Trash2, ShieldOff, Loader2, Lock, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);

interface AdminUser {
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

type ConfirmAction =
  | { type: "cancel"; user: AdminUser }
  | { type: "delete"; user: AdminUser }
  | null;

export default function AdminUsersPage() {
  const { user } = useAuth();

  // Hard block — not admin
  if (!user || !ADMIN_EMAILS.has(user.email)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lock size={40} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Access restricted.</p>
      </div>
    );
  }

  return <AdminUsersInner />;
}

function AdminUsersInner() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<ConfirmAction>(null);

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
    staleTime: 0,
  });

  const cancelMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}/membership`, {});
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel membership");
      }
      return res.json();
    },
    onSuccess: (updated: AdminUser) => {
      qc.setQueryData<AdminUser[]>(["/api/admin/users"], (old = []) =>
        old.map(u => u.id === updated.id ? { ...u, isMember: false, memberSince: null } : u)
      );
      toast({ title: "Membership cancelled", description: `${updated.displayName}'s membership and billing have been cancelled.` });
      setConfirm(null);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setConfirm(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`, {});
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete account");
      }
      return res.json();
    },
    onSuccess: (_: any, userId: number) => {
      qc.setQueryData<AdminUser[]>(["/api/admin/users"], (old = []) =>
        old.filter(u => u.id !== userId)
      );
      toast({ title: "Account deleted", description: "The account has been permanently removed." });
      setConfirm(null);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setConfirm(null);
    },
  });

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const members = filtered.filter(u => u.isMember);
  const nonMembers = filtered.filter(u => !u.isMember);

  const isPending = cancelMutation.isPending || deleteMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-black text-white uppercase tracking-tight"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Admin only — cancel memberships and delete accounts.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-sm px-3 py-2">
          <Users size={13} />
          <span>{users.length} total</span>
          <span className="text-muted-foreground/40">·</span>
          <Crown size={11} className="text-yellow-500" />
          <span className="text-yellow-500">{users.filter(u => u.isMember).length} members</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, username or email…"
          className="pl-8 bg-secondary border-border text-sm"
          data-testid="input-admin-search"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading users…
        </div>
      ) : (
        <>
          {/* Paid members */}
          {members.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-yellow-500/80 mb-3 flex items-center gap-1.5">
                <Crown size={11} /> Paid Members ({members.length})
              </h2>
              <div className="space-y-2">
                {members.map(u => (
                  <UserRow
                    key={u.id}
                    user={u}
                    onCancel={() => setConfirm({ type: "cancel", user: u })}
                    onDelete={() => setConfirm({ type: "delete", user: u })}
                    isPending={isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Non-members */}
          {nonMembers.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-1.5">
                <Users size={11} /> Non-Members ({nonMembers.length})
              </h2>
              <div className="space-y-2">
                {nonMembers.map(u => (
                  <UserRow
                    key={u.id}
                    user={u}
                    onCancel={() => setConfirm({ type: "cancel", user: u })}
                    onDelete={() => setConfirm({ type: "delete", user: u })}
                    isPending={isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
          )}
        </>
      )}

      {/* Confirm: Cancel membership */}
      <AlertDialog open={confirm?.type === "cancel"} onOpenChange={open => { if (!open) setConfirm(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancel membership?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will immediately cancel{" "}
              <span className="text-white font-semibold">{confirm?.user.displayName}</span>'s Stripe
              subscription and remove their member access. Their account will remain but they won't be
              able to access members-only content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground" onClick={() => setConfirm(null)}>
              Keep membership
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 hover:bg-red-600 text-white gap-1.5"
              onClick={() => confirm && cancelMutation.mutate(confirm.user.id)}
              disabled={cancelMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {cancelMutation.isPending
                ? <Loader2 size={13} className="animate-spin" />
                : <ShieldOff size={13} />}
              Cancel membership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm: Delete account */}
      <AlertDialog open={confirm?.type === "delete"} onOpenChange={open => { if (!open) setConfirm(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete account permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete{" "}
              <span className="text-white font-semibold">{confirm?.user.displayName}</span>'s account
              and all their data. This cannot be undone.
              {confirm?.type === "delete" && confirm.user.isMember && (
                <span className="block mt-2 text-red-400 font-semibold">
                  ⚠ You must cancel their membership first before deleting their account.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground" onClick={() => setConfirm(null)}>
              Keep account
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 hover:bg-red-600 text-white gap-1.5"
              onClick={() => confirm && deleteMutation.mutate(confirm.user.id)}
              disabled={deleteMutation.isPending || (confirm?.type === "delete" && !!confirm.user.isMember)}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending
                ? <Loader2 size={13} className="animate-spin" />
                : <Trash2 size={13} />}
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserRow({
  user,
  onCancel,
  onDelete,
  isPending,
}: {
  user: AdminUser;
  onCancel: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className="bg-card border border-border rounded-sm px-4 py-3 flex items-center gap-3"
      data-testid={`user-row-${user.id}`}
    >
      <Avatar className="h-9 w-9 shrink-0">
        {user.avatarUrl && (
          <AvatarImage src={user.avatarUrl} alt={user.displayName} className="object-cover" />
        )}
        <AvatarFallback
          className="text-xs font-bold text-white"
          style={{ background: user.avatarColor }}
        >
          {user.avatarInitials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{user.displayName}</span>
          <span className="text-xs text-muted-foreground">@{user.username}</span>
          {user.isMember && (
            <span className="flex items-center gap-1 text-xs text-yellow-500 font-semibold bg-yellow-950/30 border border-yellow-800/30 px-1.5 py-0.5 rounded-sm">
              <Crown size={9} /> Member
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>
        <p className="text-xs text-muted-foreground/50 mt-0.5">
          Joined {format(new Date(user.createdAt), "d MMM yyyy")}
          {user.isMember && user.memberSince && (
            <> · Member since {format(new Date(user.memberSince), "d MMM yyyy")}</>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Cancel membership — only shown if currently a member */}
        {user.isMember && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs text-orange-400 border-orange-800/40 hover:bg-orange-950/20 hover:text-orange-300"
            onClick={onCancel}
            disabled={isPending}
            data-testid={`button-cancel-${user.id}`}
          >
            <ShieldOff size={12} /> Cancel
          </Button>
        )}
        {/* Delete account — disabled if still a member */}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs text-red-400 border-red-800/40 hover:bg-red-950/20 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onDelete}
          disabled={isPending || user.isMember}
          title={user.isMember ? "Cancel membership first before deleting" : "Delete account permanently"}
          data-testid={`button-delete-${user.id}`}
        >
          <Trash2 size={12} /> Delete
        </Button>
      </div>
    </div>
  );
}
