import { supabase } from "@/integrations/supabase/client";

export const sessionNotesService = {
  async get(sessionId: string, userId: string) {
    const { data } = await supabase
      .from("session_notes")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    return data;
  },

  async upsert(sessionId: string, userId: string, body: string) {
    const { error } = await supabase.from("session_notes").upsert(
      { session_id: sessionId, user_id: userId, body, updated_at: new Date().toISOString() },
      { onConflict: "session_id,user_id" }
    );
    if (error) throw error;
  },

  async saveReflection(
    sessionId: string,
    payload: {
      mood?: number;
      productivity?: number;
      accomplished?: string;
      next_steps?: string;
      friction?: string;
    }
  ) {
    const { error } = await supabase
      .from("session_reflections")
      .upsert({ session_id: sessionId, ...payload }, { onConflict: "session_id" });
    if (error) throw error;
  },

  async listRecentReflections(userId: string, limit = 7) {
    const { data } = await supabase
      .from("session_reflections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  },
};
