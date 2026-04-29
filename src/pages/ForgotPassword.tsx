import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("If that account exists, a reset link has been sent.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send reset email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-hero p-6">
      <div className="absolute inset-0 -z-10 bg-background" />
      <div className="absolute inset-0 -z-10 bg-hero" />
      <div className="w-full max-w-md">
        <Link to="/login" className="mb-6 flex items-center justify-center gap-2 text-foreground">
          <div className="rounded-xl bg-gradient-primary p-2 shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">StudySphere</span>
        </Link>
        <Card className="bg-gradient-card border-border/60 p-6 shadow-card">
          <h1 className="mb-1 text-2xl font-semibold">Reset your password</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Enter your account email and we'll send a reset link.
          </p>
          {sent ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Check your inbox for a password reset link.</p>
              <Link to="/login" className="inline-flex items-center text-primary hover:underline">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                  placeholder="you@college.edu"
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full" variant="hero">
                {busy ? "Sending…" : "Send reset link"}
              </Button>
              <Link
                to="/login"
                className="mt-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to sign in
              </Link>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
