import { supabase } from "@/integrations/supabase/client";

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export const roomChatService = {
  async list(roomId: string, limit = 100): Promise<RoomMessage[]> {
    const { data, error } = await supabase
      .from("room_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as RoomMessage[]).reverse();
  },

  async send(roomId: string, body: string): Promise<RoomMessage> {
    const trimmed = body.trim();
    if (!trimmed) throw new Error("Message is empty");
    if (trimmed.length > 1000) throw new Error("Message too long");
    const { data, error } = await supabase
      .from("room_messages")
      .insert({ room_id: roomId, body: trimmed })
      .select()
      .single();
    if (error) throw error;
    return data as RoomMessage;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("room_messages").delete().eq("id", id);
    if (error) throw error;
  },
};
