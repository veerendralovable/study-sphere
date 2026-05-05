import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: "all" | "admins";
  created_by: string;
  created_at: string;
  expires_at: string | null;
}

export const announcementService = {
  async listActive(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Announcement[];
  },

  async listAll(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Announcement[];
  },

  async create(input: {
    title: string;
    body: string;
    audience?: "all" | "admins";
    expires_at?: string | null;
  }): Promise<Announcement> {
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title: input.title,
        body: input.body,
        audience: input.audience ?? "all",
        expires_at: input.expires_at ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Announcement;
  },

  async expire(id: string): Promise<void> {
    const { error } = await supabase
      .from("announcements")
      .update({ expires_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) throw error;
  },
};
