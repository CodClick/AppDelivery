
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ypsfoumafbfgcvrxylmw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwc2ZvdW1hZmJmZ2N2cnh5bG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NjkwODQsImV4cCI6MjA2MDM0NTA4NH0.aYVYGIcTbPeYONtCQaO543wfLstNDGBiUw-dUbNf6Xs";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
