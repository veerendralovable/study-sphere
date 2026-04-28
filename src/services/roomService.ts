import { supabase } from "@/integrations/supabase/client";

export const roomService = {
  async create(name: string, createdBy: string, isPrivate = false) {
    const { data, error } = await supabase
      .from("rooms")
      .insert({ name, created_by: createdBy, is_private: isPrivate })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async listAll() {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async findByCode(code: string) {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", code.toUpperCase())
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async search(query: string) {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  },
};
