import { supabase } from "@/integrations/supabase/client";

export const avatarService = {
  async upload(userId: string, file: File): Promise<string> {
    if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
    if (file.size > 2 * 1024 * 1024) throw new Error("Image must be 2 MB or smaller");
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl;
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    if (error) throw error;
    return url;
  },

  async clear(userId: string): Promise<void> {
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
    if (error) throw error;
  },
};
