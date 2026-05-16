export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          title: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          title: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          code: string
          criteria: Json
          description: string
          icon: string | null
          name: string
          tier: string
        }
        Insert: {
          code: string
          criteria?: Json
          description: string
          icon?: string | null
          name: string
          tier?: string
        }
        Update: {
          code?: string
          criteria?: Json
          description?: string
          icon?: string | null
          name?: string
          tier?: string
        }
        Relationships: []
      }
      daily_goals: {
        Row: {
          goal_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          goal_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          goal_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dm_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          thread_id: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_threads: {
        Row: {
          created_at: string
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      focus_blocklists: {
        Row: {
          items: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          items?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          items?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      focus_tracks: {
        Row: {
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          id: string
          prompt: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          prompt: string
          storage_path: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          prompt?: string
          storage_path?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          from_user: string
          id: string
          responded_at: string | null
          status: string
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user?: string
          id?: string
          responded_at?: string | null
          status?: string
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          responded_at?: string | null
          status?: string
          to_user?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pomodoro_presets: {
        Row: {
          auto_start: boolean
          created_at: string
          cycles_until_long: number
          focus_min: number
          id: string
          is_system: boolean
          long_break_min: number
          name: string
          short_break_min: number
          user_id: string | null
        }
        Insert: {
          auto_start?: boolean
          created_at?: string
          cycles_until_long?: number
          focus_min?: number
          id?: string
          is_system?: boolean
          long_break_min?: number
          name: string
          short_break_min?: number
          user_id?: string | null
        }
        Update: {
          auto_start?: boolean
          created_at?: string
          cycles_until_long?: number
          focus_min?: number
          id?: string
          is_system?: boolean
          long_break_min?: number
          name?: string
          short_break_min?: number
          user_id?: string | null
        }
        Relationships: []
      }
      presence_pings: {
        Row: {
          last_seen_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          last_seen_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          last_seen_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          last_active_at: string
          leaderboard_opt_in: boolean
          name: string | null
          status: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          last_active_at?: string
          leaderboard_opt_in?: boolean
          name?: string | null
          status?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_active_at?: string
          leaderboard_opt_in?: boolean
          name?: string | null
          status?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          room_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          room_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          room_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          mentions: string[]
          reply_to: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          mentions?: string[]
          reply_to?: string | null
          room_id: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          mentions?: string[]
          reply_to?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      room_timer_program: {
        Row: {
          current_phase: string
          cycle_index: number
          paused_at: string | null
          phase_started_at: string
          preset_id: string
          room_id: string
          updated_at: string
        }
        Insert: {
          current_phase?: string
          cycle_index?: number
          paused_at?: string | null
          phase_started_at?: string
          preset_id: string
          room_id: string
          updated_at?: string
        }
        Update: {
          current_phase?: string
          cycle_index?: number
          paused_at?: string | null
          phase_started_at?: string
          preset_id?: string
          room_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_timer_program_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "pomodoro_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          exam_mode: boolean
          id: string
          is_private: boolean
          locked: boolean
          name: string
          pinned_message_id: string | null
          room_code: string | null
          slow_mode_seconds: number
          subject: string | null
          tags: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          exam_mode?: boolean
          id?: string
          is_private?: boolean
          locked?: boolean
          name: string
          pinned_message_id?: string | null
          room_code?: string | null
          slow_mode_seconds?: number
          subject?: string | null
          tags?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          exam_mode?: boolean
          id?: string
          is_private?: boolean
          locked?: boolean
          name?: string
          pinned_message_id?: string | null
          room_code?: string | null
          slow_mode_seconds?: number
          subject?: string | null
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_notes: {
        Row: {
          body: string
          created_at: string
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          session_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_reflections: {
        Row: {
          accomplished: string | null
          created_at: string
          friction: string | null
          mood: number | null
          next_steps: string | null
          productivity: number | null
          session_id: string
          user_id: string
        }
        Insert: {
          accomplished?: string | null
          created_at?: string
          friction?: string | null
          mood?: number | null
          next_steps?: string | null
          productivity?: number | null
          session_id: string
          user_id?: string
        }
        Update: {
          accomplished?: string | null
          created_at?: string
          friction?: string | null
          mood?: number | null
          next_steps?: string | null
          productivity?: number | null
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      session_tasks: {
        Row: {
          actual_pomodoros: number
          completed_at: string | null
          created_at: string
          done: boolean
          est_pomodoros: number
          id: string
          is_focus: boolean
          position: number
          room_id: string | null
          session_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          actual_pomodoros?: number
          completed_at?: string | null
          created_at?: string
          done?: boolean
          est_pomodoros?: number
          id?: string
          is_focus?: boolean
          position?: number
          room_id?: string | null
          session_id?: string | null
          title: string
          user_id?: string
        }
        Update: {
          actual_pomodoros?: number
          completed_at?: string | null
          created_at?: string
          done?: boolean
          est_pomodoros?: number
          id?: string
          is_focus?: boolean
          position?: number
          room_id?: string | null
          session_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          duration: number | null
          end_time: string | null
          id: string
          room_id: string | null
          room_name_snapshot: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          end_time?: string | null
          id?: string
          room_id?: string | null
          room_name_snapshot?: string | null
          start_time?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          end_time?: string | null
          id?: string
          room_id?: string | null
          room_name_snapshot?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      timers: {
        Row: {
          duration: number | null
          id: string
          is_active: boolean
          room_id: string
          start_time: string | null
        }
        Insert: {
          duration?: number | null
          id?: string
          is_active?: boolean
          room_id: string
          start_time?: string | null
        }
        Update: {
          duration?: number | null
          id?: string
          is_active?: boolean
          room_id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_code: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_code: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_code_fkey"
            columns: ["badge_code"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sound_mixes: {
        Row: {
          mix: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          mix?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          mix?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current: number
          last_active_date: string | null
          longest: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current?: number
          last_active_date?: string | null
          longest?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current?: number
          last_active_date?: string | null
          longest?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          level: number
          level_progress: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          level?: number
          level_progress?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          level?: number
          level_progress?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json
          ref_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json
          ref_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json
          ref_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_alltime: {
        Row: {
          minutes_total_seconds: number | null
          sessions: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_weekly: {
        Row: {
          minutes_total_seconds: number | null
          sessions: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_xp_alltime: {
        Row: {
          level: number | null
          user_id: string | null
          xp: number | null
        }
        Insert: {
          level?: number | null
          user_id?: string | null
          xp?: number | null
        }
        Update: {
          level?: number | null
          user_id?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      leaderboard_xp_weekly: {
        Row: {
          user_id: string | null
          xp: number | null
        }
        Relationships: []
      }
      rooms_public: {
        Row: {
          created_at: string | null
          created_by: string | null
          exam_mode: boolean | null
          id: string | null
          is_private: boolean | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          exam_mode?: boolean | null
          id?: string | null
          is_private?: boolean | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          exam_mode?: boolean | null
          id?: string | null
          is_private?: boolean | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      are_friends: { Args: { _a: string; _b: string }; Returns: boolean }
      auto_close_stale_sessions: { Args: never; Returns: number }
      award_badge: {
        Args: { _code: string; _user_id: string }
        Returns: undefined
      }
      award_xp: {
        Args: {
          _amount: number
          _meta?: Json
          _ref_id?: string
          _source: string
          _user_id: string
        }
        Returns: undefined
      }
      bump_streak: { Args: { _user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_room_creator: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_room_member: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      join_private_room: {
        Args: { _code: string; _room_id: string }
        Returns: {
          id: string
          joined_at: string
          role: string
          room_id: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "room_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      join_room_by_code: {
        Args: { _code: string }
        Returns: {
          id: string
          joined_at: string
          role: string
          room_id: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "room_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      recalc_level: { Args: { _user_id: string }; Returns: undefined }
      search_users: {
        Args: { _q: string }
        Returns: {
          avatar_url: string
          id: string
          name: string
        }[]
      }
      shares_active_room: {
        Args: { _target: string; _viewer: string }
        Returns: boolean
      }
      user_streak: { Args: { _user_id: string }; Returns: number }
      xp_required_for_level: { Args: { _level: number }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
