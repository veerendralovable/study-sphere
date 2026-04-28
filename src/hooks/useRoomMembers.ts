import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { roomMemberService } from "@/services/roomMemberService";
import { profileService } from "@/services/profileService";

export interface RoomMemberWithProfile {
  id: string;
  user_id: string;
  room_id: string;
  role: string;
  status: string;
  joined_at: string;
  profile: { id: string; name: string | null; email: string | null } | null;
}

export function useRoomMembers(roomId: string | undefined) {
  const [members, setMembers] = useState<RoomMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    const load = async () => {
      const rows = await roomMemberService.listActiveByRoom(roomId);
      const profiles = await profileService.getMany(rows.map((r) => r.user_id));
      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      if (cancelled) return;
      setMembers(
        rows.map((r) => ({ ...r, profile: profileMap.get(r.user_id) ?? null }))
      );
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { members, loading };
}
