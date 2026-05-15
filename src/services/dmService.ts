import { supabase } from "@/integrations/supabase/client";

export const dmService = {
  async getOrCreateThread(myId: string, otherId: string) {
    const a = myId < otherId ? myId : otherId;
    const b = myId < otherId ? otherId : myId;
    const { data: existing } = await supabase
      .from("dm_threads")
      .select("*")
      .eq("user_a", a)
      .eq("user_b", b)
      .maybeSingle();
    if (existing) return existing;
    const { data, error } = await supabase
      .from("dm_threads")
      .insert({ user_a: a, user_b: b })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listThreads(userId: string) {
    const { data, error } = await supabase
      .from("dm_threads")
      .select("*")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!data?.length) return [];
    const otherIds = data.map((t) => (t.user_a === userId ? t.user_b : t.user_a));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", otherIds);
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return data.map((t) => ({
      ...t,
      other: map.get(t.user_a === userId ? t.user_b : t.user_a),
    }));
  },

  async listMessages(threadId: string) {
    const { data, error } = await supabase
      .from("dm_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },

  async send(threadId: string, body: string) {
    const text = body.trim();
    if (!text) return;
    const { error } = await supabase
      .from("dm_messages")
      .insert({ thread_id: threadId, body: text.slice(0, 2000) });
    if (error) throw error;
  },

  subscribe(threadId: string, onMsg: (m: any) => void) {
    const channel = supabase
      .channel(`dm-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages", filter: `thread_id=eq.${threadId}` },
        (p) => onMsg(p.new)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
