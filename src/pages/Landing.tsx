import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, Timer, ShieldCheck, Sparkles, Bell } from "lucide-react";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-primary p-1.5 shadow-glow">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">StudySphere</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild variant="hero" size="sm">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Study together, stay focused, <span className="text-primary">earn streaks</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            StudySphere is a collaborative study room platform for students with verified .edu emails.
            Shared timers, real-time presence, focus stats, and exam-mode lockdowns — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="hero">
              <Link to="/signup">Create free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sign-up restricted to verified .edu email addresses.
          </p>
        </section>

        <section className="container grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <Timer className="h-5 w-5" />, title: "Synced study timers", body: "Pomodoro-style timers shared in real time across every member of your room." },
            { icon: <Users className="h-5 w-5" />, title: "Public & private rooms", body: "Open public rooms to study with classmates, or invite-only rooms via room codes." },
            { icon: <ShieldCheck className="h-5 w-5" />, title: "Exam mode", body: "Creators can lock the room during an exam — no leaving, no timer changes." },
            { icon: <Sparkles className="h-5 w-5" />, title: "Streaks & stats", body: "Daily goals, focus streaks, and badges keep you accountable." },
            { icon: <Bell className="h-5 w-5" />, title: "Announcements", body: "Get the latest from instructors and admins, in real time." },
            { icon: <GraduationCap className="h-5 w-5" />, title: ".edu only", body: "Verified .edu accounts keep the platform free of spam and noise." },
          ].map((f) => (
            <Card key={f.title} className="bg-gradient-card border-border/60 p-6 shadow-card">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {f.icon}
              </div>
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} StudySphere. Built for students.
      </footer>
    </div>
  );
}
