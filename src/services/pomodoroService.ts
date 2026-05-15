import { supabase } from "@/integrations/supabase/client";

export interface PomodoroPreset {
  id: string;
  user_id: string | null;
  name: string;
  focus_min: number;
  short_break_min: number;
  long_break_min: number;
  cycles_until_long: number;
  auto_start: boolean;
  is_system: boolean;
}

export const pomodoroService = {
  async listPresets() {
    const { data, error } = await supabase
      .from("pomodoro_presets")
      .select("*")
      .order("is_system", { ascending: false })
      .order("focus_min");
    if (error) throw error;
    return (data ?? []) as PomodoroPreset[];
  },

  async createPreset(userId: string, p: Omit<PomodoroPreset, "id" | "is_system" | "user_id">) {
    const { data, error } = await supabase
      .from("pomodoro_presets")
      .insert({ ...p, user_id: userId, is_system: false })
      .select()
      .single();
    if (error) throw error;
    return data as PomodoroPreset;
  },

  async getProgram(roomId: string) {
    const { data } = await supabase
      .from("room_timer_program")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle();
    return data;
  },

  async startProgram(roomId: string, presetId: string) {
    const { error } = await supabase
      .from("room_timer_program")
      .upsert(
        {
          room_id: roomId,
          preset_id: presetId,
          current_phase: "focus",
          cycle_index: 0,
          phase_started_at: new Date().toISOString(),
          paused_at: null,
        },
        { onConflict: "room_id" }
      );
    if (error) throw error;
  },

  async advancePhase(
    roomId: string,
    next: { current_phase: string; cycle_index: number }
  ) {
    const { error } = await supabase
      .from("room_timer_program")
      .update({
        current_phase: next.current_phase,
        cycle_index: next.cycle_index,
        phase_started_at: new Date().toISOString(),
      })
      .eq("room_id", roomId);
    if (error) throw error;
  },

  async stopProgram(roomId: string) {
    await supabase.from("room_timer_program").delete().eq("room_id", roomId);
  },
};
