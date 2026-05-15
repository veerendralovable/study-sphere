import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Target, Trash2 } from "lucide-react";
import { sessionTaskService, SessionTask } from "@/services/sessionTaskService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function TaskListPanel({ roomId }: { roomId?: string }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<SessionTask[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      setTasks(await sessionTaskService.listForUser(user.id, roomId));
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load tasks");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, roomId]);

  const add = async () => {
    if (!user || !title.trim()) return;
    setBusy(true);
    try {
      await sessionTaskService.add(user.id, title, { roomId });
      setTitle("");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (t: SessionTask) => {
    await sessionTaskService.toggleDone(t.id, !t.done);
    await load();
  };

  const focus = async (t: SessionTask) => {
    if (!user) return;
    await sessionTaskService.setFocus(user.id, t.id);
    await load();
  };

  const remove = async (t: SessionTask) => {
    await sessionTaskService.remove(t.id);
    await load();
  };

  return (
    <Card className="bg-gradient-card border-border/60 p-5 shadow-card">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">My tasks</h3>
      <div className="mb-3 flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task..."
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add} disabled={busy || !title.trim()} size="icon" variant="hero">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks yet. Add one to start a focus session.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className={`flex items-center gap-2 rounded-md border p-2 ${
                t.is_focus ? "border-primary/40 bg-primary/5" : "border-border/40"
              }`}
            >
              <Checkbox checked={t.done} onCheckedChange={() => toggle(t)} />
              <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>
                {t.title}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {t.actual_pomodoros}/{t.est_pomodoros}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => focus(t)}
                title="Set focus"
              >
                <Target className={`h-4 w-4 ${t.is_focus ? "text-primary" : "text-muted-foreground"}`} />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(t)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
