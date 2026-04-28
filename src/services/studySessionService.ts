import { supabase } from "@/integrations/supabase/client";

export const studySessionService = {
  async start(userId: string, roomId: string) {
    const { data, error } = await supabase
      .from("study_sessions")
      .insert({ user_id: userId, room_id: roomId, start_time: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async end(sessionId: string, startTime: string) {
    const end = new Date();
    const duration = Math.max(
      0,
      Math.floor((end.getTime() - new Date(startTime).getTime()) / 1000)
    );
    const { error } = await supabase
      .from("study_sessions")
      .update({ end_time: end.toISOString(), duration })
      .eq("id", sessionId);
    if (error) throw error;
    return duration;
  },

  async listByUser(userId: string) {
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("start_time", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  },
};
