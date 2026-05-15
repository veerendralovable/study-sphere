import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { gamificationService, BadgeDef, UserBadge } from "@/services/gamificationService";
import { Award } from "lucide-react";

export function BadgeGrid({ userId }: { userId: string }) {
  const [defs, setDefs] = useState<BadgeDef[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      gamificationService.listBadges(),
      gamificationService.listUserBadges(userId),
    ]).then(([d, u]) => {
      setDefs(d);
      setOwned(new Set(u.map((b: UserBadge) => b.badge_code)));
    });
  }, [userId]);

  return (
    <Card className="bg-gradient-card border-border/60 p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Award className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Badges</h3>
        <Badge variant="secondary" className="ml-auto">{owned.size}/{defs.length}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {defs.map((b) => {
          const has = owned.has(b.code);
          return (
            <div
              key={b.code}
              title={b.description}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-base ${
                has
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/40 bg-secondary/30 opacity-50"
              }`}
            >
              <div className={`text-2xl ${has ? "" : "grayscale"}`}>
                {b.tier === "platinum" ? "💎" : b.tier === "gold" ? "🏆" : b.tier === "silver" ? "🥈" : "🥉"}
              </div>
              <div className="text-xs font-medium">{b.name}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
