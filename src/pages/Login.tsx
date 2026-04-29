import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { loginSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";

function safeReturnTo(value: string | null): string {
  if (!value) return "/";
  // Only allow same-origin paths
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to={returnTo} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      await authService.signIn(parsed.data.email, parsed.data.password);
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-hero p-6">
      <div className="absolute inset-0 -z-10 bg-background" />
      <div className="absolute inset-0 -z-10 bg-hero" />
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-foreground">
          <div className="rounded-xl bg-gradient-primary p-2 shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">StudySphere</span>
        </Link>
        <Card className="bg-gradient-card border-border/60 p-6 shadow-card">
          <h1 className="mb-1 text-2xl font-semibold">Welcome back</h1>
          <p className="mb-6 text-sm text-muted-foreground">Sign in to your StudySphere account</p>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={1}
                maxLength={128}
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full" variant="hero">
              {busy ? "Please wait…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to StudySphere?{" "}
            <Link
              to={`/signup${returnTo !== "/" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
              className="text-primary hover:underline"
            >
              Create one
            </Link>
          </p>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Access restricted to verified .edu email addresses.
        </p>
      </div>
    </div>
  );
}
