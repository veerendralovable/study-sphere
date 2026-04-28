import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { timerService } from "@/services/timerService";

export interface TimerRow {
  id: string;
  room_id: string;
  start_time: string | null;
  duration: number | null;
  is_active: boolean;
}

export function useRoomTimer(roomId: string | undefined) {
  const [timer, setTimer] = useState<TimerRow | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    timerService.getByRoom(roomId).then((t) => {
      if (!cancelled) setTimer(t as TimerRow | null);
    });

    const channel = supabase
      .channel(`timer-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "timers", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "DELETE") setTimer(null);
          else setTimer(payload.new as TimerRow);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  let remaining = 0;
  if (timer?.is_active && timer.start_time && timer.duration) {
    const elapsed = Math.floor((now - new Date(timer.start_time).getTime()) / 1000);
    remaining = Math.max(0, timer.duration - elapsed);
  } else if (timer?.duration && !timer.is_active) {
    remaining = timer.duration;
  }

  return { timer, remaining };
}
