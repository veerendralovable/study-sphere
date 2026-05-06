import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { reportService } from "@/services/reportService";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  targetType: "user" | "room";
  targetId: string;
  targetLabel?: string;
}

export function ReportDialog({ open, onOpenChange, targetType, targetId, targetLabel }: Props) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const r = reason.trim();
    if (r.length < 3) return toast.error("Please choose a reason");
    setBusy(true);
    try {
      await reportService.create(targetType, targetId, r, description.trim() || undefined);
      toast.success("Report submitted");
      setReason("");
      setDescription("");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetType}{targetLabel ? `: ${targetLabel}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={120} placeholder="Spam, harassment, inappropriate content…" />
          </div>
          <div className="space-y-2">
            <Label>Details (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={4} />
          </div>
          <Button onClick={submit} disabled={busy} className="w-full" variant="destructive">
            {busy ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
