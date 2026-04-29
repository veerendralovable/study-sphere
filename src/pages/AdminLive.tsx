import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "@/services/adminService";
import { Card } from "@/components/ui/card";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Activity, Users } from "lucide-react";
import { toast } from "sonner";

export default function AdminLive() {
  const [liveData, setLiveData] = useState({
    active_rooms: [],
    active_sessions: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLiveData();
    const interval = setInterval(loadLiveData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadLiveData = async () => {
    try {
      setRefreshing(true);
      const data = await adminService.getLiveData();
      setLiveData(data);
    } catch (error) {
      console.error("Error loading live data:", error);
      if (loading) toast.error("Failed to load live data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-8">
          <Link to="/admin" className="flex items-center gap-2 text-primary mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Live Monitoring</h1>
              <p className="text-muted-foreground mt-2">Real-time system activity</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${refreshing ? "bg-yellow-500" : "bg-success"}`} />
              <span className="text-sm text-muted-foreground">
                {refreshing ? "Updating..." : "Live"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Sessions */}
          <Card className="bg-gradient-card border-border/60 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                Active Sessions ({liveData.active_sessions.length})
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : liveData.active_sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No active sessions</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {liveData.active_sessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <div>
                      <p className="font-medium text-sm">{session.profiles?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        Started{" "}
                        {new Date(session.start_time).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Active Rooms */}
          <Card className="bg-gradient-card border-border/60 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                Active Rooms ({liveData.active_rooms.length})
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : liveData.active_rooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No active rooms</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {liveData.active_rooms.map((room: any) => (
                  <div
                    key={room.room_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <div>
                      <p className="font-medium text-sm">{room.rooms?.name || "Unknown Room"}</p>
                      <p className="text-xs text-muted-foreground">
                        {room.room_id === "all" ? "Multiple rooms" : "Active timer"}
                      </p>
                    </div>
                    <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Stats Summary */}
        <Card className="bg-gradient-card border-border/60 p-6 shadow-card mt-6">
          <h2 className="font-semibold mb-4">Summary</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="text-3xl font-bold">{liveData.active_sessions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Rooms</p>
              <p className="text-3xl font-bold">{liveData.active_rooms.length}</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
