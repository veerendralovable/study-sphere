import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target, CircleCheck as CheckCircle2, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { dailyGoalService } from "@/services/dailyGoalService";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [goalSeconds, setGoalSeconds] = useState(7200);
  const [animatedPct, setAnimatedPct] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [draftMin, setDraftMin] = useState("120");
  const [saving, setSaving] = useState(false);

  const pct = Math.min(100, Math.round((todaySeconds / goalSeconds) * 100));
  const completed = todaySeconds >= goalSeconds;

  useEffect(() => {
    if (!user) return;
    dailyGoalService.get(user.id).then((s) => {
      setGoalSeconds(s);
      setDraftMin(String(Math.round(s / 60)));
    }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedPct(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  const save = async () => {
    if (!user) return;
    const minutes = parseInt(draftMin, 10);
    if (!Number.isFinite(minutes) || minutes < 5 || minutes > 1440) {
      toast.error("Goal must be between 5 minutes and 24 hours");
      return;
    }
    setSaving(true);
    try {
      await dailyGoalService.set(user.id, minutes * 60);
      setGoalSeconds(minutes * 60);
      toast.success("Daily goal updated");
      setEditOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save goal");
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = todaySeconds === 0 ? "Not started" : completed ? "Completed" : "In progress";

  return (
    <Card className="group bg-gradient-card border-border/60 p-5 shadow-card transition-base hover:border-primary/30 hover:shadow-glow">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground transition-colors group-hover:text-primary">
          <Target className="h-4 w-4 text-primary" />
          Daily Goal
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium transition-colors ${
              completed ? "text-success" : todaySeconds === 0 ? "text-muted-foreground" : "text-primary"
            }`}
          >
            {statusLabel}
          </span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditOpen(true)} title="Edit goal">
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-2xl font-semibold">
          {fmtHM(todaySeconds)}
          <span className="text-sm font-normal text-muted-foreground"> / {fmtHM(goalSeconds)}</span>
        </span>
        <span className="text-sm font-medium tabular-nums text-muted-foreground">{animatedPct}%</span>
      </div>

      <Progress value={animatedPct} className="mb-3 h-2.5" />

      {completed && (
        <div className="flex items-center gap-2 text-sm font-medium text-success animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CheckCircle2 className="h-4 w-4" />
          Goal completed!
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set daily study goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-min">Goal (minutes)</Label>
              <Input
                id="goal-min"
                type="number"
                min={5}
                max={1440}
                value={draftMin}
                onChange={(e) => setDraftMin(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Between 5 minutes and 24 hours.</p>
            </div>
            <Button onClick={save} disabled={saving} className="w-full" variant="hero">
              {saving ? "Saving..." : "Save goal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
