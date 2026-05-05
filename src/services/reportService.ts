import { supabase } from "@/integrations/supabase/client";

export const reportService = {
  async create(targetType: "user" | "room", targetId: string, reason: string, description?: string) {
    const { data, error } = await supabase
      .from("reports")
      .insert({ target_type: targetType, target_id: targetId, reason, description })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
