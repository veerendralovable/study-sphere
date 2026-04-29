import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminService } from "@/services/adminService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Lock, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Room {
  id: string;
  name: string;
  created_by: string;
  creator_name: string;
  is_private: boolean;
  members_count: number;
  created_at: string;
}

export default function AdminRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllRooms();
      setRooms(data);
    } catch (error) {
      console.error("Error loading rooms:", error);
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      await adminService.deleteRoom(roomId);
      setRooms(rooms.filter((r) => r.id !== roomId));
      toast.success("Room deleted");
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
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
          <h1 className="text-3xl font-bold">Room Management</h1>
          <p className="text-muted-foreground mt-2">Monitor and manage study rooms</p>
        </div>

        {/* Rooms Table */}
        <Card className="bg-gradient-card border-border/60 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead>Room Name</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : rooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No rooms found
                    </TableCell>
                  </TableRow>
                ) : (
                  rooms.map((room) => (
                    <TableRow key={room.id} className="border-border/40 hover:bg-primary/5">
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {room.creator_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {room.is_private && (
                            <>
                              <Lock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Private</span>
                            </>
                          )}
                          {!room.is_private && <span className="text-sm">Public</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{room.members_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(room.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/admin/rooms/${room.id}`)}
                            className="h-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(room.id)}
                            className="h-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
}
