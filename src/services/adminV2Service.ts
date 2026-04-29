import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Report = Database["public"]["Tables"]["reports"]["Row"];
type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
type SystemSetting = Database["public"]["Tables"]["system_settings"]["Row"];

// ============================================================================
// MODERATION SERVICE
// ============================================================================

export const moderationService = {
  async createReport(
    targetType: "user" | "room",
    targetId: string,
    reason: string,
    description?: string
  ): Promise<Report | null> {
    const { data, error } = await supabase
      .from("reports")
      .insert({
        target_type: targetType,
        target_id: targetId,
        reason,
        description,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllReports(status?: string): Promise<Report[]> {
    let query = supabase.from("reports").select("*");

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data || [];
  },

  async getReportsByTarget(
    targetType: "user" | "room",
    targetId: string
  ): Promise<Report[]> {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async resolveReport(
    reportId: string,
    status: "resolved" | "dismissed",
    notes?: string
  ): Promise<Report | null> {
    const { data, error } = await supabase
      .from("reports")
      .update({
        status,
        admin_notes: notes,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPendingReportCount(): Promise<number> {
    const { count, error } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (error) throw error;
    return count || 0;
  },
};

// ============================================================================
// AUDIT LOGS SERVICE
// ============================================================================

export const auditLogsService = {
  async logAction(
    action: string,
    targetId?: string,
    targetType?: string,
    metadata?: Record<string, any>
  ): Promise<AuditLog | null> {
    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        action,
        target_id: targetId,
        target_type: targetType,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllLogs(limit = 100): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getLogsByActor(actorId: string): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("actor_id", actorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getLogsByTarget(targetType: string, targetId: string): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getLogsByAction(action: string): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("action", action)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// ============================================================================
// SYSTEM SETTINGS SERVICE
// ============================================================================

export const systemSettingsService = {
  async getSetting(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data?.value || null;
  },

  async getSettings(): Promise<SystemSetting[]> {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .order("key");

    if (error) throw error;
    return data || [];
  },

  async updateSetting(key: string, value: string): Promise<SystemSetting | null> {
    const { data, error } = await supabase
      .from("system_settings")
      .update({
        value,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMaxRoomSize(): Promise<number> {
    const value = await this.getSetting("max_room_size");
    return parseInt(value || "50", 10);
  },

  async getMaxRoomsPerUser(): Promise<number> {
    const value = await this.getSetting("max_rooms_per_user");
    return parseInt(value || "10", 10);
  },

  async getAllowedDomains(): Promise<string[]> {
    const value = await this.getSetting("allowed_domains");
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  },

  async isMaintenanceMode(): Promise<boolean> {
    const value = await this.getSetting("maintenance_mode");
    return value === "true";
  },

  async isMaintenance(): Promise<boolean> {
    return this.isMaintenanceMode();
  },

  async getTimerLimits(): Promise<{ min: number; max: number }> {
    const min = await this.getSetting("timer_min_duration");
    const max = await this.getSetting("timer_max_duration");
    return {
      min: parseInt(min || "60", 10),
      max: parseInt(max || "14400", 10),
    };
  },
};

// ============================================================================
// ADVANCED ANALYTICS SERVICE
// ============================================================================

export const advancedAnalyticsService = {
  async getRetention(days: 1 | 7 | 30 = 7): Promise<number> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);

    const { data, error } = await supabase
      .from("study_sessions")
      .select("user_id", { count: "exact" })
      .gte("created_at", targetDate.toISOString());

    if (error) throw error;

    // Calculate retention (simplified)
    return data?.length || 0;
  },

  async getAverageSessionsPerUser(): Promise<number> {
    const { data: sessionData, error: sessionError } = await supabase
      .from("study_sessions")
      .select("user_id");

    if (sessionError) throw sessionError;

    const { data: userCount, error: userError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (userError) throw userError;

    const sessions = sessionData?.length || 0;
    const users = userCount || 1;

    return sessions / users;
  },

  async getMostActiveRooms(limit = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from("rooms")
      .select(
        `
        id,
        name,
        code,
        room_members(count)
      `
      )
      .limit(limit)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getInactiveUsers(days = 7): Promise<any[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        name,
        email,
        updated_at
      `
      )
      .lt("updated_at", targetDate.toISOString())
      .eq("status", "active");

    if (error) throw error;
    return data || [];
  },

  async getSessionTrends(): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("study_sessions")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at");

    if (error) throw error;

    // Group by day
    const trends: Record<string, number> = {};
    (data || []).forEach((session: any) => {
      const date = new Date(session.created_at).toISOString().split("T")[0];
      trends[date] = (trends[date] || 0) + 1;
    });

    return Object.entries(trends).map(([date, count]) => ({
      date,
      sessions: count,
    }));
  },

  async getPeakHours(): Promise<any[]> {
    const { data, error } = await supabase
      .from("study_sessions")
      .select("created_at");

    if (error) throw error;

    const hours: Record<number, number> = {};
    (data || []).forEach((session: any) => {
      const hour = new Date(session.created_at).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });

    return Object.entries(hours)
      .map(([hour, count]) => ({
        hour: parseInt(hour, 10),
        sessions: count,
      }))
      .sort((a, b) => b.sessions - a.sessions);
  },
};
