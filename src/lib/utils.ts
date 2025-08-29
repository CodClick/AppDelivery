import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createClient } from "@supabase/supabase-js";

// Função para combinar classes Tailwind de forma inteligente
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSupabaseImageUrl(filePath: string | null | undefined): string {
  if (!filePath) {
    return "";
  }
  // Remove o nome do bucket do caminho, se ele já estiver presente
  const cleanPath = filePath.startsWith("menu_images/") ? filePath.substring("menu_images/".length) : filePath;

  // Removido a criação do cliente aqui
  // O cliente será passado como parâmetro
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const { data } = supabase.storage.from("menu_images").getPublicUrl(cleanPath);
  
  return data.publicUrl;
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};
