import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { leaderboardService, LeaderboardRow } from "@/services/leaderboardService";

function Row({ rank, row, suffix }: { rank: number; row: LeaderboardRow; suffix: string }) {
  const initials = (row.name ?? "?").slice(0, 2).toUpperCase();
  return (
    <li className="flex items-center gap-3 rounded-md border border-border/40 bg-secondary/20 p-3">
      <span className="w-6 text-center font-mono text-sm tabular-nums text-muted-foreground">{rank}</span>
      <Avatar className="h-8 w-8">
        {row.avatar_url && <AvatarImage src={row.avatar_url} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="text-sm font-medium">{row.name}</div>
        {row.meta && <div className="text-xs text-muted-foreground">{row.meta}</div>}
      </div>
      <div className="text-sm font-semibold tabular-nums">
        {row.value.toLocaleString()} {suffix}
      </div>
    </li>
  );
}

function Board({ loader, suffix }: { loader: () => Promise<LeaderboardRow[]>; suffix: string }) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loader()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;
  if (rows.length === 0) return <p className="p-6 text-sm text-muted-foreground">No data yet.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <Row key={r.user_id} rank={i + 1} row={r} suffix={suffix} />
      ))}
    </ul>
  );
}

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-semibold">
          <Trophy className="h-6 w-6 text-primary" /> Leaderboard
        </h1>
        <Card className="bg-gradient-card border-border/60 p-5 shadow-card">
          <Tabs defaultValue="weekly_min">
            <TabsList className="mb-4 grid grid-cols-4">
              <TabsTrigger value="weekly_min">Weekly · min</TabsTrigger>
              <TabsTrigger value="alltime_min">All-time · min</TabsTrigger>
              <TabsTrigger value="weekly_xp">Weekly · XP</TabsTrigger>
              <TabsTrigger value="alltime_xp">All-time · XP</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly_min">
              <Board loader={() => leaderboardService.weeklyMinutes()} suffix="min" />
            </TabsContent>
            <TabsContent value="alltime_min">
              <Board loader={() => leaderboardService.alltimeMinutes()} suffix="min" />
            </TabsContent>
            <TabsContent value="weekly_xp">
              <Board loader={() => leaderboardService.xpWeekly()} suffix="XP" />
            </TabsContent>
            <TabsContent value="alltime_xp">
              <Board loader={() => leaderboardService.xpAlltime()} suffix="XP" />
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}
