import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { signupSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";

function safeReturnTo(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function Signup() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to={returnTo} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const parsed = signupSchema.safeParse({ email, password, name });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      await authService.signUp(parsed.data.email, parsed.data.password, parsed.data.name);
      toast.success("Account created — check your email if confirmation is required.");
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      const msg = err.message ?? "Sign up failed";
      if (/already registered|already exists|user already/i.test(msg)) {
        toast.error("An account with this email already exists. Try signing in.");
      } else {
        toast.error(msg);
      }
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
          <h1 className="mb-1 text-2xl font-semibold">Create your account</h1>
          <p className="mb-6 text-sm text-muted-foreground">Sign up with your .edu email to join</p>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full" variant="hero">
              {busy ? "Please wait…" : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to={`/login${returnTo !== "/" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
              className="text-primary hover:underline"
            >
              Sign in
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
