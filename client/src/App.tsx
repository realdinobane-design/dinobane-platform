import { useHashLocation } from "wouter/use-hash-location";
import { Switch, Route, Router } from "wouter";
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

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/videos" component={VideosPage} />
      <Route path="/articles" component={ArticlesPage} />
      <Route path="/articles/:id" component={ArticleDetailPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/membership" component={MembershipPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/profile" component={ProfilePage} />
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
