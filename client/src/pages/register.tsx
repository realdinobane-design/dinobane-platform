import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, AlertTriangle } from "lucide-react";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const TOKEN_ERROR_MESSAGES: Record<string, string> = {
  invalid_token: "That verification link has already been used or is invalid. Please register again.",
  expired_token: "Your verification link has expired (links are valid for 24 hours). Please register again.",
  missing_token: "Verification link was incomplete. Please register again.",
};

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Show error if redirected back from a failed email verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err && TOKEN_ERROR_MESSAGES[err]) {
      setTokenError(TOKEN_ERROR_MESSAGES[err]);
      // Strip the error param from the URL cleanly
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch("password");

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await apiRequest("POST", "/api/auth/register", {
        username: data.username,
        email: data.email,
        password: data.password,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Registration failed");
      return json;
    },
    onSuccess: (_data, variables) => {
      setRegisteredEmail(variables.email);
      setVerificationSent(true);
    },
    onError: (err: Error) => {
      toast({
        title: "Registration failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => registerMutation.mutate(data);

  // ── Verification sent screen ──────────────────────────────────────────────
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(0 76% 47% / 0.3) 2px, hsl(0 76% 47% / 0.3) 3px)" }} />

        <div className="relative w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white uppercase tracking-wider font-display">Check your email</h1>
            <p className="text-sm text-muted-foreground mt-2">
              We've sent a verification link to<br />
              <span className="text-white font-semibold">{registeredEmail}</span>
            </p>
          </div>
          <div className="bg-card border border-border rounded-sm p-6 text-left space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Click the link in the email to verify your account. Once verified, you'll be redirected to complete your membership payment of <span className="text-white font-semibold">£5/month</span>.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn't get the email? Check your spam folder. The link expires in 24 hours.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Wrong address?{" "}
            <button
              className="text-primary hover:underline font-semibold"
              onClick={() => setVerificationSent(false)}
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
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
          <h1 className="text-xl font-bold text-foreground tracking-wider uppercase font-display">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join the DinoBane community</p>
        </div>

        {/* Token error banner — shown when redirected back from a failed verify link */}
        {tokenError && (
          <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/40 rounded-sm p-4 mb-4">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{tokenError}</p>
          </div>
        )}

        <div className="bg-card border border-border rounded-sm p-8 space-y-6">
          {/* Membership banner */}
          <div className="bg-primary/10 border border-primary/30 rounded-sm p-3 text-center">
            <p className="text-xs text-primary font-bold uppercase tracking-wider">Members Community — £5/month</p>
            <p className="text-xs text-muted-foreground mt-0.5">Create your account, verify your email, then join</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="form-register">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="YourHandle"
                data-testid="input-username"
                className="bg-background border-border focus:border-primary"
                {...register("username", {
                  required: "Username is required",
                  minLength: { value: 3, message: "At least 3 characters" },
                  pattern: { value: /^[a-zA-Z0-9_-]+$/, message: "Letters, numbers, _ and - only" }
                })}
              />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>

            {/* Email */}
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

            {/* Password with toggle */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  data-testid="input-password"
                  className="bg-background border-border focus:border-primary pr-10"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "At least 6 characters" }
                  })}
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

            {/* Confirm password with toggle */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  data-testid="input-confirm-password"
                  className="bg-background border-border focus:border-primary pr-10"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (val) => val === password || "Passwords do not match"
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest"
              disabled={registerMutation.isPending}
              data-testid="button-submit"
            >
              {registerMutation.isPending ? "Creating account..." : "Create Account & Verify Email"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already a member?{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
