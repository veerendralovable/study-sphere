import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Users, Timer as TimerIcon, ArrowRight } from "lucide-react";

export interface RoomCardProps {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount?: number;
  timerActive?: boolean;
  isYours?: boolean;
  onJoin?: () => void;
  joinLabel?: string;
  joining?: boolean;
}

export function RoomCard({
  id,
  name,
  isPrivate,
  memberCount = 0,
  timerActive,
  isYours,
  onJoin,
  joinLabel = "Join",
  joining,
}: RoomCardProps) {
  return (
    <Card className="bg-gradient-card group flex flex-col gap-4 border-border/60 p-5 shadow-card transition-base hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {memberCount} active
            </span>
            {timerActive && (
              <span className="inline-flex items-center gap-1 text-primary">
                <TimerIcon className="h-3.5 w-3.5" /> studying now
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isPrivate && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" /> Private
            </Badge>
          )}
          {isYours && <Badge variant="outline">Yours</Badge>}
        </div>
      </div>
      <div className="mt-auto flex items-center gap-2">
        {onJoin && (
          <Button size="sm" variant="secondary" onClick={onJoin} disabled={joining}>
            {joining ? "Joining…" : joinLabel}
          </Button>
        )}
        <Button size="sm" variant="ghost" asChild>
          <Link to={`/room/${id}`}>
            Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
