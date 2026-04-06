import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";

interface ResetForm { password: string; confirmPassword: string; }

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash; // "#/reset-password?token=..."
    const queryStart = hash.indexOf("?");
    if (queryStart !== -1) {
      const params = new URLSearchParams(hash.slice(queryStart + 1));
      const t = params.get("token");
      if (t) { setToken(t); return; }
    }
    setTokenError("Invalid or missing reset link. Please request a new one.");
  }, []);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>();
  const password = watch("password");

  const mutation = useMutation({
    mutationFn: async (data: ResetForm) => {
      const res = await apiRequest("POST", "/api/auth/reset-password", { token, password: data.password });
      return res.json();
    },
    onSuccess: () => {
      setDone(true);
    },
    onError: (err: Error) => {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    },
  });

  if (tokenError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">Invalid Link</h1>
          <p className="text-sm text-muted-foreground">{tokenError}</p>
          <Link href="/forgot-password">
            <Button className="bg-primary hover:bg-primary/90 text-white">Request New Reset Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">Password Updated</h1>
          <p className="text-sm text-muted-foreground">Your password has been changed. You can now sign in.</p>
          <Link href="/login">
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(0 76% 47% / 0.3) 2px, hsl(0 76% 47% / 0.3) 3px)" }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img src="/brand/logo-x.jpg" alt="DinoBane" width="56" height="56" className="rounded" />
          </Link>
          <h1 className="text-xl font-bold text-foreground tracking-wider uppercase font-display">Set New Password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a new password for your account</p>
        </div>

        <div className="bg-card border border-border rounded-sm p-8 space-y-6">
          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-background border-border focus:border-primary pr-10"
                  {...register("password", { required: "Password is required", minLength: { value: 6, message: "At least 6 characters" } })}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-background border-border focus:border-primary pr-10"
                  {...register("confirmPassword", { required: "Please confirm your password", validate: v => v === password || "Passwords do not match" })}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
