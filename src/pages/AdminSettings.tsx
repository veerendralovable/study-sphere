import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { systemSettingsService } from "@/services/adminV2Service";
import { ArrowLeft, Save, Settings } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type SystemSetting = Database["public"]["Tables"]["system_settings"]["Row"];

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedSettings, setEditedSettings] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await systemSettingsService.getSettings();
      setSettings(data);
      const edited: Record<string, string> = {};
      data.forEach((s) => {
        edited[s.key] = s.value;
      });
      setEditedSettings(edited);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setEditedSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const keysToUpdate = settings
        .filter((s) => editedSettings[s.key] !== s.value)
        .map((s) => s.key);

      for (const key of keysToUpdate) {
        await systemSettingsService.updateSetting(key, editedSettings[key]);
      }

      toast.success("Settings saved successfully");
      loadSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-8">
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">System Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure system-wide parameters and limits
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Loading settings...
          </Card>
        ) : (
          <div className="max-w-2xl">
            <Card className="p-6 space-y-6">
              {settings.map((setting) => (
                <div key={setting.key} className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {setting.key.replace(/_/g, " ")}
                  </Label>
                  {setting.description && (
                    <p className="text-xs text-muted-foreground">
                      {setting.description}
                    </p>
                  )}
                  {(setting.value === "true" || setting.value === "false") ? (
                    <select
                      value={editedSettings[setting.key]}
                      onChange={(e) =>
                        handleSettingChange(setting.key, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : (
                    <Input
                      type={/^\d+$/.test(setting.value || "") ? "number" : "text"}
                      value={editedSettings[setting.key]}
                      onChange={(e) =>
                        handleSettingChange(setting.key, e.target.value)
                      }
                      className="text-sm"
                    />
                  )}
                </div>
              ))}

              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full gap-2 mt-8"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save All Settings"}
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
