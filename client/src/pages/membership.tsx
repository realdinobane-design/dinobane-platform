import { Link, useLocation } from "wouter";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Lock, Users, MessageSquare, Newspaper, Zap, Shield, CreditCard, Settings } from "lucide-react";
import { useEffect } from "react";
import { useHashLocation } from "wouter/use-hash-location";

const FEATURES = [
  { icon: MessageSquare, text: "Access all community channels (#general, #news-links, #video-discussion, #off-topic)" },
  { icon: Users, text: "@mention other members and build your network" },
  { icon: Newspaper, text: "Share links and discuss stories from the Intel feed" },
  { icon: Zap, text: "Early access to new features and video drops" },
  { icon: Shield, text: "Direct line to DinoBane — members-only Q&A" },
];

export default function MembershipPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();

  const { refetch, setUser } = useAuth();

  // Handle Stripe redirect callbacks
  useEffect(() => {
    // With hash routing, query params live inside window.location.hash e.g. "#/membership?success=1"
    const hashStr = window.location.hash; // "#/membership?success=1"
    const qIdx = hashStr.indexOf("?");
    const params = new URLSearchParams(qIdx !== -1 ? hashStr.slice(qIdx + 1) : "");

    if (params.get("verified") === "1") {
      // Freshly verified — refetch user so nav updates, then auto-open checkout
      refetch();
    }

    if (params.get("success") === "1") {
      refetch();
      toast({ title: "Payment successful", description: "Welcome to the DinoBane community. Your membership is now active." });
    } else if (params.get("cancelled") === "1") {
      // New user cancelled Stripe — wipe their account so they can't access anything
      if (user && !user.isMember) {
        apiRequest("POST", "/api/stripe/cancel-registration", {}).then(() => {
          setUser(null);
          toast({
            title: "Payment cancelled",
            description: "Your account has been removed. Register again when you're ready to join.",
            variant: "destructive"
          });
        });
      }
    }
  }, []);

  // Stripe Checkout — redirects to Stripe
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/checkout", {});
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.message || data.error || "Could not start checkout."), { code: data.error });
      return data;
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (e: any) => {
      if (e.code === "already_subscribed") {
        // Payment existed but membership wasn't activated — server just fixed it
        toast({ title: "Membership activated", description: "Your payment was found. Refreshing your account now…" });
        refetch();
      } else {
        toast({ title: "Checkout failed", description: e.message || "Could not start checkout.", variant: "destructive" });
      }
    },
  });

  // Stripe Customer Portal — manage/cancel subscription
  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/portal", {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: () => {
      toast({ title: "Portal unavailable", description: "Could not open billing portal.", variant: "destructive" });
    },
  });

  const isMember = user?.isMember;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: "url('/brand/hero2.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 rounded-sm px-3 py-1 mb-6">
            <Lock className="h-3 w-3 text-primary" />
            <span className="text-xs text-primary font-bold uppercase tracking-widest">Members Only</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground font-display mb-4">
            Join the <span className="text-primary">DinoBane</span> Community
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Private channels, @mentions, news discussion, and direct contact with the team. Cancel any time — no questions asked.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* Pricing card */}
          <div className="bg-card border border-primary/40 rounded-sm p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10"
              style={{ background: "linear-gradient(135deg, transparent 50%, hsl(0 76% 47%) 50%)" }} />

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Monthly membership</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-foreground font-display">£5</span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cancel any time from your billing dashboard</p>
            </div>

            <ul className="space-y-3 mb-8">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>

            {isMember ? (
              <div className="space-y-3">
                {/* Active member state */}
                <div className="bg-primary/10 border border-primary/30 rounded-sm p-4 text-center mb-4">
                  <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-bold text-primary uppercase tracking-wider">Active Member</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Member since {user?.memberSince ? new Date(user.memberSince).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "recently"}
                  </p>
                </div>
                <Link href="/community">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest" data-testid="button-go-community">
                    Go to Community
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full border-border text-muted-foreground hover:text-foreground"
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  data-testid="button-manage-billing"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {portalMutation.isPending ? "Opening..." : "Manage / Cancel Subscription"}
                </Button>
              </div>
            ) : user ? (
              <div className="space-y-3">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest py-6 text-base"
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  data-testid="button-checkout"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {checkoutMutation.isPending ? "Opening checkout..." : "Join for £5/month"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Secure payment via Stripe · Cancel any time
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Link href="/register">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest py-6 text-base"
                    data-testid="button-join"
                  >
                    Join for £5/month
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center">
                  Already registered?{" "}
                  <Link href="/login" className="text-primary hover:underline">Sign in</Link>
                </p>
              </div>
            )}
          </div>

          {/* Community preview */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-wider text-foreground font-display">Community Channels</h2>

            {[
              { name: "general", desc: "Main chat — anything goes" },
              { name: "news-links", desc: "Drop links to stories you find" },
              { name: "video-discussion", desc: "Discuss the latest DinoBane videos" },
              { name: "off-topic", desc: "Banter, memes, off-the-record" },
            ].map((ch) => (
              <div key={ch.name} className="bg-card border border-border rounded-sm p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
                <div className="w-8 h-8 bg-primary/10 rounded-sm flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">#</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">#{ch.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{ch.desc}</p>
                </div>
              </div>
            ))}

            <div className="bg-card border border-border rounded-sm p-4 mt-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-semibold">Billing & Cancellation</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> Cancel any time — no lock-in, no questions</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> Manage everything from your Stripe billing portal</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> Secure checkout — card details handled by Stripe, never us</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> Billed monthly in GBP · Renews automatically</li>
              </ul>
            </div>


          </div>

        </div>
      </div>
    </div>
  );
}
