import { supabase } from "@/integrations/supabase/client";

export interface UserXP {
  user_id: string;
  xp: number;
  level: number;
  level_progress: number;
}

export interface BadgeDef {
  code: string;
  name: string;
  description: string;
  icon: string | null;
  tier: string;
}

export interface UserBadge {
  user_id: string;
  badge_code: string;
  awarded_at: string;
}

export interface XPEvent {
  id: string;
  source: string;
  amount: number;
  ref_id: string | null;
  created_at: string;
}

function xpRequired(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

export const gamificationService = {
  xpRequired,

  async getXP(userId: string): Promise<UserXP> {
    const { data } = await supabase
      .from("user_xp")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return (
      data ?? { user_id: userId, xp: 0, level: 1, level_progress: 0 }
    );
  },

  async listBadges(): Promise<BadgeDef[]> {
    const { data } = await supabase.from("badges").select("*").order("tier");
    return (data ?? []) as BadgeDef[];
  },

  async listUserBadges(userId: string): Promise<UserBadge[]> {
    const { data } = await supabase
      .from("user_badges")
      .select("*")
      .eq("user_id", userId);
    return (data ?? []) as UserBadge[];
  },

  async listXPEvents(userId: string, limit = 50): Promise<XPEvent[]> {
    const { data } = await supabase
      .from("xp_events")
      .select("id, source, amount, ref_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as XPEvent[];
  },

  async getStreak(userId: string) {
    const { data } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return data ?? { user_id: userId, current: 0, longest: 0, last_active_date: null };
  },
};
