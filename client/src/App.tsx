import { useHashLocation } from "wouter/use-hash-location";
import { Switch, Route, Router, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import VideosPage from "@/pages/videos";
import ArticlesPage from "@/pages/articles";
import ArticleDetailPage from "@/pages/article-detail";
import NewsPage from "@/pages/news";
import CommunityPage from "@/pages/community";
import MembershipPage from "@/pages/membership";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ProfilePage from "@/pages/profile";
import MediaVaultPage from "@/pages/media-vault";
import AdminUsersPage from "@/pages/admin-users";
import AdminEmailsPage from "@/pages/admin-emails";
import MembersPage from "@/pages/members";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import { AppNav } from "@/components/app-nav";
import { getMe, type AuthUser } from "@/lib/auth";
import { createContext, useContext, useCallback } from "react";

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
export const AuthContext = createContext<{
  user: AuthUser | null;
  isLoading: boolean;
  refetch: () => void;
  setUser: (user: AuthUser | null) => void;
}>({ user: null, isLoading: true, refetch: () => {}, setUser: () => {} });

export const useAuth = () => useContext(AuthContext);

// ─── ROUTE GUARDS ─────────────────────────────────────────────────────────────

// Requires a fully paid member session.
// Not logged in → /login | Logged in but not member → /membership
function MemberRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null; // wait for session check before redirecting
  if (!user) return <Redirect to="/login" />;
  if (!user.isMember) return <Redirect to="/membership" />;
  return <Component />;
}

// Requires any logged-in session (e.g. profile, admin).
function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function AppRoutes() {
  return (
    <Switch>
      {/* Public routes — no login required */}
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/membership" component={MembershipPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />

      {/* Member-only routes — must have isMember=true */}
      <Route path="/community">{() => <MemberRoute component={CommunityPage} />}</Route>
      <Route path="/media-vault">{() => <MemberRoute component={MediaVaultPage} />}</Route>
      <Route path="/news">{() => <MemberRoute component={NewsPage} />}</Route>
      <Route path="/videos">{() => <MemberRoute component={VideosPage} />}</Route>
      <Route path="/articles">{() => <MemberRoute component={ArticlesPage} />}</Route>
      <Route path="/articles/:id">{() => <MemberRoute component={ArticleDetailPage} />}</Route>
      <Route path="/members">{() => <MemberRoute component={MembersPage} />}</Route>

      {/* Authenticated routes — logged in, membership not required */}
      <Route path="/profile">{() => <AuthRoute component={ProfilePage} />}</Route>
      <Route path="/admin/users">{() => <AuthRoute component={AdminUsersPage} />}</Route>
      <Route path="/admin/members">{() => <AuthRoute component={MembersPage} />}</Route>
      <Route path="/admin/emails">{() => <AuthRoute component={AdminEmailsPage} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

// Inner app — must be inside QueryClientProvider
function InnerApp() {
  const { data: user = null, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const setUser = useCallback((u: AuthUser | null) => {
    queryClient.setQueryData(["/api/auth/me"], u);
  }, []);

  return (
    <TooltipProvider>
      <AuthContext.Provider value={{ user, isLoading, refetch, setUser }}>
        <Router hook={useHashLocation}>
          <div className="min-h-screen bg-background text-foreground flex flex-col">
            <AppNav />
            <main className="flex-1">
              <AppRoutes />
            </main>
            <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
              <p>© 2026 DinoBane. All rights reserved.</p>
            </footer>
          </div>
        </Router>
      </AuthContext.Provider>
      <Toaster />
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InnerApp />
    </QueryClientProvider>
  );
}
