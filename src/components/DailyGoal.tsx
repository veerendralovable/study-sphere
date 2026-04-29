import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, CircleCheck as CheckCircle2 } from "lucide-react";

const GOAL_SECONDS = 2 * 60 * 60; // 2 hours

function fmtHM(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface DailyGoalProps {
  todaySeconds: number;
}

export function DailyGoal({ todaySeconds }: DailyGoalProps) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const pct = Math.min(100, Math.round((todaySeconds / GOAL_SECONDS) * 100));
  const completed = todaySeconds >= GOAL_SECONDS;

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedPct(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  const statusLabel = todaySeconds === 0
    ? "Not started"
    : completed
      ? "Completed"
      : "In progress";

  return (
    <Card className="bg-gradient-card border-border/60 p-5 shadow-card transition-base hover:border-primary/30">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Target className="h-4 w-4 text-primary" />
          Daily Goal
        </div>
        <span
          className={`text-xs font-medium ${
            completed
              ? "text-success"
              : todaySeconds === 0
                ? "text-muted-foreground"
                : "text-primary"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-2xl font-semibold">
          {fmtHM(todaySeconds)}
          <span className="text-sm font-normal text-muted-foreground"> / {fmtHM(GOAL_SECONDS)}</span>
        </span>
        <span className="text-sm font-medium tabular-nums text-muted-foreground">{animatedPct}%</span>
      </div>

      <Progress value={animatedPct} className="mb-3 h-2.5" />

      {completed && (
        <div className="flex items-center gap-2 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          Goal completed!
        </div>
      )}
    </Card>
  );
}
