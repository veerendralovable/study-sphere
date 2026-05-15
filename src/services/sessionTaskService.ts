import { supabase } from "@/integrations/supabase/client";

export interface SessionTask {
  id: string;
  user_id: string;
  session_id: string | null;
  room_id: string | null;
  title: string;
  done: boolean;
  est_pomodoros: number;
  actual_pomodoros: number;
  is_focus: boolean;
  position: number;
  created_at: string;
  completed_at: string | null;
}

export const sessionTaskService = {
  async listForUser(userId: string, roomId?: string | null) {
    let q = supabase
      .from("session_tasks")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (roomId) q = q.eq("room_id", roomId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as SessionTask[];
  },

  async add(userId: string, title: string, opts: { roomId?: string; sessionId?: string; estPomodoros?: number } = {}) {
    const { data, error } = await supabase
      .from("session_tasks")
      .insert({
        user_id: userId,
        title: title.trim().slice(0, 200),
        room_id: opts.roomId ?? null,
        session_id: opts.sessionId ?? null,
        est_pomodoros: opts.estPomodoros ?? 1,
      })
      .select()
      .single();
    if (error) throw error;
    return data as SessionTask;
  },

  async toggleDone(id: string, done: boolean) {
    const { error } = await supabase
      .from("session_tasks")
      .update({ done })
      .eq("id", id);
    if (error) throw error;
  },

  async setFocus(userId: string, taskId: string) {
    await supabase.from("session_tasks").update({ is_focus: false }).eq("user_id", userId);
    const { error } = await supabase
      .from("session_tasks")
      .update({ is_focus: true })
      .eq("id", taskId);
    if (error) throw error;
  },

  async remove(id: string) {
    const { error } = await supabase.from("session_tasks").delete().eq("id", id);
    if (error) throw error;
  },

  async incrementPomodoro(taskId: string) {
    const { data } = await supabase
      .from("session_tasks")
      .select("actual_pomodoros")
      .eq("id", taskId)
      .single();
    if (!data) return;
    await supabase
      .from("session_tasks")
      .update({ actual_pomodoros: (data.actual_pomodoros ?? 0) + 1 })
      .eq("id", taskId);
  },
};
