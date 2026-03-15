import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login failed");
      return json;
    },
    onSuccess: (data) => {
      setUser(data);
      toast({ title: "Logged in", description: "Welcome back to DINOBANE." });
      navigate("/");
    },
    onError: (err: Error) => {
      toast({ title: "Login failed", description: err.message || "Invalid email or password.", variant: "destructive" });
    },
  });

  const onSubmit = (data: LoginForm) => loginMutation.mutate(data);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(0 76% 47% / 0.3) 2px, hsl(0 76% 47% / 0.3) 3px)" }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            {/* Fixed SVG — wider viewBox so DINOBANE isn't clipped */}
            <svg viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto" aria-label="DINOBANE">
              <polygon points="8,4 16,4 24,20 32,4 40,4 28,20 40,36 32,36 24,20 16,36 8,36 20,20" fill="hsl(0 76% 47%)" />
              <text x="50" y="27" fontFamily="'Clash Display', sans-serif" fontWeight="700" fontSize="17" fill="white" letterSpacing="2">DINOBANE</text>
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-foreground tracking-wider uppercase font-display">Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">Access your DinoBane account</p>
        </div>

        <div className="bg-card border border-border rounded-sm p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="form-login">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                data-testid="input-email"
                className="bg-background border-border focus:border-primary"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  data-testid="input-password"
                  className="bg-background border-border focus:border-primary pr-10"
                  {...register("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest"
              disabled={loginMutation.isPending}
              data-testid="button-submit"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Not a member?{" "}
          <Link href="/membership" className="text-primary hover:underline font-semibold">
            Join for £5/mo
          </Link>
        </p>
      </div>
    </div>
  );
}
