import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Flame, ChartBar as BarChart3, Trophy, X } from "lucide-react";

interface SessionCompletionProps {
  open: boolean;
  onClose: () => void;
  sessionSeconds: number;
  todaySeconds: number;
  sessionCount: number;
  currentStreak: number;
  badges: string[];
}

function fmtDuration(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function SessionCompletion({
  open,
  onClose,
  sessionSeconds,
  todaySeconds,
  sessionCount,
  currentStreak,
  badges,
}: SessionCompletionProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  const goDashboard = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      navigate("/");
    }, 200);
  };

  const dismiss = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 200ms ease-out",
        }}
      />
      <Card
        className="relative z-10 w-full max-w-md border-border/60 bg-gradient-card p-8 shadow-card"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.95)",
          transition: "all 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">Session Complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">Great work staying focused!</p>
        </div>

        <div className="mb-6 space-y-3">
          <StatRow icon={<Clock className="h-4 w-4 text-primary" />} label="This session" value={fmtDuration(sessionSeconds)} />
          <StatRow icon={<Clock className="h-4 w-4 text-primary" />} label="Today total" value={fmtDuration(todaySeconds)} />
          <StatRow icon={<BarChart3 className="h-4 w-4 text-primary" />} label="Sessions today" value={String(sessionCount)} />
          <StatRow icon={<Flame className="h-4 w-4 text-primary" />} label="Current streak" value={`${currentStreak} day${currentStreak === 1 ? "" : "s"}`} />
        </div>

        {badges.length > 0 && (
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {badges.map((b) => (
              <span
                key={b}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {b}
              </span>
            ))}
          </div>
        )}

        <Button onClick={goDashboard} className="w-full" variant="hero">
          Back to Dashboard
        </Button>
      </Card>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
