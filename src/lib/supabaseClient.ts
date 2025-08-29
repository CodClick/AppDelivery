import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Ensure the variables are accessible to both server and client components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Declare a client variable that might be a SupabaseClient or null
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  // If a client instance already exists, return it
  if (supabaseClient) {
    return supabaseClient;
  }

  // Throw a clear error if the variables are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase URL or anonymous key environment variables"
    );
  }

  // Otherwise, create a new client and assign it
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
};

// Export a single, global instance
export const supabase = getSupabaseClient();
