import { supabase } from "@/integrations/supabase/client";

export const profileService = {
  async getById(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateName(userId: string, name: string) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", userId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getMany(ids: string[]) {
    if (!ids.length) return [];
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", ids);
    if (error) throw error;
    return data ?? [];
  },
};
