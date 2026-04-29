import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "@/services/adminService";
import { advancedAnalyticsService } from "@/services/adminV2Service";
import { Card } from "@/components/ui/card";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, TrendingUp, Clock, Users, Zap, Activity } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  daily_active_users: number;
  total_sessions: number;
  avg_session_duration: number;
  peak_usage_time: string;
}

interface EnhancedMetrics {
  retention_7day: number;
  avg_sessions_per_user: number;
  peak_hours: Array<{ hour: number; sessions: number }>;
  session_trends: Array<{ date: string; sessions: number }>;
  inactive_users_count: number;
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [enhanced, setEnhanced] = useState<EnhancedMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load V1 analytics
      const data = await adminService.getAnalytics();
      setAnalytics(data);

      // Load V2 advanced analytics
      const retention = await advancedAnalyticsService.getRetention(7);
      const avgSessions = await advancedAnalyticsService.getAverageSessionsPerUser();
      const peakHours = await advancedAnalyticsService.getPeakHours();
      const trends = await advancedAnalyticsService.getSessionTrends();
      const inactiveUsers = await advancedAnalyticsService.getInactiveUsers(7);

      setEnhanced({
        retention_7day: retention,
        avg_sessions_per_user: avgSessions,
        peak_hours: peakHours,
        session_trends: trends,
        inactive_users_count: inactiveUsers.length,
      });
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
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-2">System metrics and user behavior insights</p>
        </div>

        {/* V1 Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Active Users</p>
                  <p className="text-3xl font-bold mt-2">{analytics.daily_active_users}</p>
                </div>
                <Users className="h-5 w-5 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-3xl font-bold mt-2">{analytics.total_sessions}</p>
                </div>
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Session Duration</p>
                  <p className="text-3xl font-bold mt-2">{analytics.avg_session_duration}m</p>
                </div>
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Peak Usage Time</p>
                  <p className="text-3xl font-bold mt-2">{analytics.peak_usage_time}</p>
                </div>
                <Zap className="h-5 w-5 text-primary" />
              </div>
            </Card>
          </div>
        )}

        {/* V2 Advanced Metrics */}
        {enhanced && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">7-Day Retention</h3>
                <p className="text-4xl font-bold text-primary">{enhanced.retention_7day}</p>
                <p className="text-sm text-muted-foreground mt-2">Users returning after first week</p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Avg Sessions Per User</h3>
                <p className="text-4xl font-bold text-primary">{enhanced.avg_sessions_per_user.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-2">Overall engagement metric</p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Inactive Users (7 days)</h3>
                <p className="text-4xl font-bold text-orange-500">{enhanced.inactive_users_count}</p>
                <p className="text-sm text-muted-foreground mt-2">Users with no recent activity</p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Peak Activity Hour</h3>
                <p className="text-4xl font-bold text-blue-500">
                  {enhanced.peak_hours[0]?.hour || 0}:00
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {enhanced.peak_hours[0]?.sessions || 0} sessions
                </p>
              </Card>
            </div>

            {/* Peak Hours Chart */}
            {enhanced.peak_hours.length > 0 && (
              <Card className="p-6 mb-8">
                <h3 className="font-semibold mb-4">Peak Hours Distribution</h3>
                <div className="space-y-2">
                  {enhanced.peak_hours.slice(0, 5).map((hour) => (
                    <div key={hour.hour} className="flex items-center gap-4">
                      <span className="text-sm w-12">{hour.hour}:00</span>
                      <div className="flex-1 h-8 bg-primary/20 rounded flex items-center" 
                        style={{ width: `${(hour.sessions / (enhanced.peak_hours[0]?.sessions || 1)) * 100}%` }}>
                        <span className="text-xs font-semibold ml-2">{hour.sessions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Session Trends */}
            {enhanced.session_trends.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">30-Day Session Trends</h3>
                <div className="text-sm text-muted-foreground mb-4">
                  {enhanced.session_trends.length} days tracked
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enhanced.session_trends.slice(-7).map((trend) => (
                        <tr key={trend.date} className="border-b border-border/50">
                          <td className="py-2">{trend.date}</td>
                          <td className="py-2 font-semibold">{trend.sessions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
