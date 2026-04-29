import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { roomService } from "@/services/roomService";
import { roomMemberService } from "@/services/roomMemberService";
import { timerService } from "@/services/timerService";
import { statsService, UserStats } from "@/services/statsService";
import { roomNameSchema, roomCodeSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppHeader } from "@/components/AppHeader";
import { ProfileDialog } from "@/components/ProfileDialog";
import { RoomCard } from "@/components/RoomCard";
import { DailyGoal } from "@/components/DailyGoal";
import { StatsCard } from "@/components/StatsCard";
import { Plus, Search, KeyRound, Flame, Clock, ChartBar as BarChart3, Zap, Users } from "lucide-react";
import { toast } from "sonner";

interface RoomWithMeta {
  id: string;
  name: string;
  is_private: boolean;
  created_by: string | null;
  memberCount: number;
  timerActive: boolean;
}

function fmtSeconds(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allRooms, setAllRooms] = useState<RoomWithMeta[]>([]);
  const [myMemberRoomIds, setMyMemberRoomIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrivate, setNewPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [rooms, myMemberships] = await Promise.all([
        roomService.listAll(),
        roomMemberService.listMyRooms(user.id),
      ]);
      const roomIds = rooms.map((r) => r.id);
      const [counts, timers] = await Promise.all([
        Promise.all(roomIds.map((id) => roomMemberService.countActiveByRoom(id))),
        timerService.getActiveByRooms(roomIds),
      ]);
      const timerMap = new Map(timers.map((t) => [t.room_id, t.is_active]));
      setAllRooms(
        rooms.map((r, i) => ({
          id: r.id,
          name: r.name,
          is_private: r.is_private,
          created_by: r.created_by,
          memberCount: counts[i] ?? 0,
          timerActive: timerMap.get(r.id) === true,
        }))
      );
      setMyMemberRoomIds(new Set(myMemberships.map((m) => m.room_id)));
      const s = await statsService.getForUser(user.id);
      setStats(s);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const yourRooms = useMemo(
    () => allRooms.filter((r) => r.created_by === user?.id),
    [allRooms, user?.id]
  );
  const joinedRooms = useMemo(
    () =>
      allRooms.filter(
        (r) => myMemberRoomIds.has(r.id) && r.created_by !== user?.id
      ),
    [allRooms, myMemberRoomIds, user?.id]
  );
  const discover = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRooms
      .filter((r) => !r.is_private)
      .filter((r) => !myMemberRoomIds.has(r.id))
      .filter((r) => (q ? r.name.toLowerCase().includes(q) : true));
  }, [allRooms, search, myMemberRoomIds]);

  const createRoom = async () => {
    if (!user) return;
    const parsed = roomNameSchema.safeParse(newName);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setCreating(true);
    try {
      const room = await roomService.create(parsed.data, user.id, newPrivate);
      await roomMemberService.join(user.id, room.id, "creator");
      toast.success("Room created");
      setCreateOpen(false);
      setNewName("");
      setNewPrivate(false);
      navigate(`/room/${room.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async (roomId: string, isPrivate: boolean) => {
    if (!user) return;
    if (isPrivate) {
      toast.error("Private room — use the room code to join");
      return;
    }
    setJoiningId(roomId);
    try {
      await roomMemberService.join(user.id, roomId);
      navigate(`/room/${roomId}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to join");
    } finally {
      setJoiningId(null);
    }
  };

  const joinByCode = async () => {
    if (!user) return;
    const parsed = roomCodeSchema.safeParse(code);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setJoiningCode(true);
    try {
      const membership = await roomMemberService.joinByCode(parsed.data);
      toast.success("Joined room");
      setCode("");
      navigate(`/room/${membership.room_id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to join");
    } finally {
      setJoiningCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onProfile={() => setProfileOpen(true)} />
      <main className="container py-8">
        {/* Stats Row */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={<Clock className="h-4 w-4" />}
            label="Today"
            value={stats ? fmtSeconds(stats.todaySeconds) : "—"}
          />
          <StatsCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="Total studied"
            value={stats ? fmtSeconds(stats.totalSeconds) : "—"}
          />
          <StatsCard
            icon={<Flame className="h-4 w-4" />}
            label="Current streak"
            value={stats ? `${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}` : "—"}
          />
          <StatsCard
            icon={<Zap className="h-4 w-4" />}
            label="Sessions"
            value={stats?.sessionCount ?? "—"}
            extra={stats?.badges.join(" · ")}
          />
        </section>

        {/* Daily Goal */}
        <section className="mb-8">
          <DailyGoal todaySeconds={stats?.todaySeconds ?? 0} />
        </section>

        {/* Actions */}
        <section className="mb-8 flex flex-col gap-3 sm:flex-row">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="sm:w-auto transition-all active:scale-95">
                <Plus className="mr-2 h-4 w-4 transition-transform" /> Create room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a study room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room name</Label>
                  <Input id="room-name" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 p-3">
                  <div>
                    <Label htmlFor="room-private" className="text-sm">Private room</Label>
                    <p className="text-xs text-muted-foreground">Joinable only via room code</p>
                  </div>
                  <Switch id="room-private" checked={newPrivate} onCheckedChange={setNewPrivate} />
                </div>
                <Button className="w-full transition-all active:scale-95" onClick={createRoom} disabled={creating} variant="hero">
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search public rooms..."
              className="border-0 px-0 focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Room code"
              maxLength={12}
              className="w-32 border-0 px-0 focus-visible:ring-0"
            />
            <Button size="sm" onClick={joinByCode} disabled={joiningCode || !code} className="transition-all active:scale-95">
              {joiningCode ? "..." : "Join"}
            </Button>
          </div>
        </section>

        <RoomSection
          title="Your rooms"
          empty="No rooms yet"
          emptyCta="Create your first room"
          onCta={() => setCreateOpen(true)}
          rooms={yourRooms}
          loading={loading}
          isYours
          onJoin={(r) => navigate(`/room/${r.id}`)}
          joinLabel="Open"
          joiningId={joiningId}
        />
        <RoomSection
          title="Joined rooms"
          empty="You haven't joined any rooms yet."
          rooms={joinedRooms}
          loading={loading}
          onJoin={(r) => navigate(`/room/${r.id}`)}
          joinLabel="Open"
          joiningId={joiningId}
        />
        <RoomSection
          title="Discover"
          empty={search ? "No public rooms match that search." : "No public rooms to join right now."}
          rooms={discover}
          loading={loading}
          onJoin={(r) => joinRoom(r.id, r.is_private)}
          joinLabel="Join"
          joiningId={joiningId}
        />
      </main>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}

function RoomSection({
  title,
  empty,
  emptyCta,
  onCta,
  rooms,
  loading,
  isYours,
  onJoin,
  joinLabel,
  joiningId,
}: {
  title: string;
  empty: string;
  emptyCta?: string;
  onCta?: () => void;
  rooms: RoomWithMeta[];
  loading: boolean;
  isYours?: boolean;
  onJoin?: (r: RoomWithMeta) => void;
  joinLabel?: string;
  joiningId?: string | null;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-36 animate-pulse bg-gradient-card border-border/60 p-5" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-transparent p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{empty}</p>
          {emptyCta && onCta && (
            <Button variant="hero" size="sm" className="mt-4 transition-all active:scale-95" onClick={onCta}>
              <Plus className="mr-2 h-4 w-4" /> {emptyCta}
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <RoomCard
              key={r.id}
              id={r.id}
              name={r.name}
              isPrivate={r.is_private}
              memberCount={r.memberCount}
              timerActive={r.timerActive}
              isYours={isYours}
              onJoin={onJoin ? () => onJoin(r) : undefined}
              joinLabel={joinLabel}
              joining={joiningId === r.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
