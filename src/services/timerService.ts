import { supabase } from "@/integrations/supabase/client";

export const timerService = {
  async getByRoom(roomId: string) {
    const { data, error } = await supabase
      .from("timers")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async start(roomId: string, durationSeconds: number) {
    const existing = await this.getByRoom(roomId);
    const payload = {
      room_id: roomId,
      start_time: new Date().toISOString(),
      duration: durationSeconds,
      is_active: true,
    };
    if (existing) {
      const { data, error } = await supabase
        .from("timers")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase
      .from("timers")
      .insert(payload)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async stop(roomId: string) {
    const { error } = await supabase
      .from("timers")
      .update({ is_active: false })
      .eq("room_id", roomId);
    if (error) throw error;
  },

  async getActiveByRooms(roomIds: string[]) {
    if (!roomIds.length) return [];
    const { data, error } = await supabase
      .from("timers")
      .select("room_id, is_active")
      .in("room_id", roomIds);
    if (error) throw error;
    return data ?? [];
  },
};
