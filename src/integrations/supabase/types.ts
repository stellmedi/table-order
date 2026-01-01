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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      discounts: {
        Row: {
          coupon_code: string | null
          created_at: string
          id: string
          is_active: boolean
          menu_id: string | null
          menu_item_id: string | null
          restaurant_id: string
          type: Database["public"]["Enums"]["discount_type"]
          value: number
          value_type: Database["public"]["Enums"]["discount_value_type"]
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          menu_id?: string | null
          menu_item_id?: string | null
          restaurant_id: string
          type: Database["public"]["Enums"]["discount_type"]
          value: number
          value_type: Database["public"]["Enums"]["discount_value_type"]
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          menu_id?: string | null
          menu_item_id?: string | null
          restaurant_id?: string
          type?: Database["public"]["Enums"]["discount_type"]
          value?: number
          value_type?: Database["public"]["Enums"]["discount_value_type"]
        }
        Relationships: [
          {
            foreignKeyName: "discounts_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_addons: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          menu_item_id: string
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          menu_item_id: string
          name: string
          price?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          menu_item_id?: string
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_addons_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_variations: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          menu_item_id: string
          name: string
          price_adjustment: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          menu_item_id: string
          name: string
          price_adjustment?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          menu_item_id?: string
          name?: string
          price_adjustment?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_variations_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          menu_id: string
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          menu_id: string
          name: string
          price: number
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          menu_id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          restaurant_id: string
          tax_rate: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          restaurant_id: string
          tax_rate?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          restaurant_id?: string
          tax_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menus_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_addons: {
        Row: {
          addon_id: string
          addon_name: string
          created_at: string
          id: string
          order_item_id: string
          price: number
          quantity: number
        }
        Insert: {
          addon_id: string
          addon_name: string
          created_at?: string
          id?: string
          order_item_id: string
          price?: number
          quantity?: number
        }
        Update: {
          addon_id?: string
          addon_name?: string
          created_at?: string
          id?: string
          order_item_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "menu_item_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_addons_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_variations: {
        Row: {
          created_at: string
          id: string
          order_item_id: string
          price_adjustment: number
          variation_id: string
          variation_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_item_id: string
          price_adjustment?: number
          variation_id: string
          variation_name: string
        }
        Update: {
          created_at?: string
          id?: string
          order_item_id?: string
          price_adjustment?: number
          variation_id?: string
          variation_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_item_variations_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_variations_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "menu_item_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          order_id: string
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          order_id: string
          price: number
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          order_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          customer_notified: boolean | null
          discount_applied: number | null
          estimated_ready_at: string | null
          id: string
          restaurant_id: string
          status: Database["public"]["Enums"]["order_status"]
          total: number
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          customer_notified?: boolean | null
          discount_applied?: number | null
          estimated_ready_at?: string | null
          id?: string
          restaurant_id: string
          status?: Database["public"]["Enums"]["order_status"]
          total: number
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          customer_notified?: boolean | null
          discount_applied?: number | null
          estimated_ready_at?: string | null
          id?: string
          restaurant_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      restaurant_settings: {
        Row: {
          created_at: string | null
          delivery_charge: number | null
          delivery_enabled: boolean | null
          delivery_zones: Json | null
          id: string
          minimum_order_value: number | null
          opening_hours: Json | null
          pickup_enabled: boolean | null
          preparation_time_minutes: number | null
          restaurant_id: string
          tax_included_in_price: boolean | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_charge?: number | null
          delivery_enabled?: boolean | null
          delivery_zones?: Json | null
          id?: string
          minimum_order_value?: number | null
          opening_hours?: Json | null
          pickup_enabled?: boolean | null
          preparation_time_minutes?: number | null
          restaurant_id: string
          tax_included_in_price?: boolean | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_charge?: number | null
          delivery_enabled?: boolean | null
          delivery_zones?: Json | null
          id?: string
          minimum_order_value?: number | null
          opening_hours?: Json | null
          pickup_enabled?: boolean | null
          preparation_time_minutes?: number | null
          restaurant_id?: string
          tax_included_in_price?: boolean | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner_id: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          slug?: string
        }
        Relationships: []
      }
      table_bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          restaurant_id: string
          status: Database["public"]["Enums"]["booking_status"]
          table_id: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string
          customer_name: string
          customer_phone: string
          id?: string
          restaurant_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          table_id: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          restaurant_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_bookings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_bookings_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_active: boolean
          name_or_number: string
          restaurant_id: string
        }
        Insert: {
          capacity: number
          created_at?: string
          id?: string
          is_active?: boolean
          name_or_number: string
          restaurant_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name_or_number?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_restaurant: {
        Args: { _restaurant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "restaurant_owner"
      booking_status: "pending" | "confirmed" | "cancelled"
      discount_type: "menu" | "item" | "coupon"
      discount_value_type: "percentage" | "flat"
      order_status: "new" | "accepted" | "ready" | "completed"
      plan_type: "starter" | "growth" | "pro"
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
      app_role: ["admin", "restaurant_owner"],
      booking_status: ["pending", "confirmed", "cancelled"],
      discount_type: ["menu", "item", "coupon"],
      discount_value_type: ["percentage", "flat"],
      order_status: ["new", "accepted", "ready", "completed"],
      plan_type: ["starter", "growth", "pro"],
    },
  },
} as const
