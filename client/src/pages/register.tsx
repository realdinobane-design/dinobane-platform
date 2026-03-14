import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch("password");

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await apiRequest("POST", "/api/auth/register", {
        username: data.username,
        email: data.email,
        password: data.password,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      toast({ title: "Account created", description: "Welcome to DINOBANE." });
      navigate("/");
    },
    onError: () => {
      toast({ title: "Registration failed", description: "Email may already be in use.", variant: "destructive" });
    },
  });

  const onSubmit = (data: RegisterForm) => registerMutation.mutate(data);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(0 76% 47% / 0.3) 2px, hsl(0 76% 47% / 0.3) 3px)" }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto" aria-label="DINOBANE">
              <polygon points="8,4 16,4 24,20 32,4 40,4 28,20 40,36 32,36 24,20 16,36 8,36 20,20" fill="hsl(0 76% 47%)" />
              <text x="48" y="26" fontFamily="'Clash Display', sans-serif" fontWeight="700" fontSize="16" fill="white" letterSpacing="2">DINOBANE</text>
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-foreground tracking-wider uppercase font-display">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join the DinoBane community</p>
        </div>

        <div className="bg-card border border-border rounded-sm p-8 space-y-6">
          {/* Membership banner */}
          <div className="bg-primary/10 border border-primary/30 rounded-sm p-3 text-center">
            <p className="text-xs text-primary font-bold uppercase tracking-wider">Members Community — £5/month</p>
            <p className="text-xs text-muted-foreground mt-0.5">Join now to access the community channels</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="form-register">
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
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                data-testid="input-password"
                className="bg-background border-border focus:border-primary"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters" }
                })}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                data-testid="input-confirm-password"
                className="bg-background border-border focus:border-primary"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (val) => val === password || "Passwords do not match"
                })}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest"
              disabled={registerMutation.isPending}
              data-testid="button-submit"
            >
              {registerMutation.isPending ? "Creating account..." : "Create Account"}
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
