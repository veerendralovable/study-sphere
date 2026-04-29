import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "@/services/adminService";
import { Card } from "@/components/ui/card";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, TrendingUp, Clock, Users, Zap } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  daily_active_users: number;
  total_sessions: number;
  avg_session_duration: number;
  peak_usage_time: string;
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-8">
          <div className="text-center">Loading analytics...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-8">
          <Link to="/admin" className="flex items-center gap-2 text-primary mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">System statistics and insights</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <AnalyticsCard
            title="Daily Active Users"
            value={analytics?.daily_active_users || 0}
            icon={<Users className="h-6 w-6" />}
            trend="+12%"
          />
          <AnalyticsCard
            title="Total Sessions"
            value={analytics?.total_sessions || 0}
            icon={<Zap className="h-6 w-6" />}
            trend="+23%"
          />
          <AnalyticsCard
            title="Avg Session Duration"
            value={`${analytics?.avg_session_duration || 0}m`}
            icon={<Clock className="h-6 w-6" />}
            trend="+5%"
          />
          <AnalyticsCard
            title="Peak Usage Time"
            value={analytics?.peak_usage_time || "N/A"}
            icon={<TrendingUp className="h-6 w-6" />}
            trend="2-4 PM"
          />
        </div>

        {/* Detailed Metrics */}
        <Card className="bg-gradient-card border-border/60 p-8 shadow-card mt-8">
          <h2 className="text-2xl font-semibold mb-6">Detailed Metrics</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-4">User Engagement</h3>
              <div className="space-y-3">
                <MetricRow label="Daily Active Users" value={analytics?.daily_active_users || 0} />
                <MetricRow label="Total Sessions" value={analytics?.total_sessions || 0} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Session Metrics</h3>
              <div className="space-y-3">
                <MetricRow
                  label="Average Duration"
                  value={`${analytics?.avg_session_duration || 0} minutes`}
                />
                <MetricRow label="Peak Usage Time" value={analytics?.peak_usage_time || "N/A"} />
              </div>
            </div>
          </div>
        </Card>

        {/* Info Cards */}
        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <Card className="bg-gradient-card border-border/60 p-6 shadow-card">
            <h3 className="font-semibold mb-2">User Growth</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track the growth of your user base over time
            </p>
            <div className="text-2xl font-bold">Trending Up</div>
          </Card>
          <Card className="bg-gradient-card border-border/60 p-6 shadow-card">
            <h3 className="font-semibold mb-2">Session Trends</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor how session patterns change throughout the week
            </p>
            <div className="text-2xl font-bold">Consistent</div>
          </Card>
        </div>
      </main>
    </div>
  );
}

function AnalyticsCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend: string;
}) {
  return (
    <Card className="bg-gradient-card border-border/60 p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className="text-primary opacity-50">{icon}</div>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold">{value}</div>
        <span className="text-xs text-success">{trend}</span>
      </div>
    </Card>
  );
}

function MetricRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
