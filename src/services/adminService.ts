import { supabase } from "@/integrations/supabase/client";

export interface UserStats {
  total_users: number;
  total_rooms: number;
  active_sessions: number;
  sessions_today: number;
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  total_study_time: number;
  sessions_count: number;
  current_streak: number;
}

export interface RoomDetail {
  id: string;
  name: string;
  created_by: string;
  creator_name: string;
  is_private: boolean;
  members_count: number;
  created_at: string;
  active_members: number;
}

export const adminService = {
  // Dashboard Stats
  async getDashboardStats(): Promise<UserStats> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get total rooms
      const { count: totalRooms } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true });

      // Get active sessions (timers that are currently running)
      const { count: activeSessions } = await supabase
        .from("timers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get sessions today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: sessionsToday } = await supabase
        .from("study_sessions")
        .select("*", { count: "exact", head: true })
        .gte("start_time", today.toISOString());

      return {
        total_users: totalUsers || 0,
        total_rooms: totalRooms || 0,
        active_sessions: activeSessions || 0,
        sessions_today: sessionsToday || 0,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  // User Management
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          email,
          status,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch all roles in one query
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap = new Map<string, string>();
      (roles || []).forEach((r: any) => {
        // 'admin' wins over other roles for display
        if (r.role === "admin" || !roleMap.has(r.user_id)) {
          roleMap.set(r.user_id, r.role);
        }
      });

      // Get session counts for each user
      const usersWithStats = await Promise.all(
        (data || []).map(async (user) => {
          const { count } = await supabase
            .from("study_sessions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          return {
            ...user,
            role: roleMap.get(user.id) || "user",
            total_sessions: count || 0,
          };
        })
      );

      return usersWithStats;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  async getUserDetails(userId: string): Promise<UserDetail> {
    try {
      const { data: user, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      // Get study sessions for stats
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("duration")
        .eq("user_id", userId);

      const totalStudyTime = sessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
      const sessionsCount = sessions?.length || 0;

      // Get role from user_roles
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("role", { ascending: true })
        .limit(1)
        .maybeSingle();

      // Get streak (simplified)
      const currentStreak = 0; // Would need more complex logic for real streak calculation

      return {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        role: roleRow?.role || "user",
        status: (user as any).status || "active",
        created_at: user.created_at,
        total_study_time: totalStudyTime,
        sessions_count: sessionsCount,
        current_streak: currentStreak,
      };
    } catch (error) {
      console.error("Error fetching user details:", error);
      throw error;
    }
  },

  async updateUserRole(userId: string, newRole: "admin" | "moderator" | "user") {
    try {
      // Remove existing roles, insert the new one
      const { error: delErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (delErr) throw delErr;

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },

  async deactivateUser(userId: string) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "blocked" })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw error;
    }
  },

  // Room Management
  async getAllRooms() {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id,
          name,
          created_by,
          is_private,
          created_at,
          profiles:created_by(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get member counts
      const roomsWithMembers = await Promise.all(
        (data || []).map(async (room) => {
          const { count } = await supabase
            .from("room_members")
            .select("*", { count: "exact", head: true })
            .eq("room_id", room.id);

          return {
            ...room,
            members_count: count || 0,
            creator_name: (room as any).profiles?.name || "Unknown",
          };
        })
      );

      return roomsWithMembers;
    } catch (error) {
      console.error("Error fetching rooms:", error);
      throw error;
    }
  },

  async getRoomDetails(roomId: string): Promise<RoomDetail> {
    try {
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select(`
          id,
          name,
          created_by,
          is_private,
          created_at,
          profiles:created_by(name)
        `)
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      // Get member count
      const { count: membersCount } = await supabase
        .from("room_members")
        .select("*", { count: "exact", head: true })
        .eq("room_id", roomId);

      // Get active members (those with active timers)
      const { count: activeMembers } = await supabase
        .from("timers")
        .select("*", { count: "exact", head: true })
        .eq("room_id", roomId)
        .eq("is_active", true);

      return {
        id: room.id,
        name: room.name,
        created_by: room.created_by,
        creator_name: (room as any).profiles?.name || "Unknown",
        is_private: room.is_private,
        members_count: membersCount || 0,
        created_at: room.created_at,
        active_members: activeMembers || 0,
      };
    } catch (error) {
      console.error("Error fetching room details:", error);
      throw error;
    }
  },

  async deleteRoom(roomId: string) {
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting room:", error);
      throw error;
    }
  },

  // Live Monitoring
  async getLiveData() {
    try {
      // Active rooms with timers
      const { data: activeRooms } = await supabase
        .from("timers")
        .select(`
          room_id,
          rooms:room_id(id, name),
          user_id,
          is_active
        `)
        .eq("is_active", true);

      // Active sessions
      const { data: activeSessions } = await supabase
        .from("study_sessions")
        .select(`
          id,
          user_id,
          room_id,
          profiles:user_id(name),
          start_time
        `)
        .is("end_time", null);

      return {
        active_rooms: activeRooms || [],
        active_sessions: activeSessions || [],
      };
    } catch (error) {
      console.error("Error fetching live data:", error);
      throw error;
    }
  },

  // Analytics
  async getAnalytics() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Daily active users
      const { count: dau } = await supabase
        .from("study_sessions")
        .select("user_id", { count: "exact" })
        .gte("start_time", today.toISOString());

      // Total sessions
      const { count: totalSessions } = await supabase
        .from("study_sessions")
        .select("*", { count: "exact", head: true });

      // Average session duration
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("duration")
        .not("duration", "is", null);

      const avgDuration =
        sessions && sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
          : 0;

      return {
        daily_active_users: dau || 0,
        total_sessions: totalSessions || 0,
        avg_session_duration: Math.round(avgDuration),
        peak_usage_time: "N/A",
      };
    } catch (error) {
      console.error("Error fetching analytics:", error);
      throw error;
    }
  },
};
