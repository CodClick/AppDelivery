import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase URL or anonymous key environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabaseImageUrl(filePath: string | null | undefined): string {
  if (!filePath) {
    return "";
  }
  const cleanPath = filePath.startsWith("menu_images/") ? filePath.substring("menu_images/".length) : filePath;
  
  const { data } = supabase.storage.from("menu_images").getPublicUrl(cleanPath);
  
  return data.publicUrl;
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};
