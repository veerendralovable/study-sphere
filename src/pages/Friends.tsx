import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { friendsService } from "@/services/friendsService";
import { useNavigate } from "react-router-dom";
import { dmService } from "@/services/dmService";
import { Users, UserPlus, Check, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const [f, i, o] = await Promise.all([
      friendsService.listFriends(user.id),
      friendsService.listIncoming(user.id),
      friendsService.listOutgoing(user.id),
    ]);
    setFriends(f);
    setIncoming(i);
    setOutgoing(o);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const search = async () => {
    try {
      setResults(await friendsService.search(q));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const send = async (id: string) => {
    try {
      await friendsService.send(id);
      toast.success("Request sent");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const respond = async (rid: string, accept: boolean) => {
    await friendsService.respond(rid, accept);
    await load();
  };

  const message = async (otherId: string) => {
    if (!user) return;
    const t = await dmService.getOrCreateThread(user.id, otherId);
    navigate(`/messages/${t.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-8 space-y-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Users className="h-6 w-6 text-primary" /> Friends
        </h1>

        <Card className="bg-gradient-card border-border/60 p-5 shadow-card">
          <div className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or .edu email..."
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            <Button onClick={search} variant="hero">Search</Button>
          </div>
          {results.length > 0 && (
            <ul className="mt-3 space-y-2">
              {results.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded border border-border/40 p-2">
                  <Avatar className="h-8 w-8">
                    {r.avatar_url && <AvatarImage src={r.avatar_url} />}
                    <AvatarFallback>{(r.name ?? "?").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => send(r.id)}>
                    <UserPlus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {incoming.length > 0 && (
          <Card className="bg-gradient-card border-border/60 p-5 shadow-card">
            <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Incoming requests</h2>
            <ul className="space-y-2">
              {incoming.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded border border-border/40 p-2">
                  <Avatar className="h-8 w-8"><AvatarFallback>{(r.profile?.name ?? "?").slice(0, 2)}</AvatarFallback></Avatar>
                  <div className="flex-1 text-sm">{r.profile?.name ?? r.from_user}</div>
                  <Button size="sm" variant="hero" onClick={() => respond(r.id, true)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => respond(r.id, false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="bg-gradient-card border-border/60 p-5 shadow-card">
          <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Your friends ({friends.length})</h2>
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground">No friends yet. Search above to send your first request.</p>
          ) : (
            <ul className="space-y-2">
              {friends.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded border border-border/40 p-2">
                  <Avatar className="h-8 w-8">
                    {f.avatar_url && <AvatarImage src={f.avatar_url} />}
                    <AvatarFallback>{(f.name ?? "?").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.email}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => message(f.id)}>
                    <MessageCircle className="mr-1 h-4 w-4" /> Message
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {outgoing.length > 0 && (
          <Card className="bg-gradient-card border-border/60 p-5 shadow-card">
            <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Pending sent</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {outgoing.map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <span>To: {r.to_user.slice(0, 8)}…</span>
                  <Button size="sm" variant="ghost" onClick={async () => { await friendsService.cancel(r.id); load(); }}>
                    Cancel
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </div>
  );
}
