import { useEffect, useState } from "react";
import { announcementService, Announcement } from "@/services/announcementService";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "studysphere_dismissed_announcements";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function dismissId(id: string) {
  const cur = getDismissed();
  if (!cur.includes(id)) {
    cur.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cur.slice(-50)));
  }
}

export function AnnouncementBanner() {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(getDismissed());

  useEffect(() => {
    if (!user) return;
    announcementService.listActive().then(setItems).catch(() => {});
    const ch = supabase
      .channel("announcements")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, () => {
        announcementService.listActive().then(setItems).catch(() => {});
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const visible = items.filter((a) => !dismissed.includes(a.id));
  if (!visible.length) return null;
  const top = visible[0];

  return (
    <div className="border-b border-primary/40 bg-primary/10">
      <div className="container flex items-start gap-3 py-2 text-sm">
        <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="flex-1">
          <span className="font-medium text-primary">{top.title}</span>
          {top.body && <span className="text-foreground/80"> — {top.body}</span>}
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => {
            dismissId(top.id);
            setDismissed(getDismissed());
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
