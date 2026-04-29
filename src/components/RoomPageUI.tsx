import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Lock, Trash2, ShieldAlert } from "lucide-react";

export interface RoomMember {
  id: string;
  user_id: string;
  profile?: {
    name?: string;
    email?: string;
  };
  role: "creator" | "member";
}

export interface RoomPageUIProps {
  roomName: string;
  roomCode?: string;
  isPrivate: boolean;
  examMode: boolean;
  isCreator: boolean;
  members: RoomMember[];
  currentUserId?: string;
  onCopyCode?: () => void;
  onRemoveMember?: (userId: string) => void;
}

export function RoomPageUI({
  roomName,
  roomCode,
  isPrivate,
  examMode,
  isCreator,
  members,
  currentUserId,
  onCopyCode,
  onRemoveMember,
}: RoomPageUIProps) {
  return (
    <>
      {/* Header Section */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold transition-colors">{roomName}</h1>
            {isPrivate && (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" /> Private
              </Badge>
            )}
            {examMode && (
              <Badge variant="destructive" className="gap-1">
                <ShieldAlert className="h-3 w-3" /> Exam
              </Badge>
            )}
          </div>
          {roomCode && (
            <button
              onClick={onCopyCode}
              className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="font-mono">{roomCode}</span>
            </button>
          )}
        </div>
      </div>

      {/* Exam Mode Banner */}
      {examMode && (
        <div className="mb-6 border-l-4 border-destructive bg-destructive/10 p-4 rounded-r-lg">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <span className="font-medium text-destructive">Exam Mode Enabled — Focus Locked</span>
          </div>
          <p className="mt-1 text-sm text-destructive/80">
            {isCreator
              ? "Members can't leave or control the timer."
              : "Stay focused — controls are locked by the room creator."}
          </p>
        </div>
      )}

      {/* Members Section */}
      <Card className="bg-gradient-card border-border/60 p-6 shadow-card transition-base hover:border-primary/30 hover:shadow-glow">
        <h2 className="mb-4 text-sm uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary">
          Active members ({members.length})
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active members</p>
        ) : (
          <ul className="space-y-2">
            {members.map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              const isMemberCreator = member.role === "creator";
              return (
                <li
                  key={member.id}
                  className={`flex items-center justify-between rounded-lg p-3 transition-all hover:shadow-glow ${
                    isCurrentUser
                      ? "bg-primary/10 border border-primary/20 hover:border-primary/40"
                      : "bg-secondary/40 hover:bg-secondary/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isCurrentUser
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {(member.profile?.name ?? "M")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`truncate text-sm font-medium ${
                            isCurrentUser ? "text-primary" : ""
                          }`}
                        >
                          {member.profile?.name ?? member.profile?.email ?? "Member"}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-primary/70">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        {isMemberCreator && (
                          <Crown className="h-3 w-3 text-warning" />
                        )}
                        <span>{isMemberCreator ? "Creator" : "Member"}</span>
                      </div>
                    </div>
                  </div>
                  {isCreator && member.user_id !== currentUserId && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveMember?.(member.user_id)}
                      title="Remove member"
                      className="h-8 w-8 shrink-0 transition-all active:scale-95 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
