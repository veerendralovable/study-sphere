import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { roomService } from "@/services/roomService";
import { roomMemberService } from "@/services/roomMemberService";
import { timerService } from "@/services/timerService";
import { studySessionService } from "@/services/studySessionService";
import { useRoomMembers } from "@/hooks/useRoomMembers";
import { useRoomTimer } from "@/hooks/useRoomTimer";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, LogOut, Lock, Play, Square, Trash2, KeyRound, Copy } from "lucide-react";
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
        // Check existing membership
        const m = await roomMemberService.myMembership(user.id, id);
        if (m && m.status === "active") {
          setAccessGranted(true);
        } else if (m && m.status === "removed") {
          toast.error("You were removed from this room");
          navigate("/");
        } else if (!r.is_private) {
          // Auto-join public rooms
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

  // Track study session: start on entry, end on leave/unmount
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
      // Server-side validation of code via SECURITY DEFINER RPC
      await roomMemberService.joinPrivate(room.id, codeInput.trim());
      setAccessGranted(true);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  const leave = async () => {
    if (!user || !id) return;
    setLeaving(true);
    try {
      const s = sessionRef.current;
      if (s) {
        await studySessionService.end(s.id, s.start_time).catch(() => {});
        sessionRef.current = null;
      }
      await roomMemberService.leave(user.id, id);
      toast.success("Left room");
      navigate("/");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLeaving(false);
    }
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

  const copyCode = () => {
    if (!room?.room_code) return;
    navigator.clipboard.writeText(room.room_code);
    toast.success("Code copied");
  };

  if (loadingRoom) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-8 text-sm text-muted-foreground">Loading room…</div>
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
                {joining ? "…" : "Join"}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const isCreator = room?.created_by === user?.id;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
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
            </div>
            <button
              onClick={copyCode}
              className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="font-mono">{room?.room_code}</span>
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <Button variant="outline" onClick={leave} disabled={leaving}>
            <LogOut className="mr-2 h-4 w-4" />
            {leaving ? "Leaving…" : "Leave room"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Timer */}
          <Card className="bg-gradient-card border-border/60 p-8 shadow-card">
            <h2 className="text-sm uppercase tracking-wide text-muted-foreground">Shared timer</h2>
            <div className="my-6 text-center font-mono text-7xl font-semibold tabular-nums">
              {fmtMMSS(remaining)}
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
                  disabled={timer?.is_active}
                />
              </div>
              <Button
                variant="hero"
                onClick={startTimer}
                disabled={acting || !!timer?.is_active}
              >
                <Play className="mr-2 h-4 w-4" /> Start
              </Button>
              <Button
                variant="outline"
                onClick={stopTimer}
                disabled={acting || !timer?.is_active}
              >
                <Square className="mr-2 h-4 w-4" /> Stop
              </Button>
            </div>
            {timer?.is_active && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Synced for everyone in the room
              </p>
            )}
          </Card>

          {/* Members */}
          <Card className="bg-gradient-card border-border/60 p-6 shadow-card">
            <h2 className="mb-3 text-sm uppercase tracking-wide text-muted-foreground">
              Active members ({members.length})
            </h2>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active members</p>
            ) : (
              <ul className="space-y-2">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/40 p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {m.profile?.name ?? m.profile?.email ?? "Member"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {m.role === "creator" ? "Creator" : "Member"}
                      </div>
                    </div>
                    {isCreator && m.user_id !== user?.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeMember(m.user_id)}
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
