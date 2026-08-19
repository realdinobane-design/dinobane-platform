import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft } from "lucide-react";

interface ForgotForm { email: string; }

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>();

  const mutation = useMutation({
    mutationFn: async (data: ForgotForm) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      setSentEmail(variables.email);
      setSent(true);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="relative w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white uppercase tracking-wider font-display">Check your email</h1>
            <p className="text-sm text-muted-foreground mt-2">
              If <span className="text-white font-semibold">{sentEmail}</span> is registered, you'll receive a reset link shortly. The link expires in 24 hours.
            </p>
          </div>
          <div className="bg-card border border-border rounded-sm p-4 text-left">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Didn't get it? Check your spam folder. If you're still having trouble, email <a href="mailto:realdinobane@gmail.com" className="text-primary">realdinobane@gmail.com</a>.
            </p>
          </div>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft size={14} /> Back to sign in
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
          <h1 className="text-xl font-bold text-foreground tracking-wider uppercase font-display">Forgot Password</h1>
          <p className="text-sm text-muted-foreground mt-1">We'll send you a reset link</p>
        </div>

        <div className="bg-card border border-border rounded-sm p-8 space-y-6">
          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="bg-background border-border focus:border-primary"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/login" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
