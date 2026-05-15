import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Music, VolumeX } from "lucide-react";
import { soundMixService, SOUND_LAYERS } from "@/services/soundMixService";
import { useAuth } from "@/context/AuthContext";

export function AmbientSoundsPanel() {
  const { user } = useAuth();
  const [mix, setMix] = useState<Record<string, number>>({});
  const audiosRef = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    if (!user) return;
    soundMixService.get(user.id).then(setMix).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    SOUND_LAYERS.forEach(({ key, src }) => {
      let a = audiosRef.current[key];
      if (!a) {
        a = new Audio(src);
        a.loop = true;
        audiosRef.current[key] = a;
      }
      const vol = (mix[key] ?? 0) / 100;
      a.volume = Math.max(0, Math.min(1, vol));
      if (vol > 0 && a.paused) a.play().catch(() => {});
      if (vol === 0 && !a.paused) a.pause();
    });
    return () => {
      // do not stop on rerender
    };
  }, [mix]);

  useEffect(() => {
    return () => {
      Object.values(audiosRef.current).forEach((a) => {
        a.pause();
        a.src = "";
      });
    };
  }, []);

  const setLayer = (key: string, value: number) => {
    const next = { ...mix, [key]: value };
    setMix(next);
    if (user) soundMixService.save(user.id, next).catch(() => {});
  };

  const stopAll = () => {
    const next: Record<string, number> = {};
    SOUND_LAYERS.forEach((l) => (next[l.key] = 0));
    setMix(next);
    if (user) soundMixService.save(user.id, next).catch(() => {});
  };

  return (
    <Card className="bg-gradient-card border-border/60 p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Music className="h-4 w-4 text-primary" /> Ambient sounds
        </h3>
        <Button size="sm" variant="ghost" onClick={stopAll}>
          <VolumeX className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3">
        {SOUND_LAYERS.map((l) => (
          <div key={l.key}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{l.label}</span>
              <span className="text-muted-foreground tabular-nums">{mix[l.key] ?? 0}</span>
            </div>
            <Slider
              value={[mix[l.key] ?? 0]}
              onValueChange={(v) => setLayer(l.key, v[0])}
              max={100}
              step={1}
            />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Sounds play locally on your device. Add a layer by sliding it up.
      </p>
    </Card>
  );
}
