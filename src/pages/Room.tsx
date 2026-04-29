import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { roomService } from "@/services/roomService";
import { roomMemberService } from "@/services/roomMemberService";
import { timerService } from "@/services/timerService";
import { studySessionService } from "@/services/studySessionService";
import { statsService, UserStats } from "@/services/statsService";
import { useRoomMembers } from "@/hooks/useRoomMembers";
import { useRoomTimer } from "@/hooks/useRoomTimer";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { SessionCompletion } from "@/components/SessionCompletion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  LogOut,
  Lock,
  Play,
  Square,
  Trash2,
  KeyRound,
  Copy,
  ShieldAlert,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

function fmtMMSS(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [duration, setDuration] = useState(25);
  const [togglingExam, setTogglingExam] = useState(false);

  // Session completion state
  const [sessionCompleteOpen, setSessionCompleteOpen] = useState(false);
  const [completedSessionSeconds, setCompletedSessionSeconds] = useState(0);
  const [completionStats, setCompletionStats] = useState<UserStats | null>(null);

  const sessionRef = useRef<{ id: string; start_time: string } | null>(null);

  const { members } = useRoomMembers(accessGranted ? id : undefined);
  const { timer, remaining } = useRoomTimer(accessGranted ? id : undefined);

  // Load room
  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    (async () => {
      setLoadingRoom(true);
      try {
        const r = await roomService.getById(id);
        if (cancelled) return;
        if (!r) {
          toast.error("Room not found");
          navigate("/");
          return;
        }
        setRoom(r);
        const m = await roomMemberService.myMembership(user.id, id);
        if (m && m.status === "active") {
          setAccessGranted(true);
        } else if (m && m.status === "removed") {
          toast.error("You were removed from this room");
          navigate("/");
        } else if (!r.is_private) {
          await roomMemberService.join(user.id, r.id);
          setAccessGranted(true);
        }
      } catch (e: any) {
        toast.error(e.message ?? "Failed to load room");
      } finally {
        if (!cancelled) setLoadingRoom(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, user, navigate]);

  // Realtime subscription on this rooms row (exam_mode toggles)
  useEffect(() => {
    if (!id || !accessGranted) return;
    const channel = supabase
      .channel(`room-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${id}` },
        (payload) => setRoom((prev: any) => ({ ...prev, ...payload.new }))
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, accessGranted]);

  // Track study session
  useEffect(() => {
    if (!accessGranted || !user || !id) return;
    let active = true;
    (async () => {
      try {
        const s = await studySessionService.start(user.id, id);
        if (active) sessionRef.current = { id: s.id, start_time: s.start_time };
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      active = false;
      const s = sessionRef.current;
      if (s) {
        studySessionService.end(s.id, s.start_time).catch(() => {});
        sessionRef.current = null;
      }
    };
  }, [accessGranted, user, id]);

  const joinWithCode = async () => {
    if (!user || !room) return;
    setJoining(true);
    try {
      await roomMemberService.joinPrivate(room.id, codeInput.trim());
      setAccessGranted(true);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  const isCreator = room?.created_by === user?.id;
  const examMode = !!room?.exam_mode;
  const examLocked = examMode && !isCreator;

  const leave = async () => {
    if (!user || !id) return;
    if (examLocked) {
      toast.error("Exam in progress -- you can't leave right now");
      return;
    }
    setLeaving(true);
    try {
      const s = sessionRef.current;
      let sessionSeconds = 0;
      if (s) {
        const end = new Date();
        sessionSeconds = Math.max(0, Math.floor((end.getTime() - new Date(s.start_time).getTime()) / 1000));
        await studySessionService.end(s.id, s.start_time).catch(() => {});
        sessionRef.current = null;
      }
      await roomMemberService.leave(user.id, id);

      // Fetch fresh stats for the completion modal
      if (user) {
        try {
          const freshStats = await statsService.getForUser(user.id);
          setCompletionStats(freshStats);
          setCompletedSessionSeconds(sessionSeconds);
          setSessionCompleteOpen(true);
        } catch {
          toast.success("Left room");
          navigate("/");
        }
      } else {
        toast.success("Left room");
        navigate("/");
      }
    } catch (e: any) {
      toast.error(e.message);
      setLeaving(false);
    }
  };

  const handleSessionCompleteClose = () => {
    setSessionCompleteOpen(false);
    navigate("/");
  };

  const startTimer = async () => {
    if (!id) return;
    setActing(true);
    try {
      await timerService.start(id, Math.max(1, Math.min(180, duration)) * 60);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActing(false);
    }
  };

  const stopTimer = async () => {
    if (!id) return;
    setActing(true);
    try {
      await timerService.stop(id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActing(false);
    }
  };

  const removeMember = async (targetUserId: string) => {
    if (!id) return;
    try {
      await roomMemberService.remove(targetUserId, id);
      toast.success("Member removed");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to remove");
    }
  };

  const toggleExamMode = async (next: boolean) => {
    if (!id) return;
    setTogglingExam(true);
    try {
      const updated = await roomService.setExamMode(id, next);
      if (updated) setRoom((prev: any) => ({ ...prev, ...updated }));
      toast.success(next ? "Exam mode enabled" : "Exam mode disabled");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to toggle exam mode");
    } finally {
      setTogglingExam(false);
    }
  };

  const copyCode = () => {
    if (!room?.room_code) return;
    navigator.clipboard.writeText(room.room_code);
    toast.success("Code copied");
  };

  // Circular timer calculations
  const totalDuration = timer?.duration ?? duration * 60;
  const progress = totalDuration > 0 ? remaining / totalDuration : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress);

  if (loadingRoom) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-8 text-sm text-muted-foreground">Loading room...</div>
      </div>
    );
  }

  // Private room gate
  if (room && !accessGranted) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container max-w-md py-12">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Card className="bg-gradient-card border-border/60 p-6 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <h1 className="text-xl font-semibold">{room.name}</h1>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              This is a private room. Enter the room code to join.
            </p>
            <div className="flex gap-2">
              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={12}
              />
              <Button onClick={joinWithCode} disabled={joining}>
                {joining ? "..." : "Join"}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <AppHeader />

        {examMode && (
          <div className="border-b border-destructive/40 bg-destructive/10">
            <div className="container flex items-center gap-2 py-2 text-sm text-destructive">
              <ShieldAlert className="h-4 w-4" />
              <span className="font-medium">Exam mode is active.</span>
              <span className="text-destructive/80">
                {isCreator
                  ? "Members can't leave or control the timer."
                  : "Stay focused -- controls are locked by the room creator."}
              </span>
            </div>
          </div>
        )}

        <main className="container py-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
          </Button>

          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-semibold">{room?.name}</h1>
                {room?.is_private && (
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
              {room?.room_code && (
                <button
                  onClick={copyCode}
                  className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span className="font-mono">{room.room_code}</span>
                  <Copy className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isCreator && (
                <div className="flex items-center gap-2 rounded-md border border-border/60 bg-secondary/40 px-3 py-2">
                  <Label htmlFor="exam-toggle" className="text-xs text-muted-foreground">
                    Exam mode
                  </Label>
                  <Switch
                    id="exam-toggle"
                    checked={examMode}
                    onCheckedChange={toggleExamMode}
                    disabled={togglingExam}
                  />
                </div>
              )}
              {examLocked ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button variant="outline" disabled>
                        <LogOut className="mr-2 h-4 w-4" /> Leave room
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Exam in progress -- leaving is disabled</TooltipContent>
                </Tooltip>
              ) : (
                <Button variant="outline" onClick={leave} disabled={leaving} className="transition-all active:scale-95">
                  <LogOut className="mr-2 h-4 w-4" />
                  {leaving ? "Leaving..." : "Leave room"}
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Timer */}
            <Card className="bg-gradient-card border-border/60 p-8 shadow-card transition-base hover:border-primary/30 hover:shadow-glow">
              <h2 className="text-sm uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary">Shared timer</h2>

              <div className="my-6 flex items-center justify-center">
                <div className="relative">
                  <svg width="260" height="260" viewBox="0 0 260 260" className="-rotate-90">
                    <circle
                      cx="130"
                      cy="130"
                      r="120"
                      fill="none"
                      stroke="hsl(var(--secondary))"
                      strokeWidth="8"
                    />
                    <circle
                      cx="130"
                      cy="130"
                      r="120"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transition: "stroke-dashoffset 500ms ease-out" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-6xl font-semibold tabular-nums">
                      {fmtMMSS(remaining)}
                    </span>
                    {timer?.is_active && (
                      <span className="mt-1 text-xs text-primary">Synced for everyone</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="duration" className="text-sm text-muted-foreground">Duration (min)</label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    max={180}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                    className="w-20"
                    disabled={timer?.is_active || examLocked}
                  />
                </div>
                <Button
                  variant="hero"
                  onClick={startTimer}
                  disabled={acting || !!timer?.is_active || examLocked}
                  className="transition-all active:scale-95"
                >
                  <Play className="mr-2 h-4 w-4" /> Start
                </Button>
                <Button
                  variant="outline"
                  onClick={stopTimer}
                  disabled={acting || !timer?.is_active || examLocked}
                  className="transition-all active:scale-95"
                >
                  <Square className="mr-2 h-4 w-4" /> Stop
                </Button>
              </div>

              {examLocked && (
                <p className="mt-4 text-center text-xs text-destructive">
                  Timer controls are locked during exam mode.
                </p>
              )}
            </Card>

            {/* Members */}
            <Card className="bg-gradient-card border-border/60 p-6 shadow-card transition-base hover:border-primary/30 hover:shadow-glow">
              <h2 className="mb-4 text-sm uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary">
                Active members ({members.length})
              </h2>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active members</p>
              ) : (
                <ul className="space-y-2">
                  {members.map((m) => {
                    const isCurrentUser = m.user_id === user?.id;
                    const isMemberCreator = m.role === "creator";
                    return (
                      <li
                        key={m.id}
                        className={`flex items-center justify-between rounded-lg p-3 transition-all hover:shadow-glow ${
                          isCurrentUser
                            ? "bg-primary/10 border border-primary/20 hover:border-primary/40"
                            : "bg-secondary/40 hover:bg-secondary/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            isCurrentUser
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {(m.profile?.name ?? "M")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`truncate text-sm font-medium ${isCurrentUser ? "text-primary" : ""}`}>
                                {m.profile?.name ?? m.profile?.email ?? "Member"}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] font-medium uppercase tracking-wider text-primary/70">You</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                              {isMemberCreator && <Crown className="h-3 w-3 text-warning" />}
                              <span>{isMemberCreator ? "Creator" : "Member"}</span>
                            </div>
                          </div>
                        </div>
                        {isCreator && m.user_id !== user?.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeMember(m.user_id)}
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
          </div>
        </main>

        <SessionCompletion
          open={sessionCompleteOpen}
          onClose={handleSessionCompleteClose}
          sessionSeconds={completedSessionSeconds}
          todaySeconds={completionStats?.todaySeconds ?? 0}
          sessionCount={completionStats?.sessionCount ?? 0}
          currentStreak={completionStats?.currentStreak ?? 0}
          badges={completionStats?.badges ?? []}
        />
      </div>
    </TooltipProvider>
  );
}
