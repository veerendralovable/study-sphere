import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { moderationService } from "@/services/adminV2Service";
import { ArrowLeft, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Report = Database["public"]["Tables"]["reports"]["Row"];

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await moderationService.getAllReports(
        filter === "all" ? undefined : filter
      );
      setReports(data);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await moderationService.resolveReport(reportId, "resolved");
      toast.success("Report resolved");
      loadReports();
    } catch (error) {
      console.error("Error resolving report:", error);
      toast.error("Failed to resolve report");
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await moderationService.resolveReport(reportId, "dismissed");
      toast.success("Report dismissed");
      loadReports();
    } catch (error) {
      console.error("Error dismissing report:", error);
      toast.error("Failed to dismiss report");
    }
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;

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

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Moderation Reports</h1>
            <div className="flex items-center gap-2 bg-destructive/10 px-3 py-1 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="font-semibold">{pendingCount} Pending</span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          {(["all", "pending", "resolved"] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              onClick={() => {
                setFilter(status);
                setReports([]);
              }}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>

        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Loading reports...
          </Card>
        ) : reports.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No reports found
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="p-6 border-l-4"
                style={{
                  borderLeftColor:
                    report.status === "pending" ? "#dc2626" : "#10b981",
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg capitalize">
                      {report.target_type} Report
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {report.reason}
                    </p>
                    {report.description && (
                      <p className="text-sm mt-2">{report.description}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded capitalize ${
                      report.status === "pending"
                        ? "bg-destructive/20 text-destructive"
                        : "bg-success/20 text-success"
                    }`}
                  >
                    {report.status}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground mb-4">
                  <p>
                    Reported by: {report.reporter_id.substring(0, 8)}
                  </p>
                  <p>
                    Target ID: {report.target_id.substring(0, 8)}
                  </p>
                  <p>Created: {new Date(report.created_at).toLocaleString()}</p>
                </div>

                {report.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResolveReport(report.id)}
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Resolve & Take Action
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismissReport(report.id)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Dismiss
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
