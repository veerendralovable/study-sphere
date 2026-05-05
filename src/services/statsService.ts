import { studySessionService } from "./studySessionService";

export interface UserStats {
  totalSeconds: number;
  sessionCount: number;
  todaySeconds: number;
  currentStreak: number;
  longestStreak: number;
  badges: string[];
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const statsService = {
  async getForUser(userId: string): Promise<UserStats> {
    const sessions = await studySessionService.listByUser(userId);
    const now = Date.now();
    const today = dateKey(new Date());

    // Include in-progress session as a partial duration up to "now".
    const enriched = sessions.map((s: any) => {
      const dur =
        s.duration && s.duration > 0
          ? s.duration
          : !s.end_time
            ? Math.max(0, Math.floor((now - new Date(s.start_time).getTime()) / 1000))
            : 0;
      return { ...s, _dur: dur };
    });

    const completed = enriched.filter((s) => s._dur > 0);
    const totalSeconds = completed.reduce((sum, s) => sum + s._dur, 0);
    const sessionCount = sessions.filter((s: any) => s.duration && s.duration > 0).length;

    const todaySeconds = completed
      .filter((s) => dateKey(new Date(s.start_time)) === today)
      .reduce((sum, s) => sum + s._dur, 0);

    const days = new Set(completed.map((s) => dateKey(new Date(s.start_time))));
    const sortedDays = Array.from(days).sort();

    let currentStreak = 0;
    const cursor = new Date();
    if (!days.has(dateKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
    while (days.has(dateKey(cursor))) {
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    let longestStreak = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const k of sortedDays) {
      const d = new Date(k);
      if (prev) {
        const diff = Math.round((d.getTime() - prev.getTime()) / 86_400_000);
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      longestStreak = Math.max(longestStreak, run);
      prev = d;
    }

    const badges: string[] = [];
    if (currentStreak >= 3) badges.push("🔥 On Fire");
    if (sessionCount >= 5) badges.push("💪 Consistent");
    if (totalSeconds >= 36_000) badges.push("🏆 10h Club");

    return { totalSeconds, sessionCount, todaySeconds, currentStreak, longestStreak, badges };
  },
};
