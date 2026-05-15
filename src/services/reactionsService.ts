import { supabase } from "@/integrations/supabase/client";

export const reactionsService = {
  async listForRoom(roomId: string) {
    const { data: msgs } = await supabase
      .from("room_messages")
      .select("id")
      .eq("room_id", roomId);
    const ids = (msgs ?? []).map((m) => m.id);
    if (ids.length === 0) return [];
    const { data } = await supabase
      .from("message_reactions")
      .select("*")
      .in("message_id", ids);
    return data ?? [];
  },

  async add(messageId: string, emoji: string) {
    const { error } = await supabase
      .from("message_reactions")
      .insert({ message_id: messageId, emoji });
    if (error && !String(error.message).includes("duplicate")) throw error;
  },

  async remove(messageId: string, userId: string, emoji: string) {
    const { error } = await supabase
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji);
    if (error) throw error;
  },
};
