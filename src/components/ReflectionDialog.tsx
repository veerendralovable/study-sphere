import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { sessionNotesService } from "@/services/sessionNotesService";
import { toast } from "sonner";

export function ReflectionDialog({
  open,
  onOpenChange,
  sessionId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionId: string | null;
  onSaved?: () => void;
}) {
  const [mood, setMood] = useState(3);
  const [productivity, setProductivity] = useState(3);
  const [accomplished, setAccomplished] = useState("");
  const [next, setNext] = useState("");
  const [friction, setFriction] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!sessionId) {
      onOpenChange(false);
      return;
    }
    setBusy(true);
    try {
      await sessionNotesService.saveReflection(sessionId, {
        mood,
        productivity,
        accomplished,
        next_steps: next,
        friction,
      });
      toast.success("Reflection saved");
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const Faces = ({ value, set }: { value: number; set: (n: number) => void }) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => set(n)}
          className={`h-9 w-9 rounded-md border text-lg ${
            value === n ? "border-primary bg-primary/10" : "border-border/60"
          }`}
        >
          {["😞", "😐", "🙂", "😊", "🤩"][n - 1]}
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session reflection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Mood</Label>
            <Faces value={mood} set={setMood} />
          </div>
          <div>
            <Label className="text-xs">Productivity</Label>
            <Faces value={productivity} set={setProductivity} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">What did you accomplish?</Label>
            <Textarea value={accomplished} onChange={(e) => setAccomplished(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">What's next?</Label>
            <Textarea value={next} onChange={(e) => setNext(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Anything blocked you?</Label>
            <Textarea value={friction} onChange={(e) => setFriction(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Skip</Button>
            <Button variant="hero" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
