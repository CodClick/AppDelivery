export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          display_order: string | null
          empresa_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: string | null
          empresa_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: string | null
          empresa_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_empresa_id_fkey"
            columns: ["empresa_id"]
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          empresa_id: string
          id: string
          image_url: string | null
          is_available: boolean | null
          is_base_price_included: boolean | null
          name: string
          price: number
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          empresa_id: string
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_base_price_included?: boolean | null
          name: string
          price: number
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          empresa_id?: string
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_base_price_included?: boolean | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_empresa_id_fkey"
            columns: ["empresa_id"]
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      variation_groups: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          is_required: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          is_required?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          is_required?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "variation_groups_empresa_id_fkey"
            columns: ["empresa_id"]
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      variations: {
        Row: {
          category_id: string
          created_at: string
          empresa_id: string
          id: string
          name: string
          price: number
        }
        Insert: {
          category_id: string
          created_at?: string
          empresa_id: string
          id?: string
          name: string
          price: number
        }
        Update: {
          category_id?: string
          created_at?: string
          empresa_id?: string
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "variations_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variations_empresa_id_fkey"
            columns: ["empresa_id"]
            referencedRelation: "empresas"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
