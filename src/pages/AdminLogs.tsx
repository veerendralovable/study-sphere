import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { auditLogsService } from "@/services/adminV2Service";
import { ArrowLeft, History } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

const actionColors: Record<string, { bg: string; text: string }> = {
  user_role_changed: { bg: "bg-blue-500/10", text: "text-blue-500" },
  user_status_changed: { bg: "bg-orange-500/10", text: "text-orange-500" },
  user_blocked: { bg: "bg-red-500/10", text: "text-red-500" },
  room_deleted: { bg: "bg-destructive/10", text: "text-destructive" },
  default: { bg: "bg-gray-500/10", text: "text-gray-500" },
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await auditLogsService.getAllLogs(200);
      setLogs(data);
    } catch (error) {
      console.error("Error loading audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || actionColors.default;
  };

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

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

          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Audit Logs</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track all admin actions and system events
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Loading audit logs...
          </Card>
        ) : logs.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No audit logs found
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Time</th>
                  <th className="text-left py-3 px-4 font-semibold">Action</th>
                  <th className="text-left py-3 px-4 font-semibold">Admin</th>
                  <th className="text-left py-3 px-4 font-semibold">Target</th>
                  <th className="text-left py-3 px-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const colors = getActionColor(log.action);
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-border hover:bg-secondary/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${colors.bg} ${colors.text}`}
                        >
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {log.actor_id?.substring(0, 8) || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {log.target_type && log.target_id ? (
                          <span className="text-xs">
                            <span className="text-muted-foreground">
                              {log.target_type}:{" "}
                            </span>
                            <span className="font-mono">
                              {log.target_id.substring(0, 8)}
                            </span>
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-xs text-primary hover:underline">
                              View metadata
                            </summary>
                            <pre className="text-xs bg-secondary/50 p-2 rounded mt-2 overflow-auto max-w-xs">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
