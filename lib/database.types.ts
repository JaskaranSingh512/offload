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
      accounts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      brand_assets: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          kind: string | null
          label: string | null
          meta: Json | null
          storage_path: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          kind?: string | null
          label?: string | null
          meta?: Json | null
          storage_path?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          kind?: string | null
          label?: string | null
          meta?: Json | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_assets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          account_id: string
          audience: string | null
          channel_rationale: string | null
          colors: Json | null
          doc_name: string | null
          doc_text: string | null
          domain: string | null
          goal: Database["public"]["Enums"]["goal_t"] | null
          industry: string | null
          name: string | null
          one_liner: string | null
          recommended_channels: string[] | null
          voice: Database["public"]["Enums"]["voice_t"] | null
        }
        Insert: {
          account_id: string
          audience?: string | null
          channel_rationale?: string | null
          colors?: Json | null
          doc_name?: string | null
          doc_text?: string | null
          domain?: string | null
          goal?: Database["public"]["Enums"]["goal_t"] | null
          industry?: string | null
          name?: string | null
          one_liner?: string | null
          recommended_channels?: string[] | null
          voice?: Database["public"]["Enums"]["voice_t"] | null
        }
        Update: {
          account_id?: string
          audience?: string | null
          channel_rationale?: string | null
          colors?: Json | null
          doc_name?: string | null
          doc_text?: string | null
          domain?: string | null
          goal?: Database["public"]["Enums"]["goal_t"] | null
          industry?: string | null
          name?: string | null
          one_liner?: string | null
          recommended_channels?: string[] | null
          voice?: Database["public"]["Enums"]["voice_t"] | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          account_id: string
          channels: string[] | null
          created_at: string | null
          duration_days: number
          ends_on: string | null
          forecast: Json | null
          frequency: Database["public"]["Enums"]["freq_t"] | null
          goal: Database["public"]["Enums"]["goal_t"]
          id: string
          name: string
          starts_on: string | null
          status: Database["public"]["Enums"]["camp_status_t"] | null
        }
        Insert: {
          account_id: string
          channels?: string[] | null
          created_at?: string | null
          duration_days: number
          ends_on?: string | null
          forecast?: Json | null
          frequency?: Database["public"]["Enums"]["freq_t"] | null
          goal: Database["public"]["Enums"]["goal_t"]
          id?: string
          name: string
          starts_on?: string | null
          status?: Database["public"]["Enums"]["camp_status_t"] | null
        }
        Update: {
          account_id?: string
          channels?: string[] | null
          created_at?: string | null
          duration_days?: number
          ends_on?: string | null
          forecast?: Json | null
          frequency?: Database["public"]["Enums"]["freq_t"] | null
          goal?: Database["public"]["Enums"]["goal_t"]
          id?: string
          name?: string
          starts_on?: string | null
          status?: Database["public"]["Enums"]["camp_status_t"] | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversions: {
        Row: {
          account_id: string | null
          id: string
          kind: string | null
          occurred_at: string | null
          post_id: string | null
          source: string | null
          tracked_link_id: string | null
          value: number | null
        }
        Insert: {
          account_id?: string | null
          id?: string
          kind?: string | null
          occurred_at?: string | null
          post_id?: string | null
          source?: string | null
          tracked_link_id?: string | null
          value?: number | null
        }
        Update: {
          account_id?: string | null
          id?: string
          kind?: string | null
          occurred_at?: string | null
          post_id?: string | null
          source?: string | null
          tracked_link_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversions_tracked_link_id_fkey"
            columns: ["tracked_link_id"]
            isOneToOne: false
            referencedRelation: "tracked_links"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_account_aggregates: {
        Row: {
          audience_type: string | null
          format: Database["public"]["Enums"]["format_t"] | null
          goal: Database["public"]["Enums"]["goal_t"] | null
          id: string
          industry: string | null
          metric: string | null
          sample_size: number | null
          value: number | null
        }
        Insert: {
          audience_type?: string | null
          format?: Database["public"]["Enums"]["format_t"] | null
          goal?: Database["public"]["Enums"]["goal_t"] | null
          id?: string
          industry?: string | null
          metric?: string | null
          sample_size?: number | null
          value?: number | null
        }
        Update: {
          audience_type?: string | null
          format?: Database["public"]["Enums"]["format_t"] | null
          goal?: Database["public"]["Enums"]["goal_t"] | null
          id?: string
          industry?: string | null
          metric?: string | null
          sample_size?: number | null
          value?: number | null
        }
        Relationships: []
      }
      founder_scripts: {
        Row: {
          account_id: string
          angle: string | null
          beats: Json | null
          duration_sec: number | null
          filmed: boolean | null
          hook: string | null
          id: string
          post_id: string
          shot_note: string | null
          title: string | null
        }
        Insert: {
          account_id: string
          angle?: string | null
          beats?: Json | null
          duration_sec?: number | null
          filmed?: boolean | null
          hook?: string | null
          id?: string
          post_id: string
          shot_note?: string | null
          title?: string | null
        }
        Update: {
          account_id?: string
          angle?: string | null
          beats?: Json | null
          duration_sec?: number | null
          filmed?: boolean | null
          hook?: string | null
          id?: string
          post_id?: string
          shot_note?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "founder_scripts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_scripts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          account_id: string | null
          body: string | null
          created_at: string | null
          id: string
          kind: string | null
          read: boolean | null
        }
        Insert: {
          account_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          kind?: string | null
          read?: boolean | null
        }
        Update: {
          account_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          kind?: string | null
          read?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          account_id: string
          code_verifier: string
          created_at: string | null
          provider: string
          state: string
        }
        Insert: {
          account_id: string
          code_verifier: string
          created_at?: string | null
          provider: string
          state?: string
        }
        Update: {
          account_id?: string
          code_verifier?: string
          created_at?: string | null
          provider?: string
          state?: string
        }
        Relationships: []
      }
      post_metrics: {
        Row: {
          account_id: string
          captured_at: string | null
          engagement_rate: number | null
          engagements: number | null
          followers_delta: number | null
          id: string
          impressions: number | null
          post_id: string
        }
        Insert: {
          account_id: string
          captured_at?: string | null
          engagement_rate?: number | null
          engagements?: number | null
          followers_delta?: number | null
          id?: string
          impressions?: number | null
          post_id: string
        }
        Update: {
          account_id?: string
          captured_at?: string | null
          engagement_rate?: number | null
          engagements?: number | null
          followers_delta?: number | null
          id?: string
          impressions?: number | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          account_id: string
          approval_state: Database["public"]["Enums"]["approval_t"] | null
          campaign_id: string
          channel: Database["public"]["Enums"]["provider_t"]
          content: Json
          created_at: string | null
          external_post_id: string | null
          format: Database["public"]["Enums"]["format_t"]
          id: string
          published_at: string | null
          rationale: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["post_status_t"] | null
        }
        Insert: {
          account_id: string
          approval_state?: Database["public"]["Enums"]["approval_t"] | null
          campaign_id: string
          channel: Database["public"]["Enums"]["provider_t"]
          content?: Json
          created_at?: string | null
          external_post_id?: string | null
          format: Database["public"]["Enums"]["format_t"]
          id?: string
          published_at?: string | null
          rationale?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status_t"] | null
        }
        Update: {
          account_id?: string
          approval_state?: Database["public"]["Enums"]["approval_t"] | null
          campaign_id?: string
          channel?: Database["public"]["Enums"]["provider_t"]
          content?: Json
          created_at?: string | null
          external_post_id?: string | null
          format?: Database["public"]["Enums"]["format_t"]
          id?: string
          published_at?: string | null
          rationale?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status_t"] | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          account_id: string
          handle: string | null
          id: string
          oauth_access_token: string | null
          oauth_refresh_token: string | null
          provider: Database["public"]["Enums"]["provider_t"]
          read_scope: boolean | null
          status: Database["public"]["Enums"]["sa_status_t"] | null
          token_expires_at: string | null
          write_scope: boolean | null
        }
        Insert: {
          account_id: string
          handle?: string | null
          id?: string
          oauth_access_token?: string | null
          oauth_refresh_token?: string | null
          provider: Database["public"]["Enums"]["provider_t"]
          read_scope?: boolean | null
          status?: Database["public"]["Enums"]["sa_status_t"] | null
          token_expires_at?: string | null
          write_scope?: boolean | null
        }
        Update: {
          account_id?: string
          handle?: string | null
          id?: string
          oauth_access_token?: string | null
          oauth_refresh_token?: string | null
          provider?: Database["public"]["Enums"]["provider_t"]
          read_scope?: boolean | null
          status?: Database["public"]["Enums"]["sa_status_t"] | null
          token_expires_at?: string | null
          write_scope?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          account_id: string | null
          body: string | null
          created_at: string | null
          dismissed: boolean | null
          id: string
          kind: string | null
          payload: Json | null
        }
        Insert: {
          account_id?: string | null
          body?: string | null
          created_at?: string | null
          dismissed?: boolean | null
          id?: string
          kind?: string | null
          payload?: Json | null
        }
        Update: {
          account_id?: string | null
          body?: string | null
          created_at?: string | null
          dismissed?: boolean | null
          id?: string
          kind?: string | null
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_links: {
        Row: {
          account_id: string | null
          click_count: number | null
          destination_url: string | null
          id: string
          post_id: string | null
          slug: string | null
          utm: Json | null
        }
        Insert: {
          account_id?: string | null
          click_count?: number | null
          destination_url?: string | null
          id?: string
          post_id?: string | null
          slug?: string | null
          utm?: Json | null
        }
        Update: {
          account_id?: string | null
          click_count?: number | null
          destination_url?: string | null
          id?: string
          post_id?: string | null
          slug?: string | null
          utm?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tracked_links_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracked_links_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      approval_t: "pending" | "approved" | "rejected"
      camp_status_t: "draft" | "generating" | "active" | "completed"
      format_t:
        | "reddit_text"
        | "x_post"
        | "x_thread"
        | "ig_carousel"
        | "ig_single"
        | "tiktok_script"
        | "founder_script"
      freq_t: "light" | "balanced" | "aggressive"
      goal_t: "awareness" | "orders" | "community" | "launch"
      post_status_t:
        | "draft"
        | "scheduled"
        | "published"
        | "needs_attention"
        | "stalled"
      provider_t: "reddit" | "x" | "instagram" | "tiktok" | "canva"
      sa_status_t:
        | "connected"
        | "read_only"
        | "expired"
        | "disconnected"
        | "mock"
      voice_t: "warm_witty" | "authoritative" | "playful" | "editorial"
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
      approval_t: ["pending", "approved", "rejected"],
      camp_status_t: ["draft", "generating", "active", "completed"],
      format_t: [
        "reddit_text",
        "x_post",
        "x_thread",
        "ig_carousel",
        "ig_single",
        "tiktok_script",
        "founder_script",
      ],
      freq_t: ["light", "balanced", "aggressive"],
      goal_t: ["awareness", "orders", "community", "launch"],
      post_status_t: [
        "draft",
        "scheduled",
        "published",
        "needs_attention",
        "stalled",
      ],
      provider_t: ["reddit", "x", "instagram", "tiktok", "canva"],
      sa_status_t: [
        "connected",
        "read_only",
        "expired",
        "disconnected",
        "mock",
      ],
      voice_t: ["warm_witty", "authoritative", "playful", "editorial"],
    },
  },
} as const
