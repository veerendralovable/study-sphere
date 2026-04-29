import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService, UserStats } from "@/services/adminService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { Users, Zap, BookOpen, BarChart3, AlertCircle, FileText, Settings } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error loading stats:", error);
        toast.error("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">System overview and management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <StatCard
            label="Total Users"
            value={stats?.total_users || 0}
            icon={<Users className="h-4 w-4" />}
            loading={loading}
          />
          <StatCard
            label="Total Rooms"
            value={stats?.total_rooms || 0}
            icon={<BookOpen className="h-4 w-4" />}
            loading={loading}
          />
          <StatCard
            label="Active Sessions"
            value={stats?.active_sessions || 0}
            icon={<Zap className="h-4 w-4" />}
            loading={loading}
          />
          <StatCard
            label="Sessions Today"
            value={stats?.sessions_today || 0}
            icon={<BarChart3 className="h-4 w-4" />}
            loading={loading}
          />
        </div>

        {/* Management Links */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AdminCard
            title="User Management"
            description="Manage users, roles, and permissions"
            href="/admin/users"
            icon={<Users className="h-6 w-6" />}
          />
          <AdminCard
            title="Room Management"
            description="Control rooms and monitor members"
            href="/admin/rooms"
            icon={<BookOpen className="h-6 w-6" />}
          />
          <AdminCard
            title="Live Monitoring"
            description="Real-time activity monitoring"
            href="/admin/live"
            icon={<Zap className="h-6 w-6" />}
          />
          <AdminCard
            title="Analytics"
            description="System statistics and insights"
            href="/admin/analytics"
            icon={<BarChart3 className="h-6 w-6" />}
          />
          <AdminCard
            title="Moderation"
            description="Review and resolve user reports"
            href="/admin/reports"
            icon={<AlertCircle className="h-6 w-6" />}
            badge="V2"
          />
          <AdminCard
            title="Audit Logs"
            description="Track all admin actions and events"
            href="/admin/logs"
            icon={<FileText className="h-6 w-6" />}
            badge="V2"
          />
          <AdminCard
            title="System Settings"
            description="Configure system-wide parameters"
            href="/admin/settings"
            icon={<Settings className="h-6 w-6" />}
            badge="V2"
          />
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card className="bg-gradient-card border-border/60 p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-2">{loading ? "..." : value}</p>
        </div>
        <div className="text-primary opacity-50">{icon}</div>
      </div>
    </Card>
  );
}

function AdminCard({
  title,
  description,
  href,
  icon,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}) {
  return (
    <Link to={href}>
      <Card className="bg-gradient-card border-border/60 p-6 shadow-card hover:border-primary/40 hover:shadow-glow transition-all cursor-pointer h-full">
        <div className="flex items-start gap-4">
          <div className="text-primary">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{title}</h3>
              {badge && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
