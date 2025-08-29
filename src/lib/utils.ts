import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabaseClient"; // Importa o cliente Supabase

// Função para combinar classes Tailwind de forma inteligente
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
