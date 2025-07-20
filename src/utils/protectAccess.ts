// src/utils/protectAccess.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gjwmswafmuyhobwhuwup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // sua anon key
const supabase = createClient(supabaseUrl, supabaseKey);

export async function protectPageByRole(expectedRole: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = '/login';
    return;
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !data || data.role !== expectedRole) {
    window.location.href = '/acesso-negado';
  }
}