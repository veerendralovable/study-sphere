import { useEffect, useState, ReactNode } from "react";
import { settingsService } from "@/services/settingsService";
import { setAllowedEmailDomains } from "@/lib/validation";
import { isAdmin } from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [maintenance, setMaintenance] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const m = await settingsService.getMap();
      if (cancelled) return;
      setMaintenance(m.maintenance_mode === "true");
      const domains = settingsService.parseDomains(m.allowed_domains);
      setAllowedEmailDomains(domains);
      if (user) {
        const a = await isAdmin(user.id);
        if (!cancelled) setAdmin(a);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading || !ready) return <>{children}</>;
  if (maintenance && !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center">
          <Wrench className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h1 className="mb-2 text-2xl font-semibold">Under maintenance</h1>
          <p className="text-sm text-muted-foreground">
            StudySphere is temporarily unavailable while we make improvements. Please check back shortly.
          </p>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}
