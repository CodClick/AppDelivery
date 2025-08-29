import { createClient } from "@supabase/supabase-js";

// Acessa as variáveis de ambiente a partir do arquivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase URL or anonymous key environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
