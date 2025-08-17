// src/types/menu.ts

// Usamos snake_case para os campos que vêm do Supabase/PostgreSQL
// E podemos mapear para camelCase no frontend, se preferir
// Ou podemos usar camelCase direto se o Supabase for configurado com camel_case_columns
// Por simplicidade, vou manter a conversão aqui para o que você já usa (camelCase)

export interface Category {
  id: string; // UUID do Supabase
  name: string;
  display_order: string; // Confirmado como string
  empresa_id: string; // UUID da empresa
  created_at: string; // Timestamp
}

export interface Variation {
  id: string; // UUID do Supabase
  name: string;
  price_adjustment: number; // NUMERIC(10,2) no DB, number no TS
  empresa_id: string; // UUID da empresa
  created_at: string; // Timestamp
}

export interface VariationGroup {
  id: string; // UUID do Supabase
  name: string;
  min_selections: number;
  max_selections: number;
  empresa_id: string; // UUID da empresa
  created_at: string; // Timestamp
  // Propriedade para armazenar as variações associadas ao grupo
  variations?: Variation[]; // Carregado via JOIN
}

export interface MenuItem {
  id: string; // UUID do Supabase
  name: string;
  description?: string; // Não obrigatório
  price: number; // NUMERIC(10,2) no DB, number no TS
  image_url?: string;
  category_id: string; // UUID da categoria
  is_base_price_included: boolean;
  is_available: boolean;
  empresa_id: string; // UUID da empresa
  created_at: string; // Timestamp
  // Propriedades carregadas via JOIN para facilitar o uso no frontend
  category?: Category; // A categoria associada
  variation_groups?: VariationGroup[]; // Grupos de variação associados ao item
}
