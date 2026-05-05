import { supabase } from "@/integrations/supabase/client";

const DEFAULT_GOAL = 7200;

export const dailyGoalService = {
  async get(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("daily_goals")
      .select("goal_seconds")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data?.goal_seconds ?? DEFAULT_GOAL;
  },

  async set(userId: string, goalSeconds: number): Promise<void> {
    const clamped = Math.max(60, Math.min(86400, Math.round(goalSeconds)));
    const { error } = await supabase
      .from("daily_goals")
      .upsert(
        { user_id: userId, goal_seconds: clamped, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (error) throw error;
  },
};
