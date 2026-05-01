import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "@/services/adminService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Shield, UserX } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  total_sessions: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUserRole(userId, newRole as "admin" | "moderator" | "user");
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success("User role updated");
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      await adminService.deactivateUser(userId);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, status: "blocked" } : u))
      );
      toast.success("User deactivated");
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast.error("Failed to deactivate user");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !selectedRole || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-8">
          <Link to="/admin" className="flex items-center gap-2 text-primary mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage user roles and permissions</p>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-card border-border/60 p-6 shadow-card mb-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <select
              value={selectedRole || ""}
              onChange={(e) => setSelectedRole(e.target.value || null)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All roles</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="bg-gradient-card border-border/60 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border/40 hover:bg-primary/5">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            user.status === "active"
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{user.total_sessions}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeactivate(user.id)}
                          disabled={user.status === "blocked"}
                          className="h-8"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
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
