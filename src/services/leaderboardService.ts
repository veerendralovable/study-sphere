import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardRow {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  value: number;
  meta?: string;
}

async function hydrate(rows: { user_id: string; value: number; meta?: string }[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, leaderboard_opt_in")
    .in("id", ids);
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = map.get(r.user_id);
    const optedOut = p && p.leaderboard_opt_in === false;
    return {
      user_id: r.user_id,
      name: optedOut ? "Anonymous" : (p?.name ?? "—"),
      avatar_url: optedOut ? null : (p?.avatar_url ?? null),
      value: r.value,
      meta: r.meta,
    } as LeaderboardRow;
  });
}

export const leaderboardService = {
  async weeklyMinutes(limit = 50) {
    const { data, error } = await supabase
      .from("leaderboard_weekly")
      .select("user_id, minutes_total_seconds, sessions")
      .order("minutes_total_seconds", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return hydrate(
      (data ?? []).map((r: any) => ({
        user_id: r.user_id,
        value: Math.floor((r.minutes_total_seconds ?? 0) / 60),
        meta: `${r.sessions} sessions`,
      }))
    );
  },

  async alltimeMinutes(limit = 50) {
    const { data, error } = await supabase
      .from("leaderboard_alltime")
      .select("user_id, minutes_total_seconds, sessions")
      .order("minutes_total_seconds", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return hydrate(
      (data ?? []).map((r: any) => ({
        user_id: r.user_id,
        value: Math.floor((r.minutes_total_seconds ?? 0) / 60),
        meta: `${r.sessions} sessions`,
      }))
    );
  },

  async xpAlltime(limit = 50) {
    const { data, error } = await supabase
      .from("leaderboard_xp_alltime")
      .select("user_id, xp, level")
      .order("xp", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return hydrate(
      (data ?? []).map((r: any) => ({
        user_id: r.user_id,
        value: Number(r.xp ?? 0),
        meta: `Level ${r.level}`,
      }))
    );
  },

  async xpWeekly(limit = 50) {
    const { data, error } = await supabase
      .from("leaderboard_xp_weekly")
      .select("user_id, xp")
      .order("xp", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return hydrate(
      (data ?? []).map((r: any) => ({
        user_id: r.user_id,
        value: Number(r.xp ?? 0),
        meta: "XP this week",
      }))
    );
  },

  async setOptIn(userId: string, optIn: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ leaderboard_opt_in: optIn })
      .eq("id", userId);
    if (error) throw error;
  },
};
