import { supabase } from "@/integrations/supabase/client";

const ONLINE_WINDOW_MS = 60_000;

export const presenceService = {
  async ping(roomId: string, userId: string): Promise<void> {
    await supabase
      .from("presence_pings")
      .upsert(
        { room_id: roomId, user_id: userId, last_seen_at: new Date().toISOString() },
        { onConflict: "room_id,user_id" }
      );
  },

  async listOnline(roomId: string): Promise<Set<string>> {
    const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
    const { data, error } = await supabase
      .from("presence_pings")
      .select("user_id, last_seen_at")
      .eq("room_id", roomId)
      .gte("last_seen_at", cutoff);
    if (error) throw error;
    return new Set((data ?? []).map((r: any) => r.user_id));
  },
};
