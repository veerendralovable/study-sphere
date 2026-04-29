import { supabase } from "@/integrations/supabase/client";

export type MemberStatus = "active" | "left" | "removed";

export const roomMemberService = {
  async join(userId: string, roomId: string, role: "member" | "creator" = "member") {
    // Public-room join (or creator self-insert). Private rooms must use joinPrivate().
    const { data, error } = await supabase
      .from("room_members")
      .upsert(
        { user_id: userId, room_id: roomId, role, status: "active" },
        { onConflict: "user_id,room_id" }
      )
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async joinPrivate(roomId: string, code: string) {
    const { data, error } = await supabase.rpc("join_private_room", {
      _room_id: roomId,
      _code: code,
    });
    if (error) throw error;
    return data;
  },

  async joinByCode(code: string) {
    const { data, error } = await supabase.rpc("join_room_by_code", {
      _code: code,
    });
    if (error) throw error;
    return data as { room_id: string } & Record<string, unknown>;
  },

  async leave(userId: string, roomId: string) {
    const { error } = await supabase
      .from("room_members")
      .update({ status: "left" })
      .eq("user_id", userId)
      .eq("room_id", roomId);
    if (error) throw error;
  },

  async remove(targetUserId: string, roomId: string) {
    const { error } = await supabase
      .from("room_members")
      .update({ status: "removed" })
      .eq("user_id", targetUserId)
      .eq("room_id", roomId);
    if (error) throw error;
  },

  async listActiveByRoom(roomId: string) {
    const { data, error } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_id", roomId)
      .eq("status", "active");
    if (error) throw error;
    return data ?? [];
  },

  async listMyRooms(userId: string) {
    const { data, error } = await supabase
      .from("room_members")
      .select("*, rooms(*)")
      .eq("user_id", userId)
      .eq("status", "active");
    if (error) throw error;
    return data ?? [];
  },

  async countActiveByRoom(roomId: string) {
    const { count, error } = await supabase
      .from("room_members")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId)
      .eq("status", "active");
    if (error) throw error;
    return count ?? 0;
  },

  async myMembership(userId: string, roomId: string) {
    const { data, error } = await supabase
      .from("room_members")
      .select("*")
      .eq("user_id", userId)
      .eq("room_id", roomId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
