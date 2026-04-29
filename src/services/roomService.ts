import { supabase } from "@/integrations/supabase/client";

// Public-safe row from the rooms_public view (no room_code)
export interface RoomPublic {
  id: string;
  name: string;
  is_private: boolean;
  created_by: string | null;
  created_at: string;
  exam_mode: boolean;
}

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
    // Returns full row (including room_code) — RLS now restricts to creator/members.
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Discovery / dashboard listing — uses code-less view
  async listAll(): Promise<RoomPublic[]> {
    const { data, error } = await (supabase as any)
      .from("rooms_public")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as RoomPublic[];
  },

  async search(query: string): Promise<RoomPublic[]> {
    const { data, error } = await (supabase as any)
      .from("rooms_public")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as RoomPublic[];
  },

  async setExamMode(roomId: string, value: boolean) {
    const { data, error } = await supabase
      .from("rooms")
      .update({ exam_mode: value })
      .eq("id", roomId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
