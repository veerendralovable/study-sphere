import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { roomChatService, RoomMessage } from "@/services/roomChatService";
import { profileService } from "@/services/profileService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  roomId: string;
  isCreator: boolean;
}

export function RoomChat({ roomId, isCreator }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string | null; email: string | null }>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshProfiles = async (rows: RoomMessage[]) => {
    const ids = Array.from(new Set(rows.map((r) => r.user_id))).filter((id) => !profiles[id]);
    if (!ids.length) return;
    const list = await profileService.getMany(ids);
    setProfiles((prev) => {
      const next = { ...prev };
      list.forEach((p) => (next[p.id] = { name: p.name, email: p.email }));
      return next;
    });
  };

  const load = async () => {
    try {
      const rows = await roomChatService.list(roomId);
      setMessages(rows);
      await refreshProfiles(rows);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`room-chat-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const msg = payload.new as RoomMessage;
          setMessages((prev) => [...prev, msg]);
          await refreshProfiles([msg]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        (payload) => setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id))
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      await roomChatService.send(roomId, body);
      setText("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await roomChatService.remove(id);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card className="bg-gradient-card flex h-[500px] flex-col border-border/60 p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
        <MessageSquare className="h-4 w-4" /> Room chat
      </div>
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages yet — say hi!</p>
        ) : (
          messages.map((m) => {
            const p = profiles[m.user_id];
            const name = p?.name || p?.email || "Member";
            const mine = m.user_id === user?.id;
            const canDelete = mine || isCreator;
            return (
              <div key={m.id} className={`flex gap-2 text-sm ${mine ? "justify-end" : ""}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    mine ? "bg-primary/15 text-foreground" : "bg-secondary/60"
                  }`}
                >
                  {!mine && <div className="text-[10px] font-semibold uppercase text-muted-foreground">{name}</div>}
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div className="mt-0.5 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {canDelete && (
                      <button onClick={() => remove(m.id)} className="opacity-60 hover:opacity-100">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-3 flex gap-2"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          maxLength={1000}
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !text.trim()} size="icon" variant="hero">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
