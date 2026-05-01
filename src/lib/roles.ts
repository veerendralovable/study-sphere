import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "moderator" | "user";

/** Check whether a user has a given role. Server-side enforced via RLS. */
export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", role)
    .maybeSingle();
  if (error) {
    console.error("hasRole error:", error);
    return false;
  }
  return !!data;
}

export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, "admin");
}
