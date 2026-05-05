import { supabase } from "@/integrations/supabase/client";

export const settingsService = {
  // Cached fetch — settings are admin-readable only, so non-admins fall through to defaults.
  async getMap(): Promise<Record<string, string>> {
    const { data, error } = await supabase.from("system_settings").select("key,value");
    if (error) {
      // Non-admin: RLS hides rows. Return empty so callers use defaults.
      return {};
    }
    const m: Record<string, string> = {};
    (data ?? []).forEach((r: any) => (m[r.key] = r.value));
    return m;
  },

  parseDomains(raw: string | undefined): string[] {
    if (!raw) return ["edu"];
    try {
      const v = JSON.parse(raw);
      if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v;
    } catch {
      // ignore
    }
    return ["edu"];
  },
};
