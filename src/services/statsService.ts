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
    const completed = sessions.filter((s) => s.duration && s.duration > 0);

    const totalSeconds = completed.reduce((sum, s) => sum + (s.duration ?? 0), 0);
    const sessionCount = completed.length;

    const today = dateKey(new Date());
    const todaySeconds = completed
      .filter((s) => dateKey(new Date(s.start_time)) === today)
      .reduce((sum, s) => sum + (s.duration ?? 0), 0);

    // Streak calculation: consecutive days (UTC) ending today/yesterday with at least one session
    const days = new Set(completed.map((s) => dateKey(new Date(s.start_time))));
    const sortedDays = Array.from(days).sort();

    let currentStreak = 0;
    const cursor = new Date();
    // Allow streak to be valid if user studied today OR yesterday (so they don't lose streak mid-day)
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
    if (currentStreak > 3) badges.push("🔥 On Fire");
    if (sessionCount >= 5) badges.push("💪 Consistent");

    return { totalSeconds, sessionCount, todaySeconds, currentStreak, longestStreak, badges };
  },
};
