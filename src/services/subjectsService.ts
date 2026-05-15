import { supabase } from "@/integrations/supabase/client";

export const subjectsService = {
  async list() {
    const { data } = await supabase.from("subjects").select("*").order("name");
    return data ?? [];
  },
  async get(slug: string) {
    const { data } = await supabase.from("subjects").select("*").eq("slug", slug).maybeSingle();
    return data;
  },
};
