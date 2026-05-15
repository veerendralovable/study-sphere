import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import { gamificationService, UserXP } from "@/services/gamificationService";

export function XPLevelCard({ userId }: { userId: string }) {
  const [xp, setXp] = useState<UserXP | null>(null);

  useEffect(() => {
    gamificationService.getXP(userId).then(setXp).catch(() => {});
  }, [userId]);

  const required = xp ? gamificationService.xpRequired(xp.level) : 100;
  const pct = xp ? Math.min(100, Math.round((xp.level_progress / required) * 100)) : 0;

  return (
    <Card className="bg-gradient-card border-border/60 p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Trophy className="h-4 w-4 text-primary" /> Level
        </div>
        <span className="text-2xl font-semibold tabular-nums">{xp?.level ?? "—"}</span>
      </div>
      <div className="mt-3 space-y-1">
        <Progress value={pct} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{xp?.level_progress ?? 0} XP</span>
          <span>{required - (xp?.level_progress ?? 0)} to next level</span>
        </div>
      </div>
    </Card>
  );
}
