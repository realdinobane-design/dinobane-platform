import { useHashLocation } from "wouter/use-hash-location";
import { Switch, Route, Router, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// HomePage is the landing page — eagerly loaded so first paint is instant.
import HomePage from "@/pages/home";

// All other pages are split into their own chunk and loaded on demand.
// Visitors who only hit the landing page never download these.
import { lazy, Suspense } from "react";
const NotFound = lazy(() => import("@/pages/not-found"));
const ArticlesPage = lazy(() => import("@/pages/articles"));
const ArticleDetailPage = lazy(() => import("@/pages/article-detail"));
const NewsPage = lazy(() => import("@/pages/news"));
const CommunityPage = lazy(() => import("@/pages/community"));
const MembershipPage = lazy(() => import("@/pages/membership"));
const LoginPage = lazy(() => import("@/pages/login"));
const RegisterPage = lazy(() => import("@/pages/register"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const MediaVaultPage = lazy(() => import("@/pages/media-vault"));
const AdminUsersPage = lazy(() => import("@/pages/admin-users"));
const AdminEmailsPage = lazy(() => import("@/pages/admin-emails"));
const AdminContentPage = lazy(() => import("@/pages/admin-content"));
const MembersPage = lazy(() => import("@/pages/members"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const ContactPage = lazy(() => import("@/pages/contact"));
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

// Shown briefly while a lazy-loaded page chunk downloads. Intentionally minimal
// so it doesn't flash for cached chunks.
function PageLoader() {
  return <div className="min-h-[50vh]" aria-busy="true" aria-label="Loading" />;
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
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/intel" component={NewsPage} />
      <Route path="/videos">{() => { window.location.hash = "#/articles"; return null; }}</Route>
      <Route path="/articles" component={ArticlesPage} />
      <Route path="/articles/:id" component={ArticleDetailPage} />

      {/* Member-only routes — must have isMember=true */}
      <Route path="/community">{() => <MemberRoute component={CommunityPage} />}</Route>
      <Route path="/media-vault">{() => <MemberRoute component={MediaVaultPage} />}</Route>
      <Route path="/members">{() => <AuthRoute component={MembersPage} />}</Route>

      {/* Authenticated routes — logged in, membership not required */}
      <Route path="/profile">{() => <AuthRoute component={ProfilePage} />}</Route>
      <Route path="/admin/users">{() => <AuthRoute component={AdminUsersPage} />}</Route>
      <Route path="/admin/members">{() => <AuthRoute component={MembersPage} />}</Route>
      <Route path="/admin/emails">{() => <AuthRoute component={AdminEmailsPage} />}</Route>
      <Route path="/admin/content">{() => <AuthRoute component={AdminContentPage} />}</Route>

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
              <Suspense fallback={<PageLoader />}>
                <AppRoutes />
              </Suspense>
            </main>
            <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground space-y-2">
              <p>© 2026 DinoBane. All rights reserved.</p>
              <p>
                Contact:{" "}
                <a
                  href="mailto:contact@realdinobane.com"
                  className="text-yellow-400 hover:underline"
                >
                  contact@realdinobane.com
                </a>
              {" · "}
              <a href="/#/contact" className="text-yellow-400 hover:underline">Contact form</a>
              {" · "}
              <a href="/#/privacy" className="text-zinc-500 hover:underline">Privacy Policy</a>
              </p>
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
