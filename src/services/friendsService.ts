import { supabase } from "@/integrations/supabase/client";

export const friendsService = {
  async search(query: string) {
    const q = query.trim();
    if (q.length < 2) return [];
    const { data, error } = await supabase.rpc("search_users", { _q: q });
    if (error) throw error;
    return data ?? [];
  },

  async listFriends(userId: string) {
    const { data: rows, error } = await supabase
      .from("friends")
      .select("user_a, user_b, created_at")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    if (error) throw error;
    const ids = (rows ?? []).map((r) => (r.user_a === userId ? r.user_b : r.user_a));
    if (ids.length === 0) return [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email, avatar_url, last_active_at")
      .in("id", ids);
    return profiles ?? [];
  },

  async listIncoming(userId: string) {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("to_user", userId)
      .eq("status", "pending");
    if (error) throw error;
    if (!data?.length) return [];
    const ids = data.map((r) => r.from_user);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email, avatar_url")
      .in("id", ids);
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return data.map((r) => ({ ...r, profile: map.get(r.from_user) }));
  },

  async listOutgoing(userId: string) {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("from_user", userId)
      .eq("status", "pending");
    if (error) throw error;
    return data ?? [];
  },

  async send(toUserId: string) {
    const { error } = await supabase
      .from("friend_requests")
      .insert({ to_user: toUserId });
    if (error) throw error;
  },

  async respond(requestId: string, accept: boolean) {
    const { error } = await supabase
      .from("friend_requests")
      .update({ status: accept ? "accepted" : "rejected" })
      .eq("id", requestId);
    if (error) throw error;
  },

  async cancel(requestId: string) {
    const { error } = await supabase
      .from("friend_requests")
      .update({ status: "cancelled" })
      .eq("id", requestId);
    if (error) throw error;
  },
};
