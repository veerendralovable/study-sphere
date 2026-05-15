import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { dmService } from "@/services/dmService";
import { MessageCircle, Send } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const { threadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    dmService.listThreads(user.id).then(setThreads);
  }, [user?.id]);

  useEffect(() => {
    if (!threadId) return;
    dmService.listMessages(threadId).then(setMessages);
    const unsub = dmService.subscribe(threadId, (m) => setMessages((prev) => [...prev, m]));
    return () => unsub();
  }, [threadId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    if (!threadId || !body.trim()) return;
    await dmService.send(threadId, body);
    setBody("");
  };

  const active = threads.find((t) => t.id === threadId);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-5xl py-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-semibold">
          <MessageCircle className="h-6 w-6 text-primary" /> Messages
        </h1>
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <Card className="bg-gradient-card border-border/60 p-3 shadow-card">
            {threads.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                No conversations yet. Add a friend to start.
              </p>
            ) : (
              <ul className="space-y-1">
                {threads.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => navigate(`/messages/${t.id}`)}
                      className={`flex w-full items-center gap-2 rounded p-2 text-left ${
                        threadId === t.id ? "bg-primary/10" : "hover:bg-secondary/40"
                      }`}
                    >
                      <Avatar className="h-7 w-7">
                        {t.other?.avatar_url && <AvatarImage src={t.other.avatar_url} />}
                        <AvatarFallback>{(t.other?.name ?? "?").slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm">{t.other?.name ?? "Unknown"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="bg-gradient-card border-border/60 p-0 shadow-card flex h-[60vh] flex-col">
            {!threadId ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Pick a conversation
              </div>
            ) : (
              <>
                <div className="border-b border-border/40 p-3 text-sm font-medium">
                  {active?.other?.name ?? "Conversation"}
                </div>
                <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        m.user_id === user?.id
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-secondary/60"
                      }`}
                    >
                      {m.body}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 border-t border-border/40 p-3">
                  <Input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && send()}
                  />
                  <Button onClick={send} variant="hero" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
