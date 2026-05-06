import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { announcementService, Announcement } from "@/services/announcementService";
import { ArrowLeft, Megaphone, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "admins">("all");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await announcementService.listAll());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (title.trim().length < 2) return toast.error("Title required");
    if (body.trim().length < 2) return toast.error("Body required");
    setBusy(true);
    try {
      await announcementService.create({
        title: title.trim(),
        body: body.trim(),
        audience,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      toast.success("Announcement published");
      setTitle("");
      setBody("");
      setExpiresAt("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const expire = async (id: string) => {
    try {
      await announcementService.expire(id);
      toast.success("Expired");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await announcementService.remove(id);
      toast.success("Deleted");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <Link to="/admin" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Admin
        </Link>
        <div className="mb-6 flex items-center gap-3">
          <Megaphone className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Announcements</h1>
            <p className="text-sm text-muted-foreground">Broadcast a message to all members.</p>
          </div>
        </div>

        <Card className="mb-8 p-6 space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={1000} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Audience</Label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All users</option>
                <option value="admins">Admins only</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Expires at (optional)</Label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <Button onClick={create} disabled={busy} variant="hero">
            {busy ? "Publishing…" : "Publish announcement"}
          </Button>
        </Card>

        <h2 className="mb-3 text-lg font-semibold">Recent announcements</h2>
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">Loading…</Card>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No announcements</Card>
        ) : (
          <div className="space-y-3">
            {items.map((a) => {
              const expired = a.expires_at && new Date(a.expires_at) <= new Date();
              return (
                <Card key={a.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{a.title}</h3>
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                          {a.audience}
                        </span>
                        {expired && (
                          <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] text-destructive">expired</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {new Date(a.created_at).toLocaleString()}
                        {a.expires_at && ` · expires ${new Date(a.expires_at).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!expired && (
                        <Button size="sm" variant="ghost" onClick={() => expire(a.id)} title="Expire now">
                          Expire
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => remove(a.id)} title="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
