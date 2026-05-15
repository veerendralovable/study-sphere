import { supabase } from "@/integrations/supabase/client";

export type SoundLayer = "lofi" | "rain" | "cafe" | "forest" | "white_noise" | "brown_noise" | "fireplace";

export const SOUND_LAYERS: { key: SoundLayer; label: string; src: string }[] = [
  { key: "lofi", label: "Lo-fi", src: "/sounds/lofi.opus" },
  { key: "rain", label: "Rain", src: "/sounds/rain.opus" },
  { key: "cafe", label: "Café", src: "/sounds/cafe.opus" },
  { key: "forest", label: "Forest", src: "/sounds/forest.opus" },
  { key: "white_noise", label: "White noise", src: "/sounds/white-noise.opus" },
  { key: "brown_noise", label: "Brown noise", src: "/sounds/brown-noise.opus" },
  { key: "fireplace", label: "Fireplace", src: "/sounds/fireplace.opus" },
];

export const soundMixService = {
  async get(userId: string): Promise<Record<string, number>> {
    const { data } = await supabase
      .from("user_sound_mixes")
      .select("mix")
      .eq("user_id", userId)
      .maybeSingle();
    return (data?.mix as Record<string, number>) ?? {};
  },

  async save(userId: string, mix: Record<string, number>) {
    const { error } = await supabase
      .from("user_sound_mixes")
      .upsert({ user_id: userId, mix, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw error;
  },
};
